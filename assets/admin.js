/* UNESCO Dhaka NFC Card — admin panel (v2) */
import { CFG, G, VERSION, configured, esc, safeUrl, safePhoto, validId, initials, rid, $, LS, THEMES, themeOf, toast, modal, closeModal,
  confirmBox, copyText, download, ACT, prefs, toggleTheme, isDark, cardUrl, cardSvg, emblemData, S, DEF_SETTINGS, I } from './common.js';

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
let ME, ACCESS = null, STAFF = [], PRIV = {}, SETTINGS = null, SCANS = {}, MONTHS = {}, AUDIT = null;
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
  unsub.push(FS.onSnapshot(C('scanMonths'), sn => { MONTHS = {}; sn.docs.forEach(d => MONTHS[d.id] = d.data().n || 0); if (tab === 'report') soft(); }, () => {}));
}
function stopData() { unsub.forEach(u => u()); unsub = []; ACCESS = null; STAFF = []; PRIV = {}; SCANS = {}; MONTHS = {}; AUDIT = null; }
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
const TABS = [['staff', '👥 স্টাফ'], ['report', '📊 রিপোর্ট'], ['history', '🕘 ইতিহাস'], ['settings', '⚙️ সেটিংস'], ['backup', '💾 ব্যাকআপ'], ['guide', '📖 গাইড']];
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
    app.innerHTML = `<main class="login"><img src="assets/img/logo.webp" alt="UNESCO"><h1 class="h2">অনুমতি নেই</h1><p><b>${esc(ME.email)}</b> অ্যাকাউন্টটি অ্যাডমিন তালিকায় নেই। Firebase Console → Firestore → Rules-এ ইমেইলটি যোগ করে Publish করুন।</p><button class="btn out" data-act="logout">লগআউট</button></main>`;
    return;
  }
  const empty = !STAFF.length && !(SETTINGS && SETTINGS.officeNameEn);
  app.innerHTML = `<div class="ad">
    <header class="top"><img src="assets/img/emblem.png" alt="" width="40" height="31"><div class="ttl"><b>NFC কার্ড অ্যাডমিন</b><small>${esc(ME.email)}</small></div><div class="sp"></div>
      <button data-act="theme" aria-label="থিম বদলান">${isDark() ? I.sun : I.moon}</button><a href="./" class="tbtn">হোম</a><button data-act="logout">লগআউট</button></header>
    <nav class="tabs" role="tablist">${TABS.map(([k, v]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${v}</button>`).join('')}</nav>
    ${empty ? `<div class="wrap" style="padding-bottom:0"><div class="panel accent"><h3>👋 স্বাগতম! ডাটাবেজ এখনো খালি</h3><p class="m">নমুনা তথ্য দিয়ে শুরু করুন, অথবা "নতুন স্টাফ" দিয়ে নিজে যোগ করুন।</p><button class="btn" id="sdb" data-act="seed">নমুনা তথ্য দিয়ে শুরু করুন</button></div></div>` : ''}
    <main class="wrap" id="aw"></main><footer class="ver">সংস্করণ ${VERSION}</footer></div>`;
  ({ staff: aStaff, report: aReport, history: aHistory, settings: aSettings, backup: aBackup, guide: aGuide })[tab]();
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
function aStaff() {
  const all = STAFF, act = all.filter(s => s.active).length, tot = Object.values(SCANS).reduce((a, b) => a + (b.n || 0), 0);
  const list = all.filter(s => !q || [s.nameEn, s.nameBn, s.titleEn, s.deptEn, emailOf(s), phoneOf(s)].join(' ').toLowerCase().includes(q.toLowerCase()));
  const overdue = all.filter(s => !s.active && daysOff(s.id) !== null && daysOff(s.id) >= RETAIN_DAYS);
  const undated = all.filter(s => !s.active && daysOff(s.id) === null);
  const noConsent = all.filter(s => s.active && !hasConsent(s.id));
  const last = s => { const x = SCANS[s.id] && SCANS[s.id].last; return x && x.toDate ? x.toDate().toLocaleDateString('bn-BD') : ''; };
  const warn = [];
  if (overdue.length) warn.push(`<div class="panel warnp"><h3>🗑️ ${overdue.length} জন স্টাফের কার্ড ${RETAIN_DAYS} দিনের বেশি নিষ্ক্রিয়</h3><p class="m">প্রাইভেসি নীতি অনুযায়ী এখন তাঁদের তথ্য মুছে ফেলা উচিত।</p>${overdue.map(s => `<div class="wrow"><span><b>${esc(s.nameEn)}</b> · ${daysOff(s.id)} দিন</span><button class="btn red sm" data-act="del" data-arg="${esc(s.id)}">মুছে ফেলুন</button></div>`).join('')}</div>`);
  if (undated.length) warn.push(`<div class="panel warnp"><h3>📅 ${undated.length} জন নিষ্ক্রিয় স্টাফের নিষ্ক্রিয় হওয়ার তারিখ নেই</h3><p class="m">${undated.map(s => esc(s.nameEn)).join(', ')} — আজ থেকে ${RETAIN_DAYS} দিনের গণনা শুরু করতে বোতাম চাপুন।</p><button class="btn sec" data-act="markoff">আজ থেকে গণনা শুরু করুন</button></div>`);
  if (noConsent.length) warn.push(`<div class="panel warnp"><h3>✍️ ${noConsent.length} জন সক্রিয় স্টাফের সম্মতির রেকর্ড নেই</h3><p class="m">${noConsent.map(s => esc(s.nameEn)).join(', ')} — ✏️ এডিট করে সম্মতির তারিখ বসান। সম্মতি ছাড়া এঁদের তথ্য আর সেভ করা যাবে না।</p></div>`);
  $('#aw').innerHTML = `${warn.join('')}
  <div class="stats">
    <div class="st"><small>মোট স্টাফ</small><b>${all.length}</b></div><div class="st"><small>সক্রিয় কার্ড</small><b class="ok">${act}</b></div>
    <div class="st"><small>নিষ্ক্রিয় কার্ড</small><b class="bad">${all.length - act}</b></div><div class="st"><small>মোট স্ক্যান</small><b class="bl">${tot}</b></div></div>
  <div class="bar"><label class="sr" for="qbox">খুঁজুন</label><input id="qbox" type="search" placeholder="🔍 নাম, পদবি, বিভাগ দিয়ে খুঁজুন..." value="${esc(q)}" data-input="search">
    <div class="sp"></div>
    <button class="btn out" data-act="printall">🖨️ সব কার্ড (PDF)</button>
    <button class="btn out" data-act="csvout">${I.download} CSV</button>
    <label class="btn out file">📥 CSV ইমপোর্ট<input type="file" accept=".csv" class="hidden" data-change="csvin"></label>
    <button class="btn" data-act="edit">${I.plus} নতুন স্টাফ</button></div>
  <div class="tbl"><table class="rt"><thead><tr><th>স্টাফ</th><th>বিভাগ</th><th>যোগাযোগ</th><th>কার্ড আইডি</th><th>সম্মতি</th><th>স্ক্যান</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>
  ${list.map(s => { const ph = safePhoto(s.photo) || safePhoto(hiddenOf(s.id).photo), p = privOf(s.id), d = daysOff(s.id); return `<tr>
    <td data-l="স্টাফ"><div class="pp"><div class="a" style="--c1:${themeOf(s)[0]}">${ph ? `<img src="${ph}" alt="">` : esc(initials(s.nameEn))}</div><div><b>${esc(s.nameEn)}</b><small>${esc(s.nameBn)} · ${esc(s.titleEn)}</small></div></div></td>
    <td data-l="বিভাগ">${esc(s.deptEn)}</td>
    <td data-l="যোগাযোগ" class="sm">${esc(phoneOf(s))}<br><span class="muted">${esc(emailOf(s))}</span></td>
    <td data-l="আইডি"><code>${esc(s.id)}</code></td>
    <td data-l="সম্মতি" class="sm">${p.consentDate ? `<span class="pill on" title="${esc(p.consentNote || '')}">✓ ${esc(p.consentDate)}</span>` : '<span class="pill off">নেই</span>'}</td>
    <td data-l="স্ক্যান"><b>${(SCANS[s.id] && SCANS[s.id].n) || 0}</b>${last(s) ? `<br><span class="sm muted">${last(s)}</span>` : ''}</td>
    <td data-l="স্ট্যাটাস"><span class="pill ${s.active ? 'on' : 'off'}">${s.active ? 'সক্রিয়' : 'নিষ্ক্রিয়' + (d !== null ? ` · ${d} দিন` : '')}</span></td>
    <td data-l="অ্যাকশন"><div class="ia">
      <a class="iab" href="./#/c/${esc(s.id)}" target="_blank" rel="noopener" aria-label="প্রোফাইল দেখুন" title="প্রোফাইল দেখুন">${I.eye}</a>
      <button aria-label="এডিট" title="এডিট" data-act="edit" data-arg="${esc(s.id)}">${I.edit}</button>
      <button aria-label="লিংক কপি" title="লিংক কপি" data-act="copylink" data-arg="${esc(s.id)}">${I.link}</button>
      <button aria-label="কার্ড ও NFC" title="কার্ড ডিজাইন ও NFC" data-act="card" data-arg="${esc(s.id)}">${I.card}</button>
      <button aria-label="${s.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}" title="${s.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}" data-act="toggle" data-arg="${esc(s.id)}" class="${s.active ? 'ok' : 'bad'}">${I.power}</button>
      <button aria-label="মুছুন" title="মুছুন" data-act="del" data-arg="${esc(s.id)}">${I.trash}</button></div></td></tr>`; }).join('') || '<tr><td colspan="8" class="empty">কোনো স্টাফ নেই</td></tr>'}
  </tbody></table></div>
  <p class="hint">💡 🔒 চিহ্ন মানে তথ্যটি লুকানো — শুধু অ্যাডমিন দেখেন, প্রোফাইলে বা ডাটাবেজের পাবলিক অংশে থাকে না। সব পরিবর্তন "ইতিহাস" ট্যাবে রেকর্ড হয়।</p>`;
}

/* ---------- edit form ---------- */
const FIELDS = [
  ['nameEn', 'নাম (English) *', 120], ['nameBn', 'নাম (বাংলা)', 120], ['titleEn', 'পদবি (English) *', 150], ['titleBn', 'পদবি (বাংলা)', 150],
  ['deptEn', 'বিভাগ (English)', 120], ['deptBn', 'বিভাগ (বাংলা)', 120], ['phone', 'মোবাইল নম্বর', 30], ['whatsapp', 'হোয়াটসঅ্যাপ নম্বর', 30],
  ['email', 'ইমেইল', 120], ['ext', 'অফিস এক্সটেনশন', 10], ['linkedin', 'LinkedIn লিংক (https://…)', 400], ['officePhone', 'আলাদা অফিস ফোন', 30]
];
const isHid = k => HIDABLE.some(h => h[0] === k);
let ED = null;
function editStaff(id) {
  const s = id ? STAFF.find(x => x.id === id) : { id: rid(), active: false, order: STAFF.length + 1, theme: 'blue' };
  const h = id ? hiddenOf(id) : {}, p = id ? privOf(id) : {};
  const vis = k => id ? !h[k] : !NEW_HIDDEN.includes(k);
  ED = merged(s); if (!id) ED.id = s.id;
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
  const prev = privOf(id);
  const priv = { hidden, consentDate: consent ? cdate : '', consentNote: consent ? cnote : '', consentBy: consent ? ((prev.consentDate === cdate && prev.consentBy) || ME.email) : '', inactiveSince: e.active ? null : (prev.inactiveSince || Date.now()) };
  const b = $('#svb'); b.disabled = true; b.textContent = 'সেভ হচ্ছে…';
  const hidList = Object.keys(hidden).map(k => HIDABLE.find(h => h[0] === k)[1]).join('/');
  try {
    await commit(mode === 'new' ? 'যোগ' : 'এডিট', e.nameEn, `${id}${hidList ? ' · লুকানো: ' + hidList : ''}${consent ? ' · সম্মতি ' + cdate : ' · সম্মতি নেই'}${e.active ? '' : ' · নিষ্ক্রিয়'}`, bt => {
      bt.set(FS.doc(db, 'staffPrivate/' + id), priv);
      bt.set(FS.doc(db, 'staff/' + id), pub);
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
  confirmBox(`<b>${esc(s.nameEn)}</b>-এর সব তথ্য (লুকানো তথ্য ও সম্মতির রেকর্ডসহ) স্থায়ীভাবে মুছে যাবে। শুধু কার্ড বন্ধ করতে চাইলে পাওয়ার বোতাম ব্যবহার করুন।`, 'মুছে ফেলুন', async () => {
    try { await commit('মুছে ফেলা', s.nameEn, id, b => { ['staff', 'staffPrivate', 'scans'].forEach(c => b.delete(FS.doc(db, c + '/' + id))); }); toast('মুছে ফেলা হয়েছে'); } catch (e) { fbErr(e); }
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
  <div class="panel"><h3>🛒 কার্ড অর্ডার</h3><ol class="steps"><li>চিপ: <b>NTAG215</b> বা <b>NTAG216</b>।</li><li>"🖨️ সব কার্ড (PDF)" বোতাম → প্রিন্ট উইন্ডোতে "Save as PDF" → প্রিন্টিং প্রতিষ্ঠানকে দিন।</li><li>কার্ড খালি (blank chip) অবস্থায় নিন।</li></ol></div>
  <div class="panel"><h3>✅ নিয়মিত কাজ</h3><ol class="steps"><li>প্রতি মাসে "ব্যাকআপ" ট্যাব থেকে ব্যাকআপ নিন।</li><li>মাসে একবার Firebase Console → Firestore → Usage দেখুন।</li><li>কেউ অফিস ছাড়লে ৩০ দিনের মধ্যে প্রোফাইল মুছে ফেলুন।</li></ol></div>`;
}

/* ---------- actions ---------- */
Object.assign(ACT, {
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
  consentchk: (_, el) => { const d = $('#f_cdate'); if (el.checked && d && !d.value) d.value = todayStr(); if (!el.checked) { const a = $('#f_active'); if (a) a.checked = false; } }, nfcw: id => nfcWrite(id), nfclock: () => nfcLock(),
  saveset: () => saveSet(), seed: () => seed(), backup: () => backup(), restore: (_, el) => restore(el),
  csvout: () => exportCsv(), csvin: (_, el) => importCsv(el), reloadaudit: () => { AUDIT = null; aHistory(); }
});
boot().catch(e => { console.error(e); $('#app').innerHTML = `<main class="login"><h1 class="h2">লোড করা যায়নি</h1><p>ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি রিফ্রেশ করুন।</p></main>`; });
