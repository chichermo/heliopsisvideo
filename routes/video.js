const express = require('express');
const { getAccessToken, updateTokenUsage } = require('../database/database');
const { getGoogleDriveVideoStream } = require('./googledrive');

const router = express.Router();

// Middleware para verificar acceso al video
const verifyVideoAccess = async (req, res, next) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({
                error: 'Token de acceso requerido'
            });
        }

        // Obtener información del token
        const accessToken = await getAccessToken(token);
        
        if (!accessToken) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Token inválido o expirado'
            });
        }

        // Verificar si ya se usó el token (si maxViews = 1)
        if (accessToken.maxViews === 1 && accessToken.used) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Este link ya fue utilizado'
            });
        }

        // Verificar si se excedió el número máximo de vistas
        if (accessToken.currentViews >= accessToken.maxViews) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Se ha excedido el número máximo de vistas permitidas'
            });
        }

        // Adjuntar información del token a la request
        req.accessToken = accessToken;
        next();

    } catch (error) {
        console.error('Error al verificar acceso:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo verificar el acceso'
        });
    }
};

// Obtener información del video (metadata)
router.get('/info/:token', verifyVideoAccess, async (req, res) => {
    try {
        const { accessToken } = req;
        
        res.json({
            success: true,
            data: {
                videoId: accessToken.video_id,
                expiresAt: new Date(accessToken.expires_at * 1000).toISOString(),
                maxViews: accessToken.maxViews,
                currentViews: accessToken.currentViews,
                notes: accessToken.notes,
                email: accessToken.email
            }
        });

    } catch (error) {
        console.error('Error al obtener información del video:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener la información del video'
        });
    }
});

// Stream del video desde OneDrive
router.get('/stream/:token', verifyVideoAccess, async (req, res) => {
    try {
        const { accessToken } = req;
        const { token } = req.params;
        
        // Obtener IP y User-Agent para logging
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        // Registrar el acceso al video
        await updateTokenUsage(token, ipAddress, userAgent);

        // Obtener stream del video desde Google Drive
        const videoStream = await getGoogleDriveVideoStream(accessToken.video_id);
        
        if (!videoStream) {
            return res.status(404).json({
                error: 'Video no encontrado',
                message: 'El video no está disponible en OneDrive'
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

// Thumbnail del video (si está disponible)
router.get('/thumbnail/:token', verifyVideoAccess, async (req, res) => {
    try {
        const { accessToken } = req;
        
        // Por ahora, devolver un thumbnail por defecto
        // En el futuro, se puede implementar generación de thumbnails desde OneDrive
        res.json({
            success: true,
            message: 'Thumbnail no implementado aún',
            data: {
                videoId: accessToken.video_id,
                thumbnailUrl: null
            }
        });

    } catch (error) {
        console.error('Error al obtener thumbnail:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el thumbnail'
        });
    }
});

// Verificar estado del token sin consumir acceso
router.get('/check/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const accessToken = await getAccessToken(token);
        
        if (!accessToken) {
            return res.status(404).json({
                error: 'Token no encontrado',
                message: 'El link no es válido o ha expirado'
            });
        }

        // Verificar si se puede usar
        const canUse = accessToken.currentViews < accessToken.maxViews && 
                      accessToken.expires_at > Math.floor(Date.now() / 1000);

        res.json({
            success: true,
            data: {
                valid: canUse,
                expiresAt: new Date(accessToken.expires_at * 1000).toISOString(),
                maxViews: accessToken.maxViews,
                currentViews: accessToken.currentViews,
                used: accessToken.used,
                notes: accessToken.notes
            }
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo verificar el token'
        });
    }
});

module.exports = { videoRoutes: router };
