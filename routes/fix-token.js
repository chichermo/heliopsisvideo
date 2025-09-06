const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Endpoint para verificar y actualizar credenciales del token
router.get('/fix-token/:token', (req, res) => {
    const { token } = req.params;
    
    console.log(`🔧 Verificando token: ${token}`);
    
    // Primero verificar el estado actual
    const checkQuery = 'SELECT * FROM simple_tokens WHERE token = ?';
    db.get(checkQuery, [token], (err, row) => {
        if (err) {
            console.error('❌ Error verificando token:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error verificando token',
                details: err.message 
            });
        }
        
        if (!row) {
            console.log(`❌ Token ${token} no encontrado`);
            return res.json({ 
                success: false, 
                error: 'Token no encontrado' 
            });
        }
        
        console.log(`📋 Token actual:`, {
            email: row.email,
            password: row.password,
            is_active: row.is_active
        });
        
        // Usar INSERT OR REPLACE para forzar la inserción/actualización
        const insertOrReplaceQuery = `
            INSERT OR REPLACE INTO simple_tokens (
                token, email, password, video_ids, max_views, views, 
                is_active, notes, payment_status, created_at, last_accessed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const email = 'erienpoppe@gmail.com';
        const password = 'kxg8AsFg';
        const video_ids = '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE';
        const notes = 'Token real recuperado - Acceso permanente garantizado';
        const now = new Date().toISOString();
        
        db.run(insertOrReplaceQuery, [
            token,
            email,
            password,
            video_ids,
            999999, // max_views
            0, // views
            1, // is_active
            notes,
            'paid', // payment_status
            now, // created_at
            now  // last_accessed
        ], function(err) {
            if (err) {
                console.error('❌ Error actualizando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error actualizando token',
                    details: err.message 
                });
            }
            
            console.log(`✅ Token insertado/actualizado: ${this.changes} filas afectadas`);
            
            // Verificar la actualización
            db.get(checkQuery, [token], (err, updatedRow) => {
                if (err) {
                    console.error('❌ Error verificando actualización:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error verificando actualización' 
                    });
                }
                
                console.log(`✅ Token actualizado correctamente:`, {
                    email: updatedRow.email,
                    password: updatedRow.password,
                    is_active: updatedRow.is_active
                });
                
                res.json({
                    success: true,
                    message: 'Token insertado/actualizado correctamente',
                    data: {
                        token: updatedRow.token,
                        email: updatedRow.email,
                        password: updatedRow.password,
                        video_ids: updatedRow.video_ids,
                        max_views: updatedRow.max_views,
                        views: updatedRow.views,
                        is_active: updatedRow.is_active,
                        notes: updatedRow.notes,
                        created_at: updatedRow.created_at,
                        last_accessed: updatedRow.last_accessed
                    }
                });
            });
        });
    });
});

module.exports = router;
