const { db } = require('./init');

// Script para restaurar tokens de emergencia en la base de datos
async function restoreEmergencyTokens() {
    console.log('🔄 Restaurando tokens de emergencia...');
    
    // Tokens de emergencia que estaban hardcodeados
    const emergencyTokens = [
        {
            token: '0a95b5699675be71c815e8475005294f',
            email: 'erienpoppe@gmail.com',
            password: 'kxg8AsFg',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        },
        {
            token: '6679c5eff294e2014ace94dc0fbf2ac5',
            email: 'shana.moyaert@hotmail.com',
            password: 'zlhv96rH',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        },
        {
            token: '3e736c6f6eb01c7942fe52e841495877',
            email: 'johnnycoppejans@hotmail.com',
            password: '7WbovVpD',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        },
        {
            token: '2186025af95ed07d769ac7a493e469a7',
            email: 'johnnycoppejans@hotmail.com',
            password: '7WbovVpD',
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        }
    ];
    
    // Verificar si existe la tabla simple_tokens
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla simple_tokens:', err);
            return;
        }
        
        if (!table) {
            console.log('⚠️ La tabla simple_tokens no existe, creándola...');
            
            // Crear tabla simple_tokens
            db.run(`CREATE TABLE IF NOT EXISTS simple_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                video_ids TEXT NOT NULL,
                password TEXT,
                views INTEGER DEFAULT 0,
                max_views INTEGER DEFAULT 1,
                is_permanent BOOLEAN DEFAULT 0,
                requires_password BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'activo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla simple_tokens:', err);
                    return;
                }
                console.log('✅ Tabla simple_tokens creada');
                insertTokens();
            });
        } else {
            console.log('✅ La tabla simple_tokens ya existe');
            insertTokens();
        }
    });
    
    function insertTokens() {
        emergencyTokens.forEach((tokenData, index) => {
            // Verificar si el token ya existe
            db.get("SELECT id FROM simple_tokens WHERE token = ?", [tokenData.token], (err, existing) => {
                if (err) {
                    console.error(`❌ Error verificando token ${tokenData.token}:`, err);
                    return;
                }
                
                if (existing) {
                    console.log(`⚠️ Token ${tokenData.token} ya existe, actualizando...`);
                    
                    // Actualizar token existente
                    db.run(`UPDATE simple_tokens SET 
                        email = ?, 
                        video_ids = ?, 
                        password = ?, 
                        views = ?, 
                        max_views = ?, 
                        is_permanent = ?, 
                        requires_password = ?, 
                        status = ?
                        WHERE token = ?`, 
                        [
                            tokenData.email,
                            JSON.stringify(tokenData.video_ids),
                            tokenData.password,
                            tokenData.views,
                            tokenData.max_views,
                            tokenData.is_permanent ? 1 : 0,
                            tokenData.requires_password ? 1 : 0,
                            tokenData.status,
                            tokenData.token
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Error actualizando token ${tokenData.token}:`, err);
                            } else {
                                console.log(`✅ Token ${tokenData.token} actualizado`);
                            }
                        });
                } else {
                    console.log(`➕ Insertando token ${tokenData.token}...`);
                    
                    // Insertar nuevo token
                    db.run(`INSERT INTO simple_tokens 
                        (token, email, video_ids, password, views, max_views, is_permanent, requires_password, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                        [
                            tokenData.token,
                            tokenData.email,
                            JSON.stringify(tokenData.video_ids),
                            tokenData.password,
                            tokenData.views,
                            tokenData.max_views,
                            tokenData.is_permanent ? 1 : 0,
                            tokenData.requires_password ? 1 : 0,
                            tokenData.status
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Error insertando token ${tokenData.token}:`, err);
                            } else {
                                console.log(`✅ Token ${tokenData.token} insertado`);
                            }
                        });
                }
            });
        });
        
        // También insertar los videos permitidos
        const videos = [
            {
                video_id: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD',
                title: 'DEEL 1',
                description: 'Primera parte del video',
                notes: 'Video principal - DEEL 1'
            },
            {
                video_id: '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
                title: 'DEEL 2',
                description: 'Segunda parte del video',
                notes: 'Video principal - DEEL 2'
            }
        ];
        
        videos.forEach((video, index) => {
            db.get("SELECT id FROM allowed_videos WHERE video_id = ?", [video.video_id], (err, existing) => {
                if (err) {
                    console.error(`❌ Error verificando video ${video.video_id}:`, err);
                    return;
                }
                
                if (!existing) {
                    console.log(`➕ Insertando video ${video.video_id}...`);
                    
                    db.run(`INSERT INTO allowed_videos (video_id, title, description, notes) VALUES (?, ?, ?, ?)`, 
                        [video.video_id, video.title, video.description, video.notes], (err) => {
                            if (err) {
                                console.error(`❌ Error insertando video ${video.video_id}:`, err);
                            } else {
                                console.log(`✅ Video ${video.video_id} insertado`);
                            }
                        });
                } else {
                    console.log(`⚠️ Video ${video.video_id} ya existe`);
                }
            });
        });
    }
}

// Ejecutar restauración
restoreEmergencyTokens();

// Cerrar conexión después de 10 segundos
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error cerrando base de datos:', err);
        } else {
            console.log('✅ Conexión a base de datos cerrada');
        }
        process.exit(0);
    });
}, 10000);
