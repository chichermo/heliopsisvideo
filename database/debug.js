const { db } = require('./init');

// Script de diagnóstico y migración
async function debugDatabase() {
    console.log('🔍 Iniciando diagnóstico de base de datos...');
    
    // Verificar si la tabla allowed_videos existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='allowed_videos'", [], (err, table) => {
        if (err) {
            console.error('❌ Error verificando tabla:', err);
            return;
        }
        
        if (!table) {
            console.log('❌ La tabla allowed_videos NO existe');
            return;
        }
        
        console.log('✅ La tabla allowed_videos existe');
        
        // Verificar estructura de la tabla
        db.all("PRAGMA table_info(allowed_videos)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error obteniendo estructura de tabla:', err);
                return;
            }
            
            console.log('📋 Estructura de la tabla allowed_videos:');
            columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
            
            // Verificar si existe la columna notes
            const hasNotes = columns.some(col => col.name === 'notes');
            if (!hasNotes) {
                console.log('⚠️ La columna notes NO existe, agregándola...');
                
                db.run(`ALTER TABLE allowed_videos ADD COLUMN notes TEXT`, (err) => {
                    if (err) {
                        console.error('❌ Error agregando columna notes:', err);
                    } else {
                        console.log('✅ Columna notes agregada exitosamente');
                        
                        // Verificar estructura final
                        db.all("PRAGMA table_info(allowed_videos)", [], (err, finalColumns) => {
                            if (!err) {
                                console.log('📋 Estructura final de la tabla:');
                                finalColumns.forEach(col => {
                                    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                                });
                            }
                        });
                    }
                });
            } else {
                console.log('✅ La columna notes ya existe');
            }
        });
    });
    
    // Verificar si hay datos en la tabla
    db.get("SELECT COUNT(*) as count FROM allowed_videos", [], (err, result) => {
        if (err) {
            console.error('❌ Error contando registros:', err);
        } else {
            console.log(`📊 Total de videos en la tabla: ${result.count}`);
        }
    });
}

// Ejecutar diagnóstico
debugDatabase();

// Cerrar conexión después de 3 segundos
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
