import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {organizations, people, campaigns, disclaimer} from './demo-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#') && l.includes('=')).map(l => {const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];}));
if ((env.SPRING_PROFILES_ACTIVE || 'dev') !== 'dev') throw Error('Chỉ tạo dữ liệu mẫu với cấu hình dev.');
const origin = new URL(process.env.DUT_DEMO_ORIGIN || 'http://localhost:' + (env.FRONTEND_PORT || '80')).origin;
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) throw Error('Chỉ tạo dữ liệu mẫu trên localhost.');
if (!env.APP_BOOTSTRAP_ADMIN_EMAIL || !env.APP_BOOTSTRAP_ADMIN_PASSWORD) throw Error('Cần thông tin quản trị viên cục bộ trong .env.');
const directory = path.join(root, '.local'); fs.mkdirSync(directory, {recursive: true});
const stateFile = path.join(directory, 'demo-accounts.json');
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {origin, people: {}, organizations: {}, campaigns: {}, createdAt: new Date().toISOString()};
if (state.origin !== origin) throw Error('Dữ liệu mẫu đang thuộc origin khác. Dùng đúng DUT_DEMO_ORIGIN.');
const sessions = {};
function save() {fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n', {mode: 0o600});}
async function request(url, actor, method = 'GET', body) {
    const response = await fetch(origin + '/api/v1' + url, {method, headers: {Origin: origin, 'Content-Type': 'application/json', ...(sessions[actor] ? {Authorization: 'Bearer ' + sessions[actor].accessToken} : {})}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000)});
    const data = await response.json().catch(() => null);
    if (!response.ok) throw Error(url + ': HTTP ' + response.status + ' ' + (data?.code || '') + (data?.fieldErrors?.length ? ' ' + JSON.stringify(data.fieldErrors) : ''));
    return data;
}
async function login(key, values) {sessions[key] = await request('/auth/login', null, 'POST', {email: values.email, password: values.password});}
async function catalog(url) {const items = [];let page = 0;while (true) {const result = await request(url + '?size=100&page=' + page++, 'admin'); items.push(...result.items);if (!result.hasNext) return items;}}
const iso = offset => new Date(Date.now() + offset * 86400000).toISOString();
const date = offset => iso(offset).slice(0, 10);

