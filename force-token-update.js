const { db } = require('./database/init');

console.log('🔧 Forzando inserción/actualización del token...');

const token = '0a95b5699675be71c815e8475005294f';
const email = 'erienpoppe@gmail.com';
const password = 'kxg8AsFg';
const video_ids = '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE';
const notes = 'Token real recuperado - Acceso permanente garantizado';

// Usar INSERT OR REPLACE para forzar la actualización
const insertOrReplaceQuery = `
    INSERT OR REPLACE INTO simple_tokens (
        token, email, password, video_ids, max_views, views, 
        is_active, notes, payment_status, created_at, last_accessed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const now = new Date().toISOString();

db.run(insertOrReplaceQuery, [
    token,
    email,
    password,
    video_ids,
    999999, // max_views
    0, // views
    1, // is_active
    notes,
    'paid', // payment_status
    now, // created_at
    now  // last_accessed
], function(err) {
    if (err) {
        console.error('❌ Error insertando/actualizando token:', err);
        return;
    }
    
    console.log(`✅ Token insertado/actualizado: ${this.changes} filas afectadas`);
    
    // Verificar que se insertó/actualizó correctamente
    db.get('SELECT * FROM simple_tokens WHERE token = ?', [token], (err, row) => {
        if (err) {
            console.error('❌ Error verificando token:', err);
            return;
        }
        
        if (row) {
            console.log('✅ Token verificado:');
            console.log(`   Token: ${row.token}`);
            console.log(`   Email: ${row.email}`);
            console.log(`   Password: ${row.password}`);
            console.log(`   Video IDs: ${row.video_ids}`);
            console.log(`   Max Views: ${row.max_views}`);
            console.log(`   Views: ${row.views}`);
            console.log(`   Active: ${row.is_active}`);
            console.log(`   Notes: ${row.notes}`);
            console.log(`   Created: ${row.created_at}`);
            console.log(`   Last Access: ${row.last_accessed}`);
        } else {
            console.log('❌ Token no encontrado después de la inserción');
        }
        
        process.exit(0);
    });
});
