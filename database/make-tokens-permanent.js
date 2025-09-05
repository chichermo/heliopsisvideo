const { db } = require('../database/init');

console.log('🔒 Iniciando migración para hacer tokens permanentes...');

// Función para hacer todos los tokens permanentes
function makeTokensPermanent() {
    const updateQuery = `
        UPDATE simple_tokens 
        SET max_views = 999999, 
            notes = COALESCE(notes, '') || ' | Token permanente garantizado', 
            payment_status = 'paid',
            is_active = 1
        WHERE max_views < 999999 OR notes NOT LIKE '%permanente%'
    `;
    
    db.run(updateQuery, [], function(err) {
        if (err) {
            console.error('❌ Error actualizando tokens a permanentes:', err);
        } else {
            console.log(`✅ ${this.changes} tokens actualizados a permanentes`);
            
            // Verificar tokens actualizados
            const verifyQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN max_views >= 999999 THEN 1 ELSE 0 END) as permanentes FROM simple_tokens';
            
            db.get(verifyQuery, [], (err, row) => {
                if (err) {
                    console.error('❌ Error verificando tokens:', err);
                } else {
                    console.log(`📊 Total de tokens: ${row.total}`);
                    console.log(`🔒 Tokens permanentes: ${row.permanentes}`);
                    console.log(`✅ Migración completada exitosamente`);
                }
            });
        }
    });
}

// Ejecutar migración
makeTokensPermanent();
