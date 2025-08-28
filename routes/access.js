const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/init');

const router = express.Router();

// Generar nuevo token de acceso
router.post('/generate', (req, res) => {
    try {
        const { 
            email, 
            expiresIn, 
            maxViews = 1, 
            videoId, 
            notes 
        } = req.body;

        // Validaciones básicas
        if (!expiresIn || !videoId) {
            return res.status(400).json({
                error: 'Faltan campos requeridos',
                required: ['expiresIn', 'videoId'],
                optional: ['email', 'maxViews', 'notes']
            });
        }

        // Calcular fecha de expiración
        const expiresAtDate = new Date(Date.now() + (expiresIn * 60 * 1000));
        
        // Generar token único
        const token = uuidv4().replace(/-/g, '').substring(0, 16);

        // Crear token en la base de datos
        const sql = `INSERT INTO access_tokens (token, email, video_id, expires_at, max_views, notes)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [token, email || null, videoId, expiresAtDate.toISOString(), parseInt(maxViews), notes || null], function(err) {
            if (err) {
                console.error('Error creando token:', err);
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: 'No se pudo generar el token de acceso'
                });
            }
            
            const tokenId = this.lastID;
            
            // Generar URL completa
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const watchUrl = `${baseUrl}/watch/${token}`;

            res.json({
                success: true,
                message: 'Token de acceso generado exitosamente',
                data: {
                    id: tokenId,
                    token,
                    watchUrl,
                    expiresAt: expiresAtDate.toISOString(),
                    maxViews: parseInt(maxViews),
                    email: email || 'Sin restricción de email'
                }
            });
        });

    } catch (error) {
        console.error('Error al generar token:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo generar el token de acceso'
        });
    }
});

// Obtener todos los tokens
router.get('/tokens', (req, res) => {
    const sql = `SELECT * FROM access_tokens ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, tokens) => {
        if (err) {
            console.error('Error obteniendo tokens:', err);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener los tokens'
            });
        }
        
        res.json({
            success: true,
            data: tokens
        });
    });
});

// Obtener estadísticas de tokens
router.get('/stats', (req, res) => {
    const sql = `SELECT 
                    COUNT(*) as total_tokens,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_tokens,
                    COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_tokens,
                    SUM(current_views) as total_views
                  FROM access_tokens`;
    
    db.get(sql, [], (err, stats) => {
        if (err) {
            console.error('Error obteniendo estadísticas:', err);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener las estadísticas'
            });
        }
        
        res.json({
            success: true,
            data: stats
        });
    });
});

// Eliminar token
router.delete('/tokens/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `DELETE FROM access_tokens WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Error eliminando token:', err);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: 'No se pudo eliminar el token'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                error: 'Token no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Token eliminado exitosamente'
        });
    });
});

// Generar múltiples tokens (útil para eventos)
router.post('/generate-bulk', (req, res) => {
    try {
        const { 
            count = 1, 
            expiresIn, 
            maxViews = 1, 
            videoId, 
            notes 
        } = req.body;

        if (!expiresIn || !videoId || count < 1 || count > 100) {
            return res.status(400).json({
                error: 'Parámetros inválidos',
                required: ['expiresIn', 'videoId'],
                optional: ['count', 'maxViews', 'notes'],
                constraints: ['count debe estar entre 1 y 100']
            });
        }

        const tokens = [];
        const expiresAtDate = new Date(Date.now() + (expiresIn * 60 * 1000));
        
        // Generar tokens en lote
        for (let i = 0; i < count; i++) {
            const token = uuidv4().replace(/-/g, '').substring(0, 16);
            tokens.push({
                token,
                expiresAt: expiresAtDate.toISOString(),
                maxViews: parseInt(maxViews),
                videoId,
                notes: notes || null
            });
        }

        // Insertar tokens en la base de datos
        const sql = `INSERT INTO access_tokens (token, video_id, expires_at, max_views, notes)
                     VALUES (?, ?, ?, ?, ?)`;
        
        let completed = 0;
        let errors = 0;
        
        tokens.forEach((tokenData, index) => {
            db.run(sql, [tokenData.token, tokenData.videoId, tokenData.expiresAt, tokenData.maxViews, tokenData.notes], function(err) {
                if (err) {
                    console.error(`Error creando token ${index + 1}:`, err);
                    errors++;
                } else {
                    completed++;
                }
                
                // Si es el último token, enviar respuesta
                if (completed + errors === count) {
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    const tokensWithUrls = tokens.map(t => ({
                        ...t,
                        watchUrl: `${baseUrl}/watch/${t.token}`
                    }));
                    
                    res.json({
                        success: true,
                        message: `Se generaron ${completed} tokens exitosamente${errors > 0 ? `, ${errors} fallaron` : ''}`,
                        data: {
                            total: count,
                            successful: completed,
                            failed: errors,
                            tokens: tokensWithUrls
                        }
                    });
                }
            });
        });

    } catch (error) {
        console.error('Error al generar tokens en lote:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron generar los tokens en lote'
        });
    }
});

module.exports = router;
