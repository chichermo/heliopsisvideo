const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');
const { Readable } = require('stream');
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
    console.log('🔄 Inicializando cliente de Google Drive...');
    console.log('📋 Variables de entorno:');
    console.log('  - GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado');
    console.log('  - GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ No configurado');
    console.log('  - GOOGLE_REFRESH_TOKEN:', GOOGLE_REFRESH_TOKEN ? '✅ Configurado' : '❌ No configurado');
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        console.warn('⚠️ Variables de Google Drive no configuradas completamente');
        console.warn('⚠️ GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'OK' : 'FALTA');
        console.warn('⚠️ GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'OK' : 'FALTA');
        console.warn('⚠️ GOOGLE_REFRESH_TOKEN:', GOOGLE_REFRESH_TOKEN ? 'OK' : 'FALTA');
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
        console.log('✅ Cliente de Google Drive inicializado exitosamente');
        return driveClient;
    } catch (error) {
        console.error('❌ Error al inicializar Google Drive:', error);
        console.error('❌ Detalles del error:', error.message);
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
            console.log('❌ Cliente de Google Drive no inicializado');
            console.log('📋 Variables de entorno disponibles:');
            console.log('  - GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado');
            console.log('  - GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ No configurado');
            console.log('  - GOOGLE_REFRESH_TOKEN:', GOOGLE_REFRESH_TOKEN ? '✅ Configurado' : '❌ No configurado');
            
            return res.status(500).json({
                success: false,
                error: 'Cliente de Google Drive no inicializado',
                message: 'Configura las variables de entorno de Google Drive en tu archivo .env',
                details: {
                    clientId: GOOGLE_CLIENT_ID ? 'Configurado' : 'Falta',
                    clientSecret: GOOGLE_CLIENT_SECRET ? 'Configurado' : 'Falta',
                    refreshToken: GOOGLE_REFRESH_TOKEN ? 'Configurado' : 'Falta'
                }
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

        res.json({
            success: true,
            data: fileList,
            message: `Se encontraron ${fileList.length} archivos`
        });

    } catch (error) {
        console.error('❌ Error al listar archivos:', error);
        res.status(500).json({
            success: false,
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
            clientSecret: GOOGLE_CLIENT_SECRET ? 'Configurado' : 'No configurado',
            refreshToken: GOOGLE_REFRESH_TOKEN ? 'Configurado' : 'No configurado',
            redirectUri: GOOGLE_REDIRECT_URI || 'No configurado',
            message: isConnected ? 
                'Conexión a Google Drive establecida' : 
                'Configura las variables de entorno para conectar con Google Drive',
            instructions: isConnected ? null : [
                '1. Ve a https://console.developers.google.com/',
                '2. Crea un proyecto y habilita la API de Google Drive',
                '3. Crea credenciales OAuth 2.0',
                '4. Configura las URLs de redirección autorizadas',
                '5. Usa /api/googledrive/auth para obtener el refresh token',
                '6. Actualiza el archivo .env con los valores reales'
            ]
        }
    });
});

// Endpoint para probar acceso a un archivo específico
router.get('/test-file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        if (!driveClient) {
            return res.status(500).json({
                success: false,
                error: 'Cliente de Google Drive no inicializado',
                message: 'Configura las variables de entorno de Google Drive'
            });
        }

        console.log(`🧪 Probando acceso al archivo: ${fileId}`);
        
        // Probar acceso al archivo
        const fileResponse = await driveClient.files.get({
            fileId: fileId,
            fields: 'id,name,size,mimeType,webContentLink,permissions'
        });

        console.log('✅ Archivo accesible:', fileResponse.data);

        res.json({
            success: true,
            data: {
                fileId: fileResponse.data.id,
                name: fileResponse.data.name,
                size: fileResponse.data.size,
                mimeType: fileResponse.data.mimeType,
                webContentLink: fileResponse.data.webContentLink,
                permissions: fileResponse.data.permissions,
                message: 'Archivo accesible correctamente'
            }
        });

    } catch (error) {
        console.error('❌ Error probando archivo:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error accediendo al archivo',
            message: error.message,
            details: {
                code: error.code,
                status: error.status,
                errors: error.errors
            }
        });
    }
});

