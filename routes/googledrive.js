const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// Configuración de Google Drive
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/googledrive/callback';
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

let driveClient = null;

// Inicializar cliente de Google Drive
const initializeGoogleDrive = () => {
    if (!GOOGLE_REFRESH_TOKEN) {
        console.warn('⚠️ GOOGLE_REFRESH_TOKEN no configurado');
        return null;
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: GOOGLE_REFRESH_TOKEN
        });

        driveClient = google.drive({ version: 'v3', auth: oauth2Client });
        console.log('✅ Cliente de Google Drive inicializado');
        return driveClient;
    } catch (error) {
        console.error('❌ Error al inicializar Google Drive:', error);
        return null;
    }
};

// Inicializar cliente al cargar el módulo
initializeGoogleDrive();

// Obtener URL de autorización OAuth2
router.get('/auth', (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    res.json({
        authUrl,
        message: 'Usa esta URL para autorizar la aplicación con Google Drive'
    });
});

// Callback de autorización OAuth2
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({
                error: 'Código de autorización no recibido'
            });
        }

        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI
        );

        const { tokens } = await oauth2Client.getToken(code);
        const { refresh_token, access_token } = tokens;

        res.json({
            success: true,
            message: 'Autorización exitosa',
            data: {
                refreshToken: refresh_token,
                accessToken: access_token,
                instructions: 'Copia el refreshToken a tu archivo .env como GOOGLE_REFRESH_TOKEN'
            }
        });

    } catch (error) {
        console.error('Error en callback de autorización:', error);
        res.status(500).json({
            error: 'Error de autorización',
            message: 'No se pudo completar la autorización'
        });
    }
});

// Listar archivos de Google Drive
router.get('/files', async (req, res) => {
    try {
        if (!driveClient) {
            return res.status(500).json({
                error: 'Cliente de Google Drive no inicializado',
                message: 'Configura GOOGLE_REFRESH_TOKEN en tu archivo .env'
            });
        }

        console.log('🔍 Solicitando archivos de Google Drive...');
        
        const response = await driveClient.files.list({
            pageSize: 50,
            fields: 'nextPageToken, files(id, name, size, mimeType, createdTime, modifiedTime)',
            q: "trashed=false and mimeType!='application/vnd.google-apps.folder'"
        });

        const files = response.data.files || [];
        
        console.log(`✅ Archivos procesados: ${files.length}`);
        
        const fileList = files.map(file => ({
            id: file.id,
            name: file.name,
            size: parseInt(file.size) || 0,
            mimeType: file.mimeType || 'application/octet-stream',
            createdTime: file.createdTime || new Date().toISOString()
        }));

        res.json(fileList);

    } catch (error) {
        console.error('❌ Error al listar archivos:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudieron listar los archivos',
            details: error.message
        });
    }
});

// Buscar archivos por nombre
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                error: 'Parámetro de búsqueda requerido',
                message: 'Usa ?q=nombre_del_archivo'
            });
        }

        if (!driveClient) {
            return res.status(500).json({
                error: 'Cliente de Google Drive no inicializado'
            });
        }

        const response = await driveClient.files.list({
            pageSize: 50,
            fields: 'nextPageToken, files(id, name, size, mimeType, createdTime, modifiedTime)',
            q: `name contains '${q}' and trashed=false and mimeType!='application/vnd.google-apps.folder'`
        });

        const files = response.data.files || [];
        
        const fileList = files.map(file => ({
            id: file.id,
            name: file.name,
            size: parseInt(file.size) || 0,
            mimeType: file.mimeType || 'application/octet-stream',
            createdTime: file.createdTime || new Date().toISOString()
        }));

        res.json(fileList);

    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'No se pudo realizar la búsqueda'
        });
    }
});

// Verificar estado de la conexión
router.get('/status', (req, res) => {
    const isConnected = !!driveClient;
    
    res.json({
        success: true,
        data: {
            connected: isConnected,
            clientId: GOOGLE_CLIENT_ID ? 'Configurado' : 'No configurado',
            refreshToken: GOOGLE_REFRESH_TOKEN ? 'Configurado' : 'No configurado',
            message: isConnected ? 
                'Conexión a Google Drive establecida' : 
                'Configura las variables de entorno para conectar con Google Drive'
        }
    });
});

module.exports = { 
    googledriveRoutes: router
};
