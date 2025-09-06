const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { router: googledriveRoutes } = require('./routes/googledrive');
const accessRoutes = require('./routes/access');
const videoRoutes = require('./routes/video');
const videoSimpleRoutes = require('./routes/video-simple');
const videoManagementRoutes = require('./routes/videos');
const tokenRoutes = require('./routes/tokens');
const testTokenRoutes = require('./routes/test-token');
const dbStatusRoutes = require('./routes/db-status');
const fixTokenRoutes = require('./routes/fix-token');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            mediaSrc: ["'self'", "https://graph.microsoft.com", "https://drive.google.com", "https://*.googleusercontent.com", "https://res.cloudinary.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://drive.google.com", "https://*.drive.google.com", "https://drive.usercontent.google.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"]
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
require('./database/init');

// Ejecutar migración - usar migración forzada en producción
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    console.log('🚀 Entorno de producción detectado - Ejecutando migración forzada...');
    require('./database/force-migrate');
} else {
    console.log('🔄 Entorno de desarrollo - Ejecutando migración estándar...');
    require('./database/migrate').migrateDatabase();
}

// Ejecutar migración segura
console.log('🔒 Ejecutando migración segura de base de datos...');
require('./database/safe-migrate').safeMigrate();

// Ejecutar diagnóstico después de un breve delay
setTimeout(() => {
    console.log('🔍 Ejecutando diagnóstico de base de datos...');
    require('./database/diagnose').diagnoseDatabase();
}, 2000);

// Actualizar credenciales del token después de un delay más largo
setTimeout(() => {
    console.log('🔧 Actualizando credenciales del token...');
    require('./database/update-token-credentials');
}, 5000);

// Middleware para bloquear descargas de video
app.use('/api/video-simple/stream-simple/:token/:videoId', (req, res, next) => {
    // Bloquear herramientas de descarga conocidas
    const userAgent = req.headers['user-agent'] || '';
    const downloadTools = [
        'wget', 'curl', 'aria2c', 'youtube-dl', 'yt-dlp', 'ffmpeg',
        'download', 'downloader', 'save', 'grab', 'capture', 'postman',
        'insomnia', 'thunder', 'fiddler', 'charles'
    ];
    
    const isDownloadTool = downloadTools.some(tool => 
        userAgent.toLowerCase().includes(tool.toLowerCase())
    );
    
    if (isDownloadTool) {
        console.log(`🚫 Download attempt blocked from: ${userAgent}`);
        return res.status(403).json({
            success: false,
            error: 'Download tools not allowed'
        });
    }
    
    // Log para debugging
    console.log(`🎬 Video request: ${req.method} ${req.path}`);
    console.log(`👤 User-Agent: ${userAgent}`);
    console.log(`🔗 Referer: ${req.headers['referer'] || 'No referer'}`);
    console.log(`🌐 Host: ${req.get('host')}`);
    
    // Bloquear solicitudes sin referer válido (más permisivo para debugging)
    const referer = req.headers['referer'] || '';
    if (!referer) {
        console.log(`⚠️ No referer found, but allowing for debugging`);
        // Permitir sin referer por ahora para debugging
    } else if (!referer.includes(req.get('host'))) {
        console.log(`🚫 Cross-origin access blocked from: ${referer}`);
        return res.status(403).json({
            success: false,
            error: 'Cross-origin access not allowed'
        });
    }
    
    next();
});

// Rutas de la API
app.use('/api/googledrive', googledriveRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/video-simple', videoSimpleRoutes);
app.use('/api/videos', videoManagementRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/test', testTokenRoutes);
app.use('/api/debug', dbStatusRoutes);
app.use('/api/fix', fixTokenRoutes);

// Ruta principal para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-simple.html'));
});

