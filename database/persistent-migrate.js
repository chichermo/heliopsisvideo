const { db } = require('./init');

function migratePersistentTokens() {
    console.log('🔄 Iniciando migración para tokens permanentes...');
    
    // Agregar columnas nuevas si no existen
    const alterQueries = [
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
    
    // Crear índices para mejor rendimiento
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
    
    console.log('✅ Migración de tokens permanentes completada');
}

module.exports = { migratePersistentTokens };
