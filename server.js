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

// Inicializar tabla de tokens automáticamente
const { initializeTokensTable } = require('./database/auto-init-tokens');
const { createAutomaticBackup, restoreFromLatestBackup } = require('./database/backup-manager');

// Script para migración forzada de todos los tokens
const forceMigrateAllTokens = require('./force-migrate-all-tokens');

setTimeout(async () => {
    // Primero intentar restaurar desde backup
    const restored = await restoreFromLatestBackup();
    
    if (!restored) {
        // Si no hay backup, inicializar tabla normalmente
        initializeTokensTable();
    }
    
    // Crear backup inicial
    setTimeout(async () => {
        await createAutomaticBackup();
    }, 5000);
}, 2000); // Esperar 2 segundos para que la base de datos se inicialice

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

// Ruta POST para verificar credenciales de tokens de emergencia
app.post('/api/emergency-token/:token', (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    
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
        if (password === emergencyTokens[token].password) {
            res.json({
                success: true,
                message: 'Credenciales válidas',
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
            res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
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

// Ruta para el panel de administración simple
app.get('/admin-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-simple.html'));
});

// Ruta para ver videos con token
app.get('/watch/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Ruta para ver videos con token simple
app.get('/watch-simple/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player-simple.html'));
});

// Ruta especial para restaurar tokens exactos
app.post('/api/restore-exact-tokens', async (req, res) => {
    try {
        const { db } = require('./database/init');
        
        const exactTokens = [
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
        
        let insertedCount = 0;
        let errorCount = 0;
        
        for (const tokenData of exactTokens) {
            try {
                const insertSQL = `
                    INSERT OR REPLACE INTO simple_tokens 
                    (token, email, video_ids, password, views, max_views, is_permanent, requires_password, status, is_active, last_accessed, notes, payment_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                await new Promise((resolve, reject) => {
                    db.run(insertSQL, [
                        tokenData.token,
                        tokenData.email,
                        JSON.stringify(['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE']),
                        tokenData.password,
                        0,
                        999999,
                        1,
                        1,
                        'permanente',
                        1,
                        new Date().toISOString(),
                        'Token restaurado',
                        'completed'
                    ], function(err) {
                        if (err) {
                            console.error(`Error insertando token ${tokenData.token}:`, err);
                            errorCount++;
                            reject(err);
                        } else {
                            console.log(`✅ Token insertado: ${tokenData.email}`);
                            insertedCount++;
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.error(`Error procesando token ${tokenData.token}:`, error);
                errorCount++;
            }
        }
        
        // Crear backup después de restaurar tokens
        setTimeout(async () => {
            await createAutomaticBackup();
        }, 2000);
        
        res.json({
            success: true,
            message: `Tokens restaurados: ${insertedCount} exitosos, ${errorCount} errores`,
            inserted: insertedCount,
            errors: errorCount,
            total: exactTokens.length
        });
        
    } catch (error) {
        console.error('Error restaurando tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Error restaurando tokens',
            message: error.message
        });
    }
});

// Endpoint para crear backup manual
app.post('/api/create-backup', async (req, res) => {
    try {
        const filepath = await createAutomaticBackup();
        res.json({
            success: true,
            message: 'Backup creado exitosamente',
            filepath: filepath
        });
    } catch (error) {
        console.error('❌ Error creando backup:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando backup',
            message: error.message
        });
    }
});

// Endpoint para listar backups disponibles
app.get('/api/list-backups', (req, res) => {
    try {
        const { backupManager } = require('./database/backup-manager');
        const backups = backupManager.getAvailableBackups();
        
        res.json({
            success: true,
            backups: backups.map(backup => ({
                filename: backup.filename,
                size: backup.size,
                created: backup.created,
                modified: backup.modified
            }))
        });
    } catch (error) {
        console.error('❌ Error listando backups:', error);
        res.status(500).json({
            success: false,
            error: 'Error listando backups',
            message: error.message
        });
    }
});

// Ruta de inicio
app.get('/', (req, res) => {
    res.json({
        message: 'Sistema de Control de Acceso para Videos',
        version: '1.0.0',
        endpoints: {
            admin: '/admin',
            generateLink: '/api/access/generate',
            watchVideo: '/watch/:token',
            restoreTokens: '/api/restore-exact-tokens'
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