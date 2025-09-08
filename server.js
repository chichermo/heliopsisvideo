const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database/init');
const { googledriveRoutes } = require('./routes/googledrive');
const accessRoutes = require('./routes/access');
const videoRoutes = require('./routes/video');
const videoManagementRoutes = require('./routes/videos');
const videoSimpleRoutes = require('./routes/video-simple');
const { router: vimeoRoutes } = require('./routes/vimeo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            mediaSrc: ["'self'", "https://graph.microsoft.com", "https://drive.google.com", "https://*.googleusercontent.com", "https://res.cloudinary.com", "https://mega.nz", "https://*.mega.nz", "https://player.vimeo.com", "https://*.vimeo.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://drive.google.com", "https://*.drive.google.com", "https://drive.usercontent.google.com", "https://mega.nz", "https://*.mega.nz", "https://player.vimeo.com", "https://*.vimeo.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'", "https://drive.google.com", "https://*.drive.google.com", "https://mega.nz", "https://*.mega.nz", "https://player.vimeo.com", "https://*.vimeo.com"]
        },
        upgradeInsecureRequests: true
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar base de datos
initDatabase();

// Rutas de la API
app.use('/api/googledrive', googledriveRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/videos', videoManagementRoutes);
app.use('/api/video-simple', videoSimpleRoutes);
app.use('/api/vimeo', vimeoRoutes);

// Ruta para verificar tokens de emergencia (compatibilidad con frontend)
app.get('/api/emergency-token/:token', (req, res) => {
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
            email: 'johnnycoppejans@hotmail.com',
            password: '7WbovVpD',
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

// Ruta principal para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para ver videos con token
app.get('/watch/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Ruta para ver videos con token simple
app.get('/watch-simple/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player-simple.html'));
});

// Ruta de inicio
app.get('/', (req, res) => {
    res.json({
        message: 'Sistema de Control de Acceso para Videos',
        version: '1.0.0',
        endpoints: {
            admin: '/admin',
            generateLink: '/api/access/generate',
            watchVideo: '/watch/:token'
        }
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
    console.log(`📺 Panel de administración: http://localhost:${PORT}/admin`);
    console.log(`🎥 Ejemplo de link: http://localhost:${PORT}/watch/tu-token-aqui`);
});

module.exports = app;