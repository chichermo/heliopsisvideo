const { db } = require('./init');
const fs = require('fs');
const path = require('path');

// Script para procesar los tokens del usuario
async function processAllUserTokens() {
    console.log('🔄 Procesando todos los tokens del usuario...');
    
    // Tokens extraídos de las URLs proporcionadas
    const tokensData = [
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
    
    console.log(`📊 Total de tokens a procesar: ${tokensData.length}`);
    
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
                processTokens(tokensData);
            });
        } else {
            console.log('✅ La tabla simple_tokens ya existe');
            processTokens(tokensData);
        }
    });
    
    function processTokens(tokensData) {
        let processedCount = 0;
        let errorCount = 0;
        
        tokensData.forEach((tokenData, index) => {
            // Verificar si el token ya existe
            db.get("SELECT id FROM simple_tokens WHERE token = ?", [tokenData.token], (err, existing) => {
                if (err) {
                    console.error(`❌ Error verificando token ${tokenData.token}:`, err);
                    errorCount++;
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
                            JSON.stringify(['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE']),
                            tokenData.password,
                            0,
                            999999,
                            1,
                            1,
                            'permanente',
                            tokenData.token
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Error actualizando token ${tokenData.token}:`, err);
                                errorCount++;
                            } else {
                                console.log(`✅ Token ${tokenData.token} actualizado (${tokenData.email})`);
                                processedCount++;
                            }
                            
                            if (processedCount + errorCount === tokensData.length) {
                                createBackup();
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
                            JSON.stringify(['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE']),
                            tokenData.password,
                            0,
                            999999,
                            1,
                            1,
                            'permanente'
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Error insertando token ${tokenData.token}:`, err);
                                errorCount++;
                            } else {
                                console.log(`✅ Token ${tokenData.token} insertado (${tokenData.email})`);
                                processedCount++;
                            }
                            
                            if (processedCount + errorCount === tokensData.length) {
                                createBackup();
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
    
    function createBackup() {
        console.log('\n🔄 Creando respaldo completo de tokens...');
        
        // Crear directorio de respaldos si no existe
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Obtener todos los tokens de la base de datos
        db.all("SELECT * FROM simple_tokens ORDER BY created_at DESC", [], (err, tokens) => {
            if (err) {
                console.error('❌ Error obteniendo tokens para respaldo:', err);
                return;
            }
            
            // Crear respaldo en JSON
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `tokens-backup-${timestamp}.json`);
            
            const backupData = {
                timestamp: new Date().toISOString(),
                total_tokens: tokens.length,
                backup_type: 'full_user_tokens_backup',
                tokens: tokens.map(token => ({
                    token: token.token,
                    email: token.email,
                    video_ids: JSON.parse(token.video_ids),
                    password: token.password,
                    views: token.views,
                    max_views: token.max_views,
                    is_permanent: token.is_permanent === 1,
                    requires_password: token.requires_password === 1,
                    status: token.status,
                    created_at: token.created_at,
                    last_used: token.last_used
                }))
            };
            
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`✅ Respaldo JSON creado: ${path.basename(backupFile)}`);
            
            // Crear respaldo en CSV
            const csvFile = path.join(backupDir, `tokens-backup-${timestamp}.csv`);
            let csvContent = 'token,email,password,video_ids,views,max_views,is_permanent,requires_password,status,created_at,last_used\n';
            
            tokens.forEach(token => {
                csvContent += `${token.token},${token.email},${token.password},"${token.video_ids}",${token.views},${token.max_views},${token.is_permanent},${token.requires_password},${token.status},${token.created_at},${token.last_used}\n`;
            });
            
            fs.writeFileSync(csvFile, csvContent);
            console.log(`✅ Respaldo CSV creado: ${path.basename(csvFile)}`);
            
            // Crear respaldo de la base de datos completa
            const dbBackupFile = path.join(backupDir, `database-backup-${timestamp}.db`);
            fs.copyFileSync(path.join(__dirname, 'access_tokens.db'), dbBackupFile);
            console.log(`✅ Respaldo de base de datos creado: ${path.basename(dbBackupFile)}`);
            
            // Crear archivo de tokens hardcodeados para emergencia
            const emergencyFile = path.join(backupDir, `emergency-tokens-${timestamp}.js`);
            let emergencyCode = `// Respaldo de tokens de emergencia - ${new Date().toISOString()}
// Total de tokens: ${tokens.length}

const emergencyTokens = {
`;

            tokens.forEach((token, index) => {
                const videoIds = JSON.parse(token.video_ids);
                emergencyCode += `    '${token.token}': {
        email: '${token.email}',
        password: '${token.password}',
        video_ids: ${JSON.stringify(videoIds)},
        views: ${token.views},
        max_views: ${token.max_views},
        is_permanent: ${token.is_permanent === 1},
        requires_password: ${token.requires_password === 1},
        status: '${token.status}'
    }`;
                
                if (index < tokens.length - 1) {
                    emergencyCode += ',\n';
                } else {
                    emergencyCode += '\n';
                }
            });
            
            emergencyCode += `};

module.exports = { emergencyTokens };
`;

            fs.writeFileSync(emergencyFile, emergencyCode);
            console.log(`✅ Archivo de emergencia creado: ${path.basename(emergencyFile)}`);
            
            console.log(`\n📊 RESUMEN FINAL:`);
            console.log(`  ✅ Tokens procesados: ${tokens.length}`);
            console.log(`  ✅ Respaldos creados: 4 archivos`);
            console.log(`  📁 Ubicación: ${backupDir}`);
            console.log(`  🔒 Sistema de respaldo: ACTIVO`);
            
            // Cerrar conexión
            setTimeout(() => {
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error cerrando base de datos:', err);
                    } else {
                        console.log('✅ Conexión a base de datos cerrada');
                    }
                    process.exit(0);
                });
            }, 3000);
        });
    }
}

// Ejecutar procesamiento
processAllUserTokens();