await login('admin', {email: env.APP_BOOTSTRAP_ADMIN_EMAIL, password: env.APP_BOOTSTRAP_ADMIN_PASSWORD});
const [types, categories, skills] = await Promise.all([catalog('/organization-types'), catalog('/campaign-categories'), catalog('/skills')]);
for (const [index, person] of people.entries()) {
    state.people[person.key] ||= {values: {studentId: String(900000001 + index), fullName: person.name, faculty: person.faculty, email: String(900000001 + index) + '@sv1.dut.udn.vn', password: 'Demo-' + randomBytes(18).toString('base64url')}};
    const record = state.people[person.key];
    const facultyAliases = {'Công nghệ thông tin':'K. Công nghệ Thông tin','Quản lý dự án':'K. Quản lý dự án và Công nghiệp','Điện':'K. Điện','Kiến trúc':'K. Kiến trúc','Điện tử – Viễn thông':'K. Điện tử và Trí tuệ nhân tạo'};
    if (!record.registered) record.values.faculty = facultyAliases[person.faculty] || person.faculty;save();
    if (!record.registered) {await request('/auth/register', null, 'POST', record.values);record.registered = true;save();}
    await login(person.key, record.values);record.userId = sessions[person.key].user.id;
    if (!record.profileReady) {
        const profile = await request('/me/profile', person.key);
        const updated = await request('/me/profile', person.key, 'PUT', {fullName: person.name, faculty: record.values.faculty, bio: 'Sinh viên mẫu của DUT Connect, yêu thích hoạt động cộng đồng.', preferredTrack: person.track, experience: person.track === 'TECHNICAL' ? 'Đã hỗ trợ lớp học công nghệ, chuẩn bị bộ thực hành và hướng dẫn kỹ năng máy tính.' : 'Có kinh nghiệm chuẩn bị vật tư, phối hợp đội nhóm và tổ chức hoạt động sinh viên.', version: profile.version, userVersion: profile.user.version});
        await request('/me/skills', person.key, 'PUT', {skillIds: person.skills.map(name => {const skill = skills.find(s => s.name === name);if (!skill) throw Error('Thiếu kỹ năng ' + name);return skill.id;}), version: updated.version});
        record.profileReady = true;save();
    }
}
for (const definition of organizations) {
    if (!state.organizations[definition.key]) {
        const type = types.find(t => t.code === definition.type);if (!type) throw Error('Thiếu loại tổ chức ' + definition.type);
        const detail = await request('/organizations', 'organizer', 'POST', {name: definition.name + ' · Demo', organizationTypeId: type.id, description: disclaimer + '\n\n' + definition.description});
        state.organizations[definition.key] = {id: detail.organization.id};save();
    }
    const record = state.organizations[definition.key];
    let detail = await request('/organizations/' + record.id, 'organizer');
    if (detail.organization.status === 'PENDING_VERIFICATION') detail = await request('/admin/organizations/' + record.id + '/verify', 'admin', 'POST', {version: detail.organization.version});
    if (!record.managerAdded) {await request('/organizations/' + record.id + '/members', 'organizer', 'POST', {studentId: state.people.manager.values.studentId, memberRole: 'MANAGER', version: detail.organization.version});record.managerAdded = true;save();}
}
const paymentSettings = await request('/donation-settings', 'donor');
for (const [index, definition] of campaigns.entries()) {
    const record = state.campaigns[definition.key] ||= {applications: {}, tasks: [], donations: [], expenses: []};save();
    const org = state.organizations[definition.org];
    if (!record.proposalId) {
        const category = categories.find(c => c.name === definition.category);if (!category) throw Error('Thiếu danh mục ' + definition.category);
        const volunteer = definition.mode !== 'DONATION_ONLY', fundraising = definition.mode !== 'VOLUNTEER_ONLY';
        const proposal = await request('/proposals', 'organizer', 'POST', {content: {
            organizerType: 'ORGANIZATION', organizationId: org.id, categoryId: category.id, title: definition.title + ' · Demo', summary: definition.summary,
            description: disclaimer + '\n\n' + definition.description, expectedImpact: definition.impact, contributionMode: definition.mode,
            startDate: date(definition.start), endDate: date(definition.end), applicationDeadline: volunteer ? iso(5) : null, fundraisingDeadline: fundraising ? iso(45) : null,
            targetVolunteerCount: volunteer ? definition.volunteers : null, targetTechnicalCount: volunteer ? Math.floor(definition.volunteers * .4) : null,
            targetLogisticsCount: volunteer ? definition.volunteers - Math.floor(definition.volunteers * .4) : null,
            volunteerRequirements: volunteer ? 'Tinh thần trách nhiệm, sẵn sàng phối hợp đội nhóm và tham gia tập huấn. Nhóm kỹ thuật đóng góp chuyên môn; nhóm hậu cần hỗ trợ điều phối và vật tư.' : null,
            fundraisingGoal: definition.goal, institutionalFunding: '2000000', sponsorName: 'Nhóm cựu sinh viên Bách khoa (minh họa)', sponsorFunding: '1500000', estimatedBudget: '8000000'
        }});
        record.proposalId = proposal.id;save();
    }
    if (!record.id) {
        let proposal = await request('/proposals/' + record.proposalId, 'organizer');
        if (proposal.status === 'PENDING') {await request('/admin/proposals/' + record.proposalId + '/approve', 'admin', 'POST', {version: proposal.version});proposal = await request('/proposals/' + record.proposalId, 'organizer');}
        record.id = proposal.campaignId;save();
    }
    if (record.ready) {console.log('Đã có: ' + definition.title);continue;}
    let campaign = await request('/campaigns/' + record.id, 'organizer');record.slug = campaign.slug;
    if (campaign.status === 'DRAFT') campaign = await request('/campaigns/' + record.id + '/open', 'organizer', 'POST', {version: campaign.version});
    if (!record.skillsReady && definition.mode !== 'DONATION_ONLY') {
        const desired = definition.category === 'Education' ? ['Tutoring', 'Communication'] : definition.category === 'Campus Support' ? ['Programming', 'Logistics'] : ['Photography', 'Logistics'];
        campaign = await request('/campaigns/' + record.id + '/skill-requirements', 'organizer', 'PUT', {version: campaign.version, items: desired.map((name, i) => ({skillId: skills.find(s => s.name === name).id, track: i ? 'LOGISTICS' : 'TECHNICAL', importance: i ? 3 : 5}))});record.skillsReady = true;save();
    }
    if (!record.managerAdded) {campaign = await request('/campaigns/' + record.id + '/managers', 'organizer', 'POST', {studentId: state.people.manager.values.studentId, version: campaign.version});record.managerAdded = true;save();}
    if (definition.mode !== 'DONATION_ONLY') {
        for (const actor of ['technical', 'logistics', 'applicant']) {
            if (!record.applications[actor]) {const application = await request('/campaigns/' + record.id + '/applications', actor, 'POST', {preferredTrack: actor === 'logistics' ? 'LOGISTICS' : 'TECHNICAL', motivation: 'Mình muốn dùng kỹ năng học được tại Bách khoa để góp sức cho hoạt động này.', availability: 'Có thể tham gia cuối tuần và các buổi chuẩn bị sau giờ học.'});record.applications[actor] = application.id;save();}
            if (actor !== 'applicant') {const result = await request('/me/applications?campaignId=' + record.id, actor);const application = result.items.find(a => a.id === record.applications[actor]);if (application.status === 'PENDING') await request('/applications/' + application.id + '/accept', 'organizer', 'POST', {assignedTrack: actor === 'logistics' ? 'LOGISTICS' : 'TECHNICAL', version: application.version});}
        }
        if (!record.meeting) {const meeting = await request('/campaigns/' + record.id + '/meetings', 'organizer', 'POST', {title: 'Tập huấn & phân công tình nguyện viên', description: 'Trao đổi kế hoạch, kỹ năng an toàn và thống nhất nhiệm vụ theo nhóm.', meetingType: 'OFFLINE', startsAt: iso(1), endsAt: new Date(Date.now() + 86400000 + 5400000).toISOString(), location: 'Không gian sinh hoạt sinh viên DUT (minh họa)', meetingUrl: null});record.meeting = meeting.id;save();}
        const taskTitles = ['Chuẩn bị nội dung & bộ dụng cụ kỹ thuật', 'Kiểm kê vật tư và điều phối nhóm', 'Tổng hợp hình ảnh & kết quả hoạt động'];
        for (let position = 0; position < taskTitles.length; position++) {
            const actor = position === 0 ? 'technical' : 'logistics';
            if (!record.tasks[position]) {const task = await request('/campaigns/' + record.id + '/tasks', 'organizer', 'POST', {title: taskTitles[position], description: 'Phối hợp cùng đội tình nguyện, cập nhật tiến độ và báo cáo kết quả cho ban tổ chức.', track: actor === 'technical' ? 'TECHNICAL' : 'LOGISTICS', priority: position ? 'MEDIUM' : 'HIGH', dueAt: iso(6), assigneeUserIds: [state.people[actor].userId]});record.tasks[position] = task.id;save();}
            let task = await request('/tasks/' + record.tasks[position], 'organizer');
            if ((position === 0 || definition.state === 'COMPLETED') && task.status === 'TODO') task = await request('/tasks/' + task.id + '/start', actor, 'POST', {version: task.version});
            if (definition.state === 'COMPLETED' && task.status === 'IN_PROGRESS') task = await request('/tasks/' + task.id + '/done', actor, 'POST', {version: task.version});
            if (definition.state === 'COMPLETED' && task.status === 'DONE') await request('/tasks/' + task.id + '/verify', 'organizer', 'POST', {version: task.version});
        }
        if (!record.attendance) {const session = await request('/campaigns/' + record.id + '/attendance-sessions', 'organizer', 'POST', {title: 'Buổi chuẩn bị & tập huấn', startsAt: iso(-1), endsAt: new Date(Date.now() - 86400000 + 10800000).toISOString()});await request('/attendance-sessions/' + session.id + '/records', 'organizer', 'PUT', {version: session.version, records: ['technical', 'logistics'].map(a => ({userId: state.people[a].userId, status: 'PRESENT'}))});record.attendance = session.id;save();}
        if (definition.state === 'COMPLETED' && !record.completions) {for (const actor of ['technical', 'logistics']) {const completion = (await request('/campaigns/' + record.id + '/completions', 'organizer')).items.find(c => c.userId === state.people[actor].userId);if (completion.status !== 'VERIFIED') await request('/campaigns/' + record.id + '/volunteers/' + state.people[actor].userId + '/completion', 'organizer', 'PUT', {status: 'VERIFIED', verifiedHours: actor === 'technical' ? '12.50' : '8.00', note: 'Đã hoàn thành các phần việc được giao. Kết quả minh họa cho bản demo.', version: completion.version});}record.completions = true;save();}
    }
    if (definition.mode !== 'VOLUNTEER_ONLY' && paymentSettings.available && paymentSettings.provider === 'mock') {
        for (let position = 0; position < 3; position++) {
            if (!record.donations[position]) {const desired = BigInt([250000, 500000, 750000][position]);const min = BigInt(paymentSettings.minimumVnd), max = BigInt(paymentSettings.maximumVnd);const amount = desired < min ? min : desired > max ? max : desired;const donation = await request('/campaigns/' + record.id + '/donations', 'donor', 'POST', {amount: amount.toString()});record.donations[position] = donation;save();}
            const donation = record.donations[position];const detail = await request('/donations/' + donation.donationId, 'donor');if (detail.status !== 'PAID') await request('/dev/mock-payments/' + donation.paymentTransactionId + '/success', 'donor', 'POST');
        }
    }
    for (let position = 0; position < 2; position++) {
        if (!record.expenses[position]) {const expense = await request('/campaigns/' + record.id + '/expenses', 'organizer', 'POST', {title: position ? 'Vật tư cho hoạt động tiếp theo' : 'Bộ dụng cụ & tài liệu tập huấn', category: 'Vật tư hoạt động', amount: position ? '150000' : '300000', expenseDate: date(0), description: 'Chi phí minh họa để trình diễn luồng xét duyệt và công khai tài chính.', proofReference: 'DEMO-DUT-' + definition.key + '-' + position});record.expenses[position] = expense.id;save();}
        if (!position && !record.expenseApproved) {const expense = (await request('/campaigns/' + record.id + '/management/expenses', 'organizer')).items.find(e => e.id === record.expenses[0]);if (expense.status === 'PENDING') await request('/admin/expenses/' + expense.id + '/approve', 'admin', 'POST', {version: expense.version});record.expenseApproved = true;save();}
    }
    campaign = await request('/campaigns/' + record.id, 'organizer');
    if (definition.state !== 'OPEN' && campaign.status === 'OPEN') campaign = await request('/campaigns/' + record.id + '/start', 'organizer', 'POST', {version: campaign.version});
    if (definition.state === 'COMPLETED' && campaign.status === 'ACTIVE') {
        campaign = await request('/campaigns/' + record.id, 'organizer', 'PATCH', {content: {applicationDeadline: iso(-15), fundraisingDeadline: iso(-7)}, version: campaign.version});
        campaign = await request('/campaigns/' + record.id + '/complete', 'organizer', 'POST', {version: campaign.version});
    }
    record.ready = true;record.status = campaign.status;save();console.log('Đã tạo: ' + definition.title + ' [' + campaign.status + ']');
}
console.log('Hoàn tất: ' + people.length + ' tài khoản, ' + organizations.length + ' tổ chức, ' + campaigns.length + ' chiến dịch.');
console.log('Thông tin đăng nhập riêng của bản demo: .local/demo-accounts.json (không đưa lên Git).');
