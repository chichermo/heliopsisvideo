const { db } = require('./init');

// Script para actualizar la estructura de la tabla simple_tokens
async function updateTableStructure() {
    console.log('🔄 Actualizando estructura de tabla simple_tokens...');
    
    try {
        // Verificar estructura actual
        db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error obteniendo estructura de tabla:', err);
                return;
            }
            
            console.log('📋 Estructura actual de simple_tokens:');
            columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
            
            // Agregar columnas faltantes
            const missingColumns = [
                { name: 'is_active', type: 'BOOLEAN DEFAULT 1' },
                { name: 'last_accessed', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
                { name: 'notes', type: 'TEXT' },
                { name: 'payment_status', type: 'TEXT DEFAULT "pending"' }
            ];
            
            let columnsAdded = 0;
            
            missingColumns.forEach(column => {
                const columnExists = columns.some(col => col.name === column.name);
                
                if (!columnExists) {
                    console.log(`➕ Agregando columna ${column.name}...`);
                    
                    db.run(`ALTER TABLE simple_tokens ADD COLUMN ${column.name} ${column.type}`, (err) => {
                        if (err) {
                            console.error(`❌ Error agregando columna ${column.name}:`, err);
                        } else {
                            console.log(`✅ Columna ${column.name} agregada`);
                            columnsAdded++;
                            
                            if (columnsAdded === missingColumns.filter(col => !columns.some(existing => existing.name === col.name)).length) {
                                updateExistingTokens();
                            }
                        }
                    });
                } else {
                    console.log(`⚠️ Columna ${column.name} ya existe`);
                }
            });
            
            // Si no hay columnas faltantes, actualizar tokens existentes
            if (missingColumns.every(col => columns.some(existing => existing.name === col.name))) {
                updateExistingTokens();
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando estructura:', error);
    }
}

function updateExistingTokens() {
    console.log('\n🔄 Actualizando tokens existentes...');
    
    // Actualizar todos los tokens existentes con valores por defecto
    db.run(`UPDATE simple_tokens SET 
        is_active = 1,
        last_accessed = CURRENT_TIMESTAMP,
        notes = 'Token restaurado',
        payment_status = 'completed'
        WHERE is_active IS NULL OR last_accessed IS NULL`, (err) => {
        if (err) {
            console.error('❌ Error actualizando tokens:', err);
        } else {
            console.log('✅ Tokens actualizados con valores por defecto');
            
            // Verificar que los tokens estén disponibles
            db.all("SELECT COUNT(*) as count FROM simple_tokens", [], (err, result) => {
                if (err) {
                    console.error('❌ Error contando tokens:', err);
                } else {
                    console.log(`📊 Total de tokens en la base de datos: ${result.count}`);
                    
                    // Mostrar algunos tokens de ejemplo
                    db.all("SELECT token, email, password FROM simple_tokens LIMIT 5", [], (err, tokens) => {
                        if (err) {
                            console.error('❌ Error obteniendo tokens de ejemplo:', err);
                        } else {
                            console.log('\n🔑 Tokens de ejemplo:');
                            tokens.forEach(token => {
                                console.log(`  - ${token.token.substring(0, 8)}... (${token.email})`);
                            });
                        }
                        
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
            });
        }
    });
}

// Ejecutar actualización
updateTableStructure();
