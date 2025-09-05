const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/access_tokens.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    
    console.log('✅ Base de datos SQLite conectada');
    
    // Verificar si existe la tabla simple_tokens
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('❌ Error listando tablas:', err);
            return;
        }
        
        console.log('📋 Tablas encontradas:', tables.map(t => t.name));
        
        const hasSimpleTokens = tables.some(t => t.name === 'simple_tokens');
        console.log('🔑 Tabla simple_tokens existe:', hasSimpleTokens);
        
        if (!hasSimpleTokens) {
            console.log('🔄 Creando tabla simple_tokens...');
            
            // Crear tabla simple_tokens
            db.run(`CREATE TABLE IF NOT EXISTS simple_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                video_ids TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                views INTEGER DEFAULT 0,
                max_views INTEGER DEFAULT 999999,
                is_active BOOLEAN DEFAULT 1,
                last_accessed DATETIME,
                notes TEXT,
                payment_status TEXT DEFAULT 'paid'
            )`, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla simple_tokens:', err);
                } else {
                    console.log('✅ Tabla simple_tokens creada');
                    
                    // Insertar tokens de ejemplo (los que generaste ayer)
                    const tokensEjemplo = [
                        {
                            token: 'e8a7de00153327b0234e98ab4e3ee195',
                            email: 'test@example.com',
                            password: 'zPa6halt',
                            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
                        },
                        {
                            token: '5cdb2cef5ef4b254637bdadac2fa9124',
                            email: 'test@example.com',
                            password: '9vpfMDyb',
                            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
                        },
                        {
                            token: 'd1731f272b43b028d1279c4df79452ff',
                            email: 'test@example.com',
                            password: 'IgVJSETn',
                            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
                        },
                        {
                            token: 'ca48c528a11179356e9ba6a24056e4c8',
                            email: 'test@example.com',
                            password: 'Test123',
                            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
                        },
                        {
                            token: 'caaa7bcf28d43f46f5c50cd823b51192',
                            email: 'test@example.com',
                            password: 'Test123',
                            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
                        },
                        {
                            token: 'b05606a5c7c10d19bf563f44c023192e',
                            email: 'test@example.com',
                            password: 'Test123',
                            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'
                        }
                    ];
                    
                    console.log('🔄 Restaurando tokens de ayer...');
                    
                    tokensEjemplo.forEach((tokenData, index) => {
                        const insertQuery = `
                            INSERT INTO simple_tokens (token, email, password, video_ids, max_views, notes, payment_status)
                            VALUES (?, ?, ?, ?, 999999, 'Token permanente recuperado', 'paid')
                        `;
                        
                        db.run(insertQuery, [tokenData.token, tokenData.email, tokenData.password, tokenData.video_ids], function(err) {
                            if (err) {
                                console.error(`❌ Error insertando token ${index + 1}:`, err.message);
                            } else {
                                console.log(`✅ Token ${index + 1} restaurado: ${tokenData.token.substring(0,8)}...`);
                            }
                            
                            if (index === tokensEjemplo.length - 1) {
                                console.log('\n🎉 ¡Todos los tokens han sido restaurados!');
                                console.log('📊 Verificando tokens restaurados...');
                                
                                db.all('SELECT token, email, max_views, created_at FROM simple_tokens', [], (err, rows) => {
                                    if (err) {
                                        console.error('❌ Error verificando tokens:', err);
                                    } else {
                                        console.log(`📈 Total de tokens: ${rows.length}`);
                                        rows.forEach((row, i) => {
                                            console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | Max Views: ${row.max_views} | ${row.created_at}`);
                                        });
                                    }
                                    process.exit();
                                });
                            }
                        });
                    });
                }
            });
        } else {
            console.log('✅ La tabla simple_tokens ya existe');
            
            // Verificar tokens existentes
            db.all('SELECT token, email, max_views, created_at FROM simple_tokens', [], (err, rows) => {
                if (err) {
                    console.error('❌ Error obteniendo tokens:', err);
                } else {
                    console.log(`📊 Total de tokens: ${rows.length}`);
                    rows.forEach((row, i) => {
                        console.log(`${i+1}. ${row.token.substring(0,8)}... | ${row.email} | Max Views: ${row.max_views} | ${row.created_at}`);
                    });
                }
                process.exit();
            });
        }
    });
});
