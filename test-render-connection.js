#!/usr/bin/env node

const axios = require('axios');

console.log('🧪 Probador de Conexión Google Drive en Render');
console.log('==============================================\n');

// URL base de Render (ajustar según tu dominio)
const RENDER_URL = 'https://heliopsis-video.onrender.com';

async function testConnection() {
    try {
        console.log('🔍 Probando conexión a Render...');
        console.log(`📡 URL: ${RENDER_URL}`);
        
        // Probar endpoint de estado
        console.log('\n1️⃣ Probando estado de Google Drive...');
        const statusResponse = await axios.get(`${RENDER_URL}/api/googledrive/status`);
        console.log('✅ Estado:', statusResponse.data);
        
        // Probar endpoint de diagnóstico
        console.log('\n2️⃣ Probando diagnóstico completo...');
        const diagnoseResponse = await axios.get(`${RENDER_URL}/api/googledrive/diagnose`);
        console.log('✅ Diagnóstico:', JSON.stringify(diagnoseResponse.data, null, 2));
        
        // Probar acceso a archivos
        console.log('\n3️⃣ Probando listado de archivos...');
        const filesResponse = await axios.get(`${RENDER_URL}/api/googledrive/files`);
        console.log('✅ Archivos:', filesResponse.data);
        
        // Probar acceso a archivo específico
        console.log('\n4️⃣ Probando acceso a archivo específico...');
        const testFileResponse = await axios.get(`${RENDER_URL}/api/googledrive/test-file/1-38V037fiJbvUytXNPhAtQQ10bPNeLnD`);
        console.log('✅ Archivo específico:', testFileResponse.data);
        
        console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
        
    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.message);
        
        if (error.response) {
            console.error('📊 Detalles del error:');
            console.error('  - Status:', error.response.status);
            console.error('  - Data:', error.response.data);
            console.error('  - Headers:', error.response.headers);
        } else if (error.request) {
            console.error('🌐 Error de red - no se recibió respuesta');
            console.error('  - Request:', error.request);
        } else {
            console.error('⚙️ Error de configuración:', error.message);
        }
        
        console.log('\n🔧 Posibles soluciones:');
        console.log('1. Verificar que las credenciales de Google Drive estén configuradas en Render');
        console.log('2. Verificar que el archivo de video exista en Google Drive');
        console.log('3. Verificar permisos del archivo en Google Drive');
        console.log('4. Revisar logs de Render para más detalles');
    }
}

// Ejecutar pruebas
testConnection();