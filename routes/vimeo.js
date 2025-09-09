const express = require('express');
const router = express.Router();

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

// Función para obtener video desde Vimeo usando embedding
const getVimeoVideoStream = async (videoId) => {
    console.log('🔄 Obteniendo video desde Vimeo:', videoId);

    try {
        // Mapear video IDs a Vimeo video IDs
        const vimeoVideoIds = {
            '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD': '1116840023', // DEEL 1 - Video ID real de Vimeo
            '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE': '1116863299'  // DEEL 2 - Video ID real de Vimeo
        };

        const vimeoId = vimeoVideoIds[videoId];

        if (!vimeoId) {
            console.log('❌ Video ID no encontrado en Vimeo:', videoId);
            return null;
        }

        console.log(`🎥 Usando embedding de Vimeo con ID: ${vimeoId}`);

        // Generar código de embedding de Vimeo con controles visibles
        const embedCode = `<div style="position:relative;width:100%;height:100%;overflow:hidden;"><iframe src="https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0&color=ffffff&background=1&transparent=0&autoplay=0&muted=0&controls=1&loop=0&quality=auto&responsive=1&keyboard=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" title="Video"></iframe></div>`;

        console.log('✅ Código de embedding de Vimeo generado exitosamente');

        return {
            embedCode: embedCode,
            vimeoId: vimeoId,
            source: 'Vimeo',
            type: 'embed',
            size: '26GB',
            mimeType: 'text/html'
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

// Ruta para streaming de Vimeo
router.get('/stream/:videoId', async (req, res) => {
    const { videoId } = req.params;
    
    console.log(`🎬 Streaming request para video ID: ${videoId}`);
    
    try {
        await serveVimeoVideo(req, res, videoId);
    } catch (error) {
        console.error('❌ Error en ruta de streaming:', error);
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
