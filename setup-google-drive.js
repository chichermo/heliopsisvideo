#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurador de Credenciales de Google Drive');
console.log('===============================================\n');

// Verificar si existe .env
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
    console.log('✅ Archivo .env encontrado');
    require('dotenv').config();
} else {
    console.log('❌ Archivo .env no encontrado');
    console.log('📝 Creando archivo .env básico...');
    
    const envContent = `# Google Drive API Configuration
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3001/api/googledrive/callback
GOOGLE_REFRESH_TOKEN=tu_refresh_token_aqui

# Video Configuration
VIDEO_FILE_ID=1-38V037fiJbvUytXNPhAtQQ10bPNeLnD

# Server Configuration
PORT=3001
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_123456789

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Configuration
DB_PATH=./database/access_tokens.db

# Environment
NODE_ENV=development`;

    try {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Archivo .env creado exitosamente');
        require('dotenv').config();
    } catch (error) {
        console.error('❌ Error creando archivo .env:', error.message);
        process.exit(1);
    }
}

// Verificar configuración actual
console.log('\n📋 Estado actual de la configuración:');
console.log('=====================================');

const checks = [
    { name: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID },
    { name: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET },
    { name: 'GOOGLE_REFRESH_TOKEN', value: process.env.GOOGLE_REFRESH_TOKEN },
    { name: 'PORT', value: process.env.PORT },
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET }
];

checks.forEach(check => {
    const status = check.value && check.value !== 'tu_client_id_aqui' && check.value !== 'tu_client_secret_aqui' && check.value !== 'tu_refresh_token_aqui' && check.value !== 'tu_jwt_secret_super_seguro_aqui_123456789' ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${check.value ? 'Configurado' : 'No configurado'}`);
});

// Mostrar instrucciones
console.log('\n📖 Instrucciones para configurar Google Drive:');
console.log('==============================================');
console.log('1. Ve a https://console.developers.google.com/');
console.log('2. Crea un nuevo proyecto o selecciona uno existente');
console.log('3. Habilita la API de Google Drive');
console.log('4. Crea credenciales OAuth 2.0');
console.log('5. Configura las URLs de redirección autorizadas');
console.log('6. Copia el Client ID y Client Secret');
console.log('7. Usa el endpoint /api/googledrive/auth para obtener el refresh token');
console.log('8. Actualiza el archivo .env con los valores reales');

console.log('\n🔗 URLs importantes:');
console.log('===================');
console.log(`- Panel de administración: http://localhost:${process.env.PORT || 3001}/admin`);
console.log(`- Autorización Google Drive: http://localhost:${process.env.PORT || 3001}/api/googledrive/auth`);
console.log(`- Estado de Google Drive: http://localhost:${process.env.PORT || 3001}/api/googledrive/status`);

console.log('\n⚠️  IMPORTANTE:');
console.log('==============');
console.log('Sin las credenciales de Google Drive configuradas, los videos no se podrán reproducir.');
console.log('El sistema mostrará errores 500 en /api/googledrive/files y errores de formato en los videos.');

console.log('\n✅ Configuración completada');
