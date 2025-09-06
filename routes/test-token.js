const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Endpoint de prueba para verificar token directamente
router.get('/test-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        console.log(`🧪 TEST: Verificando token directamente: ${token}`);
        
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
            
            // Buscar el token específico
            const query = 'SELECT * FROM simple_tokens WHERE token = ?';
            
            db.get(query, [token], (err, row) => {
                if (err) {
                    console.error('❌ Error en consulta SQL:', err);
                    return res.json({ 
                        success: false, 
                        error: 'Error en consulta SQL',
                        details: err.message 
                    });
                }
                
                console.log(`📋 Resultado de consulta SQL:`, row);
                
                if (!row) {
                    console.log(`❌ Token ${token} NO encontrado en BD`);
                    
                    // Buscar tokens similares para debugging
                    db.all("SELECT token, email FROM simple_tokens LIMIT 5", [], (err, allTokens) => {
                        if (err) {
                            console.error('Error obteniendo tokens:', err);
                        } else {
                            console.log('🔍 Primeros 5 tokens en BD:', allTokens);
                        }
                    });
                    
                    return res.json({ 
                        success: false, 
                        error: 'Token no encontrado',
                        searched_token: token
                    });
                }
                
                console.log(`✅ Token ${token} encontrado:`, {
                    id: row.id,
                    token: row.token,
                    email: row.email,
                    video_ids: row.video_ids,
                    max_views: row.max_views,
                    views: row.views,
                    is_active: row.is_active,
                    created_at: row.created_at
                });
                
                // Verificar si está activo
                if (row.is_active !== 1) {
                    console.log(`⚠️ Token ${token} encontrado pero INACTIVO`);
                    return res.json({ 
                        success: false, 
                        error: 'Token inactivo',
                        token_data: row
                    });
                }
                
                console.log(`✅ Token ${token} VÁLIDO y ACTIVO`);
                
                res.json({
                    success: true,
                    message: 'Token válido encontrado',
                    data: {
                        token: row.token,
                        email: row.email,
                        video_ids: row.video_ids ? row.video_ids.split(',') : [],
                        max_views: row.max_views,
                        views: row.views,
                        is_active: row.is_active,
                        is_permanent: row.max_views >= 999999,
                        created_at: row.created_at
                    }
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en test-token:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

module.exports = router;