// Endpoint de diagnóstico completo
router.get('/diagnose', async (req, res) => {
    const diagnosis = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3001
        },
        googleDrive: {
            clientId: {
                configured: !!GOOGLE_CLIENT_ID,
                value: GOOGLE_CLIENT_ID ? 'Configurado' : 'No configurado'
            },
            clientSecret: {
                configured: !!GOOGLE_CLIENT_SECRET,
                value: GOOGLE_CLIENT_SECRET ? 'Configurado' : 'No configurado'
            },
            refreshToken: {
                configured: !!GOOGLE_REFRESH_TOKEN,
                value: GOOGLE_REFRESH_TOKEN ? 'Configurado' : 'No configurado'
            },
            redirectUri: {
                configured: !!GOOGLE_REDIRECT_URI,
                value: GOOGLE_REDIRECT_URI || 'No configurado'
            },
            clientInitialized: !!driveClient
        },
        recommendations: []
    };

    // Generar recomendaciones
    if (!GOOGLE_CLIENT_ID) {
        diagnosis.recommendations.push('Configurar GOOGLE_CLIENT_ID en el archivo .env');
    }
    if (!GOOGLE_CLIENT_SECRET) {
        diagnosis.recommendations.push('Configurar GOOGLE_CLIENT_SECRET en el archivo .env');
    }
    if (!GOOGLE_REFRESH_TOKEN) {
        diagnosis.recommendations.push('Configurar GOOGLE_REFRESH_TOKEN en el archivo .env');
    }
    if (!driveClient) {
        diagnosis.recommendations.push('Reiniciar el servidor después de configurar las variables de entorno');
    }

    // Probar conexión si está configurado
    if (driveClient) {
        try {
            const testResponse = await driveClient.files.list({
                pageSize: 1,
                fields: 'files(id,name)'
            });
            diagnosis.googleDrive.connectionTest = {
                success: true,
                message: 'Conexión exitosa a Google Drive',
                filesFound: testResponse.data.files?.length || 0
            };
        } catch (error) {
            diagnosis.googleDrive.connectionTest = {
                success: false,
                message: 'Error de conexión a Google Drive',
                error: error.message
            };
        }
    } else {
        diagnosis.googleDrive.connectionTest = {
            success: false,
            message: 'Cliente no inicializado - no se puede probar la conexión'
        };
    }

    res.json({
        success: true,
        data: diagnosis
    });
});

