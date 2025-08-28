const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const googledriveRoutes = require('./routes/googledrive');
const accessRoutes = require('./routes/access');
const videoRoutes = require('./routes/video');
const videoManagementRoutes = require('./routes/videos');
const tokenRoutes = require('./routes/tokens');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            mediaSrc: ["'self'", "https://graph.microsoft.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
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
require('./database/init');

// Ejecutar migración - usar migración forzada en producción
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    console.log('🚀 Entorno de producción detectado - Ejecutando migración forzada...');
    require('./database/force-migrate');
} else {
    console.log('🔄 Entorno de desarrollo - Ejecutando migración estándar...');
    require('./database/migrate').migrateDatabase();
}

// Rutas de la API
app.use('/api/googledrive', googledriveRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/videos', videoManagementRoutes);
app.use('/api/tokens', tokenRoutes);

// Ruta principal para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para ver videos con token
app.get('/watch/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
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
