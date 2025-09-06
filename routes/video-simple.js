const express = require('express');
const router = express.Router();
const path = require('path');
const crypto = require('crypto');
const { getGoogleDriveVideoStream } = require('./googledrive');
const { getVideoUrl } = require('./cloudinary');
const { db } = require('../database/init');

// Función para generar token único
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

// Función para generar contraseña aleatoria
function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Crear tabla para tokens simples si no existe
function initSimpleTokensTable() {
    const createTable = `
        CREATE TABLE IF NOT EXISTS simple_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            video_ids TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            views INTEGER DEFAULT 0,
            max_views INTEGER DEFAULT 999999,
            is_active INTEGER DEFAULT 1,
            last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            payment_status TEXT DEFAULT 'paid'
        )
    `;
    
    db.run(createTable, (err) => {
        if (err) {
            console.error('Error creando tabla simple_tokens:', err);
        } else {
            console.log('✅ Tabla simple_tokens lista');
            // Actualizar tokens existentes para que sean permanentes
            updateExistingTokensToPermanent();
        }
    });
}

// Función para actualizar tokens existentes a permanentes
function updateExistingTokensToPermanent() {
    const updateQuery = `
        UPDATE simple_tokens 
        SET max_views = 999999, 
            notes = 'Token permanente actualizado', 
            payment_status = 'paid'
        WHERE max_views < 999999 OR notes NOT LIKE '%permanente%'
    `;
    
    db.run(updateQuery, [], function(err) {
        if (err) {
            console.error('Error actualizando tokens a permanentes:', err);
        } else {
            console.log(`✅ ${this.changes} tokens actualizados a permanentes`);
        }
    });
}

// Inicializar tabla al cargar el módulo
initSimpleTokensTable();

