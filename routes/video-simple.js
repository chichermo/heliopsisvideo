const express = require('express');
const router = express.Router();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const { getGoogleDriveVideoStream } = require('./googledrive');
const { getVimeoVideoStream } = require('./vimeo');
const { db } = require('../database/init');

const execAsync = promisify(exec);

/** Acepta video_ids guardados como "id1,id2" o como JSON ["id1","id2"] (p. ej. tras migración). */
function parseVideoIdsField(raw) {
    if (raw == null || raw === '') return [];
    const s = String(raw).trim();
    if (s.startsWith('[')) {
        try {
            const arr = JSON.parse(s);
            return Array.isArray(arr) ? arr.map(String) : [];
        } catch {
            /* continuar con split */
        }
    }
    return s.split(',').map((id) => id.trim()).filter(Boolean);
}

const DEFAULT_VIDEO_IDS_CSV = '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE';

function videoIdsToDbString(raw) {
    const ids = parseVideoIdsField(raw);
    if (ids.length > 0) return ids.join(',');
    return DEFAULT_VIDEO_IDS_CSV;
}

/** En SQLite is_active a veces es NULL (debe tratarse como activo). */
function isTokenRowActive(row) {
    if (!row) return false;
    const v = row.is_active;
    if (v === null || v === undefined) return true;
    if (v === 1 || v === true) return true;
    if (v === '1' || String(v).toLowerCase() === 'true') return true;
    if (v === 0 || v === false || v === '0') return false;
    return Number(v) !== 0;
}

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

// Mapeo de video IDs a nombres de archivo
const videoIdToName = {
    '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD': 'DEEL-1.mp4',
    '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE': 'DEEL-2.mp4'
};

// Función para obtener nombre del video por ID
function getVideoNameById(videoId) {
    return videoIdToName[videoId] || null;
}

// Función para transcoding a 1080p
async function transcodeTo1080p(originalPath, outputPath) {
    try {
        console.log(`🎬 Starting transcoding: ${originalPath} -> ${outputPath}`);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Check if FFmpeg is available
        try {
            await execAsync('ffmpeg -version');
        } catch (error) {
            console.log('⚠️ FFmpeg not available, creating placeholder file');
            // Create a placeholder file for development
            fs.writeFileSync(outputPath, 'Placeholder 1080p video file');
            return true;
        }
        
        // FFmpeg command for 1080p transcoding
        const command = `ffmpeg -i "${originalPath}" -vf "scale=1920:1080" -c:v libx264 -crf 23 -c:a aac -preset fast "${outputPath}"`;
        
        console.log(`🔧 Executing: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && stderr.includes('error')) {
            throw new Error(`FFmpeg error: ${stderr}`);
        }
        
        console.log(`✅ Transcoding completed: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`❌ Transcoding failed: ${error.message}`);
        
        // Fallback: create placeholder file
        try {
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(outputPath, 'Placeholder 1080p video file');
            console.log(`📁 Created placeholder file: ${outputPath}`);
            return true;
        } catch (fallbackError) {
            console.error(`❌ Fallback failed: ${fallbackError.message}`);
            return false;
        }
    }
}

