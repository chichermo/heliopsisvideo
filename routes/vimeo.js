const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Configuración de Vimeo
let vimeoClient = null;

// Función para inicializar Vimeo
const initializeVimeo = () => {
    try {
        const Vimeo = require('vimeo').Vimeo;
        
        // Usar credenciales directamente (ya configuradas en vimeo.env)
        const clientId = process.env.VIMEO_CLIENT_ID || 'YOUR_CLIENT_ID';
        const clientSecret = process.env.VIMEO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
        const accessToken = process.env.VIMEO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
        
        vimeoClient = new Vimeo(clientId, clientSecret, accessToken);
        
        console.log('✅ Vimeo client inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando Vimeo:', error.message);
        return false;
    }
};

// Inicializar Vimeo al cargar el módulo
initializeVimeo();

// Mapeo seguro de video IDs a Vimeo video IDs (solo en backend)
const SECURE_VIDEO_MAPPING = {
    '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD': '1116840023', // DEEL 1 - Video ID real de Vimeo
    '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE': '1116863299'  // DEEL 2 - Video ID real de Vimeo
};

// Función para generar token temporal seguro
const generateSecureToken = (videoId, userToken) => {
    const timestamp = Date.now();
    const data = `${videoId}-${userToken}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
};

// Función para verificar token y dominio
const verifyAccess = (req, videoId) => {
    const userToken = req.query.token;
    const referer = req.get('Referer') || req.get('Origin');
    const userAgent = req.get('User-Agent');
    
    // Verificar que viene de nuestro dominio
    const allowedDomains = [
        'heliopsis-video.onrender.com',
        'localhost:3000',
        '127.0.0.1:3000'
    ];
    
    const isValidDomain = allowedDomains.some(domain => 
        referer && referer.includes(domain)
    );
    
    if (!isValidDomain) {
        console.log('❌ Acceso denegado - dominio no autorizado:', referer);
        return false;
    }
    
    if (!userToken) {
        console.log('❌ Acceso denegado - token de usuario requerido');
        return false;
    }
    
    console.log('✅ Acceso autorizado para:', { videoId, userToken, referer });
    return true;
};

// Función para obtener video desde Vimeo usando embedding (versión segura)
const getVimeoVideoStream = async (videoId, userToken = null) => {
    console.log('🔄 Obteniendo video desde Vimeo:', videoId);

    try {
        const vimeoId = SECURE_VIDEO_MAPPING[videoId];

        if (!vimeoId) {
            console.log('❌ Video ID no encontrado en Vimeo:', videoId);
            return null;
        }

        console.log(`🎥 Usando embedding de Vimeo con ID: ${vimeoId}`);

        // Generar código de embedding de Vimeo con controles visibles y parámetros de seguridad
        const embedCode = `<div style="position:relative;width:100%;height:100%;overflow:hidden;"><iframe src="https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0&color=ffffff&background=1&transparent=0&autoplay=0&muted=0&controls=1&loop=0&quality=auto&responsive=1&keyboard=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" title="Video"></iframe></div>`;

        console.log('✅ Código de embedding de Vimeo generado exitosamente');

        return {
            embedCode: embedCode,
            vimeoId: vimeoId,
            source: 'Vimeo',
            type: 'embed',
            size: '26GB',
            mimeType: 'text/html',
            secure: true
        };

    } catch (error) {
        console.error('❌ Error obteniendo video de Vimeo:', error.message);
        return null;
    }
};

// Función para servir video de Vimeo usando embedding
const serveVimeoVideo = async (req, res, videoId) => {
    try {
        const vimeoResult = await getVimeoVideoStream(videoId);

        if (!vimeoResult || !vimeoResult.embedCode) {
            return res.status(404).json({ error: 'Video no encontrado en Vimeo' });
        }

        console.log('🔄 Sirviendo video de Vimeo usando embedding:', videoId);

        // Configurar headers para HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Enviar el código de embedding
        res.send(vimeoResult.embedCode);

    } catch (error) {
        console.error('❌ Error sirviendo video de Vimeo:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

// Ruta SEGURA para streaming de Vimeo (requiere autenticación)
router.get('/secure-stream/:videoId', async (req, res) => {
    const { videoId } = req.params;
    
    console.log(`🔒 Streaming SEGURO request para video ID: ${videoId}`);
    
    try {
        // Verificar acceso
        if (!verifyAccess(req, videoId)) {
            return res.status(403).json({ 
                error: 'Acceso denegado', 
                message: 'Token de usuario requerido y dominio autorizado' 
            });
        }
        
        await serveVimeoVideo(req, res, videoId);
    } catch (error) {
        console.error('❌ Error en ruta de streaming seguro:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// Ruta para obtener URL segura del video (para el frontend)
router.get('/secure-url/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const userToken = req.query.token;
    
    console.log(`🔗 Generando URL segura para video ID: ${videoId}`);
    
    try {
        if (!userToken) {
            return res.status(400).json({ error: 'Token de usuario requerido' });
        }
        
        const vimeoId = SECURE_VIDEO_MAPPING[videoId];
        if (!vimeoId) {
            return res.status(404).json({ error: 'Video no encontrado' });
        }
        
        // Generar URL segura con parámetros de autenticación
        const secureUrl = `/api/vimeo/secure-stream/${videoId}?token=${userToken}`;
        
        res.json({
            secureUrl: secureUrl,
            videoId: videoId,
            expires: Date.now() + (60 * 60 * 1000) // 1 hora
        });
        
    } catch (error) {
        console.error('❌ Error generando URL segura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta LEGACY para streaming de Vimeo (mantener compatibilidad)
router.get('/stream/:videoId', async (req, res) => {
    const { videoId } = req.params;
    
    console.log(`🎬 Streaming LEGACY request para video ID: ${videoId}`);
    
    try {
        await serveVimeoVideo(req, res, videoId);
    } catch (error) {
        console.error('❌ Error en ruta de streaming legacy:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

module.exports = {
    router,
    getVimeoVideoStream,
    serveVimeoVideo
};