// Ruta para crear token simple
router.post('/create-simple', async (req, res) => {
    try {
        const { email, video_ids } = req.body;
        
        if (!email || !video_ids) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email y video_ids son requeridos' 
            });
        }

        const token = generateToken();
        const password = generatePassword();
        
        // Guardar en base de datos SQLite (PERMANENTE)
        const insertQuery = `
            INSERT INTO simple_tokens (token, email, password, video_ids, max_views, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(insertQuery, [token, email, password, video_ids, 999999, 'Token permanente'], function(err) {
            if (err) {
                console.error('Error guardando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error guardando token' 
                });
            }
            
            const watchUrl = `${req.protocol}://${req.get('host')}/watch-simple/${token}`;
            
            console.log(`✅ Token simple creado: ${token} para ${email}`);
            
            res.json({
                success: true,
                data: {
                    token,
                    email,
                    password,
                    watchUrl,
                    video_ids: video_ids.split(','),
                    max_views: 999999,
                    is_permanent: true
                }
            });
        });
        
    } catch (error) {
        console.error('Error creando token simple:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para carga masiva de emails
router.post('/bulk-create-simple', async (req, res) => {
    try {
        const { emails, video_ids } = req.body;
        
        if (!emails || !video_ids) {
            return res.status(400).json({ 
                success: false, 
                error: 'Emails y video_ids son requeridos' 
            });
        }
        
        // Validar que emails sea un array
        const emailList = Array.isArray(emails) ? emails : [emails];
        
        if (emailList.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Lista de emails vacía' 
            });
        }
        
        const results = [];
        const errors = [];
        
        // Crear tokens para cada email
        for (const email of emailList) {
            try {
                const token = generateToken();
                const password = generatePassword();
                
                // Guardar en base de datos
                const insertQuery = `
                    INSERT INTO simple_tokens (token, email, password, video_ids, max_views, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                await new Promise((resolve, reject) => {
                    db.run(insertQuery, [token, email, password, video_ids, 999999, 'Token permanente'], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                
                const watchUrl = `${req.protocol}://${req.get('host')}/watch-simple/${token}`;
                
                results.push({
                    email,
                    token,
                    password,
                    watchUrl,
                    video_ids: video_ids.split(','),
                    status: 'success'
                });
                
                console.log(`✅ Token masivo creado: ${token} para ${email}`);
                
            } catch (error) {
                console.error(`Error creando token para ${email}:`, error);
                errors.push({
                    email,
                    error: error.message,
                    status: 'error'
                });
            }
        }
        
        res.json({
            success: true,
            data: {
                total_processed: emailList.length,
                successful: results.length,
                failed: errors.length,
                results,
                errors
            }
        });
        
    } catch (error) {
        console.error('Error en carga masiva:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para verificar token simple
router.get('/check-simple/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const query = 'SELECT * FROM simple_tokens WHERE token = ? AND is_active = 1';
        
        db.get(query, [token], (err, row) => {
            if (err) {
                console.error('Error verificando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando token' 
                });
            }
            
            if (!row) {
                return res.json({ 
                    success: false, 
                    error: 'Token no encontrado o inactivo' 
                });
            }
            
            res.json({
                success: true,
                data: {
                    email: row.email,
                    video_ids: row.video_ids.split(','),
                    views: row.views,
                    max_views: row.max_views,
                    is_permanent: row.max_views >= 999999,
                    requires_password: true,
                    status: row.max_views >= 999999 ? 'permanente' : 'limitado'
                }
            });
        });
        
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para validar email y contraseña
router.post('/check-simple/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { email, password } = req.body;
        
        const query = 'SELECT * FROM simple_tokens WHERE token = ? AND email = ? AND password = ? AND is_active = 1';
        
        db.get(query, [token, email, password], (err, row) => {
            if (err) {
                console.error('Error validando credenciales:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error validando credenciales' 
                });
            }
            
            if (!row) {
                return res.json({ 
                    success: false, 
                    error: 'Credenciales incorrectas' 
                });
            }
            
            // TOKENS PERMANENTES: No verificar límite de vistas para tokens con max_views >= 999999
            if (row.max_views < 999999 && row.views >= row.max_views) {
                return res.json({ 
                    success: false, 
                    error: 'Límite de vistas alcanzado' 
                });
            }
            
            res.json({
                success: true,
                data: {
                    email: row.email,
                    video_ids: row.video_ids.split(','),
                    views: row.views,
                    max_views: row.max_views
                }
            });
        });
        
    } catch (error) {
        console.error('Error validando credenciales:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para streaming de video
router.get('/stream-simple/:token/:videoId', async (req, res) => {
    try {
        const { token, videoId } = req.params;
        
        // Detectar intentos de descarga
        const userAgent = req.headers['user-agent'] || '';
        const referer = req.headers['referer'] || '';
        const accept = req.headers['accept'] || '';
        
        // Bloquear descargas directas y herramientas de descarga
        const downloadTools = [
            'wget', 'curl', 'aria2c', 'youtube-dl', 'yt-dlp', 'ffmpeg',
            'download', 'downloader', 'save', 'grab', 'capture'
        ];
        
        const isDownloadTool = downloadTools.some(tool => 
            userAgent.toLowerCase().includes(tool.toLowerCase())
        );
        
        // Bloquear si es una herramienta de descarga
        if (isDownloadTool) {
            console.log(`🚫 Download attempt blocked from: ${userAgent}`);
            return res.status(403).json({
                success: false,
                error: 'Download tools not allowed'
            });
        }
        
        // Verificar que la solicitud venga del dominio correcto
        if (referer && !referer.includes(req.get('host'))) {
            console.log(`🚫 Cross-origin access blocked from: ${referer}`);
            return res.status(403).json({
                success: false,
                error: 'Cross-origin access not allowed'
            });
        }
        
        const query = 'SELECT * FROM simple_tokens WHERE token = ? AND video_ids LIKE ? AND is_active = 1';
        
        db.get(query, [token, `%${videoId}%`], async (err, row) => {
            if (err) {
                console.error('Error verificando acceso:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando acceso' 
                });
            }
            
            if (!row) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Acceso denegado' 
                });
            }
            
            // TOKENS PERMANENTES: No verificar límite de vistas para tokens con max_views >= 999999
            if (row.max_views < 999999 && row.views >= row.max_views) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Límite de vistas alcanzado' 
                });
            }
            
            // Solo incrementar vistas en la primera solicitud (sin Range header) y solo para estadísticas
            if (!req.headers.range) {
                const updateQuery = 'UPDATE simple_tokens SET views = views + 1, last_accessed = CURRENT_TIMESTAMP WHERE token = ?';
                db.run(updateQuery, [token], (err) => {
                    if (err) console.error('Error actualizando vistas:', err);
                });
                console.log(`📊 Vistas incrementadas para ${token}: ${row.views + 1} (permanente)`);
            }
            
            console.log(`🎬 Streaming simple para token: ${token}`);
            
            try {
                // Intentar obtener stream directo de Google Drive
                const streamResult = await getGoogleDriveVideoStream(videoId);
                
                if (streamResult && streamResult.error) {
                    console.log('❌ Error específico de Google Drive:', streamResult.error);
                    if (streamResult.needsAuth) {
                        console.log('🔑 Se requiere autenticación de Google Drive');
                        return res.status(503).json({
                            success: false,
                            error: 'Servicio de video temporalmente no disponible',
                            message: 'Se requiere configuración de Google Drive',
                            details: 'Contacta al administrador para configurar el acceso a Google Drive'
                        });
                    }
                }
                
                if (streamResult && streamResult.stream) {
                    console.log('✅ Stream directo obtenido de Google Drive');
                    
                    // Configurar headers para streaming de video
                    res.setHeader('Content-Type', streamResult.mimeType || 'video/mp4');
                    res.setHeader('Accept-Ranges', 'bytes');
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                    res.setHeader('X-Download-Options', 'noopen');
                    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

                    // Headers específicos para prevenir descarga
                    res.setHeader('Content-Disposition', 'inline; filename=""');
                    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self' blob:;");

                    // Headers adicionales de seguridad
                    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

                    // Prevenir hotlinking y descarga directa
                    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

                    console.log('✅ Sirviendo stream directo de Google Drive');
                    return streamResult.stream.pipe(res);
                }
                
                // Fallback: Redirección a webContentLink
                if (streamResult && streamResult.webContentLink) {
                    if (streamResult.isLargeFile) {
                        console.log('🔄 Redirigiendo a webContentLink para archivo grande');
                    } else {
                        console.log('🔄 Redirigiendo a webContentLink como fallback');
                    }
                    
                    // Para videos grandes, usar un enfoque diferente: servir una página HTML que redirija
                    if (streamResult.isLargeFile) {
                        console.log('📱 Sirviendo página de redirección para video grande');
                        
                        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reproductor de Video</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            font-family: Arial, sans-serif; 
        }
        .video-container { 
            position: relative; 
            width: 100vw; 
            height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .video-player { 
            width: 100%; 
            height: 100%; 
            border: none; 
        }
        .loading { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            color: white; 
            text-align: center; 
        }
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 2s linear infinite; 
            margin: 20px auto; 
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="loading" id="loading">
            <h2>🎬 Cargando video...</h2>
            <div class="spinner"></div>
            <p>Preparando reproductor...</p>
        </div>
        <iframe 
            id="videoFrame" 
            class="video-player" 
            src="${streamResult.webContentLink}" 
            frameborder="0" 
            allowfullscreen
            style="display: none;"
            onload="hideLoading()">
        </iframe>
    </div>
    <script>
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('videoFrame').style.display = 'block';
        }
        
        // Fallback si el iframe no carga
        setTimeout(() => {
            if (document.getElementById('loading').style.display !== 'none') {
                document.getElementById('loading').innerHTML = 
                    '<h2>⚠️ Error cargando video</h2><p>Intenta recargar la página</p>';
            }
        }, 10000);
    </script>
</body>
</html>`;
                        
                        res.setHeader('Content-Type', 'text/html');
                        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                        res.setHeader('Pragma', 'no-cache');
                        res.setHeader('Expires', '0');
                        return res.send(html);
                    }
                    
                    // Para archivos pequeños, usar redirección directa
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                    res.setHeader('X-Content-Type-Options', 'nosniff');
                    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                    res.setHeader('X-Download-Options', 'noopen');
                    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
                    res.setHeader('Content-Disposition', 'inline; filename=""');
                    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
                    
                    return res.redirect(302, streamResult.webContentLink);
                }
                
            } catch (error) {
                console.error('❌ Error con Google Drive:', error.message);
                console.error('❌ Stack trace:', error.stack);
            }
            
            // Último fallback: Error
            console.log('❌ No se pudo obtener el video desde Google Drive');
            return res.status(500).json({ 
                error: 'No se pudo obtener el video',
                message: 'Servicio temporalmente no disponible'
            });
        });
        
    } catch (error) {
        console.error('Error en streaming simple:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para listar todos los tokens (administración)
router.get('/list-simple', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, token, email, password, video_ids, 
                created_at, views, max_views, is_active, 
                last_accessed, notes, payment_status
            FROM simple_tokens 
            ORDER BY created_at DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error listando tokens:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error listing tokens' 
                });
            }
            
            res.json({
                success: true,
                data: rows.map(row => ({
                    id: row.id,
                    token: row.token,
                    email: row.email,
                    password: row.password,
                    video_ids: row.video_ids.split(','),
                    created_at: row.created_at,
                    views: row.views,
                    max_views: row.max_views,
                    is_active: row.is_active === 1,
                    last_accessed: row.last_accessed,
                    notes: row.notes,
                    payment_status: row.payment_status,
                    is_permanent: row.max_views >= 999999,
                    access_link: `${req.protocol}://${req.get('host')}/watch-simple/${row.token}`
                }))
            });
        });
        
    } catch (error) {
        console.error('Error listando tokens:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Ruta para obtener estadísticas de tokens
router.get('/stats-simple', async (req, res) => {
    try {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM simple_tokens',
            active: 'SELECT COUNT(*) as count FROM simple_tokens WHERE is_active = 1',
            inactive: 'SELECT COUNT(*) as count FROM simple_tokens WHERE is_active = 0',
            total_views: 'SELECT SUM(views) as total FROM simple_tokens',
            recent_7_days: 'SELECT COUNT(*) as count FROM simple_tokens WHERE created_at >= datetime("now", "-7 days")',
            recent_30_days: 'SELECT COUNT(*) as count FROM simple_tokens WHERE created_at >= datetime("now", "-30 days")',
            active_today: 'SELECT COUNT(*) as count FROM simple_tokens WHERE last_accessed >= datetime("now", "-1 day")',
            active_week: 'SELECT COUNT(*) as count FROM simple_tokens WHERE last_accessed >= datetime("now", "-7 days")',
            avg_views: 'SELECT AVG(views) as avg FROM simple_tokens',
            max_views: 'SELECT MAX(views) as max FROM simple_tokens',
            total_revenue: 'SELECT COUNT(*) as count FROM simple_tokens WHERE payment_status = "paid"'
        };
        
        const stats = {};
        
        for (const [key, query] of Object.entries(queries)) {
            await new Promise((resolve, reject) => {
                db.get(query, [], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        stats[key] = row.count || row.total || row.avg || row.max || 0;
                        resolve();
                    }
                });
            });
        }
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para actualizar token (activar/desactivar, cambiar notas, etc.)
router.put('/manage-simple/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { action, notes, is_active } = req.body;
        
        let updateQuery = '';
        let params = [];
        
        switch (action) {
            case 'activate':
                updateQuery = 'UPDATE simple_tokens SET is_active = 1 WHERE token = ?';
                params = [token];
                break;
            case 'deactivate':
                updateQuery = 'UPDATE simple_tokens SET is_active = 0 WHERE token = ?';
                params = [token];
                break;
            case 'update_notes':
                updateQuery = 'UPDATE simple_tokens SET notes = ? WHERE token = ?';
                params = [notes, token];
                break;
            case 'reset_views':
                updateQuery = 'UPDATE simple_tokens SET views = 0 WHERE token = ?';
                params = [token];
                break;
            case 'update_status':
                updateQuery = 'UPDATE simple_tokens SET is_active = ?, notes = ? WHERE token = ?';
                params = [is_active ? 1 : 0, notes || '', token];
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid action' 
                });
        }
        
        db.run(updateQuery, params, function(err) {
            if (err) {
                console.error('Error updating token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error updating token' 
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Token not found' 
                });
            }
            
            res.json({
                success: true,
                message: `Token ${action} successful`,
                changes: this.changes
            });
        });
        
    } catch (error) {
        console.error('Error updating token:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Ruta para eliminar token
router.delete('/delete-simple/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const deleteQuery = 'DELETE FROM simple_tokens WHERE token = ?';
        
        db.run(deleteQuery, [token], function(err) {
            if (err) {
                console.error('Error deleting token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error deleting token' 
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Token not found' 
                });
            }
            
            res.json({
                success: true,
                message: 'Token deleted successfully',
                changes: this.changes
            });
        });
        
    } catch (error) {
        console.error('Error deleting token:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Ruta para insertar token directamente (recuperación)
router.post('/insert-token-direct', async (req, res) => {
    try {
        const { token, email, password, video_ids, max_views, notes, payment_status } = req.body;
        
        if (!token || !email || !password || !video_ids) {
            return res.status(400).json({ 
                success: false, 
                error: 'Token, email, password y video_ids son requeridos' 
            });
        }

        // Insertar token directamente en la base de datos
        const insertQuery = `
            INSERT OR REPLACE INTO simple_tokens 
            (token, email, password, video_ids, max_views, notes, payment_status, is_active, views)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
        `;
        
        db.run(insertQuery, [
            token, 
            email, 
            password, 
            video_ids, 
            max_views || 999999, 
            notes || 'Token recuperado - Acceso permanente garantizado',
            payment_status || 'paid'
        ], function(err) {
            if (err) {
                console.error('Error insertando token directamente:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error insertando token' 
                });
            }
            
            console.log(`✅ Token insertado directamente: ${token} para ${email}`);
            
            res.json({
                success: true,
                message: 'Token insertado exitosamente',
                data: {
                    token,
                    email,
                    password,
                    video_ids: video_ids.split(','),
                    max_views: max_views || 999999,
                    is_permanent: true,
                    access_link: `${req.protocol}://${req.get('host')}/watch-simple/${token}`
                }
            });
        });
        
    } catch (error) {
        console.error('Error insertando token directamente:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

module.exports = router;
