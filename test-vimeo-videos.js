const https = require('https');

// Script para probar ambos videos de Vimeo
async function testVimeoVideos() {
    console.log('🧪 Probando ambos videos de Vimeo...');
    
    const videos = [
        { id: '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', name: 'DEEL 1.mp4' },
        { id: '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE', name: 'DEEL 2.mp4' }
    ];
    
    for (const video of videos) {
        console.log(`\n🎬 Probando ${video.name} (ID: ${video.id})`);
        
        const url = `https://heliopsis-video.onrender.com/api/vimeo/stream/${video.id}`;
        
        try {
            const response = await makeRequest(url);
            console.log(`✅ ${video.name}: Status ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                console.log(`📄 ${video.name}: Respuesta válida`);
            } else {
                console.log(`❌ ${video.name}: Error ${response.statusCode}`);
            }
        } catch (error) {
            console.error(`❌ ${video.name}: Error`, error.message);
        }
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

// Ejecutar prueba
testVimeoVideos();
