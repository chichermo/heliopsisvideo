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
        
        // Actualizar con las credenciales correctas
        const updateQuery = `
            UPDATE simple_tokens 
            SET email = ?, password = ?, notes = ?
            WHERE token = ?
        `;
        
        const email = 'erienpoppe@gmail.com';
        const password = 'kxg8AsFg';
        const notes = 'Token real recuperado - Acceso permanente garantizado';
        
        db.run(updateQuery, [email, password, notes, token], function(err) {
            if (err) {
                console.error('❌ Error actualizando token:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error actualizando token',
                    details: err.message 
                });
            }
            
            console.log(`✅ Token actualizado: ${this.changes} filas afectadas`);
            
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
                    message: 'Token actualizado correctamente',
                    data: {
                        token: updatedRow.token,
                        email: updatedRow.email,
                        password: updatedRow.password,
                        is_active: updatedRow.is_active,
                        notes: updatedRow.notes
                    }
                });
            });
        });
    });
});

module.exports = router;
