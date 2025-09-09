// Script para insertar todos los tokens manualmente
const tokens = [
    { email: 'Moens_Tamara@hotmail.com', token: '2186025af95ed07d769ac7a493e469a7', password: 'YDki5j9x' },
    { email: 'chiara@brandstoffenslabbinck.com', token: 'd4585c2f30851d38df97533004faab0e', password: 'qkR8UkeL' },
    { email: 'johnnycoppejans@hotmail.com', token: '3e736c6f6eb01c7942fe52e841495877', password: '7WbovVpD' },
    { email: 'verraes-dhooghe@skynet.be', token: 'ffce28c9269663d32bf63b275caf759c', password: '3M5V3iPe' },
    { email: 'schiettecatte.nathalie@gmail.com', token: '57f11b2591563aa3d69a19a5c0da85fd', password: '2etOWzJy' },
    { email: 'lizzy.litaer@gmail.com', token: '552dfb7004e9482a7b77db223aebd92c', password: 'vaaG4whP' },
    { email: 'info@knokke-interiors.be', token: 'd7e7ae1e1953a2512635840e6a36bd88', password: 'rMr2jtbL' },
    { email: 'kellefleerackers@hotmail.com', token: 'c12e1ab7cc23887acead9db2e27c52bc', password: 'mkjSjY7N' },
    { email: 'evy_verstrynge@hotmail.com', token: 'ee6c8bb94d76ba0e18b5b6de1324138b', password: '2SCSmij7' },
    { email: 'eline.degroote08@icloud.com', token: 'e4dfa25683905acf5be666d66f3d2ec6', password: '5lxm2kVC' },
    { email: 'melissa_lamote@hotmail.com', token: '708a234c20d1b2c95fb604e02130ece3', password: '1ILi4iX3' },
    { email: 'tantefie2109@hotmail.com', token: 'b02df63790a3b733cb6d521023f2a3b5', password: 'A6J6Vnzq' },
    { email: 'emilydelcroix123@gmail.com', token: 'eeec1ddfcd54f946a215f63aec1625e3', password: 'FzuI06Zn' },
    { email: 'verbouwsandra@gmail.com', token: '988f706df719313e2612994893efe24b', password: 'Qwv6PJgn' },
    { email: 'sam_bogaert@outlook.com', token: '55c17a2364d9b55b36d2bcea3b418d31', password: 'p49ZX60E' },
    { email: 'jessie-westyn@hotmail.com', token: '0d6063265005fb10e7efe7fa81871006', password: 'kbE57BXB' },
    { email: 'France.dekeyser@hotmail.com', token: '382f2404e48d269850782b098babef8a', password: 'iDoDKn8h' },
    { email: 'ella8300@icloud.com', token: '7d5edb6595788b9ab48d55cba1a6dd05', password: 'troUdlXV' },
    { email: 'sofiehertsens@hotmail.com', token: '29202f2a81862ab8e3ea2280dfcfa8d1', password: 'HyXCwyr4' },
    { email: 'w-elshout@hotmail.com', token: 'fc455d68f3f81fca8eede63fdc46f868', password: 'cWB9wYom' },
    { email: 'joyavantorre@gmail.com', token: 'e99c610d8b7887d2f03e2160dc02932a', password: 'Rvn28U15' },
    { email: 'vstaal@hotmail.com', token: '5ab19ba7e644047967e4c4f7b72445a4', password: 'nmn3pWkM' },
    { email: 'kurzieboy@hotmail.com', token: '0469d9ab40b84e74636387ee11db450a', password: '0xzLaSBR' },
    { email: 'marjolijnrotsaert@hotmail.com', token: '85bb0db6b1440ae97775c445923f2b7f', password: '7K7wWaxe' },
    { email: 'shana.moyaert@hotmail.com', token: '6679c5eff294e2014ace94dc0fbf2ac5', password: 'zlhv96rH' },
    { email: 'ymkevanherpe@hotmail.com', token: 'ddcffb66ce06e26493e679e095e6d54a', password: 'cgbR1cw2' },
    { email: 'fauve.muyllaert@gmail.com', token: 'a99956c7ac4c0618107cb55f29df4fff', password: 'XCDKZb2v' },
    { email: 'christy.de.graeve@icloud.com', token: '387f385c619d17864eb6a610b2d6d77a', password: 'AqRwy2Zd' },
    { email: 'lindeversporten@gmail.com', token: '8c9bfdf01215c99b9b303459de515e52', password: 'a24WttS1' },
    { email: 'Carole.scrivens@gmail.com', token: '047993c360a8e0258e7b895d2ca62c77', password: 'naEmwyBH' }
];

console.log('📋 INSTRUCCIONES PARA INSERTAR TODOS LOS TOKENS:');
console.log('================================================');
console.log('');
console.log('1. Ve al panel de administración: https://heliopsis-video.onrender.com/admin-simple');
console.log('');
console.log('2. Usa la función "Bulk Upload" (Carga Masiva)');
console.log('');
console.log('3. Copia y pega este texto en el campo de emails:');
console.log('');
console.log('Moens_Tamara@hotmail.com');
console.log('chiara@brandstoffenslabbinck.com');
console.log('johnnycoppejans@hotmail.com');
console.log('verraes-dhooghe@skynet.be');
console.log('schiettecatte.nathalie@gmail.com');
console.log('lizzy.litaer@gmail.com');
console.log('info@knokke-interiors.be');
console.log('kellefleerackers@hotmail.com');
console.log('evy_verstrynge@hotmail.com');
console.log('eline.degroote08@icloud.com');
console.log('melissa_lamote@hotmail.com');
console.log('tantefie2109@hotmail.com');
console.log('emilydelcroix123@gmail.com');
console.log('verbouwsandra@gmail.com');
console.log('sam_bogaert@outlook.com');
console.log('jessie-westyn@hotmail.com');
console.log('France.dekeyser@hotmail.com');
console.log('ella8300@icloud.com');
console.log('sofiehertsens@hotmail.com');
console.log('w-elshout@hotmail.com');
console.log('joyavantorre@gmail.com');
console.log('vstaal@hotmail.com');
console.log('kurzieboy@hotmail.com');
console.log('marjolijnrotsaert@hotmail.com');
console.log('shana.moyaert@hotmail.com');
console.log('ymkevanherpe@hotmail.com');
console.log('fauve.muyllaert@gmail.com');
console.log('christy.de.graeve@icloud.com');
console.log('lindeversporten@gmail.com');
console.log('Carole.scrivens@gmail.com');
console.log('');
console.log('4. Configuración recomendada:');
console.log('   - Videos: DEEL 1 y DEEL 2');
console.log('   - Max Views: 999999');
console.log('   - Token Type: Permanente');
console.log('   - Require Password: Sí');
console.log('');
console.log('5. Haz clic en "Generar Tokens Masivos"');
console.log('');
console.log('6. Los tokens se generarán automáticamente con passwords únicos');
console.log('');
console.log('💡 ALTERNATIVA: Si prefieres usar los tokens originales con passwords específicos,');
console.log('   puedes crear tokens individuales con los passwords que proporcionaste.');
