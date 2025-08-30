const express = require('express');
const { db } = require('../database/init');
const { getGoogleDriveVideoStream } = require('./googledrive');

const router = express.Router();

// Sistema SIMPLE de tokens - sin complicaciones
const activeTokens = new Map();

// Función para obtener la URL base dinámica
function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${protocol}://${host}`;
}

// Crear token simple
router.post('/create-simple', (req, res) => {
    const { email, video_id } = req.body;
    
    if (!email || !video_id) {
        return res.status(400).json({
            error: 'Email y video_id son requeridos'
        });
    }
    
    // Token simple de 32 caracteres
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Guardar en memoria (simple y rápido)
    activeTokens.set(token, {
        email,
        video_id,
        created: new Date(),
        views: 0,
        maxViews: 100 // Muchas vistas para evitar problemas
    });
    
    console.log(`✅ Token simple creado: ${token} para ${email}`);
    
    // Usar URL dinámica para producción
    const baseUrl = getBaseUrl(req);
    const link = `${baseUrl}/watch-simple/${token}`;
    
    res.json({
        success: true,
        token,
        link: link
    });
});

// Verificar token simple
router.get('/check-simple/:token', (req, res) => {
    const { token } = req.params;
    
    const tokenData = activeTokens.get(token);
    
    if (!tokenData) {
        return res.status(404).json({
            error: 'Token no encontrado'
        });
    }
    
    res.json({
        success: true,
        valid: tokenData.views < tokenData.maxViews,
        email: tokenData.email,
        views: tokenData.views,
        maxViews: tokenData.maxViews
    });
});

// Stream simple - SIN VERIFICACIONES COMPLEJAS
router.get('/stream-simple/:token', async (req, res) => {
    const { token } = req.params;
    
    console.log(`🎬 Streaming simple para token: ${token}`);
    
    const tokenData = activeTokens.get(token);
    
    if (!tokenData) {
        return res.status(404).json({
            error: 'Token no encontrado'
        });
    }
    
    try {
        // Obtener stream directamente
        const videoStream = await getGoogleDriveVideoStream(tokenData.video_id);
        
        if (!videoStream) {
            return res.status(404).json({
                error: 'Video no encontrado'
            });
        }
        
        // Incrementar vistas solo una vez por sesión
        if (tokenData.views === 0) {
            tokenData.views++;
            console.log(`📊 Vistas incrementadas para ${token}: ${tokenData.views}`);
        }
        
        // Configurar headers básicos
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        
        // Stream directo
        videoStream.stream.pipe(res);
        
    } catch (error) {
        console.error('Error en streaming simple:', error);
        res.status(500).json({
            error: 'Error al reproducir video'
        });
    }
});

module.exports = router;
