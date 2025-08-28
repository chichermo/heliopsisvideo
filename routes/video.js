const express = require('express');
const { db } = require('../database/init');
const { getGoogleDriveVideoStream } = require('./googledrive');

const router = express.Router();

// Middleware para verificar acceso al video
const verifyVideoAccess = (req, res, next) => {
    const { token } = req.params;
    
    if (!token) {
        return res.status(400).json({
            error: 'Token de acceso requerido'
        });
    }

    // Obtener información del token
    const sql = `SELECT * FROM access_tokens WHERE token = ? AND is_active = 1`;
    
    db.get(sql, [token], (err, accessToken) => {
        if (err) {
            console.error('Error verificando token:', err);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'No se pudo verificar el acceso'
            });
        }
        
        if (!accessToken) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Token inválido o expirado'
            });
        }

        // Verificar si se excedió el número máximo de vistas
        if (accessToken.current_views >= accessToken.max_views) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Se ha excedido el número máximo de vistas permitidas'
            });
        }

        // Verificar si el token ha expirado
        if (accessToken.expires_at && new Date(accessToken.expires_at) < new Date()) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'El token ha expirado'
            });
        }

        // Adjuntar información del token a la request
        req.accessToken = accessToken;
        next();
    });
};

// Obtener información del video (metadata)
router.get('/info/:token', verifyVideoAccess, (req, res) => {
    const { accessToken } = req;
    
    res.json({
        success: true,
        data: {
            videoId: accessToken.video_id,
            expiresAt: accessToken.expires_at,
            maxViews: accessToken.max_views,
            currentViews: accessToken.current_views,
            notes: accessToken.notes,
            email: accessToken.email
        }
    });
});

// Stream del video desde Google Drive
router.get('/stream/:token', verifyVideoAccess, async (req, res) => {
    try {
        const { accessToken } = req;
        const { token } = req.params;
        
        // Obtener IP y User-Agent para logging
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        // Registrar el acceso al video
        const updateSql = `UPDATE access_tokens SET current_views = current_views + 1 WHERE token = ?`;
        db.run(updateSql, [token], (err) => {
            if (err) {
                console.error('Error actualizando uso del token:', err);
            }
        });

        // Obtener stream del video desde Google Drive
        const videoStream = await getGoogleDriveVideoStream(accessToken.video_id);
        
        if (!videoStream) {
            return res.status(404).json({
                error: 'Video no encontrado',
                message: 'El video no está disponible en Google Drive'
            });
        }

        // Configurar headers para streaming
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Headers de seguridad para prevenir descarga
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        
        // Manejar range requests para streaming eficiente
        const range = req.headers.range;
        
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : videoStream.contentLength - 1;
            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${videoStream.contentLength}`);
            res.setHeader('Content-Length', chunksize);
            
            // Stream del rango solicitado
            videoStream.stream.pipe(res);
        } else {
            // Stream completo
            res.setHeader('Content-Length', videoStream.contentLength);
            videoStream.stream.pipe(res);
        }

    } catch (error) {
        console.error('Error al streamear video:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo reproducir el video'
        });
    }
});

// Verificar estado del token sin consumir acceso
router.get('/check/:token', (req, res) => {
    const { token } = req.params;
    
    const sql = `SELECT * FROM access_tokens WHERE token = ? AND is_active = 1`;
    
    db.get(sql, [token], (err, accessToken) => {
        if (err) {
            console.error('Error verificando token:', err);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'No se pudo verificar el token'
            });
        }
        
        if (!accessToken) {
            return res.status(404).json({
                error: 'Token no encontrado',
                message: 'El link no es válido o ha expirado'
            });
        }

        // Verificar si se puede usar
        const canUse = accessToken.current_views < accessToken.max_views && 
                      (!accessToken.expires_at || new Date(accessToken.expires_at) > new Date());

        res.json({
            success: true,
            data: {
                valid: canUse,
                expiresAt: accessToken.expires_at,
                maxViews: accessToken.max_views,
                currentViews: accessToken.current_views,
                notes: accessToken.notes
            }
        });
    });
});

module.exports = router;
