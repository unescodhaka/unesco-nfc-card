/* UNESCO Dhaka NFC Card — admin panel (v2) */
import { CFG, G, VERSION, configured, esc, safeUrl, safePhoto, validId, initials, rid, $, LS, THEMES, themeOf, toast, modal, closeModal,
  confirmBox, copyText, download, ACT, prefs, toggleTheme, isDark, cardUrl, cardSvg, emblemData, siteBase, S, DEF_SETTINGS, I } from './common.js';

const SAMPLE = [
 {
  "id": "k7m2qa",
  "nameEn": "Dr. Ayesha Rahman",
  "nameBn": "ড. আয়েশা রহমান",
  "titleEn": "Head of Office",
  "titleBn": "অফিস প্রধান",
  "deptEn": "Management",
  "deptBn": "ব্যবস্থাপনা",
  "phone": "+880 1700-000001",
  "whatsapp": "",
  "email": "a.rahman@unesco.org",
  "ext": "101",
  "linkedin": "",
  "bioEn": "Leading UNESCO programmes in Bangladesh across education, culture, science and communication.",
  "bioBn": "বাংলাদেশে ইউনেস্কোর শিক্ষা, সংস্কৃতি, বিজ্ঞান ও যোগাযোগ কর্মসূচির নেতৃত্ব দিচ্ছেন।",
  "photo": "",
  "active": true,
  "order": 1,
  "theme": "blue"
 },
 {
  "id": "p4x9tc",
  "nameEn": "Md. Tanvir Hasan",
  "nameBn": "মোঃ তানভীর হাসান",
  "titleEn": "Programme Specialist",
  "titleBn": "প্রোগ্রাম স্পেশালিস্ট",
  "deptEn": "Education",
  "deptBn": "শিক্ষা",
  "phone": "+880 1700-000002",
  "whatsapp": "",
  "email": "t.hasan@unesco.org",
  "ext": "112",
  "linkedin": "",
  "bioEn": "",
  "bioBn": "",
  "photo": "",
  "active": true,
  "order": 2,
  "theme": "teal"
 },
 {
  "id": "r8n3wd",
  "nameEn": "Nusrat Jahan",
  "nameBn": "নুসরাত জাহান",
  "titleEn": "National Programme Officer",
  "titleBn": "ন্যাশনাল প্রোগ্রাম অফিসার",
  "deptEn": "Culture",
  "deptBn": "সংস্কৃতি",
  "phone": "+880 1700-000003",
  "whatsapp": "",
  "email": "n.jahan@unesco.org",
  "ext": "121",
  "linkedin": "",
  "bioEn": "",
  "bioBn": "",
  "photo": "",
  "active": true,
  "order": 3,
  "theme": "orange"
 },
 {
  "id": "h2v6ye",
  "nameEn": "Kamrul Islam",
  "nameBn": "কামরুল ইসলাম",
  "titleEn": "Communication & Information Officer",
  "titleBn": "যোগাযোগ ও তথ্য কর্মকর্তা",
  "deptEn": "Communication & Information",
  "deptBn": "যোগাযোগ ও তথ্য",
  "phone": "+880 1700-000004",
  "whatsapp": "",
  "email": "k.islam@unesco.org",
  "ext": "131",
  "linkedin": "",
  "bioEn": "",
  "bioBn": "",
  "photo": "",
  "active": true,
  "order": 4,
  "theme": "purple"
 },
 {
  "id": "b5z8uf",
  "nameEn": "Shirin Akter",
  "nameBn": "শিরিন আক্তার",
  "titleEn": "Administrative & Finance Officer",
  "titleBn": "প্রশাসনিক ও অর্থ কর্মকর্তা",
  "deptEn": "Administration",
  "deptBn": "প্রশাসন",
  "phone": "+880 1700-000005",
  "whatsapp": "",
  "email": "s.akter@unesco.org",
  "ext": "141",
  "linkedin": "",
  "bioEn": "",
  "bioBn": "",
  "photo": "",
  "active": true,
  "order": 5,
  "theme": "green"
 },
 {
  "id": "m3c7jg",
  "nameEn": "Rafiq Ahmed",
  "nameBn": "রফিক আহমেদ",
  "titleEn": "Programme Assistant",
  "titleBn": "প্রোগ্রাম সহকারী",
  "deptEn": "Natural Sciences",
  "deptBn": "প্রাকৃতিক বিজ্ঞান",
  "phone": "+880 1700-000006",
  "whatsapp": "",
  "email": "r.ahmed@unesco.org",
  "ext": "151",
  "linkedin": "",
  "bioEn": "",
  "bioBn": "",
  "photo": "",
  "active": false,
  "order": 6,
  "theme": "blue"
 }
];
const IDLE_MIN = 30;
let A, FS, AU, auth, db;
let ME, ACCESS = null, STAFF = [], PRIV = {}, SETTINGS = null, SCANS = {}, MONTHS = {}, AUDIT = null, INVITES = {}, SUBS = {};
let tab = 'staff', q = '', unsub = [], idleT = null;