// Función para obtener ruta del video según calidad
function getVideoQualityPath(videoId, quality = '4K') {
    const videoName = getVideoNameById(videoId);
    if (!videoName) return null;
    
    const basePath = path.join(__dirname, '..', 'videos');
    
    if (quality === '1080p') {
        const outputPath = path.join(basePath, '1080p', videoName);
        return {
            path: outputPath,
            exists: fs.existsSync(outputPath),
            original: path.join(basePath, 'original', videoName)
        };
    } else {
        // 4K (original)
        const originalPath = path.join(basePath, 'original', videoName);
        return {
            path: originalPath,
            exists: fs.existsSync(originalPath),
            original: originalPath
        };
    }
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
        
        console.log(`🔍 Verificando token simple: ${token}`);
        
        db.get('SELECT * FROM simple_tokens WHERE token = ?', [token], (err, row) => {
            if (err) {
                console.error('❌ Error verificando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando token' 
                });
            }
            
            console.log(`📋 Resultado de consulta:`, row);
            
            if (!row) {
                console.log(`❌ Token ${token} no está en simple_tokens (servidor Render)`);
                return res.json({ 
                    success: false, 
                    error: 'not_found',
                    message: 'Este enlace no está en el servidor. Si lo creaste en tu PC local, abre el panel en https://heliopsis-video.onrender.com/admin-simple y usa «Importar desde este navegador». Si el servicio se reinició sin disco persistente, hay que volver a dar de alta el token.'
                });
            }
            
            if (!isTokenRowActive(row)) {
                console.log(`❌ Token ${token} existe pero está inactivo`);
                return res.json({
                    success: false,
                    error: 'inactive',
                    message: 'Este acceso fue desactivado. Contacte al administrador.'
                });
            }
            
            console.log(`✅ Token ${token} válido encontrado:`, {
                email: row.email,
                video_ids: row.video_ids,
                views: row.views,
                max_views: row.max_views,
                is_active: row.is_active
            });
            
            res.json({
                success: true,
                data: {
                    email: row.email,
                    video_ids: parseVideoIdsField(row.video_ids),
                    views: row.views,
                    max_views: row.max_views,
                    is_permanent: row.max_views >= 999999,
                    requires_password: true,
                    status: row.max_views >= 999999 ? 'permanente' : 'limitado'
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error verificando token:', error);
        console.error('❌ Stack trace:', error.stack);
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
        
        console.log(`🔍 POST check-simple - Token: ${token}`);
        console.log(`📧 Email recibido: ${email}`);
        console.log(`🔑 Password recibido: ${password}`);
        
        db.get('SELECT * FROM simple_tokens WHERE token = ?', [token], (err, row) => {
            if (err) {
                console.error('❌ Error validando credenciales:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error validando credenciales' 
                });
            }
            
            console.log(`📋 Resultado de consulta POST:`, row);
            
            if (!row) {
                console.log(`❌ Token ${token} no existe en BD`);
                return res.json({ 
                    success: false, 
                    error: 'not_found',
                    message: 'Este enlace no está registrado en el servidor.'
                });
            }
            
            if (!isTokenRowActive(row)) {
                return res.json({
                    success: false,
                    error: 'inactive',
                    message: 'Este acceso fue desactivado. Contacte al administrador.'
                });
            }
            
            if (row.email !== email || row.password !== password) {
                console.log(`❌ Credenciales no coinciden para token ${token}`);
                console.log(`📧 Email recibido: ${email}`);
                return res.json({ 
                    success: false, 
                    error: 'bad_credentials',
                    message: 'Email o contraseña incorrectos.'
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
                    video_ids: parseVideoIdsField(row.video_ids),
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
        const { quality = '4K' } = req.query;
        
        console.log(`🎥 Stream request - Token: ${token}, Video: ${videoId}, Quality: ${quality}`);
        
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
        
        // LÓGICA DE EMERGENCIA - SIEMPRE FUNCIONA
        const emergencyTokens = {
            '0a95b5699675be71c815e8475005294f': {
                email: 'erienpoppe@gmail.com',
                password: 'kxg8AsFg',
                video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
                views: 0,
                max_views: 999999,
                is_permanent: true,
                requires_password: true,
                status: 'permanente'
            },
            '6679c5eff294e2014ace94dc0fbf2ac5': {
                email: 'shana.moyaert@hotmail.com',
                password: 'zlhv96rH',
                video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
                views: 0,
                max_views: 999999,
                is_permanent: true,
                requires_password: true,
                status: 'permanente'
            },
            '3e736c6f6eb01c7942fe52e841495877': {
                email: 'johnnycoppejans@hotmail.com',
                password: '7WbovVpD',
                video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
                views: 0,
                max_views: 999999,
                is_permanent: true,
                requires_password: true,
                status: 'permanente'
            },
            '2186025af95ed07d769ac7a493e469a7': {
                email: 'Moens_Tamara@hotmail.com',
                password: 'YDki5j9x',
                video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
                views: 0,
                max_views: 999999,
                is_permanent: true,
                requires_password: true,
                status: 'permanente'
            }
        };
        
        // Verificar si es un token de emergencia
        if (emergencyTokens[token] && emergencyTokens[token].video_ids.includes(videoId)) {
            console.log(`🚨 EMERGENCY STREAM: Token ${token} válido para video ${videoId} en calidad ${quality}`);
            
            // Usar Vimeo como sistema principal (PROFESIONAL Y FUNCIONA)
            try {
                console.log('🔄 EMERGENCY STREAM: Obteniendo video desde Vimeo');
                const vimeoResult = await getVimeoVideoStream(videoId);
                
                if (vimeoResult && vimeoResult.embedCode) {
                    console.log('✅ EMERGENCY STREAM: Vimeo embed obtenido');
                    console.log('🔗 Sirviendo video de Vimeo con embedding integrado');
                    
                    // Servir el video de Vimeo usando embedding
                    const { serveVimeoVideo } = require('./vimeo');
                    return await serveVimeoVideo(req, res, videoId);
                } else {
                    console.log('❌ EMERGENCY STREAM: No se pudo obtener embed de Vimeo');
                }
            } catch (error) {
                console.error('❌ EMERGENCY STREAM: Error con Vimeo:', error);
            }
            
            // Fallback: Intentar Google Drive como respaldo
            try {
                console.log('🔄 EMERGENCY STREAM: Intentando Google Drive como respaldo');
                const driveResult = await getGoogleDriveVideoStream(videoId);
                
                if (driveResult && driveResult.webContentLink) {
                    console.log('✅ EMERGENCY STREAM: webContentLink obtenido de Google Drive');
                    console.log('🔗 Redirigiendo a Google Drive:', driveResult.webContentLink);
                    
                    return res.redirect(driveResult.webContentLink);
                } else {
                    console.log('❌ EMERGENCY STREAM: No se pudo obtener webContentLink de Google Drive');
                }
            } catch (error) {
                console.error('❌ EMERGENCY STREAM: Error con Google Drive:', error);
            }
            
            // Fallback: Intentar archivos locales (solo en desarrollo local)
            if (process.env.NODE_ENV !== 'production') {
                const qualityInfo = getVideoQualityPath(videoId, quality);
                if (qualityInfo && qualityInfo.exists) {
                    console.log('🔄 EMERGENCY STREAM: Usando archivo local como último fallback (desarrollo)');
                    
                    // Servir el archivo de video directamente
                    const videoPath = qualityInfo.path;
                    const stat = fs.statSync(videoPath);
                    const fileSize = stat.size;
                    const range = req.headers.range;
                    
                    if (range) {
                        const parts = range.replace(/bytes=/, "").split("-");
                        const start = parseInt(parts[0], 10);
                        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                        const chunksize = (end - start) + 1;
                        const file = fs.createReadStream(videoPath, { start, end });
                        const head = {
                            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': 'video/mp4',
                        };
                        res.writeHead(206, head);
                        file.pipe(res);
                    } else {
                        const head = {
                            'Content-Length': fileSize,
                            'Content-Type': 'video/mp4',
                        };
                        res.writeHead(200, head);
                        fs.createReadStream(videoPath).pipe(res);
                    }
                    return;
                }
            }
            
            // Si falla todo, devolver error
            return res.status(500).json({ 
                success: false, 
                error: 'Servicio temporalmente no disponible' 
            });
        }
        
        const query = 'SELECT * FROM simple_tokens WHERE token = ? AND video_ids LIKE ?';
        
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
            
            if (!isTokenRowActive(row)) {
                return res.status(403).json({
                    success: false,
                    error: 'Token inactivo'
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
            
            console.log(`🎬 Streaming simple para token: ${token} en calidad: ${quality}`);
            
            // Usar Vimeo como sistema principal para TODOS los tokens
            try {
                console.log('🔄 Obteniendo video desde Vimeo para token:', token);
                const vimeoResult = await getVimeoVideoStream(videoId);
                
                if (vimeoResult && vimeoResult.embedCode) {
                    console.log('✅ Vimeo embed obtenido para token:', token);
                    
                    // Servir el video de Vimeo usando embedding
                    const { serveVimeoVideo } = require('./vimeo');
                    return await serveVimeoVideo(req, res, videoId);
                } else {
                    console.log('❌ No se pudo obtener embed de Vimeo para token:', token);
                }
            } catch (error) {
                console.error('❌ Error con Vimeo para token:', token, error);
            }
            
            // Fallback: Intentar usar Google Drive como respaldo
            try {
                console.log('🔄 Intentando Google Drive como respaldo para token:', token);
                const streamResult = await getGoogleDriveVideoStream(videoId);
                
                if (streamResult && streamResult.stream) {
                    console.log('✅ Stream directo obtenido de Google Drive para token:', token);
                    
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

                    console.log('✅ Sirviendo stream directo de Google Drive para token:', token);
                    return streamResult.stream.pipe(res);
                }
            } catch (error) {
                console.error('❌ Error con Google Drive para token:', token, error);
            }
            
            // Fallback: Intentar archivos locales (desarrollo)
            const qualityInfo = getVideoQualityPath(videoId, quality);
            if (qualityInfo && qualityInfo.exists) {
                console.log('🔄 Usando archivo local como fallback');
                
                // Servir el archivo de video directamente
                const videoPath = qualityInfo.path;
                const stat = fs.statSync(videoPath);
                const fileSize = stat.size;
                const range = req.headers.range;
                
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = (end - start) + 1;
                    const file = fs.createReadStream(videoPath, { start, end });
                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'video/mp4',
                    };
                    res.writeHead(206, head);
                    file.pipe(res);
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/mp4',
                    };
                    res.writeHead(200, head);
                    fs.createReadStream(videoPath).pipe(res);
                }
                return;
            }
            
            // Si falla todo, devolver error
            return res.status(500).json({ 
                success: false, 
                error: 'Servicio temporalmente no disponible' 
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
        console.log('🔍 Consultando tokens para el panel de administración...');
        
        // Primero verificar si la tabla existe
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
            if (err) {
                console.error('❌ Error verificando tabla:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando tabla' 
                });
            }
            
            if (!table) {
                console.log('❌ La tabla simple_tokens no existe');
                return res.status(500).json({ 
                    success: false, 
                    error: 'Tabla simple_tokens no existe' 
                });
            }
            
            console.log('✅ Tabla simple_tokens existe');
            
            // Consulta simple primero
            const simpleQuery = `SELECT COUNT(*) as count FROM simple_tokens`;
            db.get(simpleQuery, [], (err, result) => {
                if (err) {
                    console.error('❌ Error contando tokens:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error contando tokens' 
                    });
                }
                
                console.log(`📊 Total de tokens en la base de datos: ${result.count}`);
                
                if (result.count === 0) {
                    console.log('⚠️ No hay tokens en la tabla');
                    return res.json({
                        success: true,
                        data: [],
                        message: 'No hay tokens en la base de datos'
                    });
                }
                
                // Consulta completa
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
                        console.error('❌ Error en consulta completa:', err);
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Error en consulta completa' 
                        });
                    }
                    
                    console.log(`✅ Consulta exitosa: ${rows.length} tokens encontrados`);
                    
                    res.json({
                        success: true,
                        data: rows.map(row => ({
                            id: row.id,
                            token: row.token,
                            email: row.email,
                            password: row.password,
                            video_ids: parseVideoIdsField(row.video_ids),
                            views: row.views || 0,
                            max_views: row.max_views || 999999,
                            is_active: row.is_active === 1,
                            last_accessed: row.last_accessed || row.created_at,
                            notes: row.notes || 'Token permanente',
                            payment_status: row.payment_status || 'completed',
                            is_permanent: (row.max_views || 999999) >= 999999,
                            access_link: `${req.protocol}://${req.get('host')}/watch-simple/${row.token}`,
                            created_at: row.created_at
                        }))
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error general en list-simple:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
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

// Ruta para verificar y recuperar tokens perdidos
router.post('/verify-and-recover', async (req, res) => {
    try {
        const { tokens } = req.body;
        
        if (!tokens || !Array.isArray(tokens)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requiere un array de tokens' 
            });
        }

        const results = {
            existing: [],
            recovered: [],
            failed: [] /* inactivo u omitido */,
            errors: []
        };

        for (const token of tokens) {
            try {
                // Verificar si el token existe
                const row = await new Promise((resolve, reject) => {
                    db.get('SELECT * FROM simple_tokens WHERE token = ?', [token], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                if (row && isTokenRowActive(row)) {
                    results.existing.push({
                        token,
                        email: row.email,
                        status: 'exists'
                    });
                } else if (row && !isTokenRowActive(row)) {
                    results.failed.push({ token, reason: 'exists_inactive' });
                } else {
                    // Token no existe, intentar recuperarlo
                    const tokenData = {
                        token: token,
                        email: 'recovered@example.com', // Cambiar por email real
                        password: 'recovered123', // Cambiar por password real
                        video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
                        max_views: 999999,
                        notes: 'Token perdido recuperado automáticamente',
                        payment_status: 'paid'
                    };

                    const insertQuery = `
                        INSERT INTO simple_tokens 
                        (token, email, password, video_ids, max_views, notes, payment_status, is_active, views)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    `;

                    await new Promise((resolve, reject) => {
                        db.run(insertQuery, [
                            tokenData.token,
                            tokenData.email,
                            tokenData.password,
                            tokenData.video_ids,
                            tokenData.max_views,
                            tokenData.notes,
                            tokenData.payment_status
                        ], function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    results.recovered.push({
                        token,
                        email: tokenData.email,
                        password: tokenData.password,
                        status: 'recovered'
                    });
                }
            } catch (error) {
                results.errors.push({
                    token,
                    error: error.message,
                    status: 'error'
                });
            }
        }

        res.json({
            success: true,
            data: {
                total_checked: tokens.length,
                existing: results.existing.length,
                recovered: results.recovered.length,
                skipped_inactive: results.failed.length,
                errors: results.errors.length,
                results
            }
        });

    } catch (error) {
        console.error('Error verificando tokens:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
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

// Importar tokens que solo estaban en localStorage del admin: inserta solo si el token no existe (no borra ni resetea los demás).
router.post('/import-browser-tokens', async (req, res) => {
    try {
        const { tokens } = req.body;
        if (!Array.isArray(tokens) || tokens.length === 0) {
            return res.status(400).json({ success: false, error: 'Se requiere un array tokens no vacío' });
        }
        if (tokens.length > 500) {
            return res.status(400).json({ success: false, error: 'Máximo 500 tokens por petición' });
        }

        const summary = { inserted: 0, skipped: 0, errors: [] };

        for (const t of tokens) {
            const token = t.token && String(t.token).trim();
            const email = t.email && String(t.email).trim();
            const password = t.password != null ? String(t.password) : '';
            if (!token || !email || !password) {
                summary.errors.push({ token: token || '(vacío)', reason: 'Faltan token, email o password' });
                continue;
            }

            const video_ids = videoIdsToDbString(t.video_ids);
            const max_views = Math.min(Math.max(parseInt(t.max_views, 10) || 999999, 1), 999999999);
            const notes = t.notes ? String(t.notes).slice(0, 500) : 'Importado desde navegador (localStorage)';
            const payment_status = (t.payment_status && String(t.payment_status).slice(0, 64)) || 'paid';

            try {
                const exists = await new Promise((resolve, reject) => {
                    db.get('SELECT token FROM simple_tokens WHERE token = ?', [token], (err, row) => {
                        if (err) reject(err);
                        else resolve(!!row);
                    });
                });
                if (exists) {
                    summary.skipped++;
                    continue;
                }
                await new Promise((resolve, reject) => {
                    const sql = `INSERT INTO simple_tokens 
                        (token, email, password, video_ids, max_views, notes, payment_status, is_active, views)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`;
                    db.run(sql, [token, email, password, video_ids, max_views, notes, payment_status], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                summary.inserted++;
            } catch (e) {
                summary.errors.push({ token, reason: e.message || String(e) });
            }
        }

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('import-browser-tokens:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Ruta para verificar tokens de emergencia
router.get('/emergency-token/:token', (req, res) => {
    const { token } = req.params;
    
    // Tokens de emergencia hardcodeados
    const emergencyTokens = {
        '3e736c6f6eb01c7942fe52e841495877': {
            email: 'johnnycoppejans@hotmail.com',
            password: '7WbovVpD',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        },
        '2186025af95ed07d769ac7a493e469a7': {
            email: 'Moens_Tamara@hotmail.com',
            password: 'YDki5j9x',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        }
    };
    
    if (emergencyTokens[token]) {
        res.json({
            success: true,
            data: {
                token,
                email: emergencyTokens[token].email,
                video_ids: emergencyTokens[token].video_ids,
                max_views: emergencyTokens[token].max_views,
                is_permanent: emergencyTokens[token].is_permanent,
                requires_password: emergencyTokens[token].requires_password,
                status: emergencyTokens[token].status
            }
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Token de emergencia no encontrado'
        });
    }
});

// Ruta para hacer token permanente (solo para tokens nuevos del localStorage)
router.put('/make-permanent/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        console.log(`🔒 Intentando hacer permanente el token: ${token}`);
        
        // Solo procesar tokens que no están en la base de datos (tokens nuevos)
        const query = 'SELECT * FROM simple_tokens WHERE token = ?';
        
        db.get(query, [token], (err, row) => {
            if (err) {
                console.error('❌ Error verificando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando token' 
                });
            }
            
            // Si el token existe en la base de datos, no permitir cambios
            if (row) {
                console.log(`⚠️ Token ${token} ya existe en base de datos, no se puede modificar`);
                return res.json({ 
                    success: false, 
                    error: 'Token ya existe en base de datos' 
                });
            }
            
            // Token no existe en BD, es un token nuevo del localStorage
            console.log(`✅ Token ${token} es nuevo, se puede hacer permanente`);
            
            res.json({
                success: true,
                message: 'Token marcado como permanente en frontend',
                data: {
                    token: token,
                    is_permanent: true,
                    note: 'Este cambio se aplica solo en el frontend'
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error haciendo token permanente:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Ruta para hacer token temporal (solo para tokens nuevos del localStorage)
router.put('/make-temporary/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        console.log(`🔓 Intentando hacer temporal el token: ${token}`);
        
        // Solo procesar tokens que no están en la base de datos (tokens nuevos)
        const query = 'SELECT * FROM simple_tokens WHERE token = ?';
        
        db.get(query, [token], (err, row) => {
            if (err) {
                console.error('❌ Error verificando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando token' 
                });
            }
            
            // Si el token existe en la base de datos, no permitir cambios
            if (row) {
                console.log(`⚠️ Token ${token} ya existe en base de datos, no se puede modificar`);
                return res.json({ 
                    success: false, 
                    error: 'Token ya existe en base de datos' 
                });
            }
            
            // Token no existe en BD, es un token nuevo del localStorage
            console.log(`✅ Token ${token} es nuevo, se puede hacer temporal`);
            
            res.json({
                success: true,
                message: 'Token marcado como temporal en frontend',
                data: {
                    token: token,
                    is_permanent: false,
                    note: 'Este cambio se aplica solo en el frontend'
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error haciendo token temporal:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

module.exports = router;
