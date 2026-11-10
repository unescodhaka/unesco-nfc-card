/* UNESCO Dhaka NFC Card — public profile pages (v2) */
import { CFG, G, configured, esc, safeUrl, safePhoto, digits, waNum, initials, $, LS, themeOf, toast, modal, closeModal, copyText, download,
  ACT, prefs, toggleTheme, toggleLang, isDark, L, qrSvg, cardUrl, vcard, S, PRIVACY_DEF, I, TX } from './common.js';

const CACHE_MS = 6 * 60 * 60 * 1000; // show cached copy instantly, refresh in background
let F = null, db = null, fbReady = null;

function firebase() {
  if (fbReady) return fbReady;
  fbReady = (async () => {
    const mods = [import(G + 'firebase-app.js'), import(G + 'firebase-firestore-lite.js')];
    if (CFG.recaptchaSiteKey) mods.push(import(G + 'firebase-app-check.js'));
    const [appM, fsM, acM] = await Promise.all(mods);
    const app = appM.initializeApp(CFG.firebase);
    if (acM) acM.initializeAppCheck(app, { provider: new acM.ReCaptchaV3Provider(CFG.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
    F = fsM; db = F.getFirestore(app);
  })();
  return fbReady;
}

/* ---------- data with cache ---------- */
async function fetchSettings() {
  await firebase();
  try { const d = await F.getDoc(F.doc(db, 'settings/office')); const o = d.exists() ? d.data() : {}; LS.set('c_set', { o, t: Date.now() }); return o; }
  catch (e) { const c = LS.get('c_set'); return c ? c.o : {}; }
}
async function fetchStaff(id) {
  await firebase();
  try { const d = await F.getDoc(F.doc(db, 'staff/' + id)); const s = d.exists() ? Object.assign({ id }, d.data()) : null; if (s && s.active) LS.set('c_p_' + id, { s, t: Date.now() }); else LS.del('c_p_' + id); return s; }
  catch (e) {
    const c = String(e && e.code || '');
    if (c.includes('permission') || c.includes('not-found')) { LS.del('c_p_' + id); return null; }
    const cached = LS.get('c_p_' + id); return cached ? cached.s : undefined; // offline → cached copy
  }
}
function logScan(id) {
  try { const k = 'nfc_seen_' + id; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (e) {}
  const now = new Date(), m = now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0');
  F.setDoc(F.doc(db, 'scans/' + id), { n: F.increment(1), last: F.serverTimestamp() }, { merge: true }).catch(() => {});
  F.setDoc(F.doc(db, 'scanMonths/' + m), { n: F.increment(1) }, { merge: true }).catch(() => {});
}

/* ---------- pieces ---------- */
const t = () => TX[prefs.lang];
const toggles = (extra = '') => `<div class="tg" ${extra}><button data-act="lang" aria-label="${prefs.lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}">${prefs.lang === 'bn' ? 'EN' : 'বাং'}</button><button data-act="theme" aria-label="${isDark() ? 'Light mode' : 'Dark mode'}">${isDark() ? I.sun : I.moon}</button></div>`;
const coverStyle = s => { const [a, b] = themeOf(s); return `style="--c1:${a};--c2:${b}"`; };
const skeleton = () => `<div class="pf" aria-busy="true"><div class="cover sk-cover"></div><div class="av-wrap"><div class="av sk"></div></div>
  <div class="who"><div class="sk sk-line" style="width:60%;height:24px;margin:6px auto"></div><div class="sk sk-line" style="width:40%;margin:10px auto"></div></div>
  <div class="acts">${'<div class="act"><i class="sk"></i></div>'.repeat(4)}</div><div class="sk" style="height:54px;margin:14px 18px;border-radius:14px"></div>
  <div class="box">${'<div class="row"><div class="ic sk"></div><div class="tx"><div class="sk sk-line" style="width:70%"></div></div></div>'.repeat(4)}</div></div>`;
const footer = o => `<footer class="foot"><img src="assets/img/logo.webp" alt="UNESCO" width="93" height="56"><br>${esc(L(o, 'officeName'))} · Digital Business Card<br><button class="lnk" data-act="privacy">${prefs.lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy notice'}</button></footer>`;

let CUR = null, OFF = null;
function renderInactive(o) {
  const tt = t();
  $('#app').innerHTML = `<main class="off">${toggles('style="position:static;justify-content:center;margin-bottom:30px"')}
    <div class="ic" aria-hidden="true">${I.lock}</div><h1 class="h2">${tt.offT}</h1><p>${tt.offP}</p>
    <p style="margin-top:22px"><b>${esc(L(o, 'officeName'))}</b><br>${esc(o.phone)}<br>${esc(o.email)}</p>
    <img src="assets/img/logo.webp" alt="UNESCO" style="height:60px;margin-top:26px;border-radius:4px"></main>`;
}
function renderProfile(s, o) {
  const tt = t(); CUR = s; OFF = o;
  document.title = `${L(s, 'name')} — ${L(o, 'officeName')}`;
  const ph = s.officePhone || o.phone, photo = safePhoto(s.photo);
  const rows = [
    s.phone && [I.phone, tt.mobile, s.phone, 'tel:' + digits(s.phone), s.phone],
    ph && [I.office, tt.office, ph + (s.ext ? ` (${tt.ext} ${s.ext})` : ''), 'tel:' + digits(ph) + (s.ext ? ',' + digits(s.ext) : ''), ph],
    s.email && [I.mail, tt.email, s.email, 'mailto:' + s.email, s.email],
    (o.addressEn || o.addressBn) && [I.pin, tt.addr, L(o, 'address'), safeUrl(o.mapUrl) || ('https://maps.google.com/?q=' + encodeURIComponent(o.addressEn || ''))],
    safeUrl(o.website) && [I.globe, tt.web, safeUrl(o.website).replace(/^https:\/\//, ''), safeUrl(o.website)],
    safeUrl(s.linkedin) && [I.in, tt.li, safeUrl(s.linkedin).replace(/^https:\/\/(www\.)?/, ''), safeUrl(s.linkedin)]
  ].filter(Boolean);
  const ext = h => h.startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : '';
  $('#app').innerHTML = `
  <main class="pf fade" ${coverStyle(s)}>
    <header class="cover"><div class="emb"><img src="assets/img/emblem.png" alt="" width="44" height="34"><b>${esc(L(o, 'officeName'))}<small>${esc(L(o, 'tagline'))}</small></b></div>${toggles()}</header>
    <div class="av-wrap"><div class="av">${photo ? `<img src="${photo}" alt="${esc(L(s, 'name'))}" width="124" height="124">` : `<span aria-hidden="true">${esc(initials(s.nameEn))}</span>`}</div></div>
    <section class="who"><h1>${esc(L(s, 'name'))}</h1><p class="t">${esc(L(s, 'title'))}</p><p class="d">${esc(L(s, 'dept'))}</p>${L(s, 'bio') ? `<p class="bio">${esc(L(s, 'bio'))}</p>` : ''}</section>
    <nav class="acts" aria-label="Quick actions">
      ${(s.phone || ph) ? `<a class="act" href="tel:${esc(digits(s.phone || ph))}"><i class="c-blue">${I.phone}</i>${tt.call}</a>` : ''}
      ${(s.whatsapp || s.phone) ? `<a class="act" href="https://wa.me/${waNum(s.whatsapp || s.phone)}" target="_blank" rel="noopener noreferrer"><i>${I.wa}</i>${tt.wa}</a>` : ''}
      ${s.email ? `<a class="act" href="mailto:${esc(s.email)}"><i class="c-orange">${I.mail}</i>${tt.mail}</a>` : ''}
      <button class="act" data-act="share"><i class="c-purple">${I.share}</i>${tt.share}</button>
    </nav>
    <button class="save" data-act="vcf">${I.user} ${tt.save}</button>
    <section class="box" aria-label="Contact details">${rows.map(r => `<a class="row" href="${esc(r[3])}" ${ext(r[3])}><span class="ic" aria-hidden="true">${r[0]}</span><span class="tx"><small>${r[1]}</small><span>${esc(r[2])}</span></span><span class="go" aria-hidden="true">${I.chev}</span></a>`).join('')}</section>
    <div class="two"><button class="ghost" data-act="exchange">${I.swap} ${tt.exch}</button><button class="ghost" data-act="qr">${I.qr} ${tt.myqr}</button></div>
    ${footer(o)}
  </main>`;
}
function renderHome(o, list) {
  const tt = t(); document.title = L(o, 'officeName') + ' — Digital Business Card';
  $('#app').innerHTML = `<main class="pf fade">
    <header class="cover" style="height:230px"><div class="emb"><img src="assets/img/emblem.png" alt="" width="44" height="34"><b>${esc(L(o, 'officeName'))}<small>${esc(L(o, 'tagline'))}</small></b></div>${toggles()}
      <div class="hero"><h1>${esc(L(o, 'officeName'))}</h1><p>Digital Business Card</p></div></header>
    <section class="box">${[[I.pin, tt.addr, L(o, 'address'), safeUrl(o.mapUrl)], [I.office, tt.office, o.phone, 'tel:' + digits(o.phone)], [I.mail, tt.email, o.email, 'mailto:' + o.email], [I.globe, tt.web, (safeUrl(o.website) || '').replace(/^https:\/\//, ''), safeUrl(o.website)]].filter(r => r[2] && r[3]).map(r => `<a class="row" href="${esc(r[3])}" ${r[3].startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : ''}><span class="ic" aria-hidden="true">${r[0]}</span><span class="tx"><small>${r[1]}</small><span>${esc(r[2])}</span></span></a>`).join('')}</section>
    ${list && list.length ? `<h2 class="h-sec">${tt.team}</h2><section class="box">${list.map(s => `<a class="row" href="#/c/${esc(s.id)}"><span class="ic round" aria-hidden="true">${esc(initials(s.nameEn))}</span><span class="tx"><span>${esc(L(s, 'name'))}</span><small>${esc(L(s, 'title'))}</small></span><span class="go" aria-hidden="true">${I.chev}</span></a>`).join('')}</section>` : ''}
    ${footer(o)}</main>`;
}
function renderSetup() {
  $('#app').innerHTML = `<main class="login"><img src="assets/img/logo.webp" alt="UNESCO"><h1 class="h2">Firebase এখনো যুক্ত হয়নি</h1><p>config.js ফাইলে Firebase-এর তথ্য বসান (README দেখুন)।</p></main>`;
}

/* ---------- actions ---------- */
Object.assign(ACT, {
  lang: () => { toggleLang(); route(true); },
  theme: () => { toggleTheme(); route(true); },
  vcf: () => download(String(CUR.nameEn).replace(/[^\w]+/g, '_') + '.vcf', vcard(CUR, OFF), 'text/vcard'),
  share: () => { const url = cardUrl(OFF, CUR.id); if (navigator.share) navigator.share({ title: L(CUR, 'name'), text: `${L(CUR, 'name')} — ${L(CUR, 'title')}`, url }).catch(() => {}); else copyText(url); },
  qr: () => modal(`<h3>${esc(L(CUR, 'name'))}</h3><p class="sub">${t().qrSub}</p><div class="qrbox">${qrSvg(cardUrl(OFF, CUR.id))}</div><div class="mrow"><button class="btn out" data-act="close">${t().cancel}</button></div>`, 'QR'),
  privacy: () => { const o = OFF || {}; const txt = (prefs.lang === 'bn' ? o.privacyBn : o.privacyEn) || PRIVACY_DEF[prefs.lang]; modal(`<h3>${prefs.lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy notice'}</h3><p class="sub" style="font-size:14px;line-height:1.75;white-space:pre-line">${esc(txt)}</p>${o.email ? `<p class="sub">${esc(o.email)}</p>` : ''}<div class="mrow"><button class="btn out" data-act="close">${t().cancel}</button></div>`, 'Privacy'); },
  exchange: () => { const tt = t(); modal(`<h3>${tt.exch}</h3><p class="sub">${tt.exchSub}</p>
    <label for="xn">${tt.yname} *</label><input id="xn" autocomplete="name"><label for="xp">${tt.yphone}</label><input id="xp" type="tel" autocomplete="tel"><label for="xe">${tt.yemail}</label><input id="xe" type="email" autocomplete="email">
    <label for="xo">${tt.yorg}</label><input id="xo" autocomplete="organization"><label for="xm">${tt.ymsg}</label><textarea id="xm" rows="2"></textarea>
    <div class="mrow"><button class="btn wa" data-act="sendex" data-arg="wa">${tt.sendWa}</button><button class="btn" data-act="sendex" data-arg="mail">${tt.sendMail}</button></div>`, tt.exch); },
  sendex: via => { const tt = t(), g = id => $('#' + id).value.trim().slice(0, 300);
    if (!g('xn') || (!g('xp') && !g('xe'))) return toast(tt.need);
    const body = `${tt.exText}\n\n${tt.yname}: ${g('xn')}\n${tt.yphone}: ${g('xp')}\n${tt.yemail}: ${g('xe')}\n${tt.yorg}: ${g('xo')}${g('xm') ? '\n\n' + g('xm') : ''}`;
    if (via === 'wa') window.open(`https://wa.me/${waNum(CUR.whatsapp || CUR.phone)}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
    else location.href = `mailto:${encodeURIComponent(CUR.email)}?subject=${encodeURIComponent('Contact from digital card: ' + g('xn'))}&body=${encodeURIComponent(body)}`;
    closeModal(); }
});

/* ---------- router ---------- */
let seq = 0;
async function route(soft) {
  if (!soft) closeModal();
  if (!configured()) return renderSetup();
  const my = ++seq, h = location.hash || '#/', m = h.match(/^#\/c\/([a-z0-9]{6,16})$/);
  const cSet = LS.get('c_set'); const o0 = S(cSet && cSet.o);
  if (m) {
    const id = m[1], cached = LS.get('c_p_' + id);
    if (cached && cached.s) renderProfile(cached.s, o0); else if (!soft) $('#app').innerHTML = skeleton();
    if (soft && cached) return;
    const [s, oRaw] = await Promise.all([fetchStaff(id), fetchSettings()]);
    if (my !== seq) return; const o = S(oRaw);
    if (s === undefined) { if (!cached) $('#app').innerHTML = `<main class="off"><p>${t().offline || 'Offline'}</p></main>`; return; }
    if (!s || !s.active) return renderInactive(o);
    if (!cached || JSON.stringify(cached.s) !== JSON.stringify(s) || JSON.stringify(o) !== JSON.stringify(o0)) renderProfile(s, o);
    logScan(id);
  } else if (/^#\/admin/.test(h)) {
    location.replace('admin.html');
  } else {
    renderHome(o0, null);
    const oRaw = await fetchSettings(); const o = S(oRaw); if (my !== seq) return;
    let list = null;
    if (o.showDirectory) { try { const d = await F.getDoc(F.doc(db, 'directory/public')); list = d.exists() ? (d.data().list || []) : []; } catch (e) {} }
    if (my === seq) renderHome(o, list);
  }
}
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
