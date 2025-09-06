const express = require('express');
const Database = require('sqlite3').Database;
const path = require('path');
const router = express.Router();

// Función para verificar todos los tokens
const verifyAllTokens = async () => {
    return new Promise((resolve, reject) => {
        const dbPath = process.env.NODE_ENV === 'production' || process.env.RENDER 
            ? path.join(__dirname, '../database/video_access.db')
            : path.join(__dirname, '../database/video_access.db');
        
        const db = new Database(dbPath);
        
        const query = `
            SELECT 
                token,
                email,
                password,
                video_ids,
                views,
                max_views,
                is_active,
                created_at,
                last_accessed,
                notes
            FROM simple_tokens 
            WHERE is_active = 1
            ORDER BY created_at DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('❌ Error verificando tokens:', err);
                reject(err);
                return;
            }
            
            const results = rows.map(row => ({
                token: row.token,
                email: row.email,
                password: row.password,
                video_ids: row.video_ids ? row.video_ids.split(',') : [],
                views: row.views,
                max_views: row.max_views,
                is_active: row.is_active,
                created_at: row.created_at,
                last_accessed: row.last_accessed,
                notes: row.notes,
                watch_url: `${process.env.BASE_URL || 'https://heliopsis-video.onrender.com'}/watch-simple/${row.token}`,
                status: 'active'
            }));
            
            db.close();
            resolve(results);
        });
    });
};

// Endpoint para verificar todos los tokens
router.get('/verify-all', async (req, res) => {
    try {
        console.log('🔍 Verificando todos los tokens activos...');
        
        const tokens = await verifyAllTokens();
        
        console.log(`✅ Verificación completada: ${tokens.length} tokens encontrados`);
        
        res.json({
            success: true,
            message: `Verificación completada: ${tokens.length} tokens activos encontrados`,
            data: {
                total_tokens: tokens.length,
                tokens: tokens,
                summary: {
                    active_tokens: tokens.filter(t => t.is_active).length,
                    total_views: tokens.reduce((sum, t) => sum + t.views, 0),
                    avg_views_per_token: Math.round(tokens.reduce((sum, t) => sum + t.views, 0) / tokens.length)
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error en verificación de tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando tokens',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para verificar un token específico
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        console.log(`🔍 Verificando token específico: ${token}`);
        
        const tokens = await verifyAllTokens();
        const specificToken = tokens.find(t => t.token === token);
        
        if (!specificToken) {
            return res.status(404).json({
                success: false,
                message: 'Token no encontrado',
                token: token,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Token verificado: ${token}`);
        
        res.json({
            success: true,
            message: 'Token verificado exitosamente',
            data: specificToken,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error verificando token específico:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando token',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
