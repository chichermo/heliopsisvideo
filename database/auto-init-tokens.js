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
