const { addAllTokens, processTokensFromText } = require('./add-all-tokens');

// Script para procesar tokens enviados por el usuario
async function processUserTokens() {
    console.log('📋 SISTEMA DE PROCESAMIENTO DE TOKENS');
    console.log('=====================================');
    console.log('');
    console.log('💡 Envía todos tus tokens en este formato:');
    console.log('');
    console.log('token1');
    console.log('email1@example.com');
    console.log('password1');
    console.log('');
    console.log('token2');
    console.log('email2@example.com');
    console.log('password2');
    console.log('');
    console.log('... (repite para todos los tokens)');
    console.log('');
    console.log('🔧 El sistema automáticamente:');
    console.log('  ✅ Agregará todos los tokens a la base de datos');
    console.log('  ✅ Creará respaldos en JSON, CSV y DB');
    console.log('  ✅ Generará código de respaldo');
    console.log('  ✅ Configurará los videos permitidos');
    console.log('');
    console.log('📤 Envía tus tokens ahora y yo los procesaré!');
}

// Función para procesar tokens desde texto
function processTokensFromUserInput(text) {
    console.log('🔄 Procesando tokens del usuario...');
    
    const lines = text.trim().split('\n');
    const tokens = [];
    let currentToken = {};
    let lineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === '') {
            // Línea vacía, procesar token actual si está completo
            if (currentToken.token && currentToken.email && currentToken.password) {
                tokens.push({
                    token: currentToken.token,
                    email: currentToken.email,
                    password: currentToken.password,
                    video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
                    views: 0,
                    max_views: 999999,
                    is_permanent: true,
                    requires_password: true,
                    status: 'permanente'
                });
                console.log(`✅ Token procesado: ${currentToken.token} (${currentToken.email})`);
            }
            currentToken = {};
            lineIndex = 0;
        } else {
            switch (lineIndex) {
                case 0:
                    currentToken.token = line;
                    break;
                case 1:
                    currentToken.email = line;
                    break;
                case 2:
                    currentToken.password = line;
                    break;
            }
            lineIndex++;
        }
    }
    
    // Procesar último token si no termina con línea vacía
    if (currentToken.token && currentToken.email && currentToken.password) {
        tokens.push({
            token: currentToken.token,
            email: currentToken.email,
            password: currentToken.password,
            video_ids: ['1-38V037fiJbvUytXNPhAtQQ10bPNeLnD', '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE'],
            views: 0,
            max_views: 999999,
            is_permanent: true,
            requires_password: true,
            status: 'permanente'
        });
        console.log(`✅ Token procesado: ${currentToken.token} (${currentToken.email})`);
    }
    
    console.log(`\n📊 Total de tokens procesados: ${tokens.length}`);
    
    if (tokens.length > 0) {
        console.log('🔄 Agregando tokens a la base de datos...');
        addAllTokens(tokens);
    } else {
        console.log('⚠️ No se encontraron tokens válidos');
    }
    
    return tokens;
}

// Función para crear respaldo inmediato
async function createImmediateBackup() {
    const TokenBackupManager = require('./backup-manager');
    const backupManager = new TokenBackupManager();
    await backupManager.createFullBackup();
}

// Exportar funciones
module.exports = {
    processUserTokens,
    processTokensFromUserInput,
    createImmediateBackup
};

// Si se ejecuta directamente
if (require.main === module) {
    processUserTokens();
}
