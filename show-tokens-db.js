const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 EXTRAYENDO INFORMACIÓN DE TOKENS DESDE BASE DE DATOS...\n');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database', 'access_tokens.db');
const db = new sqlite3.Database(dbPath);

// Función para obtener todos los tokens
function getAllTokens() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT token, email, password, max_views, is_active, notes, created_at
            FROM simple_tokens 
            WHERE email NOT LIKE '%example%' 
            AND email NOT LIKE '%test%'
            AND email != 'test-nuevo@example.com'
            ORDER BY created_at DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Función principal
async function showTokensInfo() {
    try {
        const tokens = await getAllTokens();
        
        console.log(`📊 Total de tokens reales encontrados: ${tokens.length}\n`);
        
        if (tokens.length > 0) {
            console.log('📋 INFORMACIÓN COMPLETA DE TOKENS:');
            console.log('================================================');
            
            tokens.forEach((token, index) => {
                console.log(`${index + 1}. ${token.email}`);
                console.log(`   Token: ${token.token}`);
                console.log(`   Password: ${token.password}`);
                console.log(`   Link: https://heliopsis-video.onrender.com/watch-simple/${token.token}`);
                console.log(`   Max Views: ${token.max_views}`);
                console.log(`   Status: ${token.is_active ? 'ACTIVO' : 'INACTIVO'}`);
                console.log(`   Notes: ${token.notes || 'N/A'}`);
                console.log(`   Created: ${token.created_at}`);
                console.log('   ---');
            });
            
            console.log('================================================');
            console.log(`🎉 ¡${tokens.length} tokens listos para usuarios!`);
            console.log('🔒 Todos los tokens son permanentes (999999 views)');
            console.log('📝 Los tokens están guardados en la base de datos local');
            console.log('🚀 Para que estén disponibles en Render, necesitas subir los cambios a git');
        } else {
            console.log('❌ No se encontraron tokens reales en la base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

// Ejecutar
showTokensInfo();
