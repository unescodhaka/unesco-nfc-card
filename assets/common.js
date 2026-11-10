/* UNESCO Dhaka NFC Card — shared helpers (v2) */
export const VERSION = '2.1.0';
export const FB_V = '10.14.1';
export const G = `https://www.gstatic.com/firebasejs/${FB_V}/`;
// config.js: সংস্করণ ২-এর APP_CONFIG, অথবা সংস্করণ ১-এর FIREBASE_CONFIG — দুটোই চলে
export const CFG = window.APP_CONFIG || (window.FIREBASE_CONFIG ? { firebase: window.FIREBASE_CONFIG, recaptchaSiteKey: window.RECAPTCHA_SITE_KEY || '' } : {});
export const configured = () => !!(CFG.firebase && CFG.firebase.apiKey && !/PASTE/.test(CFG.firebase.apiKey));

/* ---------- safety helpers ---------- */
export const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
export const safeUrl = u => (typeof u === 'string' && /^https:\/\/[^\s"<>]+$/i.test(u.trim())) ? u.trim() : '';
export const safePhoto = p => (typeof p === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p)) ? p : '';
export const validId = id => /^[a-z0-9]{6,16}$/.test(String(id || ''));
export const digits = s => String(s || '').replace(/[^\d+]/g, '');
export const waNum = s => String(s || '').replace(/\D/g, '');
export const initials = n => String(n || '?').replace(/^(Dr\.|Md\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
export const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
export const $ = s => document.querySelector(s);
export const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ---------- colour themes ---------- */
export const THEMES = {
  blue: ['#0077D4', '#005BA3', 'UNESCO নীল'], teal: ['#00897B', '#00695C', 'টিল'], green: ['#2E7D32', '#1B5E20', 'সবুজ'],
  orange: ['#E8833A', '#B85A14', 'কমলা'], purple: ['#6D4FC2', '#4B2E9E', 'বেগুনি'], red: ['#C8102E', '#8E0B20', 'লাল']
};
export const themeOf = s => THEMES[s && s.theme] || THEMES.blue;

/* ---------- UI: toast, modal, confirm ---------- */
export function toast(m) {
  const n = document.querySelectorAll('.toast').length, t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; t.style.bottom = (26 + n * 56) + 'px';
  document.body.appendChild(t); setTimeout(() => t.remove(), 2800);
}
let lastFocus = null;
export function modal(html, label) {
  closeModal(); lastFocus = document.activeElement;
  const m = document.createElement('div'); m.className = 'mb'; m.id = 'mb';
  m.innerHTML = `<div class="md" role="dialog" aria-modal="true" aria-label="${esc(label || '')}" tabindex="-1">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m); m.querySelector('.md').focus(); return m;
}
export function closeModal() { const m = $('#mb'); if (m) { m.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); } }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
export function confirmBox(msg, okLabel, fn, danger = true) {
  modal(`<h3>নিশ্চিত করুন</h3><p class="sub" style="font-size:14px">${msg}</p><div class="mrow"><button class="btn out" data-act="close">বাতিল</button><button class="btn ${danger ? 'red' : ''}" id="okb">${esc(okLabel)}</button></div>`, 'confirm');
  $('#okb').onclick = () => { closeModal(); fn(); };
}
export function copyText(t) {
  const done = () => toast('কপি হয়েছে ✓ / Copied');
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => showText(t)); else showText(t);
}
function showText(t) { modal(`<h3>কপি করুন</h3><textarea rows="4" readonly>${esc(t)}</textarea><div class="mrow"><button class="btn out" data-act="close">বন্ধ</button></div>`, 'copy'); }
export function download(name, content, type) {
  const b = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

/* ---------- event delegation (no inline JS → strict CSP) ---------- */
export const ACT = { close: () => closeModal() };
const run = (attr, e) => { const t = e.target.closest(`[${attr}]`); if (!t) return; const fn = ACT[t.getAttribute(attr)]; if (fn) { if (e.type === 'click' && t.tagName !== 'INPUT') e.preventDefault(); fn(t.dataset.arg, t, e); } };
document.addEventListener('click', e => run('data-act', e));
document.addEventListener('input', e => run('data-input', e));
document.addEventListener('change', e => run('data-change', e));
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-enter]')) { const fn = ACT[e.target.dataset.enter]; if (fn) { e.preventDefault(); fn(e.target.dataset.arg, e.target, e); } } });

/* ---------- theme (light / dark / auto) ---------- */
export const prefs = { lang: LS.get('nfc_lang', 'bn'), theme: LS.get('nfc_theme', 'auto') };
const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
export function applyTheme() {
  const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && mq && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0E141C' : '#0077D4';
  return dark;
}
applyTheme(); if (mq && mq.addEventListener) mq.addEventListener('change', applyTheme);
export const isDark = () => document.documentElement.dataset.theme === 'dark';
export function toggleTheme() { prefs.theme = isDark() ? 'light' : 'dark'; LS.set('nfc_theme', prefs.theme); applyTheme(); }
export function toggleLang() { prefs.lang = prefs.lang === 'bn' ? 'en' : 'bn'; LS.set('nfc_lang', prefs.lang); document.documentElement.lang = prefs.lang; }
document.documentElement.lang = prefs.lang;
export const L = (s, k) => ((prefs.lang === 'bn' ? (s[k + 'Bn'] || s[k + 'En']) : (s[k + 'En'] || s[k + 'Bn'])) || '');

/* ---------- QR, vCard, card artwork ---------- */
export function qrSvg(text, attrs = '') {
  const q = window.qrcode(0, 'M'); q.addData(text); q.make();
  let svg = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  if (attrs) svg = svg.replace('<svg', '<svg ' + attrs);
  return svg.replace('<svg', '<svg role="img" aria-label="QR code"');
}
export function siteBase(o) {
  const b = safeUrl(o && o.baseUrl) || (location.origin + location.pathname.replace(/[^/]*$/, ''));
  return b.replace(/#.*$/, '').replace(/(index|admin)\.html$/, '').replace(/\/?$/, '/');
}
export const cardUrl = (o, id) => siteBase(o) + '#/c/' + id;
export function vcard(s, o) {
  const e = v => String(v || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const ph = s.officePhone || o.phone, parts = String(s.nameEn || '').split(' '), last = parts.length > 1 ? parts.pop() : '';
  const v = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(last)};${e(parts.join(' '))};;;`, `FN:${e(s.nameEn)}`, `ORG:${e(o.officeNameEn)};${e(s.deptEn)}`, `TITLE:${e(s.titleEn)}`];
  if (s.phone) v.push(`TEL;TYPE=CELL:${digits(s.phone)}`);
  if (ph) v.push(`TEL;TYPE=WORK,VOICE:${digits(ph)}${s.ext ? ',' + digits(s.ext) : ''}`);
  if (s.email) v.push(`EMAIL;TYPE=INTERNET,WORK:${e(s.email)}`);
  if (o.addressEn) v.push(`ADR;TYPE=WORK:;;${e(o.addressEn)};;;;`);
  if (safeUrl(o.website)) v.push(`URL:${safeUrl(o.website)}`);
  v.push(`NOTE:${e('Digital card: ' + cardUrl(o, s.id))}`);
  const p = safePhoto(s.photo); if (p.startsWith('data:image/jpeg')) v.push('PHOTO;ENCODING=b;TYPE=JPEG:' + p.split(',')[1]);
  v.push('END:VCARD'); return v.join('\r\n');
}
let EMB64 = '';
export async function emblemData() {
  if (EMB64) return EMB64;
  try { const b = await (await fetch('assets/img/emblem.png')).blob(); EMB64 = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) { EMB64 = ''; }
  return EMB64;
}
const wrap = (str, n) => { const w = String(str).split(' '), out = []; let cur = ''; w.forEach(x => { if ((cur + ' ' + x).trim().length > n) { if (cur.trim()) out.push(cur.trim()); cur = x; } else cur += ' ' + x; }); if (cur.trim()) out.push(cur.trim()); return out; };
export function cardSvg(s, o, side, emb) {
  const X = v => esc(v || ''), W = 856, H = 540, [c1, c2] = themeOf(s), gid = 'g' + s.id;
  if (side === 'front') return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="85.6mm" height="54mm" viewBox="0 0 ${W} ${H}" role="img" aria-label="Card front">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" rx="32" fill="url(#${gid})"/><circle cx="760" cy="80" r="190" fill="#fff" opacity=".07"/><circle cx="90" cy="560" r="160" fill="#fff" opacity=".05"/>
    ${emb ? `<image href="${emb}" xlink:href="${emb}" x="50" y="48" width="104" height="80"/>` : ''}
    <text x="172" y="88" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700">${X(o.officeNameEn)}</text>
    <text x="172" y="122" fill="#fff" opacity=".88" font-family="Arial,Helvetica,sans-serif" font-size="19">${X(o.tagline2)}</text>
    <text x="50" y="420" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="44" font-weight="700">${X(s.nameEn)}</text>
    <text x="50" y="466" fill="#fff" opacity=".92" font-family="Arial,Helvetica,sans-serif" font-size="25">${X(s.titleEn)}${s.deptEn ? ' · ' + X(s.deptEn) : ''}</text>
    <g transform="translate(730,400) scale(3.6)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M6 8.3a6 6 0 0 1 0 7.4M9.5 5.5a10 10 0 0 1 0 13M13 3a14 14 0 0 1 0 18"/></g></svg>`;
  const qr = qrSvg(cardUrl(o, s.id), 'x="50" y="110" width="300" height="300"');
  const lines = [s.phone, s.email, o.addressEn, (safeUrl(o.website) || '').replace(/^https?:\/\//, '')].filter(Boolean);
  let y = 190, tl = '';
  lines.forEach(l => wrap(l, 32).forEach(p => { tl += `<text x="390" y="${y}" fill="#334" font-family="Arial,Helvetica,sans-serif" font-size="21">${X(p)}</text>`; y += 31; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="85.6mm" height="54mm" viewBox="0 0 ${W} ${H}" role="img" aria-label="Card back">
    <rect width="${W}" height="${H}" rx="32" fill="#fff" stroke="#e3e8ef" stroke-width="2"/><rect y="${H - 22}" width="${W}" height="22" fill="${c1}"/>
    ${qr}<text x="390" y="140" fill="${c1}" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="700">Tap or Scan</text>${tl}</svg>`;
}

/* ---------- default office settings & privacy text ---------- */
export const DEF_SETTINGS = {
 "officeNameEn": "UNESCO Dhaka Office",
 "officeNameBn": "ইউনেস্কো ঢাকা অফিস",
 "taglineEn": "United Nations Educational, Scientific and Cultural Organization",
 "taglineBn": "জাতিসংঘ শিক্ষা, বিজ্ঞান ও সংস্কৃতি সংস্থা",
 "addressEn": "House 122, Road 1, Block F, Banani, Dhaka 1213, Bangladesh",
 "addressBn": "বাড়ি ১২২, রোড ১, ব্লক এফ, বনানী, ঢাকা ১২১৩",
 "phone": "+880 2 222 71482",
 "email": "dhaka@unesco.org",
 "website": "https://www.unesco.org/en/fieldoffice/dhaka",
 "mapUrl": "https://maps.google.com/?q=House+122+Road+1+Block+F+Banani+Dhaka",
 "tagline2": "Education · Science · Culture · Communication",
 "baseUrl": "",
 "showDirectory": false
};
export const S = o => Object.assign({}, DEF_SETTINGS, o || {});
export const PRIVACY_DEF = {
  bn: 'এই পেজে দেখানো তথ্য সংশ্লিষ্ট স্টাফের সম্মতিতে শুধু পেশাগত যোগাযোগের জন্য প্রকাশ করা হয়েছে। আমরা আপনার কোনো ব্যক্তিগত তথ্য, IP ঠিকানা বা অবস্থান সংরক্ষণ করি না; শুধু কার্ডটি কতবার খোলা হয়েছে তার মোট সংখ্যা রাখা হয়। তথ্য সংশোধন বা মুছে ফেলার অনুরোধ অফিসের ইমেইলে পাঠান।',
  en: 'The information on this page is published with the staff member\'s consent, for professional contact only. We do not store your personal data, IP address or location; only the total number of times this card is opened is counted. To request correction or removal, please email the office.'
};

/* ---------- icons & profile texts ---------- */
/* ---------------- ICONS ---------------- */
const I = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="#25D366"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.2A11.8 11.8 0 0 0 1.7 17.8L0 24l6.3-1.7a11.8 11.8 0 0 0 5.7 1.4A11.8 11.8 0 0 0 20.4 3.6z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
  in: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1zM7.1 20.5H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>',
  office: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM21 14v.01M14 21h.01M17 17h4v4h-4"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  moon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>',
  sun: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  lock: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
  power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
  nfc: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M6 8.3a6 6 0 0 1 0 7.4M9.5 5.5a10 10 0 0 1 0 13M13 3a14 14 0 0 1 0 18"/></svg>'
};

/* ---------------- I18N (প্রোফাইল পেজ) ---------------- */
const TX = {
  bn: { call: 'কল', wa: 'হোয়াটসঅ্যাপ', mail: 'ইমেইল', share: 'শেয়ার', save: 'কন্টাক্ট সেভ করুন', mobile: 'মোবাইল', office: 'অফিস ফোন', ext: 'এক্সটেনশন', email: 'ইমেইল', addr: 'অফিসের ঠিকানা', web: 'ওয়েবসাইট', li: 'লিংকডইন', myqr: 'QR কোড', exch: 'আপনার তথ্য দিন', exchSub: 'আপনার যোগাযোগের তথ্য পাঠিয়ে দিন, যাতে আমি পরে যোগাযোগ করতে পারি।', yname: 'আপনার নাম', yphone: 'ফোন নম্বর', yemail: 'ইমেইল', yorg: 'প্রতিষ্ঠান', ymsg: 'বার্তা (ঐচ্ছিক)', sendWa: 'হোয়াটসঅ্যাপে পাঠান', sendMail: 'ইমেইলে পাঠান', cancel: 'বাতিল', qrSub: 'অন্য কেউ এই QR স্ক্যান করে প্রোফাইল দেখতে পারবেন', offT: 'কার্ডটি সক্রিয় নেই', offP: 'এই কার্ডটি বর্তমানে নিষ্ক্রিয় করা আছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।', nfT: 'প্রোফাইল পাওয়া যায়নি', nfP: 'লিংকটি সঠিক নয় অথবা প্রোফাইলটি মুছে ফেলা হয়েছে।', copied: 'লিংক কপি হয়েছে ✓', team: 'আমাদের টিম', need: 'নাম ও ফোন/ইমেইল দিন', exText: 'হ্যালো, আপনার ডিজিটাল কার্ড থেকে আমার তথ্য পাঠাচ্ছি:' },
  en: { call: 'Call', wa: 'WhatsApp', mail: 'Email', share: 'Share', save: 'Save Contact', mobile: 'Mobile', office: 'Office Phone', ext: 'Ext.', email: 'Email', addr: 'Office Address', web: 'Website', li: 'LinkedIn', myqr: 'QR Code', exch: 'Share Your Info', exchSub: 'Send me your contact details so I can get back to you.', yname: 'Your Name', yphone: 'Phone', yemail: 'Email', yorg: 'Organization', ymsg: 'Message (optional)', sendWa: 'Send via WhatsApp', sendMail: 'Send via Email', cancel: 'Cancel', qrSub: 'Others can scan this QR to open the profile', offT: 'Card Inactive', offP: 'This card is currently deactivated. Please contact the office for details.', nfT: 'Profile Not Found', nfP: 'The link is incorrect or the profile has been removed.', copied: 'Link copied ✓', team: 'Our Team', need: 'Please enter name and phone/email', exText: 'Hello, sharing my details from your digital card:' }
};

TX.bn.offline='ইন্টারনেট সংযোগ নেই। সংযোগ পেলে আবার চেষ্টা করুন।'; TX.en.offline='You are offline. Please try again when connected.';
export { I, TX };
