const fs = require('fs');
const path = require('path');
const { db } = require('./init');

const DEFAULT_VIDEO_IDS_JSON = JSON.stringify([
    '1-38V037fiJbvUytXNPhAtQQ10bPNeLnD',
    '1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE',
]);

function normalizeToken(t) {
    if (t == null) return '';
    return String(t).trim().toLowerCase();
}

/**
 * Inserta tokens incluidos en el repo (git) si aún no están en SQLite.
 * En Render sin disco persistente, cada despliegue vacía la BD: así se vuelven a cargar los enlaces conocidos.
 * No pisa filas existentes (INSERT OR IGNORE).
 */
function mergeBundledTokensOnStartup() {
    return new Promise((resolve) => {
        const filepath = path.join(__dirname, 'bundled-tokens.json');
        if (!fs.existsSync(filepath)) {
            console.log('ℹ️ No hay database/bundled-tokens.json, omitiendo fusión');
            return resolve({ inserted: 0, skipped: 0 });
        }

        let bundle;
        try {
            bundle = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (e) {
            console.error('❌ bundled-tokens.json inválido:', e.message);
            return resolve({ inserted: 0, skipped: 0 });
        }

        const list = Array.isArray(bundle.tokens) ? bundle.tokens : [];
        if (list.length === 0) {
            return resolve({ inserted: 0, skipped: 0 });
        }

        const fallbackPwd = process.env.BUNDLED_DEFAULT_PASSWORD;

        let done = 0;
        let inserted = 0;
        const total = list.length;
        let settled = false;

        const finishOne = (err, changes) => {
            if (err) {
                console.warn('⚠️ bundled-merge:', err.message);
            } else if (changes > 0) {
                inserted++;
            }
            done++;
            if (done >= total && !settled) {
                settled = true;
                console.log(
                    `📦 Bundled tokens: ${inserted} insertados, ${total - inserted} ya existían (total en archivo: ${total})`
                );
                resolve({ inserted, skipped: total - inserted });
            }
        };

        for (const row of list) {
            const token = normalizeToken(row.token);
            const email = row.email != null ? String(row.email).trim() : '';
            let password = row.password != null ? String(row.password) : '';
            if (!password && fallbackPwd) {
                password = String(fallbackPwd);
            }
            if (!token || !email || !password) {
                process.nextTick(() => finishOne(null, 0));
                continue;
            }

            let videoIds = row.video_ids;
            if (Array.isArray(videoIds)) {
                videoIds = JSON.stringify(videoIds);
            }
            if (!videoIds) {
                videoIds = DEFAULT_VIDEO_IDS_JSON;
            }

            db.run(
                `INSERT OR IGNORE INTO simple_tokens (token, email, password, video_ids)
                 VALUES (?, ?, ?, ?)`,
                [token, email, password, videoIds],
                function onRun(err) {
                    finishOne(err, err ? 0 : this.changes);
                }
            );
        }
    });
}

module.exports = { mergeBundledTokensOnStartup, normalizeToken };