// Ruta para ver videos con token
app.get('/watch/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

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

// Función para insertar tokens originales al iniciar
function insertOriginalTokens() {
    const { db } = require('./database/init');
    
    // Lista completa de tokens originales
    const originalTokens = [
        { email: 'Moens_Tamara@hotmail.com', token: '2186025af95ed07d769ac7a493e469a7', password: 'YDki5j9x' },
        { email: 'chiara@brandstoffenslabbinck.com', token: 'd4585c2f30851d38df97533004faab0e', password: 'qkR8UkeL' },
        { email: 'johnnycoppejans@hotmail.com', token: '3e736c6f6eb01c7942fe52e841495877', password: '7WbovVpD' },
        { email: 'verraes-dhooghe@skynet.be', token: 'ffce28c9269663d32bf63b275caf759c', password: '3M5V3iPe' },
        { email: 'schiettecatte.nathalie@gmail.com', token: '57f11b2591563aa3d69a19a5c0da85fd', password: '2etOWzJy' },
        { email: 'lizzy.litaer@gmail.com', token: '552dfb7004e9482a7b77db223aebd92c', password: 'vaaG4whP' },
        { email: 'info@knokke-interiors.be', token: 'd7e7ae1e1953a2512635840e6a36bd88', password: 'rMr2jtbL' },
        { email: 'kellefleerackers@hotmail.com', token: 'c12e1ab7cc23887acead9db2e27c52bc', password: 'mkjSjY7N' },
        { email: 'evy_verstrynge@hotmail.com', token: 'ee6c8bb94d76ba0e18b5b6de1324138b', password: '2SCSmij7' },
        { email: 'eline.degroote08@icloud.com', token: 'e4dfa25683905acf5be666d66f3d2ec6', password: '5lxm2kVC' },
        { email: 'melissa_lamote@hotmail.com', token: '708a234c20d1b2c95fb604e02130ece3', password: '1ILi4iX3' },
        { email: 'tantefie2109@hotmail.com', token: 'b02df63790a3b733cb6d521023f2a3b5', password: 'A6J6Vnzq' },
        { email: 'emilydelcroix123@gmail.com', token: 'eeec1ddfcd54f946a215f63aec1625e3', password: 'FzuI06Zn' },
        { email: 'verbouwsandra@gmail.com', token: '988f706df719313e2612994893efe24b', password: 'Qwv6PJgn' },
        { email: 'sam_bogaert@outlook.com', token: '55c17a2364d9b55b36d2bcea3b418d31', password: 'p49ZX60E' },
        { email: 'jessie-westyn@hotmail.com', token: '0d6063265005fb10e7efe7fa81871006', password: 'kbE57BXB' },
        { email: 'France.dekeyser@hotmail.com', token: '382f2404e48d269850782b098babef8a', password: 'iDoDKn8h' },
        { email: 'ella8300@icloud.com', token: '7d5edb6595788b9ab48d55cba1a6dd05', password: 'troUdlXV' },
        { email: 'sofiehertsens@hotmail.com', token: '29202f2a81862ab8e3ea2280dfcfa8d1', password: 'HyXCwyr4' },
        { email: 'w-elshout@hotmail.com', token: 'fc455d68f3f81fca8eede63fdc46f868', password: 'cWB9wYom' },
        { email: 'joyavantorre@gmail.com', token: 'e99c610d8b7887d2f03e2160dc02932a', password: 'Rvn28U15' },
        { email: 'vstaal@hotmail.com', token: '5ab19ba7e644047967e4c4f7b72445a4', password: 'nmn3pWkM' },
        { email: 'kurzieboy@hotmail.com', token: '0469d9ab40b84e74636387ee11db450a', password: '0xzLaSBR' },
        { email: 'marjolijnrotsaert@hotmail.com', token: '85bb0db6b1440ae97775c445923f2b7f', password: '7K7wWaxe' },
        { email: 'shana.moyaert@hotmail.com', token: '6679c5eff294e2014ace94dc0fbf2ac5', password: 'zlhv96rH' },
        { email: 'ymkevanherpe@hotmail.com', token: 'ddcffb66ce06e26493e679e095e6d54a', password: 'cgbR1cw2' },
        { email: 'fauve.muyllaert@gmail.com', token: 'a99956c7ac4c0618107cb55f29df4fff', password: 'XCDKZb2v' },
        { email: 'christy.de.graeve@icloud.com', token: '387f385c619d17864eb6a610b2d6d77a', password: 'AqRwy2Zd' },
        { email: 'lindeversporten@gmail.com', token: '8c9bfdf01215c99b9b303459de515e52', password: 'a24WttS1' },
        { email: 'Carole.scrivens@gmail.com', token: '047993c360a8e0258e7b895d2ca62c77', password: 'naEmwyBH' }
    ];
    
    console.log(`🔄 Insertando ${originalTokens.length} tokens originales...`);
    
    let successCount = 0;
    originalTokens.forEach((tokenData, index) => {
        const insertQuery = `
            INSERT OR REPLACE INTO simple_tokens 
            (token, email, password, video_ids, max_views, notes, payment_status, is_active, views, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
        `;
        
        db.run(insertQuery, [
            tokenData.token,
            tokenData.email,
            tokenData.password,
            '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
            999999,
            'Token original restaurado - Acceso permanente garantizado',
            'paid'
        ], function(err) {
            if (err) {
                console.log(`❌ Error insertando token ${index + 1}: ${err.message}`);
            } else {
                console.log(`✅ Token ${index + 1}/${originalTokens.length} insertado: ${tokenData.email}`);
                successCount++;
            }
            
            if (successCount + (index + 1 - successCount) === originalTokens.length) {
                console.log(`\n🎉 ¡${successCount} tokens originales insertados exitosamente!`);
                console.log('🔗 Los usuarios pueden usar sus links y passwords originales');
                console.log('🔒 Todos los tokens son permanentes (999999 views)');
            }
        });
    });
}

// Función para mostrar tokens reales al iniciar
function showRealTokens() {
    const { db } = require('./database/init');
    
    const query = `
        SELECT token, email, password, max_views, is_active, notes, created_at
        FROM simple_tokens 
        WHERE email NOT LIKE '%example%' 
        AND email NOT LIKE '%test%'
        AND email != 'test-nuevo@example.com'
        ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error obteniendo tokens:', err);
            return;
        }
        
        if (rows.length > 0) {
            console.log(`\n📋 TOKENS REALES CREADOS (${rows.length}):`);
            console.log('================================================');
            
            rows.forEach((token, index) => {
                console.log(`${index + 1}. ${token.email}`);
                console.log(`   Token: ${token.token}`);
                console.log(`   Password: ${token.password}`);
                console.log(`   Link: https://heliopsis-video.onrender.com/watch-simple/${token.token}`);
                console.log(`   Max Views: ${token.max_views}`);
                console.log(`   Status: ${token.is_active ? 'ACTIVO' : 'INACTIVO'}`);
                console.log('   ---');
            });
            
            console.log('================================================');
            console.log('🔒 Todos los tokens son permanentes (999999 views)');
            console.log('🚀 Los tokens estarán disponibles en Render después del despliegue');
        }
    });
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en http://localhost:${PORT} - CSP Updated`);
    console.log(`📺 Panel de administración: http://localhost:${PORT}/admin`);
    console.log(`🎥 Ejemplo de link: http://localhost:${PORT}/watch/tu-token-aqui`);
    
    // Insertar tokens originales y mostrar tokens reales después de un breve delay
    setTimeout(() => {
        insertOriginalTokens();
        setTimeout(showRealTokens, 3000);
    }, 2000);
});

module.exports = app;
