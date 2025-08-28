const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
    createAccessToken, 
    getAllTokens, 
    deleteToken, 
    getTokenStats 
} = require('../database/database');

const router = express.Router();

// Generar nuevo token de acceso
router.post('/generate', async (req, res) => {
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
        const expiresAt = Math.floor(Date.now() / 1000) + (expiresIn * 60); // expiresIn en minutos

        // Generar token único
        const token = uuidv4().replace(/-/g, '').substring(0, 16);

        // Crear token en la base de datos
        const tokenId = await createAccessToken({
            token,
            email: email || null,
            expiresAt,
            maxViews: parseInt(maxViews),
            videoId,
            notes: notes || null
        });

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
                expiresAt: new Date(expiresAt * 1000).toISOString(),
                maxViews: parseInt(maxViews),
                email: email || 'Sin restricción de email'
            }
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
router.get('/tokens', async (req, res) => {
    try {
        const tokens = await getAllTokens();
        res.json({
            success: true,
            data: tokens
        });
    } catch (error) {
        console.error('Error al obtener tokens:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener los tokens'
        });
    }
});

// Obtener estadísticas de tokens
router.get('/stats', async (req, res) => {
    try {
        const stats = await getTokenStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

// Eliminar token
router.delete('/tokens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteToken(parseInt(id));
        
        if (deleted === 0) {
            return res.status(404).json({
                error: 'Token no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Token eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar token:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo eliminar el token'
        });
    }
});

// Generar múltiples tokens (útil para eventos)
router.post('/generate-bulk', async (req, res) => {
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
                message: 'count debe estar entre 1 y 100'
            });
        }

        const tokens = [];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        for (let i = 0; i < count; i++) {
            const token = uuidv4().replace(/-/g, '').substring(0, 16);
            const expiresAt = Math.floor(Date.now() / 1000) + (expiresIn * 60);

            const tokenId = await createAccessToken({
                token,
                email: null,
                expiresAt,
                maxViews: parseInt(maxViews),
                videoId,
                notes: notes ? `${notes} - Token ${i + 1}` : `Token ${i + 1}`
            });

            tokens.push({
                id: tokenId,
                token,
                watchUrl: `${baseUrl}/watch/${token}`,
                expiresAt: new Date(expiresAt * 1000).toISOString()
            });
        }

        res.json({
            success: true,
            message: `${count} tokens generados exitosamente`,
            data: tokens
        });

    } catch (error) {
        console.error('Error al generar tokens en lote:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron generar los tokens'
        });
    }
});

module.exports = { accessRoutes: router };
