const { db } = require('./init');

// Script que se ejecuta automáticamente al iniciar el servidor
function initializeTokensTable() {
    console.log('🔄 Inicializando tabla de tokens...');
    
    // Verificar si la tabla existe y tiene la estructura correcta
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
        
        console.log('✅ Tabla simple_tokens existe, verificando estructura...');
        
        // Verificar si tiene todas las columnas necesarias
        db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error obteniendo estructura:', err);
                return;
            }
            
            const requiredColumns = ['is_permanent', 'requires_password', 'is_active', 'last_accessed', 'notes', 'payment_status'];
            const existingColumns = columns.map(c => c.name);
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
            
            if (missingColumns.length > 0) {
                console.log('⚠️ Faltan columnas en la tabla:', missingColumns);
                console.log('🔄 Ejecutando migración de tabla...');
                migrateTable();
                return;
            }
            
            console.log('✅ Estructura de tabla correcta');
            
            // Verificar si hay tokens
            db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
                if (err) {
                    console.error('❌ Error contando tokens:', err);
                    return;
                }
                
                console.log(`📊 Tokens en la base de datos: ${result.count}`);
                
                if (result.count === 0) {
                    console.log('⚠️ No hay tokens, insertando tokens de emergencia...');
                    insertEmergencyTokens();
                } else {
                    console.log('✅ Hay tokens en la base de datos');
                }
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
        insertEmergencyTokens();
    });
}

function migrateTable() {
    console.log('🔄 Simplificando migración: recreando tabla completa...');
    
    // Eliminar tabla existente y crear una nueva
    db.run(`DROP TABLE simple_tokens`, (err) => {
        if (err) {
            console.error('❌ Error eliminando tabla antigua:', err);
            return;
        }
        
        console.log('✅ Tabla antigua eliminada, creando nueva...');
        
        // Crear nueva tabla con estructura completa
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
                console.error('❌ Error creando nueva tabla:', err);
                return;
            }
            
            console.log('✅ Nueva tabla creada con estructura completa');
            insertEmergencyTokens();
        });
    });
}

function insertEmergencyTokens() {
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
            INSERT INTO simple_tokens 
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
                }
            }
        });
    });
}

// Exportar función para usar en server.js
module.exports = { initializeTokensTable };

// Si se ejecuta directamente
if (require.main === module) {
    initializeTokensTable();
}
