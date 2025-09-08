const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configuración de Google Drive API
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Función para inicializar el cliente de Google Drive
function initializeGoogleDriveClient() {
    if (process.env.GOOGLE_ACCESS_TOKEN) {
        oauth2Client.setCredentials({
            access_token: process.env.GOOGLE_ACCESS_TOKEN
        });
        return true;
    }
    return false;
}

// Ruta para obtener URL de autorización
router.get('/auth', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
    res.json({ authUrl });
});

// Ruta para manejar el callback de OAuth
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'Código de autorización no proporcionado' });
        }

        const { tokens } = await oauth2Client.getToken(code);
        
        // Guardar el token en el archivo .env
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Actualizar o agregar el token
        if (envContent.includes('GOOGLE_ACCESS_TOKEN=')) {
            envContent = envContent.replace(
                /GOOGLE_ACCESS_TOKEN=.*/,
                `GOOGLE_ACCESS_TOKEN=${tokens.access_token}`
            );
        } else {
            envContent += `\nGOOGLE_ACCESS_TOKEN=${tokens.access_token}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        
        // Actualizar el token en memoria
        oauth2Client.setCredentials(tokens);
        
        res.json({ 
            success: true, 
            message: 'Autorización exitosa. Token guardado.',
            access_token: tokens.access_token 
        });
        
    } catch (error) {
        console.error('Error en callback:', error);
        res.status(500).json({ error: 'Error en la autorización' });
    }
});

// Ruta para listar archivos
router.get('/files', async (req, res) => {
    try {
        if (!initializeGoogleDriveClient()) {
            return res.status(401).json({ error: 'No autorizado. Obtén un token primero.' });
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const response = await drive.files.list({
            pageSize: 50,
            fields: 'files(id, name, size, mimeType, createdTime, webViewLink)',
            q: "mimeType contains 'video/'"
        });

        res.json(response.data.files);
    } catch (error) {
        console.error('Error listando archivos:', error);
        res.status(500).json({ error: 'Error al listar archivos' });
    }
});

// Ruta para obtener información de un archivo específico
router.get('/files/:fileId', async (req, res) => {
    try {
        if (!initializeGoogleDriveClient()) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { fileId } = req.params;
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const response = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, size, mimeType, createdTime, webViewLink'
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error obteniendo archivo:', error);
        res.status(500).json({ error: 'Error al obtener archivo' });
    }
});

// Función para obtener stream de video desde Google Drive
async function getGoogleDriveVideoStream(fileId, range) {
    try {
        if (!initializeGoogleDriveClient()) {
            throw new Error('No autorizado');
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media',
            headers: range ? { 'Range': range } : {}
        }, { responseType: 'stream' });

        return response.data;
    } catch (error) {
        console.error('Error obteniendo stream de video:', error);
        throw error;
    }
}

// Ruta para buscar archivos
router.get('/search', async (req, res) => {
    try {
        if (!initializeGoogleDriveClient()) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Término de búsqueda requerido' });
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const response = await drive.files.list({
            pageSize: 20,
            fields: 'files(id, name, size, mimeType, createdTime)',
            q: `name contains '${q}' and mimeType contains 'video/'`
        });

        res.json(response.data.files);
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ error: 'Error en la búsqueda' });
    }
});

// Ruta para verificar estado de conexión
router.get('/status', (req, res) => {
    const isConnected = initializeGoogleDriveClient();
    res.json({ 
        connected: isConnected,
        message: isConnected ? 'Conectado a Google Drive' : 'No conectado. Obtén un token primero.'
    });
});

module.exports = { 
    googledriveRoutes: router,
    getGoogleDriveVideoStream 
};
