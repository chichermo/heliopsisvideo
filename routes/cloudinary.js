const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Función para obtener URL de video desde Cloudinary
const getVideoUrl = (videoId) => {
  console.log('🔄 Obteniendo video desde Cloudinary:', videoId);
  
  // Mapear video IDs a nombres en Cloudinary
  const cloudinaryVideos = {
    '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD': 'DEEL-1',
    '1-1ABC123DEF456GHI789JKL012MNO345': 'DEEL-2'
  };

  const publicId = cloudinaryVideos[videoId];
  
  if (!publicId) {
    console.log('❌ Video ID no encontrado:', videoId);
    return null;
  }

  try {
    // Generar URL de video con streaming optimizado
    const videoUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'mp4',
      quality: 'auto',
      fetch_format: 'auto',
      streaming_profile: 'auto',
      secure: true
    });

    console.log('✅ URL de Cloudinary generada:', videoUrl);
    return videoUrl;
  } catch (error) {
    console.error('❌ Error generando URL de Cloudinary:', error);
    return null;
  }
};

module.exports = {
  getVideoUrl
};
