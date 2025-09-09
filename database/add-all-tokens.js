const { db } = require('./init');
const fs = require('fs');
const path = require('path');

// Script para agregar múltiples tokens y crear respaldos
async function addAllTokens(tokensData) {
    console.log('🔄 Procesando tokens...');
    
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
                            JSON.stringify(tokenData.video_ids),
                            tokenData.password,
                            tokenData.views || 0,
                            tokenData.max_views || 999999,
                            tokenData.is_permanent ? 1 : 0,
                            tokenData.requires_password ? 1 : 0,
                            tokenData.status || 'activo',
                            tokenData.token
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Error actualizando token ${tokenData.token}:`, err);
                                errorCount++;
                            } else {
                                console.log(`✅ Token ${tokenData.token} actualizado`);
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
                            JSON.stringify(tokenData.video_ids),
                            tokenData.password,
                            tokenData.views || 0,
                            tokenData.max_views || 999999,
                            tokenData.is_permanent ? 1 : 0,
                            tokenData.requires_password ? 1 : 0,
                            tokenData.status || 'activo'
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Error insertando token ${tokenData.token}:`, err);
                                errorCount++;
                            } else {
                                console.log(`✅ Token ${tokenData.token} insertado`);
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
        console.log('\n🔄 Creando respaldo de tokens...');
        
        // Crear directorio de respaldos si no existe
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Obtener todos los tokens de la base de datos
        db.all("SELECT * FROM simple_tokens", [], (err, tokens) => {
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
            console.log(`✅ Respaldo creado: ${backupFile}`);
            
            // Crear respaldo en CSV
            const csvFile = path.join(backupDir, `tokens-backup-${timestamp}.csv`);
            let csvContent = 'token,email,password,video_ids,views,max_views,is_permanent,requires_password,status,created_at,last_used\n';
            
            tokens.forEach(token => {
                csvContent += `${token.token},${token.email},${token.password},"${token.video_ids}",${token.views},${token.max_views},${token.is_permanent},${token.requires_password},${token.status},${token.created_at},${token.last_used}\n`;
            });
            
            fs.writeFileSync(csvFile, csvContent);
            console.log(`✅ Respaldo CSV creado: ${csvFile}`);
            
            // Crear respaldo de la base de datos completa
            const dbBackupFile = path.join(backupDir, `database-backup-${timestamp}.db`);
            fs.copyFileSync(path.join(__dirname, 'access_tokens.db'), dbBackupFile);
            console.log(`✅ Respaldo de base de datos creado: ${dbBackupFile}`);
            
            console.log(`\n📊 Resumen:`);
            console.log(`  - Tokens procesados: ${tokens.length}`);
            console.log(`  - Respaldos creados: 3 (JSON, CSV, DB)`);
            console.log(`  - Ubicación: ${backupDir}`);
            
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
            }, 2000);
        });
    }
}

// Función para procesar tokens desde texto plano
function processTokensFromText(text) {
    const lines = text.trim().split('\n');
    const tokens = [];
    
    for (let i = 0; i < lines.length; i += 4) {
        if (i + 3 < lines.length) {
            const token = lines[i].trim();
            const email = lines[i + 1].trim();
            const password = lines[i + 2].trim();
            const videoIds = ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'];
            
            if (token && email && password) {
                tokens.push({
                    token: token,
                    email: email,
                    password: password,
                    video_ids: videoIds,
                    views: 0,
                    max_views: 999999,
                    is_permanent: true,
                    requires_password: true,
                    status: 'permanente'
                });
            }
        }
    }
    
    return tokens;
}

// Exportar funciones
module.exports = {
    addAllTokens,
    processTokensFromText
};

// Si se ejecuta directamente, mostrar instrucciones
if (require.main === module) {
    console.log('📋 INSTRUCCIONES PARA USAR ESTE SCRIPT:');
    console.log('');
    console.log('1. Envía todos tus tokens en este formato:');
    console.log('   token1');
    console.log('   email1@example.com');
    console.log('   password1');
    console.log('   (línea vacía)');
    console.log('   token2');
    console.log('   email2@example.com');
    console.log('   password2');
    console.log('   (línea vacía)');
    console.log('   ...');
    console.log('');
    console.log('2. El script creará automáticamente:');
    console.log('   - Respaldos en JSON, CSV y DB');
    console.log('   - Todos los tokens en la base de datos');
    console.log('   - Videos permitidos');
    console.log('');
    console.log('3. Los respaldos se guardarán en: database/backups/');
    console.log('');
    console.log('💡 Envía tus tokens y yo los procesaré automáticamente!');
}
