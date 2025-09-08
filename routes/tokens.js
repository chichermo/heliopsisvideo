const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/init');
const { 
    generateDeviceFingerprint, 
    isValidEmail, 
    generateAccessToken, 
    isTokenValid,
    parseUserAgent 
} = require('../utils/security');
const router = express.Router();

// Middleware para obtener IP real del cliente
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Crear nuevo token de acceso
router.post('/create', (req, res) => {
    const { email, video_id, max_views = 1, expires_in_hours = 24, max_devices = 1 } = req.body;

    // Validaciones
    if (!email || !video_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email y video_id son requeridos' 
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Formato de email inválido' 
        });
    }

    if (max_views < 1 || max_views > 100) {
        return res.status(400).json({ 
            success: false, 
            message: 'max_views debe estar entre 1 y 100' 
        });
    }

    if (max_devices < 1 || max_devices > 5) {
        return res.status(400).json({ 
            success: false, 
            message: 'max_devices debe estar entre 1 y 5' 
        });
    }

    const token = generateAccessToken();
    const expires_at = new Date(Date.now() + (expires_in_hours * 60 * 60 * 1000));

    const sql = `INSERT INTO access_tokens 
                 (token, email, video_id, max_views, expires_at, max_devices, share_blocked) 
                 VALUES (?, ?, ?, ?, ?, ?, 1)`;

    db.run(sql, [token, email, video_id, max_views, expires_at.toISOString(), max_devices], function(err) {
        if (err) {
            console.error('Error creando token:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }

        res.json({
            success: true,
            message: 'Token creado exitosamente',
            data: {
                token,
                email,
                video_id,
                max_views,
                expires_at,
                max_devices,
                share_blocked: true
            }
        });
    });
});

// Validar token y obtener información del video
router.get('/validate/:token', (req, res) => {
    const { token } = req.params;
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIP(req);
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    if (!token) {
        return res.status(400).json({ 
            success: false, 
            message: 'Token requerido' 
        });
    }

    const sql = `SELECT * FROM access_tokens WHERE token = ?`;
    
    db.get(sql, [token], (err, tokenData) => {
        if (err) {
            console.error('Error validando token:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }

        if (!tokenData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Token no encontrado' 
            });
        }

        // Validar si el token es válido
        if (!isTokenValid(tokenData)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Token expirado, inactivo o límite de visualizaciones alcanzado' 
            });
        }

        // Verificar límite de dispositivos
        const deviceCheckSql = `SELECT COUNT(*) as device_count FROM device_tokens WHERE token_id = ?`;
        
        db.get(deviceCheckSql, [tokenData.id], (err, deviceResult) => {
            if (err) {
                console.error('Error verificando dispositivos:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error interno del servidor' 
                });
            }

            const currentDevices = deviceResult.device_count || 0;
            
            // Si es un dispositivo nuevo y ya alcanzó el límite
            if (currentDevices >= tokenData.max_devices) {
                // Verificar si este dispositivo ya está registrado
                const existingDeviceSql = `SELECT * FROM device_tokens WHERE token_id = ? AND device_fingerprint = ?`;
                
                db.get(existingDeviceSql, [tokenData.id, deviceFingerprint], (err, existingDevice) => {
                    if (err || !existingDevice) {
                        return res.status(403).json({ 
                            success: false, 
                            message: 'Límite de dispositivos alcanzado' 
                        });
                    }
                    
                    // Dispositivo existente, permitir acceso
                    allowAccess(tokenData, deviceFingerprint, ipAddress, userAgent, res);
                });
            } else {
                // Dispositivo nuevo, permitir acceso
                allowAccess(tokenData, deviceFingerprint, ipAddress, userAgent, res);
            }
        });
    });
});

// Función para permitir acceso y registrar dispositivo
function allowAccess(tokenData, deviceFingerprint, ipAddress, userAgent, res) {
    // Registrar dispositivo si es nuevo
    const deviceSql = `INSERT OR IGNORE INTO device_tokens 
                       (token_id, device_fingerprint, ip_address, user_agent) 
                       VALUES (?, ?, ?, ?)`;
    
    db.run(deviceSql, [tokenData.id, deviceFingerprint, ipAddress, userAgent], function(err) {
        if (err) {
            console.error('Error registrando dispositivo:', err);
        }
    });

    // Incrementar contador de visualizaciones
    const updateViewsSql = `UPDATE access_tokens SET current_views = current_views + 1 WHERE id = ?`;
    
    db.run(updateViewsSql, [tokenData.id], function(err) {
        if (err) {
            console.error('Error actualizando visualizaciones:', err);
        }
    });

    // Registrar log de visualización
    const logSql = `INSERT INTO video_logs 
                    (token_id, email, video_id, ip_address, user_agent, device_fingerprint) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(logSql, [tokenData.id, tokenData.email, tokenData.video_id, ipAddress, userAgent, deviceFingerprint], function(err) {
        if (err) {
            console.error('Error registrando log:', err);
        }
    });

    // Obtener información del video
    const videoSql = `SELECT * FROM allowed_videos WHERE video_id = ?`;
    
    db.get(videoSql, [tokenData.video_id], (err, videoData) => {
        if (err) {
            console.error('Error obteniendo video:', err);
        }

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                token: tokenData.token,
                email: tokenData.email,
                video_id: tokenData.video_id,
                max_views: tokenData.max_views,
                current_views: tokenData.current_views + 1,
                expires_at: tokenData.expires_at,
                max_devices: tokenData.max_devices,
                share_blocked: tokenData.share_blocked,
                video_info: videoData || null
            }
        });
    });
}

// Listar todos los tokens
router.get('/list', (req, res) => {
    const sql = `SELECT * FROM access_tokens ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, tokens) => {
        if (err) {
            console.error('Error listando tokens:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }

        res.json({
            success: true,
            data: tokens
        });
    });
});

// Obtener estadísticas de un token
router.get('/stats/:token', (req, res) => {
    const { token } = req.params;

    const sql = `SELECT 
                    t.*,
                    COUNT(DISTINCT dt.device_fingerprint) as unique_devices,
                    COUNT(vl.id) as total_views
                 FROM access_tokens t
                 LEFT JOIN device_tokens dt ON t.id = dt.token_id
                 LEFT JOIN video_logs vl ON t.id = vl.token_id
                 WHERE t.token = ?
                 GROUP BY t.id`;

    db.get(sql, [token], (err, stats) => {
        if (err) {
            console.error('Error obteniendo estadísticas:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }

        if (!stats) {
            return res.status(404).json({ 
                success: false, 
                message: 'Token no encontrado' 
            });
        }

        res.json({
            success: true,
            data: stats
        });
    });
});

// Desactivar token
router.put('/deactivate/:token', (req, res) => {
    const { token } = req.params;

    const sql = `UPDATE access_tokens SET is_active = 0 WHERE token = ?`;
    
    db.run(sql, [token], function(err) {
        if (err) {
            console.error('Error desactivando token:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Token no encontrado' 
            });
        }

        res.json({
            success: true,
            message: 'Token desactivado exitosamente'
        });
    });
});

module.exports = router;