/* ---------- boot ---------- */
async function boot() {
  if (!configured()) { $('#app').innerHTML = `<main class="login"><img src="assets/img/logo.webp" alt="UNESCO"><h1 class="h2">Firebase এখনো যুক্ত হয়নি</h1><p>config.js ফাইলে Firebase-এর তথ্য বসান।</p></main>`; return; }
  render();
  const mods = [import(G + 'firebase-app.js'), import(G + 'firebase-firestore.js'), import(G + 'firebase-auth.js')];
  if (CFG.recaptchaSiteKey) mods.push(import(G + 'firebase-app-check.js'));
  const [appM, fsM, auM, acM] = await Promise.all(mods);
  A = appM.initializeApp(CFG.firebase);
  if (acM) acM.initializeAppCheck(A, { provider: new acM.ReCaptchaV3Provider(CFG.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
  FS = fsM; AU = auM; db = FS.getFirestore(A); auth = AU.getAuth(A);
  try { await AU.setPersistence(auth, AU.browserSessionPersistence); } catch (e) {}
  AU.onAuthStateChanged(auth, u => { ME = u || null; if (ME) { startData(); armIdle(); } else { stopData(); disarmIdle(); } render(); });
}

/* ---------- idle auto-logout ---------- */
const bump = () => { if (!ME) return; clearTimeout(idleT); idleT = setTimeout(() => { AU.signOut(auth); toast(`${IDLE_MIN} মিনিট কোনো কাজ না হওয়ায় লগআউট করা হয়েছে`); }, IDLE_MIN * 60000); };
function armIdle() { ['click', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach(ev => addEventListener(ev, bump, { passive: true })); bump(); }
function disarmIdle() { clearTimeout(idleT); ['click', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach(ev => removeEventListener(ev, bump)); }

/* ---------- live data ---------- */
function startData() {
  if (unsub.length) return; ACCESS = null;
  const C = n => FS.collection(db, n);
  unsub.push(FS.onSnapshot(C('staff'), sn => { STAFF = sn.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.nameEn).localeCompare(b.nameEn)); ACCESS = true; soft(); }, () => { ACCESS = false; render(); }));
  unsub.push(FS.onSnapshot(C('staffPrivate'), sn => { PRIV = {}; sn.docs.forEach(d => PRIV[d.id] = d.data()); soft(); }, () => {}));
  unsub.push(FS.onSnapshot(FS.doc(db, 'settings/office'), d => { SETTINGS = d.exists() ? d.data() : {}; if (tab !== 'settings') soft(); }, () => {}));
  unsub.push(FS.onSnapshot(C('scans'), sn => { SCANS = {}; sn.docs.forEach(d => SCANS[d.id] = d.data()); if (tab === 'staff' || tab === 'report') soft(); }, () => {}));
  unsub.push(FS.onSnapshot(C('invites'), sn => { INVITES = {}; sn.docs.forEach(d => INVITES[d.id] = d.data()); soft(); }, () => {}));
  unsub.push(FS.onSnapshot(C('submissions'), sn => { SUBS = {}; sn.docs.forEach(d => SUBS[d.id] = d.data()); soft(); }, () => {}));
  unsub.push(FS.onSnapshot(C('scanMonths'), sn => { MONTHS = {}; sn.docs.forEach(d => MONTHS[d.id] = d.data().n || 0); if (tab === 'report') soft(); }, () => {}));
}
function stopData() { unsub.forEach(u => u()); unsub = []; ACCESS = null; STAFF = []; PRIV = {}; SCANS = {}; MONTHS = {}; AUDIT = null; INVITES = {}; SUBS = {}; }
let softT = null; function soft() { clearTimeout(softT); softT = setTimeout(() => { if (!$('#mb')) render(); }, 60); }

/* ---------- writes: every change is logged in the audit trail, atomically ---------- */
async function commit(action, target, detail, build) {
  const b = FS.writeBatch(db);
  build(b);
  b.set(FS.doc(FS.collection(db, 'audit')), { at: FS.serverTimestamp(), by: ME.email, action, target: String(target).slice(0, 120), detail: String(detail || '').slice(0, 500) });
  await b.commit(); AUDIT = null;
}
function dirSet() { /* টিম ডিরেক্টরি স্থায়ীভাবে বন্ধ (প্রাইভেসি) — কিছু লেখা হয় না */ }
function fbErr(e) {
  const c = String((e && e.code) || ''); console.error(e);
  toast(c.includes('permission') ? 'অনুমতি নেই বা তথ্য নিয়ম মানেনি (যেমন লিংক https:// দিয়ে শুরু হয়নি)' : c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login') ? 'ইমেইল বা পাসওয়ার্ড ভুল' : c.includes('too-many') ? 'অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন' : c.includes('unavailable') || c.includes('network') ? 'ইন্টারনেট সংযোগ পরীক্ষা করুন' : 'সমস্যা হয়েছে: ' + ((e && e.message) || c));
}

/* ---------- shell ---------- */
const TABS = [['staff', '👥 স্টাফ'], ['review', '📝 পর্যালোচনা'], ['report', '📊 রিপোর্ট'], ['history', '🕘 ইতিহাস'], ['settings', '⚙️ সেটিংস'], ['backup', '💾 ব্যাকআপ'], ['guide', '📖 গাইড']];
function render() {
  const app = $('#app');
  if (ME === undefined || (ME && ACCESS === null)) { app.innerHTML = `<main class="login" aria-busy="true"><img src="assets/img/logo.webp" alt="UNESCO"><p>লোড হচ্ছে…</p></main>`; return; }
  if (!ME) {
    app.innerHTML = `<main class="login"><img src="assets/img/logo.webp" alt="UNESCO" width="150" height="90"><h1 class="h2">অ্যাডমিন লগইন</h1><p>NFC বিজনেস কার্ড ম্যানেজমেন্ট</p>
      <label class="sr" for="em">ইমেইল</label><input id="em" type="email" placeholder="ইমেইল" autocomplete="username">
      <label class="sr" for="pw">পাসওয়ার্ড</label><input id="pw" type="password" placeholder="পাসওয়ার্ড" autocomplete="current-password" data-enter="login" style="margin-top:10px">
      <button class="btn" id="lb" data-act="login">লগইন</button>
      <p class="small">🔒 ব্রাউজার বন্ধ করলে বা ${IDLE_MIN} মিনিট কাজ না করলে নিজে থেকে লগআউট হবে।</p>
      <p><button class="lnk" data-act="resetpw">পাসওয়ার্ড ভুলে গেছেন?</button> · <a href="./" class="lnk muted">হোম পেজ</a></p></main>`;
    return;
  }
  if (ACCESS === false) {
    app.innerHTML = `<main class="login"><img src="assets/img/logo.webp" alt="UNESCO"><h1 class="h2">অনুমতি নেই</h1><p><b>${esc(ME.email)}</b> অ্যাকাউন্টটি অ্যাডমিন তালিকায় নেই। Firebase Console → Firestore → Rules-এ অ্যাডমিন তালিকায় নিচের UID যোগ করে Publish করুন।</p><div class="inrow"><input value="${esc(ME.uid)}" readonly><button class="btn sec" data-act="copy" data-arg="${esc(ME.uid)}">কপি</button></div><button class="btn out" data-act="logout">লগআউট</button></main>`;
    return;
  }
  const empty = !STAFF.length && !(SETTINGS && SETTINGS.officeNameEn);
  app.innerHTML = `<div class="ad">
    <header class="top"><img src="assets/img/emblem.png" alt="" width="40" height="31"><div class="ttl"><b>NFC কার্ড অ্যাডমিন</b><small>${esc(ME.email)}</small></div><div class="sp"></div>
      <button data-act="theme" aria-label="থিম বদলান">${isDark() ? I.sun : I.moon}</button><a href="./" class="tbtn">হোম</a><button data-act="logout">লগআউট</button></header>
    <nav class="tabs" role="tablist">${TABS.map(([k, v]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${v}${k === 'review' && pendingSubs().length ? ` <span class="badge">${pendingSubs().length}</span>` : ''}</button>`).join('')}</nav>
    ${empty ? `<div class="wrap" style="padding-bottom:0"><div class="panel accent"><h3>👋 স্বাগতম! ডাটাবেজ এখনো খালি</h3><p class="m">নমুনা তথ্য দিয়ে শুরু করুন, অথবা "নতুন স্টাফ" দিয়ে নিজে যোগ করুন।</p><button class="btn" id="sdb" data-act="seed">নমুনা তথ্য দিয়ে শুরু করুন</button></div></div>` : ''}
    <main class="wrap" id="aw"></main><footer class="ver">সংস্করণ ${VERSION}</footer></div>`;
  ({ staff: aStaff, review: aReview, report: aReport, history: aHistory, settings: aSettings, backup: aBackup, guide: aGuide })[tab]();
}

/* ---------- staff list ---------- */
/* ---------- privacy helpers: hidden fields, consent, retention ---------- */
const HIDABLE = [['phone', 'মোবাইল'], ['whatsapp', 'হোয়াটসঅ্যাপ'], ['email', 'ইমেইল'], ['linkedin', 'LinkedIn'], ['photo', 'ছবি']];
const NEW_HIDDEN = ['phone', 'whatsapp'];   // নতুন স্টাফের ক্ষেত্রে ডিফল্টভাবে লুকানো (privacy by default)
const RETAIN_DAYS = 30;
const privOf = id => PRIV[id] || {};
const hiddenOf = id => { const p = privOf(id), h = Object.assign({}, p.hidden || {}); if (p.phone && !h.phone) h.phone = p.phone; return h; };
const merged = s => { const h = hiddenOf(s.id), o = Object.assign({}, s); for (const k in h) if (!o[k]) o[k] = h[k]; return o; };
const hasConsent = id => !!privOf(id).consentDate;
const daysOff = id => { const t = privOf(id).inactiveSince; return t ? Math.floor((Date.now() - t) / 86400000) : null; };
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const phoneOf = s => s.phone || (hiddenOf(s.id).phone ? hiddenOf(s.id).phone + ' 🔒' : '');
const emailOf = s => s.email || (hiddenOf(s.id).email ? hiddenOf(s.id).email + ' 🔒' : '');

/* ---------- staff list ---------- */
/* ---------- staff stages: যোগ → আমন্ত্রণ → জমা (অপেক্ষমান) → সক্রিয় ---------- */
let FILTER = 'all';
function stageOf(s) {
  if (subOf(s.id)) return 'pending';
  if (s.active) return 'active';
  const li = latestInvite(s.id);
  if (li && li[1].status !== 'approved') { if (li[1].expires < Date.now()) return 'expired'; return li[1].status === 'returned' ? 'returned' : 'invited'; }
  return hasConsent(s.id) ? 'inactive' : 'new';
}
const STAGES = {
  new: ['আমন্ত্রণ বাকি', 'off'], invited: ['আমন্ত্রণ পাঠানো', 'info'], expired: ['মেয়াদ শেষ', 'off'], returned: ['ফেরত পাঠানো', 'off'],
  pending: ['অনুমোদনের অপেক্ষায়', 'warn'], active: ['সক্রিয়', 'on'], inactive: ['নিষ্ক্রিয়', 'off']
};
const FILTERS = [['all', 'সব'], ['todo', 'আমন্ত্রণ বাকি'], ['invited', 'আমন্ত্রণ পাঠানো'], ['pending', 'অনুমোদনের অপেক্ষায়'], ['active', 'সক্রিয়'], ['inactive', 'নিষ্ক্রিয়']];
const inFilter = (st, f) => f === 'all' || (f === 'todo' ? ['new', 'expired', 'returned'].includes(st) : st === f);
function stageCell(s) {
  const st = stageOf(s), [label, cls] = STAGES[st], d = daysOff(s.id);
  const btn = st === 'pending' ? `<button class="btn sm" data-act="reviewone" data-arg="${esc(s.id)}">${I.eye} দেখুন ও অনুমোদন</button>`
    : ['new', 'expired', 'returned'].includes(st) ? `<button class="btn sm sec" data-act="invite" data-arg="${esc(s.id)}">${I.mail} আমন্ত্রণ পাঠান</button>`
    : st === 'invited' ? `<button class="btn sm out" data-act="invite" data-arg="${esc(s.id)}">${I.mail} আবার পাঠান</button>` : '';
  return `<span class="pill ${cls}">${label}${st === 'inactive' && d !== null ? ` · ${d} দিন` : ''}</span>${btn ? `<div style="margin-top:6px">${btn}</div>` : ''}`;
}

function aStaff() {
  const all = STAFF, tot = Object.values(SCANS).reduce((a, b) => a + (b.n || 0), 0);
  const counts = {}; FILTERS.forEach(([k]) => counts[k] = all.filter(s => inFilter(stageOf(s), k)).length);
  const list = all.filter(s => inFilter(stageOf(s), FILTER) && (!q || [s.nameEn, s.nameBn, s.titleEn, s.deptEn, emailOf(s), phoneOf(s)].join(' ').toLowerCase().includes(q.toLowerCase())));
  const overdue = all.filter(s => !s.active && hasConsent(s.id) && daysOff(s.id) !== null && daysOff(s.id) >= RETAIN_DAYS);
  const undated = all.filter(s => !s.active && hasConsent(s.id) && daysOff(s.id) === null && stageOf(s) === 'inactive');
  const noConsent = all.filter(s => s.active && !hasConsent(s.id));
  const last = s => { const x = SCANS[s.id] && SCANS[s.id].last; return x && x.toDate ? x.toDate().toLocaleDateString('bn-BD') : ''; };
  const warn = [];
  if (counts.pending) warn.push(`<div class="panel warnp okp"><h3>📝 ${counts.pending} জন স্টাফ তথ্য ও সম্মতি জমা দিয়েছেন — অনুমোদনের অপেক্ষায়</h3><div class="mrow" style="margin-top:8px"><button class="btn sm" data-act="filter" data-arg="pending">তালিকা দেখুন</button></div></div>`);
  if (overdue.length) warn.push(`<div class="panel warnp"><h3>🗑️ ${overdue.length} জন স্টাফের কার্ড ${RETAIN_DAYS} দিনের বেশি নিষ্ক্রিয়</h3><p class="m">প্রাইভেসি নীতি অনুযায়ী এখন তাঁদের তথ্য মুছে ফেলা উচিত।</p>${overdue.map(s => `<div class="wrow"><span><b>${esc(s.nameEn)}</b> · ${daysOff(s.id)} দিন</span><button class="btn red sm" data-act="del" data-arg="${esc(s.id)}">মুছে ফেলুন</button></div>`).join('')}</div>`);
  if (undated.length) warn.push(`<div class="panel warnp"><h3>📅 ${undated.length} জন নিষ্ক্রিয় স্টাফের নিষ্ক্রিয় হওয়ার তারিখ নেই</h3><p class="m">${undated.map(s => esc(s.nameEn)).join(', ')} — আজ থেকে ${RETAIN_DAYS} দিনের গণনা শুরু করতে বোতাম চাপুন।</p><button class="btn sec" data-act="markoff">আজ থেকে গণনা শুরু করুন</button></div>`);
  if (noConsent.length) warn.push(`<div class="panel warnp"><h3>✍️ ${noConsent.length} জন সক্রিয় স্টাফের সম্মতির রেকর্ড নেই</h3><p class="m">${noConsent.map(s => esc(s.nameEn)).join(', ')} — তাঁদের সম্মতির আমন্ত্রণ পাঠান, অথবা ✏️ এডিট করে সম্মতির তারিখ বসান।</p></div>`);
  $('#aw').innerHTML = `${warn.join('')}
  <div class="stats">
    <div class="st"><small>মোট স্টাফ</small><b>${all.length}</b></div><div class="st"><small>সক্রিয় কার্ড</small><b class="ok">${counts.active}</b></div>
    <div class="st"><small>অনুমোদনের অপেক্ষায়</small><b class="bl">${counts.pending}</b></div><div class="st"><small>মোট স্ক্যান</small><b>${tot}</b></div></div>
  <div class="bar"><label class="sr" for="qbox">খুঁজুন</label><input id="qbox" type="search" placeholder="🔍 নাম, পদবি, ইমেইল দিয়ে খুঁজুন..." value="${esc(q)}" data-input="search">
    <div class="sp"></div>
    <button class="btn" data-act="quickadd">${I.plus} স্টাফ যোগ করুন</button>
    <button class="btn sec" data-act="invite">✉️ আমন্ত্রণ পাঠান</button>
    <details class="more"><summary class="btn out">⋯ আরও</summary><div class="menu">
      <button class="btn out" data-act="edit">📝 পুরো ফর্মে নতুন স্টাফ</button>
      <button class="btn out" data-act="printall">🖨️ সব কার্ড (PDF)</button>
      <button class="btn out" data-act="csvout">${I.download} CSV এক্সপোর্ট</button>
      <label class="btn out file">📥 CSV ইমপোর্ট<input type="file" accept=".csv" class="hidden" data-change="csvin"></label></div></details></div>
  <div class="chips" role="tablist">${FILTERS.map(([k, v]) => `<button class="chip ${FILTER === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${v} <b>${counts[k]}</b></button>`).join('')}</div>
  <div class="tbl"><table class="rt"><thead><tr><th>স্টাফ</th><th>ইমেইল / যোগাযোগ</th><th>অবস্থা</th><th>সম্মতি</th><th>স্ক্যান</th><th>অ্যাকশন</th></tr></thead><tbody>
  ${list.map(s => { const ph = safePhoto(s.photo) || safePhoto(hiddenOf(s.id).photo), p = privOf(s.id); return `<tr>
    <td data-l="স্টাফ"><div class="pp"><div class="a" style="--c1:${themeOf(s)[0]}">${ph ? `<img src="${ph}" alt="">` : esc(initials(s.nameEn))}</div><div><b>${esc(s.nameEn)}</b><small>${esc(s.titleEn)}${s.deptEn ? ' · ' + esc(s.deptEn) : ''}</small></div></div></td>
    <td data-l="যোগাযোগ" class="sm">${esc(emailOf(s))}${phoneOf(s) ? `<br><span class="muted">${esc(phoneOf(s))}</span>` : ''}</td>
    <td data-l="অবস্থা">${stageCell(s)}</td>
    <td data-l="সম্মতি" class="sm">${p.consentDate ? `<span class="pill on" title="${esc(p.consentNote || '')}">✓ ${esc(p.consentDate)}</span>` : '<span class="muted">—</span>'}</td>
    <td data-l="স্ক্যান"><b>${(SCANS[s.id] && SCANS[s.id].n) || 0}</b>${last(s) ? `<br><span class="sm muted">${last(s)}</span>` : ''}</td>
    <td data-l="অ্যাকশন"><div class="ia">
      ${s.active ? `<a class="iab" href="./#/c/${esc(s.id)}" target="_blank" rel="noopener" aria-label="প্রোফাইল দেখুন" title="প্রোফাইল দেখুন">${I.eye}</a>` : ''}
      <button aria-label="এডিট" title="এডিট" data-act="edit" data-arg="${esc(s.id)}">${I.edit}</button>
      ${s.active ? `<button aria-label="লিংক কপি" title="কার্ডের লিংক কপি" data-act="copylink" data-arg="${esc(s.id)}">${I.link}</button>
      <button aria-label="কার্ড ও NFC" title="কার্ড ডিজাইন ও NFC" data-act="card" data-arg="${esc(s.id)}">${I.card}</button>` : ''}
      ${(s.active || hasConsent(s.id)) ? `<button aria-label="${s.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}" title="${s.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}" data-act="toggle" data-arg="${esc(s.id)}" class="${s.active ? 'ok' : 'bad'}">${I.power}</button>` : ''}
      <button aria-label="মুছুন" title="মুছুন" data-act="del" data-arg="${esc(s.id)}">${I.trash}</button></div></td></tr>`; }).join('') || `<tr><td colspan="6" class="empty">${all.length ? 'এই তালিকায় কেউ নেই' : 'এখনো কোনো স্টাফ নেই — "স্টাফ যোগ করুন" চাপুন'}</td></tr>`}
  </tbody></table></div>
  <p class="hint">💡 ধাপ: <b>স্টাফ যোগ করুন</b> (নাম, পদবি, ইমেইল) → <b>আমন্ত্রণ পাঠান</b> → স্টাফ নিজে তথ্য পূরণ করে ই-স্বাক্ষরসহ জমা দেন → এখানে <b>📝 অনুমোদনের অপেক্ষায়</b> দেখাবে → অনুমোদন করলে কার্ড সক্রিয়।</p>`;
}

/* ---------- quick add: শুধু নাম, পদবি, ইমেইল ---------- */
let QA_MODE = 'one';
function quickAdd(mode) {
  QA_MODE = mode || QA_MODE;
  modal(`<h3>স্টাফ যোগ করুন</h3><p class="sub">শুধু নাম, পদবি ও ইমেইল দিন। বাকি তথ্য, ছবি ও সম্মতি স্টাফ নিজে আমন্ত্রণ লিংক থেকে দেবেন।</p>
    <div class="chips" style="margin:0 0 12px"><button class="chip ${QA_MODE === 'one' ? 'on' : ''}" data-act="qamode" data-arg="one">একজন</button><button class="chip ${QA_MODE === 'many' ? 'on' : ''}" data-act="qamode" data-arg="many">একসাথে অনেকজন (Excel থেকে)</button></div>
    ${QA_MODE === 'one' ? `<div class="grid2"><div><label for="qa_n">নাম (English) *</label><input id="qa_n" maxlength="120" autocomplete="off"></div><div><label for="qa_t">পদবি (English) *</label><input id="qa_t" maxlength="150" autocomplete="off"></div>
      <div class="full"><label for="qa_e">অফিস ইমেইল *</label><input id="qa_e" type="email" maxlength="120" autocomplete="off"></div></div>`
    : `<label for="qa_list">Excel-এ তিনটি কলাম (নাম, পদবি, ইমেইল) সিলেক্ট করে কপি করুন, তারপর এখানে পেস্ট করুন</label>
      <textarea id="qa_list" rows="8" placeholder="Ayesha Rahman&#9;Programme Officer&#9;a.rahman@unesco.org&#10;Tanvir Hasan&#9;Finance Assistant&#9;t.hasan@unesco.org" data-input="qaprev"></textarea><p class="hint" id="qa_prev">প্রতি লাইনে একজন। কমা দিয়েও লেখা যাবে: নাম, পদবি, ইমেইল</p>`}
    <label class="sw"><input type="checkbox" id="qa_inv" checked> যোগ করার পরই আমন্ত্রণ পাঠান</label>
    <div class="mrow"><button class="btn out" data-act="close">বাতিল</button><button class="btn" id="qab" data-act="qasave">যোগ করুন</button></div>`, 'স্টাফ যোগ');
  const f = $(QA_MODE === 'one' ? '#qa_n' : '#qa_list'); if (f) f.focus();
}
const okMail = e => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e);
const existingEmails = () => new Set(STAFF.map(s => String(merged(s).email || '').toLowerCase()).filter(Boolean));
function parseList(txt) {
  const have = existingEmails(), seen = new Set(), ok = [], bad = [], dup = [];
  txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const c = (l.includes('\t') ? l.split('\t') : l.split(',')).map(x => x.trim());
    const [n, t, e] = [c[0] || '', c[1] || '', (c[2] || '').toLowerCase()];
    if (/^(name|নাম)$/i.test(n)) return;
    if (!n || !t || !okMail(e)) return bad.push(l);
    if (have.has(e) || seen.has(e)) return dup.push(e);
    seen.add(e); ok.push([n.slice(0, 120), t.slice(0, 150), e.slice(0, 120)]);
  });
  return { ok, bad, dup };
}
async function qaSave() {
  let rows;
  if (QA_MODE === 'one') {
    const n = $('#qa_n').value.trim(), t = $('#qa_t').value.trim(), e = $('#qa_e').value.trim().toLowerCase();
    if (!n || !t || !e) return toast('নাম, পদবি ও ইমেইল তিনটিই দিন');
    if (!okMail(e)) return toast('ইমেইল সঠিক নয়');
    if (existingEmails().has(e)) return toast('এই ইমেইলে আগেই একজন স্টাফ আছেন');
    rows = [[n, t, e]];
  } else {
    const r = parseList($('#qa_list').value); if (!r.ok.length) return toast('কোনো বৈধ সারি পাওয়া যায়নি');
    if (r.bad.length || r.dup.length) toast(`${r.bad.length ? r.bad.length + 'টি সারি অসম্পূর্ণ' : ''}${r.bad.length && r.dup.length ? ', ' : ''}${r.dup.length ? r.dup.length + 'টি ইমেইল আগে থেকেই আছে' : ''} — সেগুলো বাদ দেওয়া হলো`);
    rows = r.ok;
  }
  const inv = $('#qa_inv').checked, b = $('#qab'); b.disabled = true; b.textContent = 'যোগ হচ্ছে…';
  const made = rows.map(([n, t, e], i) => ({ id: rid(), pub: { nameEn: n, titleEn: t, email: e, active: false, order: STAFF.length + i + 1, theme: 'blue', photo: '', updated: FS.serverTimestamp() } }));
  try {
    for (let i = 0; i < made.length; i += 150) {
      const ch = made.slice(i, i + 150);
      await commit('স্টাফ যোগ', ch.length === 1 ? ch[0].pub.nameEn : ch.length + ' জন', ch.map(m => m.id).join(',').slice(0, 480), bt => ch.forEach(m => {
        bt.set(FS.doc(db, 'staffPrivate/' + m.id), { hidden: {}, consentDate: '', inactiveSince: null });
        bt.set(FS.doc(db, 'staff/' + m.id), m.pub);
      }));
    }
    made.forEach(m => { if (!STAFF.find(x => x.id === m.id)) STAFF.push(Object.assign({ id: m.id }, m.pub)); });
    toast(`${made.length} জন যোগ হয়েছে ✓`);
    if (inv) { LAST_MADE = await createInvites(made.map(m => m.id)); showSend(); } else closeModal();
  } catch (e) { fbErr(e); b.disabled = false; b.textContent = 'যোগ করুন'; }
}
function qaPreview() { const el = $('#qa_list'), p = $('#qa_prev'); if (!el || !p) return; const r = parseList(el.value); p.textContent = `✓ ${r.ok.length} জন যোগ হবে${r.bad.length ? ` · ✗ ${r.bad.length}টি সারি অসম্পূর্ণ` : ''}${r.dup.length ? ` · ${r.dup.length}টি ইমেইল আগে থেকেই আছে` : ''}`; }

/* ---------- review a single staff from the list ---------- */
function reviewOne(id) { const s = subOf(id); if (!s) return toast('জমা পাওয়া যায়নি'); modal(reviewCard(s[0], s[1]), 'পর্যালোচনা'); }

/* ---------- edit form ---------- */
const FIELDS = [
  ['nameEn', 'নাম (English) *', 120], ['nameBn', 'নাম (বাংলা)', 120], ['titleEn', 'পদবি (English) *', 150], ['titleBn', 'পদবি (বাংলা)', 150],
  ['deptEn', 'বিভাগ (English)', 120], ['deptBn', 'বিভাগ (বাংলা)', 120], ['phone', 'মোবাইল নম্বর', 30], ['whatsapp', 'হোয়াটসঅ্যাপ নম্বর', 30],
  ['email', 'ইমেইল', 120], ['ext', 'অফিস এক্সটেনশন', 10], ['linkedin', 'LinkedIn লিংক (https://…)', 400], ['officePhone', 'আলাদা অফিস ফোন', 30]
];
const isHid = k => HIDABLE.some(h => h[0] === k);
let ED = null;
function editStaff(id, subTk) {
  const s = id ? STAFF.find(x => x.id === id) : { id: rid(), active: false, order: STAFF.length + 1, theme: 'blue' };
  const sb = subTk ? SUBS[subTk] : null;
  const h = id ? hiddenOf(id) : {}, p = sb ? { consentDate: subDate(sb), consentNote: 'অনলাইন সম্মতি · ই-স্বাক্ষর' + (sb.verifiedEmail ? ' · ইমেইল যাচাইকৃত' : '') } : id ? privOf(id) : {};
  const vis = k => sb ? !!sb.visibility[k] : id ? !h[k] : !NEW_HIDDEN.includes(k);
  ED = merged(s); if (!id) ED.id = s.id;
  if (sb) { Object.assign(ED, sb.data, { photo: safePhoto(sb.photo), active: true, _sub: subTk }); }
  const ph = safePhoto(ED.photo);
  const visBox = k => `<span class="vis"><input type="checkbox" id="v_${k}" ${vis(k) ? 'checked' : ''}> <span>প্রোফাইলে দেখান</span></span>`;
  modal(`<h3>${id ? 'স্টাফের তথ্য এডিট' : 'নতুন স্টাফ যোগ করুন'}</h3><p class="sub">কার্ড আইডি <code>${esc(s.id)}</code> কখনো বদলাবে না। "প্রোফাইলে দেখান" টিক তুলে দিলে সেই তথ্য শুধু অ্যাডমিনের কাছে থাকবে।</p>
    <div class="phw"><div class="a" id="phv">${ph ? `<img src="${ph}" alt="">` : esc(initials(ED.nameEn))}</div>
      <div><label class="btn sec file">📷 ছবি আপলোড<input type="file" accept="image/*" class="hidden" data-change="photo"></label>
      ${ph ? `<button class="btn red" data-act="rmphoto">সরান</button>` : ''}<div style="margin-top:8px">${visBox('photo')}</div></div></div>
    <div class="grid2">${FIELDS.map(([k, l, n]) => `<div><label for="f_${k}" class="lrow"><span>${l}</span>${isHid(k) ? visBox(k) : ''}</label><input id="f_${k}" maxlength="${n}" value="${esc(ED[k])}" ${k === 'email' ? 'type="email"' : k === 'linkedin' ? 'type="url"' : ''}></div>`).join('')}</div>
    <label>কার্ডের রং</label><div class="themes" role="radiogroup">${Object.entries(THEMES).map(([k, v]) => `<label class="th"><input type="radio" name="th" value="${k}" ${(ED.theme || 'blue') === k ? 'checked' : ''}><span style="background:linear-gradient(135deg,${v[0]},${v[1]})"></span>${v[2]}</label>`).join('')}</div>
    <label for="f_bioEn">সংক্ষিপ্ত পরিচিতি (English)</label><textarea id="f_bioEn" rows="2" maxlength="600">${esc(ED.bioEn)}</textarea>
    <label for="f_bioBn">সংক্ষিপ্ত পরিচিতি (বাংলা)</label><textarea id="f_bioBn" rows="2" maxlength="600">${esc(ED.bioBn)}</textarea>
    <fieldset class="consent"><legend>✍️ সম্মতি (কার্ড সক্রিয় করতে আবশ্যক)</legend>
      <label class="sw"><input type="checkbox" id="f_consent" ${p.consentDate ? 'checked' : ''} data-change="consentchk"> এই স্টাফ লিখিতভাবে সম্মতি দিয়েছেন যে "প্রোফাইলে দেখান" চিহ্নিত তথ্যগুলো পাবলিক থাকবে</label>
      <div class="grid2"><div><label for="f_cdate">সম্মতির তারিখ</label><input type="date" id="f_cdate" value="${esc(p.consentDate || '')}" max="${todayStr()}"></div>
      <div><label for="f_cnote">নোট (যেমন সম্মতি ফর্মের ফাইল নম্বর)</label><input id="f_cnote" maxlength="120" value="${esc(p.consentNote || '')}"></div></div>
      ${p.consentBy ? `<p class="hint">রেকর্ড করেছেন: ${esc(p.consentBy)}</p>` : ''}</fieldset>
    <label class="sw"><input type="checkbox" id="f_active" ${ED.active ? 'checked' : ''}> কার্ড সক্রিয়</label>
    <div class="mrow"><button class="btn out" data-act="close">বাতিল</button><button class="btn" id="svb" data-act="save" data-arg="${id ? 'edit' : 'new'}">সেভ করুন</button></div>`, 'স্টাফ');
}
function pickPhoto(inp) {
  const f = inp.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return toast('শুধু ছবি ফাইল দিন');
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'), Z = 240; c.width = c.height = Z; const x = c.getContext('2d');
    const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, Z, Z);
    ED.photo = c.toDataURL('image/jpeg', .78); $('#phv').innerHTML = `<img src="${ED.photo}" alt="">`;
  }; img.src = r.result; }; r.readAsDataURL(f);
}
async function saveStaff(mode) {
  const e = ED, id = e.id; FIELDS.forEach(([k]) => e[k] = $('#f_' + k).value.trim());
  e.bioEn = $('#f_bioEn').value.trim(); e.bioBn = $('#f_bioBn').value.trim(); e.active = $('#f_active').checked;
  e.theme = (document.querySelector('input[name=th]:checked') || {}).value || 'blue';
  const consent = $('#f_consent').checked, cdate = $('#f_cdate').value, cnote = $('#f_cnote').value.trim().slice(0, 120);
  if (!e.nameEn || !e.titleEn) return toast('নাম ও পদবি (English) আবশ্যক');
  if (e.linkedin && !safeUrl(e.linkedin)) return toast('LinkedIn লিংক https:// দিয়ে শুরু হতে হবে');
  if (e.email && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e.email)) return toast('ইমেইল সঠিক নয়');
  if (consent && !/^\d{4}-\d{2}-\d{2}$/.test(cdate)) return toast('সম্মতির তারিখ দিন');
  if (e.active && !consent) return toast('সম্মতির রেকর্ড ছাড়া কার্ড সক্রিয় করা যাবে না');
  if (!validId(id)) return toast('কার্ড আইডি সঠিক নয়');
  const pub = {}, hidden = {};
  ['nameEn', 'nameBn', 'titleEn', 'titleBn', 'deptEn', 'deptBn', 'phone', 'whatsapp', 'email', 'ext', 'linkedin', 'officePhone', 'bioEn', 'bioBn', 'active', 'order', 'theme'].forEach(k => { if (e[k] !== undefined) pub[k] = e[k]; });
  pub.photo = safePhoto(e.photo);
  HIDABLE.forEach(([k]) => { if (!$('#v_' + k).checked && pub[k]) { hidden[k] = pub[k]; pub[k] = ''; } });
  pub.order = Number(pub.order) || STAFF.length + 1; pub.updated = FS.serverTimestamp();
  const prev = privOf(id), sb = e._sub ? SUBS[e._sub] : null;
  const priv = { hidden, consentDate: consent ? cdate : '', consentNote: consent ? cnote : '', consentBy: consent ? (sb ? (sb.verifiedEmail || (INVITES[e._sub] || {}).email || '') : ((prev.consentDate === cdate && prev.consentBy) || ME.email)) : '', inactiveSince: e.active ? null : (prev.inactiveSince || ((STAFF.find(x => x.id === id) || {}).active ? Date.now() : null)) };
  if (sb && consent) { priv.consentMethod = 'online'; priv.consentSub = e._sub; } else if (prev.consentMethod && consent && prev.consentDate === cdate) { priv.consentMethod = prev.consentMethod; if (prev.consentSub) priv.consentSub = prev.consentSub; }
  const b = $('#svb'); b.disabled = true; b.textContent = 'সেভ হচ্ছে…';
  const hidList = Object.keys(hidden).map(k => HIDABLE.find(h => h[0] === k)[1]).join('/');
  try {
    await commit(mode === 'new' ? 'যোগ' : 'এডিট', e.nameEn, `${id}${hidList ? ' · লুকানো: ' + hidList : ''}${consent ? ' · সম্মতি ' + cdate : ' · সম্মতি নেই'}${e.active ? '' : ' · নিষ্ক্রিয়'}`, bt => {
      bt.set(FS.doc(db, 'staffPrivate/' + id), priv);
      bt.set(FS.doc(db, 'staff/' + id), pub);
      if (sb) bt.update(FS.doc(db, 'invites/' + e._sub), { status: 'approved', approvedAt: Date.now() });
    });
    closeModal(); toast('সেভ হয়েছে ✓');
  } catch (err) { fbErr(err); b.disabled = false; b.textContent = 'সেভ করুন'; }
}
async function toggleActive(id) {
  const s = STAFF.find(x => x.id === id);
  if (!s.active && !hasConsent(id)) { toast('আগে সম্মতির তারিখ বসান'); return editStaff(id); }
  try {
    await commit(s.active ? 'নিষ্ক্রিয়' : 'সক্রিয়', s.nameEn, id, b => {
      b.set(FS.doc(db, 'staffPrivate/' + id), { inactiveSince: s.active ? Date.now() : null }, { merge: true });
      b.update(FS.doc(db, 'staff/' + id), { active: !s.active });
    });
    toast(!s.active ? 'কার্ড সক্রিয় করা হয়েছে' : `কার্ড নিষ্ক্রিয় করা হয়েছে — ${RETAIN_DAYS} দিন পর তথ্য মুছে ফেলার রিমাইন্ডার আসবে`);
  } catch (e) { fbErr(e); }
}
async function markOff() {
  const list = STAFF.filter(s => !s.active && daysOff(s.id) === null);
  try { await commit('তারিখ', 'নিষ্ক্রিয় স্টাফ', list.map(s => s.id).join(','), b => list.forEach(s => b.set(FS.doc(db, 'staffPrivate/' + s.id), { inactiveSince: Date.now() }, { merge: true }))); toast('গণনা শুরু হয়েছে ✓'); } catch (e) { fbErr(e); }
}
function delStaff(id) {
  const s = STAFF.find(x => x.id === id);
  confirmBox(`<b>${esc(s.nameEn)}</b>-এর সব তথ্য (লুকানো তথ্য, সম্মতির রেকর্ড ও ই-স্বাক্ষরসহ) স্থায়ীভাবে মুছে যাবে। শুধু কার্ড বন্ধ করতে চাইলে পাওয়ার বোতাম ব্যবহার করুন।`, 'মুছে ফেলুন', async () => {
    try { await commit('মুছে ফেলা', s.nameEn, id, b => { ['staff', 'staffPrivate', 'scans'].forEach(c => b.delete(FS.doc(db, c + '/' + id))); Object.entries(INVITES).forEach(([tk, v]) => { if (v.staffId === id) b.delete(FS.doc(db, 'invites/' + tk)); }); Object.entries(SUBS).forEach(([tk, v]) => { if (v.staffId === id) b.delete(FS.doc(db, 'submissions/' + tk)); }); }); toast('মুছে ফেলা হয়েছে'); } catch (e) { fbErr(e); }
  });
}

/* ---------- card design, print, Web NFC ---------- */
async function cardDesign(id) {
  const s = STAFF.find(x => x.id === id), o = S(SETTINGS), url = cardUrl(o, id), emb = await emblemData(), nfc = 'NDEFReader' in window;
  modal(`<h3>কার্ড — ${esc(s.nameEn)}</h3><p class="sub">সাইজ 85.6 × 54 মিমি। SVG ফাইল প্রিন্টিং প্রতিষ্ঠানকে দিন।</p>
    <div class="cards" id="printArea"><div class="pcv">${cardSvg(s, o, 'front', emb)}</div><div class="pcv">${cardSvg(s, o, 'back', emb)}</div></div>
    <label for="curl">NFC কার্ডে লেখার লিংক</label><div class="inrow"><input id="curl" value="${esc(url)}" readonly><button class="btn sec" data-act="copy" data-arg="${esc(url)}">কপি</button></div>
    ${nfc ? `<div class="panel nfcbox"><b>📱 এই ফোন দিয়েই কার্ডে লিখুন</b><p class="m">বোতাম চেপে কার্ডটি ফোনের পেছনে ধরুন।</p><div class="mrow"><button class="btn" data-act="nfcw" data-arg="${esc(id)}">কার্ডে লিংক লিখুন</button><button class="btn red" data-act="nfclock">কার্ড লক করুন</button></div></div>`
      : `<p class="hint">💡 Android ফোনের Chrome-এ এই পেজ খুললে এখান থেকেই সরাসরি কার্ডে লিংক লেখা যাবে।</p>`}
    <div class="mrow"><button class="btn out" data-act="close">বন্ধ</button><button class="btn sec" data-act="dlcard" data-arg="${esc(id)}|front">${I.download} সামনে</button><button class="btn sec" data-act="dlcard" data-arg="${esc(id)}|back">${I.download} পেছনে</button><button class="btn" data-act="printone">🖨️ প্রিন্ট / PDF</button></div>`, 'কার্ড');
}
async function nfcWrite(id) {
  const url = cardUrl(S(SETTINGS), id);
  try { const r = new NDEFReader(); toast('কার্ডটি ফোনের পেছনে ধরুন…'); await r.write({ records: [{ recordType: 'url', data: url }] }); toast('লেখা হয়েছে ✓ — এখন কার্ডটি স্ক্যান করে পরীক্ষা করুন'); }
  catch (e) { toast('লেখা যায়নি: ' + (e.message || e.name)); }
}
function nfcLock() {
  confirmBox('কার্ড লক করলে আর কখনো লিংক বদলানো যাবে না। আগে স্ক্যান করে পরীক্ষা করেছেন তো? লক করতে বোতাম চেপে কার্ডটি ফোনের পেছনে ধরুন।', 'লক করুন', async () => {
    try { const r = new NDEFReader(); if (!r.makeReadOnly) return toast('এই ফোনে লক করা যায় না, NFC Tools অ্যাপ ব্যবহার করুন'); toast('কার্ডটি ফোনের পেছনে ধরুন…'); await r.makeReadOnly(); toast('কার্ড লক হয়েছে ✓'); }
    catch (e) { toast('লক করা যায়নি: ' + (e.message || e.name)); }
  });
}
async function printAll() {
  const o = S(SETTINGS), emb = await emblemData(), act = STAFF.filter(s => s.active);
  if (!act.length) return toast('কোনো সক্রিয় স্টাফ নেই');
  let el = $('#printAll'); if (!el) { el = document.createElement('div'); el.id = 'printAll'; document.body.appendChild(el); }
  el.innerHTML = act.map(s => `<div class="pair"><div>${cardSvg(s, o, 'front', emb)}</div><div>${cardSvg(s, o, 'back', emb)}</div><p>${esc(s.nameEn)} — ${esc(s.id)}</p></div>`).join('');
  document.body.classList.add('print-all'); setTimeout(() => { window.print(); }, 50);
}
addEventListener('afterprint', () => document.body.classList.remove('print-all', 'print-one'));

/* ---------- report ---------- */
function aReport() {
  const months = [], d = new Date();
  for (let i = 11; i >= 0; i--) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); months.push(x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0')); }
  const vals = months.map(m => MONTHS[m] || 0), max = Math.max(1, ...vals), W = 720, H = 260, P = 34, bw = (W - P * 2) / 12;
  const mn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const bars = vals.map((v, i) => { const h = Math.round((H - 70) * v / max), x = P + i * bw + 6, y = H - 40 - h; return `<rect x="${x}" y="${y}" width="${bw - 12}" height="${Math.max(h, 1)}" rx="5" class="bar-r"><title>${months[i]}: ${v}</title></rect>${v ? `<text x="${x + (bw - 12) / 2}" y="${y - 6}" text-anchor="middle" class="bar-v">${v}</text>` : ''}<text x="${x + (bw - 12) / 2}" y="${H - 18}" text-anchor="middle" class="bar-l">${mn[+months[i].slice(5) - 1]}</text>`; }).join('');
  const top = STAFF.map(s => [s, (SCANS[s.id] && SCANS[s.id].n) || 0]).sort((a, b) => b[1] - a[1]).slice(0, 10), tmax = Math.max(1, ...top.map(x => x[1]));
  const thisM = vals[11], lastM = vals[10];
  $('#aw').innerHTML = `<div class="stats"><div class="st"><small>এই মাসে স্ক্যান</small><b class="bl">${thisM}</b></div><div class="st"><small>গত মাসে</small><b>${lastM}</b></div><div class="st"><small>১২ মাসে মোট</small><b>${vals.reduce((a, b) => a + b, 0)}</b></div></div>
  <div class="panel"><h3>মাসভিত্তিক স্ক্যান (গত ১২ মাস)</h3><p class="m">সব কার্ড মিলিয়ে প্রতি মাসে কতবার প্রোফাইল খোলা হয়েছে।</p><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Monthly scans">${bars}<line x1="${P}" x2="${W - P}" y1="${H - 40}" y2="${H - 40}" class="axis"/></svg></div>
  <div class="panel"><h3>সবচেয়ে বেশি স্ক্যান হওয়া কার্ড</h3>${top.filter(x => x[1]).map(([s, n]) => `<div class="hb"><span>${esc(s.nameEn)}</span><i style="width:${Math.round(100 * n / tmax)}%"></i><b>${n}</b></div>`).join('') || '<p class="m">এখনো কোনো স্ক্যান হয়নি।</p>'}</div>`;
}

/* ---------- history (audit trail) ---------- */
async function aHistory() {
  if (!AUDIT) {
    $('#aw').innerHTML = '<div class="panel"><p class="m">লোড হচ্ছে…</p></div>';
    try { const sn = await FS.getDocs(FS.query(FS.collection(db, 'audit'), FS.orderBy('at', 'desc'), FS.limit(200))); AUDIT = sn.docs.map(d => d.data()); } catch (e) { fbErr(e); AUDIT = []; }
    if (tab !== 'history') return;
  }
  const f = x => x && x.toDate ? x.toDate().toLocaleString('bn-BD') : '—';
  $('#aw').innerHTML = `<div class="panel"><h3>🕘 পরিবর্তনের ইতিহাস</h3><p class="m">কে, কখন, কী বদলেছেন — সর্বশেষ ২০০টি। এই রেকর্ড কেউ বদলাতে বা মুছতে পারে না।</p>
    <div class="tbl flat"><table class="rt"><thead><tr><th>সময়</th><th>কে</th><th>কাজ</th><th>কার</th><th>বিস্তারিত</th></tr></thead><tbody>
    ${AUDIT.map(a => `<tr><td data-l="সময়" class="sm">${f(a.at)}</td><td data-l="কে" class="sm">${esc(a.by)}</td><td data-l="কাজ"><span class="pill info">${esc(a.action)}</span></td><td data-l="কার">${esc(a.target)}</td><td data-l="বিস্তারিত" class="sm muted">${esc(a.detail)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">এখনো কোনো রেকর্ড নেই</td></tr>'}
    </tbody></table></div><div class="mrow"><button class="btn out" data-act="reloadaudit">🔄 রিফ্রেশ</button></div></div>`;
}

/* ---------- settings ---------- */
const SET = [
  ['officeNameEn', 'অফিসের নাম (English)', 120], ['officeNameBn', 'অফিসের নাম (বাংলা)', 120], ['taglineEn', 'ট্যাগলাইন (English)', 200], ['taglineBn', 'ট্যাগলাইন (বাংলা)', 200],
  ['addressEn', 'ঠিকানা (English)', 300], ['addressBn', 'ঠিকানা (বাংলা)', 300], ['phone', 'অফিস ফোন', 30], ['email', 'অফিস ইমেইল', 120],
  ['website', 'ওয়েবসাইট (https://…)', 400], ['mapUrl', 'Google Maps লিংক (https://…)', 400], ['tagline2', 'কার্ডের সামনে ছোট লেখা', 120]
];
function aSettings() {
  const o = S(SETTINGS);
  $('#aw').innerHTML = `
  <div class="panel"><h3>🏢 অফিসের তথ্য</h3><div class="grid2">${SET.map(([k, l, n]) => `<div><label for="s_${k}">${l}</label><input id="s_${k}" maxlength="${n}" value="${esc(o[k])}"></div>`).join('')}</div></div>
  <div class="panel"><h3>🌐 ওয়েবসাইটের ঠিকানা</h3><p class="m">নিজস্ব ডোমেইন, যেমন <code>https://card.example.org/</code>। খালি রাখলে বর্তমান ঠিকানা। <b>কার্ড লক করার আগে চূড়ান্ত করুন।</b></p>
    <label class="sr" for="s_baseUrl">ঠিকানা</label><input id="s_baseUrl" maxlength="400" value="${esc(o.baseUrl)}" placeholder="${esc(location.origin + location.pathname.replace(/[^/]*$/, ''))}">
    <p class="hint">উদাহরণ লিংক: <code>${esc(cardUrl(o, 'abc1234'))}</code></p></div>
  <div class="panel"><h3>🛡️ গোপনীয়তা নোটিশ</h3><p class="m">প্রোফাইলের নিচে "গোপনীয়তা নীতি" লিংকে দেখাবে। খালি রাখলে ডিফল্ট লেখা দেখাবে।</p>
    <label for="s_privacyBn">বাংলা</label><textarea id="s_privacyBn" rows="3" maxlength="1500">${esc(o.privacyBn)}</textarea>
    <label for="s_privacyEn">English</label><textarea id="s_privacyEn" rows="3" maxlength="1500">${esc(o.privacyEn)}</textarea></div>
  <div class="mrow end"><button class="btn big" data-act="saveset">সেটিংস সেভ করুন</button></div>
  <div class="panel"><h3>🔒 নিরাপত্তা</h3><p class="m">পাসওয়ার্ড কমপক্ষে ১৪ অক্ষরের রাখুন। বদলাতে বোতাম চাপুন, ইমেইলে লিংক যাবে।</p>
    <button class="btn sec" data-act="mypw">পাসওয়ার্ড রিসেট ইমেইল পাঠান</button>
    <p class="hint">আপনার অ্যাডমিন UID (Firestore Rules-এর অ্যাডমিন তালিকার জন্য):</p><div class="inrow"><input value="${esc(ME.uid)}" readonly><button class="btn sec" data-act="copy" data-arg="${esc(ME.uid)}">কপি</button></div>
    <p class="hint">App Check: ${CFG.recaptchaSiteKey ? '✅ চালু (config.js-এ reCAPTCHA কী আছে)' : '⚠️ বন্ধ — config.js-এ recaptchaSiteKey বসান (গাইড দেখুন)'}</p></div>`;
}
async function saveSet() {
  const o = {}; SET.forEach(([k]) => o[k] = $('#s_' + k).value.trim());
  o.baseUrl = $('#s_baseUrl').value.trim(); o.showDirectory = false; o.privacyBn = $('#s_privacyBn').value.trim(); o.privacyEn = $('#s_privacyEn').value.trim();
  for (const k of ['website', 'mapUrl', 'baseUrl']) if (o[k] && !safeUrl(o[k])) return toast('লিংক https:// দিয়ে শুরু হতে হবে: ' + k);
  const full = Object.assign({}, S(SETTINGS), o); delete full.passHash;
  try { await commit('সেটিংস', 'অফিস সেটিংস', Object.keys(o).filter(k => (SETTINGS || {})[k] !== o[k]).join(', '), b => { b.set(FS.doc(db, 'settings/office'), full); dirSet(b, STAFF, full); }); toast('সেটিংস সেভ হয়েছে ✓'); } catch (e) { fbErr(e); }
}

/* ---------- backup, CSV ---------- */
function aBackup() {
  $('#aw').innerHTML = `<div class="panel"><h3>💾 ব্যাকআপ</h3><p class="m">প্রতি মাসে একবার ব্যাকআপ নিয়ে অফিসের নিরাপদ ড্রাইভে রাখুন। ফাইলে সবার ফোন নম্বর আছে — গোপন রাখুন।</p>
    <div class="mrow"><button class="btn sec" data-act="backup">${I.download} ব্যাকআপ ডাউনলোড (JSON)</button><button class="btn out" data-act="csvout">${I.download} Excel/CSV</button>
    <label class="btn out file">📂 ব্যাকআপ রিস্টোর<input type="file" accept=".json" class="hidden" data-change="restore"></label></div>
    <p class="hint">শেষ ব্যাকআপ (এই কম্পিউটারে): ${LS.get('last_backup') ? new Date(LS.get('last_backup')).toLocaleDateString('bn-BD') : 'কখনো নেওয়া হয়নি'}</p></div>`;
}
function backup() {
  const staff = STAFF.map(s => { const c = Object.assign({}, s); delete c.updated; return c; });
  download('nfc_backup_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ version: 2, settings: SETTINGS, staff, private: PRIV }, null, 1), 'application/json');
  LS.set('last_backup', Date.now()); commit('ব্যাকআপ', 'সব তথ্য', STAFF.length + ' জন', () => {}).catch(() => {});
}
const ALLOWED = ['nameEn', 'nameBn', 'titleEn', 'titleBn', 'deptEn', 'deptBn', 'phone', 'whatsapp', 'email', 'ext', 'linkedin', 'officePhone', 'bioEn', 'bioBn', 'photo', 'active', 'order', 'theme'];
const clean = s => { const o = {}; ALLOWED.forEach(k => { if (s[k] !== undefined) o[k] = s[k]; }); o.active = o.active === true || o.active === 'yes'; if (o.linkedin && !safeUrl(o.linkedin)) o.linkedin = ''; o.photo = safePhoto(o.photo); if (o.theme && !THEMES[o.theme]) o.theme = 'blue'; if (o.order !== undefined) o.order = Number(o.order) || 0; return o; };
// rows: [id, publicData, privateData|null, mergePrivate]
async function writeMany(action, rows, extra) {
  for (let i = 0; i < rows.length; i += 120) {
    const chunk = rows.slice(i, i + 120);
    await commit(action, `${i + 1}–${i + chunk.length}`, chunk.map(r => r[0]).join(',').slice(0, 480), b => {
      chunk.forEach(([id, data, priv, mergeP]) => { if (priv) b.set(FS.doc(db, 'staffPrivate/' + id), priv, mergeP ? { merge: true } : {}); b.set(FS.doc(db, 'staff/' + id), data); });
    });
  }
  if (extra) await extra();
}
function restore(inp) {
  const f = inp.files[0]; if (!f) return; inp.value = '';
  f.text().then(t => { let d; try { d = JSON.parse(t); if (!Array.isArray(d.staff)) throw 0; } catch (e) { return toast('ফাইলটি সঠিক নয়'); }
    let forced = 0;
    const rows = d.staff.filter(s => validId(s.id) && s.nameEn && s.titleEn).map(s => {
      const p0 = (d.private && d.private[s.id]) || {}, hidden = Object.assign({}, p0.hidden || {}); if (p0.phone && !hidden.phone) hidden.phone = String(p0.phone).slice(0, 30);
      const pub = clean(s); if (pub.active && !p0.consentDate) { pub.active = false; forced++; }
      const priv = { hidden, consentDate: p0.consentDate || '', consentNote: p0.consentNote || '', consentBy: p0.consentBy || '', inactiveSince: pub.active ? null : (p0.inactiveSince || Date.now()) };
      return [s.id, pub, priv, false];
    });
    confirmBox(`ব্যাকআপ থেকে ${rows.length} জন স্টাফ ও সেটিংস রিস্টোর করবেন? একই আইডির বর্তমান তথ্য বদলে যাবে।${forced ? `<br><br>⚠️ ${forced} জনের সম্মতির রেকর্ড নেই — তাঁদের কার্ড নিষ্ক্রিয় অবস্থায় রিস্টোর হবে।` : ''}`, 'রিস্টোর', async () => {
      try { await writeMany('রিস্টোর', rows, async () => { if (d.settings) { const set = Object.assign({}, S(SETTINGS), d.settings); delete set.passHash; set.showDirectory = false; await commit('রিস্টোর', 'সেটিংস', '', b => b.set(FS.doc(db, 'settings/office'), set)); } }); toast('রিস্টোর সম্পন্ন ✓'); } catch (e) { fbErr(e); }
    }, false);
  });
}
const CSV_COLS = ['id', 'nameEn', 'nameBn', 'titleEn', 'titleBn', 'deptEn', 'deptBn', 'phone', 'whatsapp', 'email', 'ext', 'linkedin', 'bioEn', 'bioBn', 'theme', 'active'];
function exportCsv() {
  const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const cols = CSV_COLS.concat(['hiddenFields', 'consentDate']);
  const rows = [cols.join(','), ...STAFF.map(s0 => { const s = merged(s0), h = hiddenOf(s0.id); return cols.map(k => cell(k === 'active' ? (s.active ? 'yes' : 'no') : k === 'hiddenFields' ? Object.keys(h).filter(x => x !== 'photo').join(' ') : k === 'consentDate' ? privOf(s0.id).consentDate : s[k])).join(','); })];
  download('staff_list.csv', '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
}
function parseCsv(t) {
  const out = []; let row = [], f = '', qd = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (qd) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') qd = false; else f += c; }
    else if (c === '"') qd = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); out.push(row); row = []; f = ''; } else if (c !== '\r') f += c; }
  if (f || row.length) { row.push(f); out.push(row); } return out;
}
function importCsv(inp) {
  const f = inp.files[0]; if (!f) return; inp.value = '';
  f.text().then(t => {
    const rows = parseCsv(t.replace(/^﻿/, '')).filter(r => r.some(x => x.trim())); const h = (rows.shift() || []).map(x => x.trim());
    let add = 0, upd = 0, skip = 0, forced = 0; const out = [];
    rows.forEach(r => { const o = {}; h.forEach((k, i) => { if (CSV_COLS.includes(k)) o[k] = (r[i] || '').trim().replace(/^'(?=[=+\-@])/, ''); });
      if (!o.nameEn || !o.titleEn) { skip++; return; }
      o.active = !/^(no|false|0|না)$/i.test(o.active || 'yes') ? 'yes' : 'no';
      const ex = validId(o.id) && STAFF.find(x => x.id === o.id); const id = validId(o.id) ? o.id : rid(); delete o.id;
      const base = ex ? merged(ex) : { order: STAFF.length + add + 1, theme: 'blue' }; delete base.id; delete base.updated;
      const data = clean(Object.assign(base, o));
      // keep hidden fields hidden (existing: as before; new: mobile & WhatsApp hidden by default)
      const hideKeys = ex ? Object.keys(hiddenOf(id)) : NEW_HIDDEN, hidden = {};
      hideKeys.forEach(k => { if (data[k]) { hidden[k] = data[k]; data[k] = ''; } });
      if (data.active && !(ex && hasConsent(id))) { data.active = false; forced++; }
      const priv = { hidden, inactiveSince: data.active ? null : (privOf(id).inactiveSince || Date.now()) };
      if (ex) upd++; else add++; out.push([id, data, priv, true]); });
    if (!out.length) return toast('কোনো বৈধ সারি পাওয়া যায়নি');
    confirmBox(`${add} জন নতুন, ${upd} জন আপডেট${skip ? `, ${skip}টি সারি বাদ (নাম/পদবি নেই)` : ''}।${forced ? `<br><br>⚠️ ${forced} জনের সম্মতির রেকর্ড নেই — তাঁদের কার্ড নিষ্ক্রিয় থাকবে। পরে এডিট করে সম্মতির তারিখ বসিয়ে সক্রিয় করুন।` : ''}<br><br>নতুন স্টাফের মোবাইল ও হোয়াটসঅ্যাপ ডিফল্টভাবে লুকানো থাকবে।`, 'ইমপোর্ট', async () => {
      try { await writeMany('CSV ইমপোর্ট', out); toast('ইমপোর্ট সম্পন্ন ✓'); } catch (e) { fbErr(e); }
    }, false);
  });
}
async function seed() {
  const b0 = $('#sdb'); if (b0) { b0.disabled = true; b0.textContent = 'যোগ হচ্ছে…'; }
  try {
    const o = Object.assign({}, DEF_SETTINGS, { showDirectory: false }), d = todayStr();
    await commit('শুরু', 'নমুনা তথ্য', SAMPLE.length + ' জন', b => {
      SAMPLE.forEach(s => { const { id, ...body } = s; const pub = clean(body);
        b.set(FS.doc(db, 'staffPrivate/' + id), { hidden: {}, consentDate: d, consentNote: 'নমুনা তথ্য — আসল স্টাফ নয়', consentBy: ME.email, inactiveSince: pub.active ? null : Date.now() });
        b.set(FS.doc(db, 'staff/' + id), pub); });
      b.set(FS.doc(db, 'settings/office'), o);
    });
    toast('নমুনা তথ্য যোগ হয়েছে ✓');
  } catch (e) { fbErr(e); if (b0) { b0.disabled = false; b0.textContent = 'নমুনা তথ্য দিয়ে শুরু করুন'; } }
}
function aGuide() {
  $('#aw').innerHTML = `
  <div class="panel"><h3>📱 কার্ডে লিংক লেখা</h3><ol class="steps">
    <li><b>সহজ উপায় (Android + Chrome):</b> ফোনে এই অ্যাডমিন পেজ খুলুন → স্টাফের 💳 বোতাম → "কার্ডে লিংক লিখুন" → কার্ড ফোনের পেছনে ধরুন।</li>
    <li><b>বিকল্প:</b> NFC Tools অ্যাপ → Write → Add a record → URL → লিংক পেস্ট → Write।</li>
    <li>কার্ডটি এমন ফোনে স্ক্যান করে দেখুন যেখানে অ্যাডমিন লগইন নেই।</li>
    <li>সব ঠিক থাকলে "কার্ড লক করুন" চাপুন (অথবা NFC Tools → Other → Lock tag)। ⚠️ লক স্থায়ী।</li></ol></div>
  <div class="panel"><h3>✉️ স্টাফদের অনলাইন সম্মতি</h3><ol class="steps">
    <li>স্টাফ তালিকায় "✉️ সম্মতির আমন্ত্রণ" (সবাই) বা কারো পাশের ✉️ বোতাম চাপুন → "লিংক তৈরি করুন"।</li>
    <li>পাঠান: <b>Outlook</b> (প্রতিজনের পাশে), <b>Word Mail Merge</b> ফাইল (সবাইকে একসাথে), অথবা <b>⚡ Firebase</b> (স্বয়ংক্রিয়, ফ্রি প্ল্যানে দিনে ৫টি)।</li>
    <li>স্টাফ লিংকে তথ্য ঠিক করে, কোনটি দেখাবে বেছে নিয়ে, ই-স্বাক্ষর আপলোড করে জমা দেবেন।</li>
    <li>"📝 পর্যালোচনা" ট্যাবে মিলিয়ে দেখে অনুমোদন, বদলে সক্রিয়, বা কারণসহ ফেরত পাঠান।</li></ol></div>
  <div class="panel"><h3>🛒 কার্ড অর্ডার</h3><ol class="steps"><li>চিপ: <b>NTAG215</b> বা <b>NTAG216</b>।</li><li>"🖨️ সব কার্ড (PDF)" বোতাম → প্রিন্ট উইন্ডোতে "Save as PDF" → প্রিন্টিং প্রতিষ্ঠানকে দিন।</li><li>কার্ড খালি (blank chip) অবস্থায় নিন।</li></ol></div>
  <div class="panel"><h3>✅ নিয়মিত কাজ</h3><ol class="steps"><li>প্রতি মাসে "ব্যাকআপ" ট্যাব থেকে ব্যাকআপ নিন।</li><li>মাসে একবার Firebase Console → Firestore → Usage দেখুন।</li><li>কেউ অফিস ছাড়লে ৩০ দিনের মধ্যে প্রোফাইল মুছে ফেলুন।</li></ol></div>`;
}

/* ---------- staff self-service invites (Outlook / Firebase email) & review ---------- */
const INVITE_DAYS = 14;
const token32 = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
const consentUrl = tk => siteBase(S(SETTINGS)) + 'consent.html?t=' + tk;
const latestInvite = id => Object.entries(INVITES).filter(([, v]) => v.staffId === id).sort((a, b) => (b[1].created || 0) - (a[1].created || 0))[0];
const subOf = id => Object.entries(SUBS).find(([tk, v]) => v.staffId === id && INVITES[tk] && INVITES[tk].status !== 'approved');
const fbSentToday = () => { const d = LS.get('fb_sent', {}); return d.day === todayStr() ? d.n : 0; };
const fbSentAdd = () => LS.set('fb_sent', { day: todayStr(), n: fbSentToday() + 1 });
const FB_DAILY = 5;
function inviteChip(id) {
  const s = subOf(id); if (s) return '<span class="pill info">📝 জমা পড়েছে</span>';
  const li = latestInvite(id); if (!li) return '';
  const v = li[1], exp = v.expires < Date.now();
  if (v.status === 'approved') return '';
  if (v.status === 'returned') return `<span class="pill off">↩ ফেরত</span>`;
  return exp ? '<span class="pill off">⌛ মেয়াদ শেষ</span>' : '<span class="pill info">✉️ পাঠানো</span>';
}
function mailtoFor(tk, inv, extra) {
  const url = consentUrl(tk), exp = new Date(inv.expires).toLocaleDateString('en-GB'), o = S(SETTINGS);
  const sub = `${o.officeNameEn} digital business card — your details & consent / আপনার তথ্য ও সম্মতি`;
  const body = `${extra ? extra + '\n\n' : ''}প্রিয় ${inv.name},\n\nঅফিসের নতুন NFC ডিজিটাল বিজনেস কার্ডের জন্য নিচের লিংকে গিয়ে আপনার তথ্য যাচাই করুন, কোন তথ্য প্রোফাইলে দেখাবে তা বেছে নিন, এবং ই-স্বাক্ষর আপলোড করে সম্মতি দিন। আপনার সম্মতি ও অ্যাডমিনের অনুমোদন ছাড়া কিছুই প্রকাশ হবে না।\n\n${url}\n\nলিংকটি শুধু আপনার জন্য, ${exp} পর্যন্ত চালু থাকবে। অনুগ্রহ করে কাউকে ফরোয়ার্ড করবেন না।\n\n---\nDear ${inv.name},\n\nPlease open the link above to check your details for the new office NFC business card, choose what is shown on your profile, and give your consent by uploading your e-signature. Nothing is published without your consent and admin approval. The link is personal and valid until ${exp}.\n\nThank you,\n${o.officeNameEn}`;
  return `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
}
async function createInvites(ids) {
  const now = Date.now(), made = [];
  await commit('আমন্ত্রণ', ids.length + ' জন', ids.join(',').slice(0, 480), b => {
    ids.forEach(id => {
      const s = STAFF.find(x => x.id === id), m = merged(s), h = hiddenOf(id), tk = token32();
      Object.entries(INVITES).filter(([, v]) => v.staffId === id && v.status !== 'approved').forEach(([old]) => b.delete(FS.doc(db, 'invites/' + old)));
      const prefill = {}; ['nameEn', 'nameBn', 'titleEn', 'titleBn', 'deptEn', 'deptBn', 'phone', 'whatsapp', 'email', 'ext', 'linkedin', 'bioEn', 'bioBn', 'photo'].forEach(k => prefill[k] = m[k] || '');
      prefill.photo = safePhoto(prefill.photo);
      const inv = { staffId: id, email: String(m.email || '').toLowerCase(), name: m.nameEn, prefill, visibility: { phone: !h.phone && !!s.phone, whatsapp: !h.whatsapp && !!s.whatsapp, email: !h.email, linkedin: !h.linkedin, photo: !h.photo }, created: now, expires: now + INVITE_DAYS * 86400000, status: 'sent', lang: 'bn' };
      b.set(FS.doc(db, 'invites/' + tk), inv); made.push([tk, inv]);
    });
  });
  return made;
}
function inviteRows(made) {
  return made.map(([tk, inv]) => `<div class="wrow inv"><span><b>${esc(inv.name)}</b><br><small class="muted">${esc(inv.email)}</small></span><span class="ib">
    <a class="btn sec sm" href="${esc(mailtoFor(tk, inv))}">📧 Outlook</a>
    <button class="btn sm" data-act="fbsend" data-arg="${tk}">⚡ Firebase</button>
    <button class="btn out sm" data-act="copy" data-arg="${esc(consentUrl(tk))}">🔗 কপি</button></span></div>`).join('');
}
let LAST_MADE = [];
function inviteModal() {
  const list = STAFF.filter(s => merged(s).email && !['active', 'pending'].includes(stageOf(s)));
  const pre = s => ['new', 'expired', 'returned'].includes(stageOf(s));
  const noMail = STAFF.filter(s => !merged(s).email);
  modal(`<h3>✉️ আমন্ত্রণ পাঠান</h3><p class="sub">যাঁদের আমন্ত্রণ যায়নি তাঁরা আগে থেকেই বাছাই করা আছেন। প্রতিজন একটি ব্যক্তিগত লিংক পাবেন (${INVITE_DAYS} দিন চালু)।</p>
    <div class="invlist">${list.map(s => `<label class="sw"><input type="checkbox" class="invck" value="${esc(s.id)}" ${pre(s) ? 'checked' : ''}> ${esc(s.nameEn)} <small class="muted">${esc(merged(s).email)}</small> <span class="pill ${STAGES[stageOf(s)][1]}">${STAGES[stageOf(s)][0]}</span></label>`).join('') || '<p class="m">আমন্ত্রণ পাঠানোর মতো কেউ নেই।</p>'}</div>
    ${noMail.length ? `<p class="hint">⚠️ ${noMail.length} জনের ইমেইল নেই — এডিট করে ইমেইল বসান।</p>` : ''}
    <div class="mrow"><button class="btn out" data-act="close">বাতিল</button><button class="btn" data-act="invcreate">লিংক তৈরি করে পাঠান</button></div>`, 'আমন্ত্রণ');
}
async function inviteOne(id) {
  if (!merged(STAFF.find(x => x.id === id)).email) { toast('এই স্টাফের ইমেইল নেই — আগে এডিট করে ইমেইল বসান'); return editStaff(id); }
  try { LAST_MADE = await createInvites([id]); showSend(); } catch (e) { fbErr(e); }
}
async function invCreate() {
  const ids = [...document.querySelectorAll('.invck:checked')].map(x => x.value); if (!ids.length) return toast('কাউকে বেছে নিন');
  try { LAST_MADE = await createInvites(ids); } catch (e) { return fbErr(e); }
  showSend();
}
function showSend() {
  const left = Math.max(0, FB_DAILY - fbSentToday());
  modal(`<h3>✅ ${LAST_MADE.length}টি লিংক তৈরি হয়েছে — এখন পাঠান</h3>
    <div class="sendways">
      <div><b>📧 Outlook (প্রস্তাবিত)</b><p class="m">প্রতিজনের পাশে "Outlook" চাপুন — বাংলা ও ইংরেজিতে লেখা ইমেইল খুলবে, শুধু Send চাপবেন। সবাইকে একসাথে পাঠাতে Word Mail Merge ফাইল নিন।</p><button class="btn sec sm" data-act="mergecsv">${I.download} Word Mail Merge ফাইল (CSV)</button></div>
      <div><b>⚡ Firebase স্বয়ংক্রিয়</b><p class="m">Firebase নিজেই ইমেইল পাঠাবে এবং স্টাফের ইমেইল যাচাই করবে (ইমেইলটি ইংরেজিতে, Firebase-এর নিজস্ব লেখায়)। ফ্রি প্ল্যানে দিনে ${FB_DAILY}টি — আজ বাকি আনুমানিক ${left}টি।</p><button class="btn sm" data-act="fball" ${left ? '' : 'disabled'}>⚡ প্রথম ${Math.min(left, LAST_MADE.length)} জনকে পাঠান</button></div>
    </div>
    <p class="hint">💡 দুটোই পাঠাতে পারেন: Outlook-এ ব্যাখ্যাসহ ইমেইল, আর Firebase-এ যাচাইয়ের লিংক। স্টাফ যেকোনো একটি লিংক খুললেই হবে; Firebase-এর লিংক দিয়ে খুললে ফর্মে "ইমেইল যাচাই হয়েছে" দেখাবে।</p>
    <div class="invsend">${inviteRows(LAST_MADE)}</div>
    <div class="mrow"><button class="btn out" data-act="close">বন্ধ</button></div>`, 'পাঠান');
}
async function fbSend(tk, quiet) {
  const inv = INVITES[tk] || (LAST_MADE.find(x => x[0] === tk) || [])[1]; if (!inv) return false;
  try {
    await AU.sendSignInLinkToEmail(auth, inv.email, { url: consentUrl(tk), handleCodeInApp: true });
    fbSentAdd(); FS.updateDoc(FS.doc(db, 'invites/' + tk), { fbSentAt: Date.now() }).catch(() => {});
    if (!quiet) toast(`⚡ ${inv.name}-কে Firebase ইমেইল পাঠানো হয়েছে`); return true;
  } catch (e) {
    const c = String(e.code || '');
    toast(c.includes('quota') ? `Firebase-এর আজকের ইমেইল সীমা (${FB_DAILY}টি) শেষ — Outlook দিয়ে পাঠান` : c.includes('operation-not-allowed') ? 'Firebase-এ Email link চালু নেই — গাইডের ধাপ দেখুন' : c.includes('unauthorized') ? 'ওয়েবসাইটের ঠিকানা Firebase-এর Authorized domains-এ নেই' : 'Firebase ইমেইল পাঠানো যায়নি: ' + (e.message || c));
    return false;
  }
}
async function fbAll() {
  let ok = 0; for (const [tk] of LAST_MADE) { if (fbSentToday() >= FB_DAILY) break; if (await fbSend(tk, true)) ok++; else break; }
  toast(`⚡ ${ok} জনকে Firebase ইমেইল পাঠানো হয়েছে${ok < LAST_MADE.length ? ' — বাকিদের Outlook দিয়ে পাঠান' : ''}`);
}
function mergeCsv() {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Name', 'Email', 'Link', 'ValidUntil'].join(','), ...LAST_MADE.map(([tk, v]) => [v.name, v.email, consentUrl(tk), new Date(v.expires).toLocaleDateString('en-GB')].map(cell).join(','))];
  download('consent_invites_mailmerge.csv', '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
  toast('ফাইল ডাউনলোড হয়েছে — Word → Mailings → Start Mail Merge → E-mail Messages');
}

/* ---------- review tab ---------- */
const LABELS = { nameEn: 'নাম (EN)', nameBn: 'নাম (বাং)', titleEn: 'পদবি (EN)', titleBn: 'পদবি (বাং)', deptEn: 'বিভাগ (EN)', deptBn: 'বিভাগ (বাং)', phone: 'মোবাইল', whatsapp: 'হোয়াটসঅ্যাপ', email: 'ইমেইল', ext: 'এক্সটেনশন', linkedin: 'LinkedIn', bioEn: 'পরিচিতি (EN)', bioBn: 'পরিচিতি (বাং)' };
const pendingSubs = () => Object.entries(SUBS).filter(([tk]) => !INVITES[tk] || INVITES[tk].status !== 'approved').sort((a, b) => ((a[1].submittedAt || {}).seconds || 0) - ((b[1].submittedAt || {}).seconds || 0));
const tsDate = x => x && x.toDate ? x.toDate() : null;
function reviewCard(tk, sb) { const cur = STAFF.find(x => x.id === sb.staffId); if (!cur) return ''; const m = merged(cur), d = tsDate(sb.submittedAt), np = safePhoto(sb.photo), op = safePhoto(m.photo);
    const rows = Object.keys(LABELS).map(k => { const a = m[k] || '', b2 = sb.data[k] || '', ch = a !== b2, vk = ['phone', 'whatsapp', 'email', 'linkedin'].includes(k); if (!a && !b2) return ''; return `<tr class="${ch ? 'chg' : ''}"><td>${LABELS[k]}</td><td class="muted">${esc(a)}</td><td>${esc(b2)}</td><td>${vk ? (sb.visibility[k] ? '👁 দেখাবে' : '🔒 লুকানো') : ''}</td></tr>`; }).join('');
    return `<div class="panel rv"><div class="rvh"><div><h3>${esc(sb.data.nameEn)}</h3><p class="m">${d ? d.toLocaleString('bn-BD') : ''} · ${sb.verifiedEmail ? `<span class="pill on">✅ ইমেইল যাচাইকৃত</span>` : `<span class="pill info">🔗 লিংকের মাধ্যমে</span>`} · কার্ড আইডি <code>${esc(sb.staffId)}</code></p></div></div>
      <div class="tbl flat"><table><thead><tr><th>তথ্য</th><th>বর্তমান</th><th>নতুন</th><th>প্রোফাইলে</th></tr></thead><tbody>${rows}
      <tr class="${np !== op ? 'chg' : ''}"><td>ছবি</td><td>${op ? `<img src="${op}" class="thumb" alt="">` : '—'}</td><td>${np ? `<img src="${np}" class="thumb" alt="">` : '—'}</td><td>${sb.visibility.photo ? '👁 দেখাবে' : '🔒 লুকানো'}</td></tr></tbody></table></div>
      <div class="sigrow" style="margin-top:12px"><div class="sigbox"><img src="${safePhoto(sb.signature)}" alt="signature"></div><div class="m"><b>${esc(sb.fullName)}</b><br>সম্মতি সংস্করণ ${esc(sb.consentVersion)}${sb.verifiedEmail ? `<br>${esc(sb.verifiedEmail)}` : ''}</div></div>
      <div class="mrow"><button class="btn red" data-act="subreturn" data-arg="${tk}">↩ ফেরত পাঠান</button><button class="btn sec" data-act="subedit" data-arg="${tk}">✏️ বদলে সক্রিয় করুন</button><button class="btn" data-act="subok" data-arg="${tk}">✓ অনুমোদন ও সক্রিয়</button></div></div>`; }
function aReview() {
  const list = pendingSubs();
  $('#aw').innerHTML = `<div class="panel"><h3>📝 স্টাফদের জমা দেওয়া তথ্য ও সম্মতি</h3><p class="m">মিলিয়ে দেখে অনুমোদন করুন। অনুমোদন করলে তথ্য প্রোফাইলে যাবে, সম্মতির রেকর্ড নিজে থেকে সেভ হবে, আর কার্ড সক্রিয় হবে।</p>
    <div class="mrow" style="margin-top:6px"><button class="btn sec" data-act="invite">✉️ নতুন আমন্ত্রণ পাঠান</button></div></div>
  ${list.map(([tk, sb]) => { return reviewCard(tk, sb); }).join('') || '<div class="panel"><p class="m">এখন পর্যালোচনার জন্য কিছু নেই।</p></div>'}`;
}
function subToStaff(tk) {
  const sb = SUBS[tk], cur = STAFF.find(x => x.id === sb.staffId), pub = {}, hidden = {};
  ['nameEn', 'nameBn', 'titleEn', 'titleBn', 'deptEn', 'deptBn', 'phone', 'whatsapp', 'email', 'ext', 'linkedin', 'bioEn', 'bioBn'].forEach(k => pub[k] = String(sb.data[k] || ''));
  ['officePhone'].forEach(k => pub[k] = cur.officePhone || '');
  pub.photo = safePhoto(sb.photo); pub.theme = cur.theme || 'blue'; pub.order = Number(cur.order) || STAFF.length; pub.active = true;
  ['phone', 'whatsapp', 'email', 'linkedin', 'photo'].forEach(k => { if (!sb.visibility[k] && pub[k]) { hidden[k] = pub[k]; pub[k] = ''; } });
  if (pub.linkedin && !safeUrl(pub.linkedin)) pub.linkedin = '';
  return { pub, hidden };
}
const subDate = sb => { const d = tsDate(sb.submittedAt) || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
async function subApprove(tk) {
  const sb = SUBS[tk], inv = INVITES[tk] || {}, { pub, hidden } = subToStaff(tk); pub.updated = FS.serverTimestamp();
  try {
    await commit('অনলাইন সম্মতি অনুমোদন', pub.nameEn, `${sb.staffId} · ${sb.verifiedEmail ? 'ইমেইল যাচাইকৃত' : 'লিংক'} · ${sb.consentVersion}`, b => {
      b.set(FS.doc(db, 'staffPrivate/' + sb.staffId), { hidden, consentDate: subDate(sb), consentNote: 'অনলাইন সম্মতি · ই-স্বাক্ষর' + (sb.verifiedEmail ? ' · ইমেইল যাচাইকৃত' : ''), consentBy: sb.verifiedEmail || inv.email || '', consentMethod: 'online', consentSub: tk, inactiveSince: null });
      b.set(FS.doc(db, 'staff/' + sb.staffId), pub);
      b.update(FS.doc(db, 'invites/' + tk), { status: 'approved', approvedAt: Date.now() });
    });
    if ($('#mb')) closeModal(); toast('অনুমোদিত ✓ — কার্ড সক্রিয় হয়েছে'); soft();
  } catch (e) { fbErr(e); }
}
function subReturn(tk) {
  const sb = SUBS[tk];
  modal(`<h3>↩ ফেরত পাঠান — ${esc(sb.data.nameEn)}</h3><p class="sub">কী ঠিক করতে হবে লিখুন। একই লিংকটি আবার ${INVITE_DAYS} দিনের জন্য চালু হবে, জমা দেওয়া তথ্য মুছে যাবে।</p>
    <label for="rnote">কারণ</label><textarea id="rnote" rows="3" maxlength="300"></textarea>
    <div class="mrow"><button class="btn out" data-act="close">বাতিল</button><button class="btn red" data-act="subreturnok" data-arg="${tk}">ফেরত পাঠান</button></div>`, 'ফেরত');
}
async function subReturnOk(tk) {
  const note = $('#rnote').value.trim(); if (!note) return toast('কারণ লিখুন');
  const sb = SUBS[tk], inv = Object.assign({}, INVITES[tk], { expires: Date.now() + INVITE_DAYS * 86400000, status: 'returned', returnNote: note });
  try {
    await commit('ফেরত', sb.data.nameEn, note.slice(0, 300), b => { b.update(FS.doc(db, 'invites/' + tk), { status: 'returned', returnNote: note, expires: inv.expires }); b.delete(FS.doc(db, 'submissions/' + tk)); });
    modal(`<h3>ফেরত পাঠানো হয়েছে — স্টাফকে জানান</h3><div class="mrow"><a class="btn sec" href="${esc(mailtoFor(tk, inv, 'আপনার জমা দেওয়া তথ্য ফেরত পাঠানো হয়েছে। কারণ: ' + note))}">📧 Outlook-এ জানান</a><button class="btn" data-act="fbsend" data-arg="${tk}">⚡ Firebase লিংক আবার পাঠান</button><button class="btn out" data-act="close">বন্ধ</button></div>`, 'ফেরত');
  } catch (e) { fbErr(e); }
}

/* ---------- actions ---------- */
Object.assign(ACT, {
  close: () => { closeModal(); soft(); },
  login: async () => {
    const em = $('#em').value.trim(), pw = $('#pw').value; if (!em || !pw) return toast('ইমেইল ও পাসওয়ার্ড দিন');
    const b = $('#lb'); b.disabled = true; b.textContent = 'অপেক্ষা করুন…';
    try { await AU.setPersistence(auth, AU.browserSessionPersistence); await AU.signInWithEmailAndPassword(auth, em, pw); if (pw.length < 14) setTimeout(() => toast('⚠️ আপনার পাসওয়ার্ড ছোট। সেটিংস থেকে ১৪+ অক্ষরের পাসওয়ার্ডে বদলে নিন'), 900); }
    catch (e) { fbErr(e); b.disabled = false; b.textContent = 'লগইন'; }
  },
  resetpw: async () => { const em = ($('#em') || {}).value; if (!em) return toast('আগে ইমেইল লিখুন'); try { await AU.sendPasswordResetEmail(auth, em.trim()); } catch (e) {} toast('ইমেইলটি অ্যাকাউন্টে থাকলে রিসেট লিংক পাঠানো হয়েছে'); },
  mypw: async () => { try { await AU.sendPasswordResetEmail(auth, ME.email); toast('ইমেইলে লিংক পাঠানো হয়েছে'); } catch (e) { fbErr(e); } },
  logout: () => AU.signOut(auth),
  theme: () => { toggleTheme(); render(); },
  tab: k => { tab = k; if (k === 'history') AUDIT = null; render(); },
  search: (_, el) => { q = el.value; const p = el.selectionStart; aStaff(); const n = $('#qbox'); n.focus(); n.setSelectionRange(p, p); },
  edit: id => editStaff(id), save: mode => saveStaff(mode), photo: (_, el) => pickPhoto(el), rmphoto: () => { ED.photo = ''; $('#phv').textContent = initials(ED.nameEn); },
  toggle: id => toggleActive(id), del: id => delStaff(id), card: id => cardDesign(id),
  copylink: id => copyText(cardUrl(S(SETTINGS), id)), copy: v => copyText(v),
  dlcard: async arg => { const [id, side] = arg.split('|'), s = STAFF.find(x => x.id === id); download(`Card_${side}_${s.nameEn.replace(/\W+/g, '_')}.svg`, cardSvg(s, S(SETTINGS), side, await emblemData()), 'image/svg+xml'); },
  printone: () => { document.body.classList.add('print-one'); setTimeout(() => window.print(), 50); },
  printall: () => printAll(), markoff: () => markOff(),
  invite: id => id ? inviteOne(id) : inviteModal(),
  quickadd: () => quickAdd(), qamode: m => quickAdd(m), qasave: () => qaSave(), qaprev: () => qaPreview(), filter: f => { FILTER = f; tab = 'staff'; render(); }, reviewone: id => reviewOne(id), invcreate: () => invCreate(), fbsend: tk => fbSend(tk), fball: () => fbAll(), mergecsv: () => mergeCsv(),
  subok: tk => subApprove(tk), subedit: tk => { const sb = SUBS[tk]; editStaff(sb.staffId, tk); }, subreturn: tk => subReturn(tk), subreturnok: tk => subReturnOk(tk),
  consentchk: (_, el) => { const d = $('#f_cdate'); if (el.checked && d && !d.value) d.value = todayStr(); if (!el.checked) { const a = $('#f_active'); if (a) a.checked = false; } }, nfcw: id => nfcWrite(id), nfclock: () => nfcLock(),
  saveset: () => saveSet(), seed: () => seed(), backup: () => backup(), restore: (_, el) => restore(el),
  csvout: () => exportCsv(), csvin: (_, el) => importCsv(el), reloadaudit: () => { AUDIT = null; aHistory(); }
});
boot().catch(e => { console.error(e); $('#app').innerHTML = `<main class="login"><h1 class="h2">লোড করা যায়নি</h1><p>ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি রিফ্রেশ করুন।</p></main>`; });
