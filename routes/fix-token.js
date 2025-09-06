const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Endpoint para verificar y actualizar credenciales del token
router.get('/fix-token/:token', (req, res) => {
    const { token } = req.params;
    
    console.log(`🔧 Forzando inserción/actualización del token: ${token}`);
    
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
            console.error('❌ Error insertando/actualizando token:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error insertando/actualizando token',
                details: err.message 
            });
        }
        
        console.log(`✅ Token insertado/actualizado: ${this.changes} filas afectadas`);
        
        // Verificar la inserción/actualización
        const checkQuery = 'SELECT * FROM simple_tokens WHERE token = ?';
        db.get(checkQuery, [token], (err, updatedRow) => {
            if (err) {
                console.error('❌ Error verificando inserción/actualización:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error verificando inserción/actualización' 
                });
            }
            
            if (!updatedRow) {
                console.error('❌ Token no encontrado después de la inserción');
                return res.status(500).json({ 
                    success: false, 
                    error: 'Token no encontrado después de la inserción' 
                });
            }
            
            console.log(`✅ Token verificado correctamente:`, {
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

module.exports = router;
