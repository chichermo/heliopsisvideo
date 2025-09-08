const axios = require('axios');

const RENDER_URL = 'https://heliopsis-video.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

async function testRenderAPI() {
    console.log('🧪 Probando API en Render...\n');
    
    try {
        // Test 1: Verificar que el servidor esté funcionando
        console.log('📋 Test 1: Verificar servidor funcionando...');
        const response1 = await axios.get(`${RENDER_URL}/`);
        console.log('✅ Servidor funcionando:', response1.data.message);
        
        // Test 2: Verificar videos permitidos
        console.log('\n📋 Test 2: Verificar videos permitidos...');
        const response2 = await axios.get(`${RENDER_URL}/api/videos`);
        console.log('✅ Videos permitidos obtenidos:', response2.data.success);
        console.log('📊 Total videos:', response2.data.data?.length || 0);
        
        // Test 3: Verificar estructura de datos de videos
        if (response2.data.data && response2.data.data.length > 0) {
            console.log('\n📋 Test 3: Verificar estructura de datos...');
            response2.data.data.forEach((video, index) => {
                console.log(`\n🎬 Video ${index + 1}:`);
                console.log(`  ID: ${video.id}`);
                console.log(`  video_id: ${video.video_id}`);
                console.log(`  title: ${video.title}`);
                console.log(`  file_size: ${video.file_size}`);
                console.log(`  notes: ${video.notes}`);
                
                // Verificar que no haya datos undefined
                const hasUndefined = !video.title || !video.video_id || video.title === 'undefined';
                if (hasUndefined) {
                    console.log('  ❌ DATOS CORRUPTOS DETECTADOS');
                } else {
                    console.log('  ✅ Datos válidos');
                }
            });
        }
        
        // Test 4: Verificar Google Drive status
        console.log('\n📋 Test 4: Verificar estado de Google Drive...');
        const response3 = await axios.get(`${RENDER_URL}/api/googledrive/status`);
        console.log('✅ Estado Google Drive:', response3.data.success);
        
        console.log('\n🎉 ¡Pruebas de Render completadas!');
        
    } catch (error) {
        console.error('❌ Error en las pruebas de Render:', error.message);
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📝 Datos:', error.response.data);
        }
        
        console.log('\n💡 Posibles causas:');
        console.log('   - El deploy en Render aún no ha terminado');
        console.log('   - La migración forzada aún no se ha ejecutado');
        console.log('   - Hay un problema de configuración');
    }
}

async function compareLocalVsRender() {
    console.log('\n🔄 Comparando Local vs Render...\n');
    
    try {
        // Test local
        console.log('📋 Probando API local...');
        const localResponse = await axios.get(`${LOCAL_URL}/api/videos`);
        console.log('✅ Local - Videos obtenidos:', localResponse.data.data?.length || 0);
        
        // Test Render
        console.log('\n📋 Probando API Render...');
        const renderResponse = await axios.get(`${RENDER_URL}/api/videos`);
        console.log('✅ Render - Videos obtenidos:', renderResponse.data.data?.length || 0);
        
        // Comparar datos
        if (localResponse.data.data && renderResponse.data.data) {
            console.log('\n📊 Comparación de datos:');
            
            localResponse.data.data.forEach((localVideo, index) => {
                const renderVideo = renderResponse.data.data[index];
                if (renderVideo) {
                    console.log(`\n🎬 Video ${index + 1}:`);
                    console.log(`  Local title: ${localVideo.title}`);
                    console.log(`  Render title: ${renderVideo.title}`);
                    console.log(`  Coinciden: ${localVideo.title === renderVideo.title ? '✅' : '❌'}`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error en comparación:', error.message);
    }
}

// Ejecutar pruebas
async function runTests() {
    await testRenderAPI();
    await compareLocalVsRender();
}

runTests();
