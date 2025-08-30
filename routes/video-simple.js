const express = require('express');
const { db } = require('../database/init');
const { getGoogleDriveVideoStream } = require('./googledrive');
const crypto = require('crypto');

const router = express.Router();

// Sistema SIMPLE de tokens - sin complicaciones
const activeTokens = new Map();

// Función para obtener la URL base dinámica
function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${protocol}://${host}`;
}

// Función para generar contraseña aleatoria
function generatePassword() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
    
    // Generar contraseña aleatoria
    const password = generatePassword();
    
    // Guardar en memoria (simple y rápido) - SIN EXPIRACIÓN
    activeTokens.set(token, {
        email,
        video_id,
        password, // Contraseña asociada al email
        created: new Date(),
        views: 0,
        maxViews: 1000, // Muchas más vistas para evitar problemas
        // NO HAY EXPIRACIÓN - LOS TOKENS NO EXPIRAN
    });
    
    console.log(`✅ Token simple creado: ${token} para ${email} con contraseña: ${password}`);
    
    // Usar URL dinámica para producción
    const baseUrl = getBaseUrl(req);
    const link = `${baseUrl}/watch-simple/${token}`;
    
    res.json({
        success: true,
        token,
        password, // Devolver la contraseña al administrador
        link: link,
        message: `Token creado con contraseña: ${password}`
    });
});

// Verificar token simple (GET - sin validación de email)
router.get('/check-simple/:token', (req, res) => {
    const { token } = req.params;
    
    const tokenData = activeTokens.get(token);
    
    if (!tokenData) {
        return res.status(404).json({
            error: 'Token no encontrado'
        });
    }
    
    // Verificar solo límite de vistas, NO expiración
    const isValid = tokenData.views < tokenData.maxViews;
    
    res.json({
        success: true,
        valid: isValid,
        email: tokenData.email,
        views: tokenData.views,
        maxViews: tokenData.maxViews,
        // NO INCLUIR EXPIRACIÓN
    });
});

// Verificar token simple CON VALIDACIÓN DE EMAIL Y CONTRASEÑA
router.post('/check-simple/:token', (req, res) => {
    const { token } = req.params;
    const { email, password } = req.body;
    
    const tokenData = activeTokens.get(token);
    
    if (!tokenData) {
        return res.status(404).json({
            error: 'Token no encontrado'
        });
    }
    
    // Validar email si se proporciona
    if (email && email !== tokenData.email) {
        return res.status(403).json({
            error: 'Email no autorizado para este token',
            emailValidated: false,
            passwordValidated: false
        });
    }
    
    // Validar contraseña si se proporciona
    if (password && password !== tokenData.password) {
        return res.status(403).json({
            error: 'Contraseña incorrecta',
            emailValidated: email === tokenData.email,
            passwordValidated: false
        });
    }
    
    // Verificar solo límite de vistas, NO expiración
    const isValid = tokenData.views < tokenData.maxViews;
    
    res.json({
        success: true,
        valid: isValid,
        email: tokenData.email,
        views: tokenData.views,
        maxViews: tokenData.maxViews,
        emailValidated: email === tokenData.email,
        passwordValidated: password === tokenData.password,
        accessValidated: email === tokenData.email && password === tokenData.password
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
    
    // Verificar límite de vistas
    if (tokenData.views >= tokenData.maxViews) {
        return res.status(403).json({
            error: 'Límite de vistas alcanzado'
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

// Ruta para migrar tokens del sistema complejo al simple
router.post('/migrate-token', (req, res) => {
    const { oldToken } = req.body;
    
    if (!oldToken) {
        return res.status(400).json({
            error: 'Token requerido'
        });
    }
    
    // Buscar token en la base de datos del sistema complejo
    db.get('SELECT * FROM access_tokens WHERE token = ?', [oldToken], (err, tokenData) => {
        if (err) {
            console.error('Error buscando token:', err);
            return res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
        
        if (!tokenData) {
            return res.status(404).json({
                error: 'Token no encontrado'
            });
        }
        
        // Crear nuevo token simple
        const newToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
        
        // Generar contraseña aleatoria
        const password = generatePassword();
        
        // Guardar en memoria
        activeTokens.set(newToken, {
            email: tokenData.email,
            video_id: tokenData.video_id,
            password: password, // Contraseña asociada al email
            created: new Date(),
            views: 0,
            maxViews: 1000, // Sin expiración
        });
        
        // Usar URL dinámica para producción
        const baseUrl = getBaseUrl(req);
        const link = `${baseUrl}/watch-simple/${newToken}`;
        
        res.json({
            success: true,
            oldToken,
            newToken,
            password, // Devolver la contraseña
            link: link,
            message: `Token migrado exitosamente al sistema simple con contraseña: ${password}`
        });
    });
});

module.exports = router;
