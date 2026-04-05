/**
 * One-off / repeatable: rebuild database/bundled-tokens.json from master list + live API prefix match.
 * Run: node scripts/build-bundled-tokens.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

function fullFromPrefix(prefix, email, password) {
    let p = String(prefix || '')
        .toLowerCase()
        .replace(/\.\.\.$/, '')
        .trim();
    if (p.length >= 32) return p.slice(0, 32);
    const h = crypto.createHash('sha256').update(`${email}|${password}|heliopsis-bundle-suffix-v1`).digest('hex');
    return (p + h).slice(0, 32);
}

const userRows = `
Moens_Tamara@hotmail.com|2186025a|YDki5j9x
chiara@brandstoffenslabbinck.com|d4585c2f|qkR8UkeL
johnnycoppejans@hotmail.com|3e736c6f|7WbovVpD
verraes-dhooghe@skynet.be|ffce28c9|3M5V3iPe
schiettecatte.nathalie@gmail.com|57f11b25|2etOWzJy
lizzy.litaer@gmail.com|552dfb70|vaaG4whP
info@knokke-interiors.be|d7e7ae1e|rMr2jtbL
kellefleerackers@hotmail.com|c12e1ab7|mkjSjY7N
evy_verstrynge@hotmail.com|ee6c8bb9|2SCSmij7
eline.degroote08@icloud.com|e4dfa256|5lxm2kVC
melissa_lamote@hotmail.com|708a234c|1ILi4iX3
tantefie2109@hotmail.com|b02df637|A6J6Vnzq
emilydelcroix123@gmail.com|eeec1ddf|FzuI06Zn
verbouwsandra@gmail.com|988f706d|Qwv6PJgn
sam_bogaert@outlook.com|55c17a23|p49ZX60E
jessie-westyn@hotmail.com|0d606326|kbE57BXB
France.dekeyser@hotmail.com|382f2404|iDoDKn8h
ella8300@icloud.com|7d5edb65|troUdlXV
sofiehertsens@hotmail.com|29202f2a|HyXCwyr4
w-elshout@hotmail.com|fc455d68|cWB9wYom
joyavantorre@gmail.com|e99c610d|Rvn28U15
vstaal@hotmail.com|5ab19ba7|nmn3pWkM
kurzieboy@hotmail.com|0469d9ab|0xzLaSBR
marjolijnrotsaert@hotmail.com|85bb0db6|7K7wWaxe
shana.moyaert@hotmail.com|6679c5ef|zlhv96rH
ymkevanherpe@hotmail.com|ddcffb66|cgbR1cw2
fauve.muyllaert@gmail.com|a99956c7|XCDKZb2v
christy.de.graeve@icloud.com|387f385c|AqRwy2Zd
lindeversporten@gmail.com|8c9bfdf0|a24WttS1
Carole.scrivens@gmail.com|047993c3|naEmwyBH
macoppens@proximus.be|de235240|XD2ETQYU
kaat.lannoy@outlook.com|5ce2d80b|6ngWEXB0
nathaliegoorix@hotmail.com|9f66bdc9|Xg0WMSaq
Lily.barnes05@hotmail.com|ff6ee07d|LE2TW33j
sarah.dobbelaere@outlook.be|11e35d72|EtMRNxrY
moens_tamara@hotmail.com|6321d667|rCfo9nei
chris.christine@skynet.be|cdb5b91e|sEtzP9r6
vermeirsch.m@gmail.com|eed02319|QV9ELr0L
sylvie_cantraine@yahoo.com|b32d6560|sY2HjKF6
Sarahds1985@gmail.com|a8e449af|Q8uK1Ge5
magaliboedt@hotmail.com|cd31d650|LE6edpPb
vanderheydenkate@hotmail.com|97c664e7|w7pFrNk4
zander.proost@hotmail.com|bf5819e5|bFUnjZGZ
sarah.dobbelaere@outlook.be|67668b2a|5zPxPkdV
silke.devinck@hotmail.com|6c23cd23|aUzFvNaq
silke.devinck@hotmail.com|76b39098|A5jD5vs0
kurt.cheryl@telenet.be|86210b4e|1wu67HWT
devoogtannelies@gmail.com|ab96417d|MxDwiLdU
anke.dekee@knokke-heist.be|dd2648e8|GqaAfMWS
alinemoeykens@icloud.com|33fc33c7|7rO23wPJ
erienpoppe@gmail.com|0a95b569|kxg8AsFg
erienpoppe@gmail.com|6bd56fca|Rpl7xuQz
louise.deconick2008@icloud.com|fcba5072|Qw7EKCYa
anka_demulder@hotmail.com|e681ed88|ks2riun6
hanne.eeckeloo@hotmail.be|90d0a9ff|zsMLsJig
Liesbethkreps@gmail.com|465e6f25|gTSRC66g
`
    .trim()
    .split(/\n/)
    .map((l) => {
        const [email, pref, pwd] = l.split('|');
        return { email: email.trim(), pref: pref.trim(), password: pwd.trim() };
    });

const vid = '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE';

function fetchApi() {
    return new Promise((resolve, reject) => {
        https
            .get('https://heliopsis-video.onrender.com/api/video-simple/list-simple', (res) => {
                let d = '';
                res.on('data', (c) => (d += c));
                res.on('end', () => resolve(JSON.parse(d)));
            })
            .on('error', reject);
    });
}

(async () => {
    const api = await fetchApi();
    const byEmail = new Map();
    for (const t of api.data || []) {
        byEmail.set(t.email.toLowerCase(), t);
    }

    const tokens = [];
    const seen = new Set();

    for (const r of userRows) {
        const em = r.email.toLowerCase();
        const pref = r.pref.toLowerCase();
        const apiRow = byEmail.get(em);

        let token;
        if (apiRow && apiRow.token && apiRow.token.toLowerCase().startsWith(pref)) {
            token = apiRow.token.toLowerCase();
        } else {
            token = fullFromPrefix(pref, r.email, r.password);
        }

        if (seen.has(token)) continue;
        seen.add(token);

        tokens.push({
            token,
            email: r.email,
            password: r.password,
            video_ids: vid,
        });
    }

    const out = {
        version: 2,
        note: 'UPSERT on deploy. Passwords from master list; token = API match when prefix fits, else prefix + SHA256 suffix.',
        tokens,
    };

    const outPath = path.join(__dirname, '..', 'database', 'bundled-tokens.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('Wrote', tokens.length, 'tokens ->', outPath);
})();
