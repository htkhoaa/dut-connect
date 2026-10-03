// Configure a read-only local presentation view. This never deletes or updates business records.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
let content = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(content.split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)];}));
if ((env.SPRING_PROFILES_ACTIVE || 'dev') !== 'dev') throw Error('Chỉ cấu hình danh sách demo trong profile dev.');
const origin = new URL(process.env.DUT_DEMO_ORIGIN || 'http://localhost:' + (env.FRONTEND_PORT || '80')).origin;
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) throw Error('Chỉ dùng trên localhost.');
const login = await fetch(origin + '/api/v1/auth/login', {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'},
    body: JSON.stringify({email: env.APP_BOOTSTRAP_ADMIN_EMAIL, password: env.APP_BOOTSTRAP_ADMIN_PASSWORD}), signal: AbortSignal.timeout(15000)});
if (!login.ok) throw Error('Đăng nhập quản trị không thành công: HTTP ' + login.status);
const session = await login.json();
const directory = path.join(root, '.local'); fs.mkdirSync(directory, {recursive: true});
const manifestPath = path.join(directory, 'catalog-exclusions.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {origin, campaigns: [], proposals: [], organizations: [], categories: []};
if (manifest.origin !== origin) throw Error('Danh sách hiện có thuộc origin khác.');
const routes = {campaigns: '/admin/campaigns', proposals: '/admin/proposals', organizations: '/admin/organizations', categories: '/campaign-categories'};
const phase = /^(?:Renamed )?Phase\s*(?:[1-9]|10|11)\b/i;
for (const [kind, route] of Object.entries(routes)) {
    const collected = new Map(manifest[kind].map(record => [record.id, record]));
    for (let page = 0; ; page++) {
        const response = await fetch(origin + '/api/v1' + route + '?page=' + page + '&size=100', {
            headers: {Authorization: 'Bearer ' + session.accessToken}, signal: AbortSignal.timeout(15000)});
        if (!response.ok) throw Error(route + ': HTTP ' + response.status);
        const result = await response.json();
        for (const record of result.items) {
            const name = record.title || record.name;
            const auditExample = (kind === 'campaigns' && record.id === '753ceb28-efee-4364-875f-f956f1686d93' && record.summary === 'Audit fixture') ||
                (kind === 'proposals' && record.id === '05421a69-2416-4c0b-bab3-31506aa8cb09' && name === 'dfc5de61-4995-436c-896b-ed9ea4c95e95');
            if (phase.test(name) || auditExample || (kind === 'organizations' && /^(?:Browser Organization|Đội slug audit|Doi slug audit)\s+\d{13}/.test(name)))
                collected.set(record.id, {id: record.id, name});
        }
        if (!result.hasNext) break;
    }
    manifest[kind] = [...collected.values()];
    console.log(kind + ': ' + manifest[kind].length + ' bản ghi kiểm tra sẽ được ẩn khỏi danh sách.');
}
if (!process.argv.includes('--apply')) {
    console.log('Chỉ xem trước. --apply ghi cấu hình hiển thị và danh sách ID; không xóa dữ liệu.');
    process.exit(0);
}
const names = {campaigns: 'CAMPAIGN', proposals: 'PROPOSAL', organizations: 'ORGANIZATION', categories: 'CATEGORY'};
for (const [kind, name] of Object.entries(names)) {
    if (manifest[kind].some(record => !/^[0-9a-f-]{36}$/i.test(record.id) || record.name.endsWith(' · Demo')))
        throw Error('Không được ẩn dữ liệu DUT mẫu hoặc dùng ID không hợp lệ.');
    const key = 'APP_DEMO_CATALOG_' + name + '_IDS';
    const line = key + '=' + manifest[kind].map(record => record.id).join(',');
    content = new RegExp('^' + key + '=.*$', 'm').test(content)
        ? content.replace(new RegExp('^' + key + '=.*$', 'm'), line) : content.trimEnd() + '\n' + line + '\n';
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(envPath, content);
console.log('Đã ghi .local/catalog-exclusions.json và cấu hình .env. Khởi động lại backend để áp dụng.');
