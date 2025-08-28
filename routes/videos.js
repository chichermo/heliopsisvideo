const express = require('express');
const { 
    addAllowedVideo, 
    removeAllowedVideo, 
    getAllowedVideos, 
    toggleVideoStatus 
} = require('../database/database');

const router = express.Router();

// Obtener todos los videos permitidos
router.get('/', async (req, res) => {
    try {
        const videos = await getAllowedVideos();
        res.json({
            success: true,
            data: videos
        });
    } catch (error) {
        console.error('Error obteniendo videos permitidos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener videos permitidos'
        });
    }
});

// Obtener videos ocultos
router.get('/hidden', async (req, res) => {
    try {
        const videos = await getHiddenVideos();
        res.json({
            success: true,
            data: videos
        });
    } catch (error) {
        console.error('Error obteniendo videos ocultos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener videos ocultos'
        });
    }
});

// Agregar un video a la lista de permitidos
router.post('/', async (req, res) => {
    try {
        const { google_drive_id, name, size, mime_type, created_time, notes } = req.body;
        
        if (!google_drive_id || !name) {
            return res.status(400).json({
                success: false,
                error: 'ID de Google Drive y nombre son requeridos'
            });
        }

        const videoId = await addAllowedVideo({
            google_drive_id,
            name,
            size: size || 0,
            mime_type: mime_type || 'video/mp4',
            created_time: created_time || new Date().toISOString(),
            notes: notes || ''
        });

        res.json({
            success: true,
            message: 'Video agregado exitosamente',
            data: { id: videoId }
        });
    } catch (error) {
        console.error('Error agregando video:', error);
        res.status(500).json({
            success: false,
            error: 'Error al agregar video'
        });
    }
});

// Remover un video de la lista de permitidos
router.delete('/:googleDriveId', async (req, res) => {
    try {
        const { googleDriveId } = req.params;
        
        const changes = await removeAllowedVideo(googleDriveId);
        
        if (changes > 0) {
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
    } catch (error) {
        console.error('Error removiendo video:', error);
        res.status(500).json({
            success: false,
            error: 'Error al remover video'
        });
    }
});

// Cambiar estado de un video (activo/inactivo)
router.patch('/:googleDriveId/toggle', async (req, res) => {
    try {
        const { googleDriveId } = req.params;
        const { isActive } = req.body;
        
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isActive debe ser un booleano'
            });
        }

        const changes = await toggleVideoStatus(googleDriveId, isActive);
        
        if (changes > 0) {
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
    } catch (error) {
        console.error('Error cambiando estado del video:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar estado del video'
        });
    }
});

// Actualizar notas de un video
router.patch('/:googleDriveId/notes', async (req, res) => {
    try {
        const { googleDriveId } = req.params;
        const { notes } = req.body;
        
        if (typeof notes !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'notes debe ser una cadena de texto'
            });
        }

        const changes = await updateVideoNotes(googleDriveId, notes);
        
        if (changes > 0) {
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
    } catch (error) {
        console.error('Error actualizando notas del video:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar notas del video'
        });
    }
});

// Obtener estadísticas de videos
router.get('/stats', async (req, res) => {
    try {
        const stats = await getVideoStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de videos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas de videos'
        });
    }
});

// Obtener videos eliminados
router.get('/deleted', async (req, res) => {
    try {
        const videos = await getDeletedVideos();
        res.json({
            success: true,
            data: videos
        });
    } catch (error) {
        console.error('Error obteniendo videos eliminados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener videos eliminados'
        });
    }
});

// Restaurar video eliminado
router.patch('/:googleDriveId/restore', async (req, res) => {
    try {
        const { googleDriveId } = req.params;
        
        const changes = await restoreVideo(googleDriveId);
        
        if (changes > 0) {
            res.json({
                success: true,
                message: 'Video restaurado exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }
    } catch (error) {
        console.error('Error restaurando video:', error);
        res.status(500).json({
            success: false,
            error: 'Error al restaurar video'
        });
    }
});

// Eliminar permanentemente un video
router.delete('/:googleDriveId/permanent', async (req, res) => {
    try {
        const { googleDriveId } = req.params;
        
        const changes = await permanentlyDeleteVideo(googleDriveId);
        
        if (changes > 0) {
            res.json({
                success: true,
                message: 'Video eliminado permanentemente'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }
    } catch (error) {
        console.error('Error eliminando video permanentemente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar video permanentemente'
        });
    }
});

module.exports = { videoManagementRoutes: router };
