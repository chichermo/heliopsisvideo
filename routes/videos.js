const express = require('express');
const { db } = require('../database/init');

const router = express.Router();

// Obtener todos los videos permitidos
router.get('/', (req, res) => {
    const sql = `SELECT * FROM allowed_videos WHERE is_active = 1 ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, videos) => {
        if (err) {
            console.error('Error obteniendo videos permitidos:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener videos permitidos'
            });
        }
        
        res.json({
            success: true,
            data: videos
        });
    });
});

// Agregar un video a la lista de permitidos
router.post('/', (req, res) => {
    const { video_id, title, description, file_size, duration, notes } = req.body;
    
    if (!video_id || !title) {
        return res.status(400).json({
            success: false,
            error: 'ID del video y título son requeridos'
        });
    }

    const sql = `INSERT INTO allowed_videos (video_id, title, description, file_size, duration, notes)
                  VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [video_id, title, description || '', file_size || 0, duration || 0, notes || ''], function(err) {
        if (err) {
            console.error('Error agregando video:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al agregar video'
            });
        }
        
        res.json({
            success: true,
            message: 'Video agregado exitosamente',
            data: { id: this.lastID }
        });
    });
});

// Remover un video de la lista de permitidos
router.delete('/:videoId', (req, res) => {
    const { videoId } = req.params;
    
    const sql = `UPDATE allowed_videos SET is_active = 0 WHERE video_id = ?`;
    
    db.run(sql, [videoId], function(err) {
        if (err) {
            console.error('Error removiendo video:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al remover video'
            });
        }
        
        if (this.changes > 0) {
            res.json({
                success: true,
                message: 'Video removido exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }
    });
});

// Cambiar estado de un video (activo/inactivo)
router.patch('/:videoId/toggle', (req, res) => {
    const { videoId } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({
            success: false,
            error: 'isActive debe ser un booleano'
        });
    }

    const sql = `UPDATE allowed_videos SET is_active = ? WHERE video_id = ?`;
    
    db.run(sql, [isActive ? 1 : 0, videoId], function(err) {
        if (err) {
            console.error('Error cambiando estado del video:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al cambiar estado del video'
            });
        }
        
        if (this.changes > 0) {
            res.json({
                success: true,
                message: `Video ${isActive ? 'activado' : 'desactivado'} exitosamente`
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }
    });
});

// Actualizar notas de un video
router.patch('/:videoId/notes', (req, res) => {
    const { videoId } = req.params;
    const { notes } = req.body;
    
    if (typeof notes !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'notes debe ser una cadena de texto'
        });
    }

    const sql = `UPDATE allowed_videos SET notes = ? WHERE video_id = ?`;
    
    db.run(sql, [notes, videoId], function(err) {
        if (err) {
            console.error('Error actualizando notas del video:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar notas del video'
            });
        }
        
        if (this.changes > 0) {
            res.json({
                success: true,
                message: 'Notas actualizadas exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }
    });
});

// Obtener estadísticas de videos
router.get('/stats', (req, res) => {
    const sql = `SELECT 
                    COUNT(*) as total_videos,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_videos,
                    COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_videos,
                    SUM(file_size) as total_size
                  FROM allowed_videos`;
    
    db.get(sql, [], (err, stats) => {
        if (err) {
            console.error('Error obteniendo estadísticas de videos:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas de videos'
            });
        }
        
        res.json({
            success: true,
            data: stats
        });
    });
});

module.exports = router;
