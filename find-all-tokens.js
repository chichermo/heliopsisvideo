const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔍 BUSCANDO TOKENS EN TODAS LAS BASES DE DATOS...\n');

const dbFiles = [
    './database/access_tokens.db',
    './database/video_access.db',
    './database/tokens.db'
];

let totalTokens = 0;

function checkDatabase(dbPath) {
    return new Promise((resolve) => {
        if (!fs.existsSync(dbPath)) {
            console.log(`❌ ${dbPath} - No existe`);
            resolve(0);
            return;
        }

        const db = new sqlite3.Database(dbPath);
        
        // Verificar qué tablas existen
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                console.log(`❌ ${dbPath} - Error: ${err.message}`);
                db.close();
                resolve(0);
                return;
            }

            console.log(`\n📊 ${dbPath}:`);
            console.log(`   Tablas: ${tables.map(t => t.name).join(', ')}`);

            // Buscar tokens en cada tabla
            let tableCount = 0;
            let completedTables = 0;

            tables.forEach(table => {
                if (table.name.includes('token')) {
                    db.all(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, countRows) => {
                        if (err) {
                            console.log(`   ❌ Error en tabla ${table.name}: ${err.message}`);
                        } else {
                            const count = countRows[0].count;
                            console.log(`   📋 ${table.name}: ${count} registros`);
                            tableCount += count;
                        }
                        
                        completedTables++;
                        if (completedTables === tables.length) {
                            db.close();
                            resolve(tableCount);
                        }
                    });
                } else {
                    completedTables++;
                    if (completedTables === tables.length) {
                        db.close();
                        resolve(tableCount);
                    }
                }
            });

            if (tables.length === 0) {
                db.close();
                resolve(0);
            }
        });
    });
}

async function checkAllDatabases() {
    for (const dbPath of dbFiles) {
        const count = await checkDatabase(dbPath);
        totalTokens += count;
    }
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   Total de tokens encontrados: ${totalTokens}`);
    
    if (totalTokens === 0) {
        console.log('\n❌ NO SE ENCONTRARON TOKENS EN NINGUNA BASE DE DATOS');
        console.log('   Esto confirma que los tokens que creaste hoy se perdieron');
    }
}

checkAllDatabases();
