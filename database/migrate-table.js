const { db } = require('./init');

// Script para migrar la tabla simple_tokens existente
function migrateSimpleTokensTable() {
    console.log('🔄 Iniciando migración de tabla simple_tokens...');
    
    // Primero verificar si la tabla existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla:', err);
            return;
        }
        
        if (!table) {
            console.log('⚠️ La tabla simple_tokens no existe, creándola...');
            createNewTable();
            return;
        }
        
        console.log('✅ Tabla simple_tokens existe, verificando columnas...');
        
        // Obtener estructura actual de la tabla
        db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error obteniendo estructura de tabla:', err);
                return;
            }
            
            console.log('📋 Columnas actuales:', columns.map(c => c.name));
            
            const requiredColumns = [
                'id', 'token', 'email', 'video_ids', 'password', 'views', 'max_views',
                'is_permanent', 'requires_password', 'status', 'created_at', 'last_used',
                'is_active', 'last_accessed', 'notes', 'payment_status'
            ];
            
            const existingColumns = columns.map(c => c.name);
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
            
            if (missingColumns.length === 0) {
                console.log('✅ Todas las columnas necesarias están presentes');
                insertTokens();
                return;
            }
            
            console.log('⚠️ Faltan columnas:', missingColumns);
            console.log('🔄 Recreando tabla con estructura completa...');
            
            // Crear tabla temporal con estructura completa
            db.run(`CREATE TABLE simple_tokens_new (
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
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                payment_status TEXT DEFAULT 'completed'
            )`, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla nueva:', err);
                    return;
                }
                
                console.log('✅ Tabla nueva creada, copiando datos...');
                
                // Copiar datos existentes
                db.run(`INSERT INTO simple_tokens_new 
                    (id, token, email, video_ids, password, views, max_views, created_at, last_used)
                    SELECT id, token, email, video_ids, password, views, max_views, created_at, last_used
                    FROM simple_tokens`, (err) => {
                    if (err) {
                        console.error('❌ Error copiando datos:', err);
                        return;
                    }
                    
                    console.log('✅ Datos copiados, reemplazando tabla...');
                    
                    // Eliminar tabla antigua y renombrar la nueva
                    db.run(`DROP TABLE simple_tokens`, (err) => {
                        if (err) {
                            console.error('❌ Error eliminando tabla antigua:', err);
                            return;
                        }
                        
                        db.run(`ALTER TABLE simple_tokens_new RENAME TO simple_tokens`, (err) => {
                            if (err) {
                                console.error('❌ Error renombrando tabla:', err);
                                return;
                            }
                            
                            console.log('✅ Migración completada');
                            insertTokens();
                        });
                    });
                });
            });
        });
    });
}

function createNewTable() {
    const createTableSQL = `
        CREATE TABLE simple_tokens (
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
            last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            payment_status TEXT DEFAULT 'completed'
        )
    `;
    
    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('❌ Error creando tabla:', err);
            return;
        }
        
        console.log('✅ Tabla simple_tokens creada');
        insertTokens();
    });
}

function insertTokens() {
    console.log('🔄 Insertando tokens de emergencia...');
    
    const emergencyTokens = [
        { email: 'johnnycoppejans@hotmail.com', token: '3e736c6f6eb01c7942fe52e841495877', password: '7WbovVpD' },
        { email: 'shana.moyaert@hotmail.com', token: '6679c5eff294e2014ace94dc0fbf2ac5', password: 'zlhv96rH' },
        { email: 'Moens_Tamara@hotmail.com', token: '2186025af95ed07d769ac7a493e469a7', password: 'YDki5j9x' },
        { email: 'chiara@brandstoffenslabbinck.com', token: 'd4585c2f30851d38df97533004faab0e', password: 'qkR8UkeL' },
        { email: 'verraes-dhooghe@skynet.be', token: 'ffce28c9269663d32bf63b275caf759c', password: '3M5V3iPe' }
    ];
    
    let insertedCount = 0;
    
    emergencyTokens.forEach((tokenData, index) => {
        const insertSQL = `
            INSERT OR REPLACE INTO simple_tokens 
            (token, email, video_ids, password, views, max_views, is_permanent, requires_password, status, is_active, last_accessed, notes, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
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
            'Token de emergencia',
            'completed'
        ], (err) => {
            if (err) {
                console.error(`❌ Error insertando token ${tokenData.token}:`, err);
            } else {
                console.log(`✅ Token insertado: ${tokenData.email}`);
                insertedCount++;
                
                if (insertedCount === emergencyTokens.length) {
                    console.log(`🎉 ${emergencyTokens.length} tokens de emergencia insertados`);
                    
                    // Verificar conteo final
                    db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
                        if (err) {
                            console.error('❌ Error contando tokens finales:', err);
                        } else {
                            console.log(`📊 Total de tokens en la base de datos: ${result.count}`);
                        }
                        
                        // Cerrar conexión
                        setTimeout(() => {
                            db.close((err) => {
                                if (err) {
                                    console.error('❌ Error cerrando base de datos:', err);
                                } else {
                                    console.log('✅ Conexión cerrada');
                                }
                                process.exit(0);
                            });
                        }, 2000);
                    });
                }
            }
        });
    });
}

// Ejecutar migración
migrateSimpleTokensTable();
