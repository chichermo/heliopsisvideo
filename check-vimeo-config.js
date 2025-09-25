const Vimeo = require('vimeo').Vimeo;

// Configuración de Vimeo
const clientId = process.env.VIMEO_CLIENT_ID;
const clientSecret = process.env.VIMEO_CLIENT_SECRET;
const accessToken = process.env.VIMEO_ACCESS_TOKEN;

if (!clientId || !clientSecret || !accessToken) {
    console.log('❌ Error: Vimeo credentials not found in environment variables');
    process.exit(1);
}

const client = new Vimeo(clientId, clientSecret, accessToken);

// IDs de tus videos
const videoIds = ['1116840023', '1116863299']; // DEEL 1 y DEEL 2

async function checkVideoConfig(videoId) {
    return new Promise((resolve, reject) => {
        client.request({
            method: 'GET',
            path: `/videos/${videoId}`
        }, (error, body, statusCode, headers) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

async function checkAllVideos() {
    console.log('🔍 Checking Vimeo video configurations...\n');
    
    for (const videoId of videoIds) {
        try {
            console.log(`📹 Checking video ${videoId}...`);
            const videoData = await checkVideoConfig(videoId);
            
            console.log(`✅ Video: ${videoData.name}`);
            console.log(`📊 Privacy: ${videoData.privacy?.view}`);
            console.log(`🌍 Embed: ${videoData.embed?.privacy}`);
            console.log(`🔗 Domain restrictions: ${videoData.embed?.domains?.join(', ') || 'None'}`);
            console.log(`🌐 Geographic restrictions: ${videoData.privacy?.countries || 'None'}`);
            console.log(`🔒 Password protection: ${videoData.password ? 'Yes' : 'No'}`);
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Error checking video ${videoId}:`, error.message);
        }
    }
}

checkAllVideos().catch(console.error);