// Obtener stream de video desde Google Drive
const getGoogleDriveVideoStream = async (videoId) => {
    console.log('🔄 Obteniendo stream de video desde Google Drive:', videoId);
    
    try {
        // Si el cliente no está inicializado, intentar reinicializarlo
        if (!driveClient) {
            console.log('🔄 Cliente no inicializado, intentando reinicializar...');
            driveClient = initializeGoogleDrive();
            
            if (!driveClient) {
                console.error('❌ No se pudo inicializar el cliente de Google Drive');
                return {
                    error: 'Cliente de Google Drive no disponible',
                    needsAuth: true
                };
            }
        }

        // Mapear video IDs a Google Drive file IDs
        const driveVideoIds = {
            '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD': '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD',
            '1-1ABC123DEF456GHI789JKL012MNO345': '1-1ABC123DEF456GHI789JKL012MNO345'
        };

        const fileId = driveVideoIds[videoId];
        
        if (!fileId) {
            console.log('❌ Video ID no encontrado:', videoId);
            return null;
        }

        console.log(`🎥 Solicitando video con ID: ${fileId}`);
        
        // PRIMERA OPCIÓN: Para videos grandes, usar webContentLink directamente
        try {
            console.log('🔄 Obteniendo metadata del archivo...');
            console.log('📋 Detalles de la solicitud:');
            console.log('  - File ID:', fileId);
            console.log('  - Cliente inicializado:', !!driveClient);
            
            const metadataResponse = await driveClient.files.get({
                fileId: fileId,
                fields: 'id,name,size,mimeType,webContentLink'
            });
            
            console.log('📋 Metadata obtenida:', {
                id: metadataResponse.data?.id,
                name: metadataResponse.data?.name,
                size: metadataResponse.data?.size,
                mimeType: metadataResponse.data?.mimeType,
                hasWebContentLink: !!metadataResponse.data?.webContentLink
            });
            
            // Para videos grandes (>1GB), usar webContentLink directamente
            const fileSize = parseInt(metadataResponse.data?.size) || 0;
            const isLargeFile = fileSize > 1073741824; // 1GB
            
            if (isLargeFile) {
                console.log(`📊 Archivo grande detectado (${(fileSize / 1073741824).toFixed(2)} GB) - usando webContentLink`);
                
                if (metadataResponse.data && metadataResponse.data.webContentLink) {
                    console.log('✅ webContentLink obtenido para archivo grande:', metadataResponse.data.webContentLink);
                    
                    // Para videos grandes, usar URL directa de Google Drive que funciona sin autenticación
                    const directUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
                    console.log('🔄 Usando URL directa para archivo grande:', directUrl);
                    
                    return {
                        redirect: true,
                        webContentLink: directUrl,
                        size: metadataResponse.data.size,
                        name: metadataResponse.data.name,
                        isLargeFile: true
                    };
                }
            }
            
            // Para archivos pequeños, intentar stream directo
            console.log('🔄 Intentando stream directo para archivo pequeño...');
            
            const streamResponse = await driveClient.files.get({
                fileId: fileId,
                alt: 'media'
            }, {
                responseType: 'stream',
                headers: {
                    'Accept': 'video/*,*/*',
                    'Accept-Encoding': 'identity'
                }
            });

            console.log('✅ Stream directo obtenido exitosamente');
            console.log('📊 Headers de respuesta:', streamResponse.headers);
            
            return {
                stream: streamResponse.data,
                mimeType: 'video/mp4'
            };
        } catch (streamError) {
            console.log('⚠️ Stream directo falló:', streamError.message);
            console.log('❌ Detalles del error:', {
                code: streamError.code,
                status: streamError.status,
                message: streamError.message,
                errors: streamError.errors
            });
            
            // SEGUNDA OPCIÓN: Obtener webContentLink
            try {
                console.log('🔄 Obteniendo webContentLink...');
                
                const metadataResponse = await driveClient.files.get({
                    fileId: fileId,
                    fields: 'id,name,size,mimeType,webContentLink'
                });
                
                console.log('📋 Metadata obtenida:', {
                    id: metadataResponse.data?.id,
                    name: metadataResponse.data?.name,
                    size: metadataResponse.data?.size,
                    mimeType: metadataResponse.data?.mimeType,
                    hasWebContentLink: !!metadataResponse.data?.webContentLink
                });
                
                if (metadataResponse.data && metadataResponse.data.webContentLink) {
                    console.log('✅ webContentLink obtenido:', metadataResponse.data.webContentLink);
                    console.log('📊 Tamaño del archivo:', metadataResponse.data.size, 'bytes');
                    console.log('📝 Nombre del archivo:', metadataResponse.data.name);
                    
                    // Usar URL directa que funciona sin autenticación
                    const directUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
                    console.log('🔄 Usando URL directa como fallback:', directUrl);
                    
                    return {
                        redirect: true,
                        webContentLink: directUrl,
                        size: metadataResponse.data.size,
                        name: metadataResponse.data.name
                    };
                } else {
                    console.log('⚠️ No se encontró webContentLink en la respuesta');
                }
            } catch (linkError) {
                console.error('❌ Error obteniendo webContentLink:', linkError.message);
                console.error('❌ Detalles del error de metadata:', {
                    code: linkError.code,
                    status: linkError.status,
                    message: linkError.message,
                    errors: linkError.errors
                });
                
                // TERCERA OPCIÓN: Generar URL directa
                console.log('🔄 Generando URL directa como último recurso...');
                const directUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
                
                return {
                    redirect: true,
                    webContentLink: directUrl,
                    fallback: true
                };
            }
        }
    } catch (error) {
        console.error('❌ Error general con Google Drive:', error.message);
        return null;
    }
};

module.exports = {
    router,
    getGoogleDriveVideoStream
};
