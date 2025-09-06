const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Endpoint para verificar estado completo de la base de datos
router.get('/db-status', async (req, res) => {
    try {
        console.log('🔍 Verificando estado completo de la base de datos...');
        
        // Verificar conexión
        db.get("SELECT 1 as test", [], (err, result) => {
            if (err) {
                console.error('❌ Error de conexión a BD:', err);
                return res.json({ 
                    success: false, 
                    error: 'Error de conexión a BD',
                    details: err.message 
                });
            }
            
            console.log('✅ Conexión a BD exitosa');
            
            // Verificar si la tabla existe
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='simple_tokens'", [], (err, table) => {
                if (err) {
                    console.error('❌ Error verificando tabla:', err);
                    return res.json({ 
                        success: false, 
                        error: 'Error verificando tabla',
                        details: err.message 
                    });
                }
                
                if (!table) {
                    console.log('❌ Tabla simple_tokens NO existe');
                    return res.json({ 
                        success: false, 
                        error: 'Tabla simple_tokens no existe' 
                    });
                }
                
                console.log('✅ Tabla simple_tokens existe');
                
                // Contar registros
                db.get("SELECT COUNT(*) as count FROM simple_tokens", [], (err, countResult) => {
                    if (err) {
                        console.error('❌ Error contando registros:', err);
                        return res.json({ 
                            success: false, 
                            error: 'Error contando registros',
                            details: err.message 
                        });
                    }
                    
                    console.log(`📊 Total de registros: ${countResult.count}`);
                    
                    // Obtener estructura de la tabla
                    db.all("PRAGMA table_info(simple_tokens)", [], (err, columns) => {
                        if (err) {
                            console.error('❌ Error obteniendo estructura:', err);
                            return res.json({ 
                                success: false, 
                                error: 'Error obteniendo estructura',
                                details: err.message 
                            });
                        }
                        
                        console.log('📋 Estructura de la tabla:');
                        columns.forEach(col => {
                            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
                        });
                        
                        // Obtener primeros 5 registros
                        db.all("SELECT token, email, is_active, created_at FROM simple_tokens LIMIT 5", [], (err, rows) => {
                            if (err) {
                                console.error('❌ Error obteniendo registros:', err);
                                return res.json({ 
                                    success: false, 
                                    error: 'Error obteniendo registros',
                                    details: err.message 
                                });
                            }
                            
                            console.log('🔍 Primeros 5 registros:');
                            rows.forEach((row, index) => {
                                console.log(`  ${index + 1}. Token: ${row.token}, Email: ${row.email}, Active: ${row.is_active} (${typeof row.is_active}), Created: ${row.created_at}`);
                            });
                            
                            // Buscar el token específico
                            const specificToken = '0a95b5699675be71c815e8475005294f';
                            db.get("SELECT * FROM simple_tokens WHERE token = ?", [specificToken], (err, specificRow) => {
                                if (err) {
                                    console.error('❌ Error buscando token específico:', err);
                                    return res.json({ 
                                        success: false, 
                                        error: 'Error buscando token específico',
                                        details: err.message 
                                    });
                                }
                                
                                console.log(`🔍 Token específico ${specificToken}:`, specificRow);
                                
                                res.json({
                                    success: true,
                                    message: 'Estado de BD verificado',
                                    data: {
                                        connection: 'OK',
                                        table_exists: true,
                                        total_records: countResult.count,
                                        table_structure: columns,
                                        first_5_records: rows,
                                        specific_token: specificRow,
                                        timestamp: new Date().toISOString()
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en db-status:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

module.exports = router;
