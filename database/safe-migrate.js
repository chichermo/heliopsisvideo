const { db } = require('./init');

function safeMigrate() {
    console.log('🔍 Verificando estructura de base de datos...');
    
    // Verificar si la tabla simple_tokens existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla simple_tokens:', err);
            return;
        }
        
        if (!table) {
            console.log('⚠️ Tabla simple_tokens no existe. Creando tabla...');
            createSimpleTokensTable();
        } else {
            console.log('✅ Tabla simple_tokens existe. Ejecutando migración segura...');
            migrateExistingTable();
        }
    });
}

function createSimpleTokensTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS simple_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            password TEXT,
            video_ids TEXT NOT NULL,
            max_views INTEGER DEFAULT 999999,
            views INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            notes TEXT,
            payment_status TEXT DEFAULT 'paid',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('❌ Error creando tabla simple_tokens:', err);
            return;
        }
        
        console.log('✅ Tabla simple_tokens creada exitosamente');
        
        // Crear índices
        createIndexes();
        
        // Insertar tokens por defecto
        insertDefaultTokens();
    });
}

function createIndexes() {
    const indexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_simple_tokens_token ON simple_tokens(token)',
        'CREATE INDEX IF NOT EXISTS idx_simple_tokens_email ON simple_tokens(email)',
        'CREATE INDEX IF NOT EXISTS idx_simple_tokens_created_at ON simple_tokens(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_simple_tokens_last_accessed ON simple_tokens(last_accessed)'
    ];
    
    indexQueries.forEach((query, index) => {
        db.run(query, (err) => {
            if (err) {
                console.error(`Error creando índice ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Índice ${index + 1} creado`);
            }
        });
    });
}

function insertDefaultTokens() {
    console.log('🔄 Insertando tokens por defecto...');
    
    const defaultTokens = [
        {
            token: '0a95b5699675be71c815e8475005294f',
            email: 'usuario@ejemplo.com',
            password: 'password123',
            video_ids: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
            max_views: 999999,
            notes: 'Token permanente garantizado'
        }
    ];
    
    defaultTokens.forEach((tokenData, index) => {
        db.run(`
            INSERT OR IGNORE INTO simple_tokens (token, email, password, video_ids, max_views, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            tokenData.token,
            tokenData.email,
            tokenData.password,
            tokenData.video_ids,
            tokenData.max_views,
            tokenData.notes
        ], function(err) {
            if (err) {
                console.error(`❌ Error insertando token ${index + 1}:`, err);
            } else if (this.changes > 0) {
                console.log(`✅ Token ${index + 1} insertado: ${tokenData.email}`);
            } else {
                console.log(`⚠️ Token ${index + 1} ya existe: ${tokenData.email}`);
            }
        });
    });
}

function migrateExistingTable() {
    console.log('🔄 Migrando tabla existente...');
    
    // Agregar columnas nuevas si no existen
    const alterQueries = [
        'ALTER TABLE simple_tokens ADD COLUMN video_ids TEXT',
        'ALTER TABLE simple_tokens ADD COLUMN last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP',
        'ALTER TABLE simple_tokens ADD COLUMN notes TEXT',
        'ALTER TABLE simple_tokens ADD COLUMN payment_status TEXT DEFAULT "paid"'
    ];
    
    alterQueries.forEach((query, index) => {
        db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error en migración ${index + 1}:`, err.message);
            } else if (!err) {
                console.log(`✅ Migración ${index + 1} completada`);
            }
        });
    });
    
    // Actualizar max_views para tokens existentes si es necesario
    const updateQuery = 'UPDATE simple_tokens SET max_views = 999999 WHERE max_views < 999999';
    db.run(updateQuery, (err) => {
        if (err) {
            console.error('Error actualizando max_views:', err);
        } else {
            console.log('✅ Límite de vistas actualizado para tokens permanentes');
        }
    });
}

module.exports = {
    safeMigrate
};

// Ejecutar si se llama directamente
if (require.main === module) {
    safeMigrate();
}
