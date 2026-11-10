/* UNESCO Dhaka NFC Card — staff self-service form & online consent (v2.2) */
import { CFG, G, configured, esc, safeUrl, safePhoto, initials, $, toast, ACT, prefs, toggleLang, toggleTheme, isDark, S, PRIVACY_DEF, I } from './common.js';

export const CONSENT_VERSION = 'C-2026-11';
const P = new URLSearchParams(location.search), TOKEN = (P.get('t') || '').toLowerCase();
let F, db, AU, auth, INV = null, SET = {}, VERIFIED = '', DRAFT = {}, VIS = {}, SIG = '';

const TXT = {
  bn: {
    title: 'ডিজিটাল বিজনেস কার্ড — আপনার তথ্য ও সম্মতি', hello: 'আসসালামু আলাইকুম / নমস্কার', intro: 'অফিসের NFC বিজনেস কার্ডের জন্য নিচের তথ্যগুলো যাচাই করুন, কোনটি পাবলিক প্রোফাইলে দেখাবে তা বেছে নিন, এবং সম্মতি দিন। অ্যাডমিন অনুমোদন না করা পর্যন্ত কিছুই প্রকাশ হবে না।',
    s1: '১. আপনার তথ্য', s2: '২. কোনটি দেখাবে', s3: '৩. গোপনীয়তা নোটিশ ও সম্মতি', show: 'প্রোফাইলে দেখান', photo: 'প্রোফাইল ছবি', upPhoto: '📷 ছবি আপলোড', rm: 'সরান',
    agree: 'আমি গোপনীয়তা নোটিশটি পড়েছি এবং "প্রোফাইলে দেখান" চিহ্নিত আমার তথ্যগুলো অফিসের ডিজিটাল বিজনেস কার্ডে প্রকাশে সম্মতি দিচ্ছি। আমি যেকোনো সময় অফিসকে জানিয়ে এই সম্মতি প্রত্যাহার করতে পারব।',
    fullName: 'আপনার পুরো নাম (স্বাক্ষর হিসেবে)', sig: 'ই-স্বাক্ষর (ছবি আপলোড করুন)', sigHint: 'সাদা কাগজে সই করে ছবি তুলুন, অথবা স্বাক্ষরের ছবি/স্ক্যান দিন (JPG/PNG)।', upSig: '✍️ স্বাক্ষর আপলোড',
    submit: 'জমা দিন', sending: 'জমা হচ্ছে…', verified: 'ইমেইল যাচাই হয়েছে', notverified: 'Outlook/লিংকের মাধ্যমে খোলা',
    need: 'নাম ও পদবি (English) আবশ্যক', needAgree: 'সম্মতির ঘরে টিক দিন', needName: 'পুরো নাম লিখুন', needSig: 'ই-স্বাক্ষরের ছবি আপলোড করুন', badLink: 'LinkedIn লিংক https:// দিয়ে শুরু হতে হবে', badMail: 'ইমেইল সঠিক নয়',
    okT: 'ধন্যবাদ! আপনার তথ্য ও সম্মতি জমা হয়েছে।', okP: 'অ্যাডমিন পর্যালোচনা করে আপনার কার্ড সক্রিয় করবেন। এই পেজটি এখন বন্ধ করতে পারেন।',
    badT: 'লিংকটি সঠিক নয় বা মেয়াদ শেষ', badP: 'নতুন লিংকের জন্য অফিসের অ্যাডমিনের সাথে যোগাযোগ করুন।',
    doneT: 'আপনার কার্ড সক্রিয় হয়েছে ✓', doneP: 'তথ্য পরিবর্তন বা সম্মতি প্রত্যাহার করতে অফিসের অ্যাডমিনকে জানান।',
    subT: 'আপনার তথ্য ইতিমধ্যে জমা হয়েছে', subP: 'অ্যাডমিন পর্যালোচনা করছেন। কিছু বদলাতে চাইলে অ্যাডমিনকে জানান।',
    returned: 'অ্যাডমিন আপনার জমা দেওয়া তথ্য ফেরত পাঠিয়েছেন। কারণ:', expires: 'লিংকের মেয়াদ', loading: 'লোড হচ্ছে…', fail: 'জমা দেওয়া যায়নি। লিংকের মেয়াদ শেষ হতে পারে বা আগেই জমা হয়েছে। সমস্যা থাকলে অ্যাডমিনকে জানান।'
  },
  en: {
    title: 'Digital Business Card — Your details & consent', hello: 'Hello', intro: 'Please check your details for the office NFC business card, choose what appears on your public profile, and give your consent. Nothing is published until an admin approves it.',
    s1: '1. Your details', s2: '2. What to show', s3: '3. Privacy notice & consent', show: 'Show on profile', photo: 'Profile photo', upPhoto: '📷 Upload photo', rm: 'Remove',
    agree: 'I have read the privacy notice and consent to publishing my details marked "Show on profile" on the office digital business card. I can withdraw this consent at any time by informing the office.',
    fullName: 'Your full name (as signature)', sig: 'E-signature (upload an image)', sigHint: 'Sign on white paper and take a photo, or upload a signature image/scan (JPG/PNG).', upSig: '✍️ Upload signature',
    submit: 'Submit', sending: 'Submitting…', verified: 'Email verified', notverified: 'Opened via Outlook/link',
    need: 'Name and title (English) are required', needAgree: 'Please tick the consent box', needName: 'Please type your full name', needSig: 'Please upload your e-signature image', badLink: 'LinkedIn link must start with https://', badMail: 'Email is not valid',
    okT: 'Thank you! Your details and consent have been submitted.', okP: 'An admin will review and activate your card. You can close this page now.',
    badT: 'Link is invalid or expired', badP: 'Please contact the office admin for a new link.',
    doneT: 'Your card is active ✓', doneP: 'To change details or withdraw consent, please inform the office admin.',
    subT: 'Your details have already been submitted', subP: 'An admin is reviewing them. Contact the admin to change anything.',
    returned: 'The admin returned your submission. Reason:', expires: 'Link valid until', loading: 'Loading…', fail: 'Could not submit. The link may have expired or was already used. Please contact the admin.'
  }
};
const t = () => TXT[prefs.lang];
const FIELDS = [
  ['nameEn', 'Name (English) *', 'নাম (English) *', 120], ['nameBn', 'Name (Bangla)', 'নাম (বাংলা)', 120], ['titleEn', 'Title (English) *', 'পদবি (English) *', 150], ['titleBn', 'Title (Bangla)', 'পদবি (বাংলা)', 150],
  ['deptEn', 'Department (English)', 'বিভাগ (English)', 120], ['deptBn', 'Department (Bangla)', 'বিভাগ (বাংলা)', 120], ['phone', 'Mobile', 'মোবাইল নম্বর', 30], ['whatsapp', 'WhatsApp', 'হোয়াটসঅ্যাপ নম্বর', 30],
  ['email', 'Email', 'ইমেইল', 120], ['ext', 'Office extension', 'অফিস এক্সটেনশন', 10], ['linkedin', 'LinkedIn (https://…)', 'LinkedIn লিংক (https://…)', 400], ['bioEn', 'Short bio (English)', 'সংক্ষিপ্ত পরিচিতি (English)', 600], ['bioBn', 'Short bio (Bangla)', 'সংক্ষিপ্ত পরিচিতি (বাংলা)', 600]
];
const HID = ['phone', 'whatsapp', 'email', 'linkedin'];

async function boot() {
  if (!configured() || !/^[a-z0-9]{32}$/.test(TOKEN)) return shell(card(t().badT, t().badP));
  shell(`<p class="m" style="text-align:center;padding:40px">${t().loading}</p>`);
  const mods = [import(G + 'firebase-app.js'), import(G + 'firebase-firestore-lite.js'), import(G + 'firebase-auth.js')];
  if (CFG.recaptchaSiteKey) mods.push(import(G + 'firebase-app-check.js'));
  const [appM, fsM, auM, acM] = await Promise.all(mods);
  const app = appM.initializeApp(CFG.firebase);
  if (acM) acM.initializeAppCheck(app, { provider: new acM.ReCaptchaV3Provider(CFG.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
  F = fsM; AU = auM; db = F.getFirestore(app); auth = AU.getAuth(app);
  try { await AU.setPersistence(auth, AU.inMemoryPersistence); } catch (e) {}
  try { const d = await F.getDoc(F.doc(db, 'invites/' + TOKEN)); INV = d.exists() ? d.data() : null; } catch (e) { INV = null; }
  try { const s = await F.getDoc(F.doc(db, 'settings/office')); SET = S(s.exists() ? s.data() : {}); } catch (e) { SET = S({}); }
  if (!INV || !INV.expires || INV.expires < Date.now()) return shell(card(t().badT, t().badP));
  if (INV.status === 'approved') return shell(card(t().doneT, t().doneP));
  if (INV.status === 'submitted') return shell(card(t().subT, t().subP));
  // Firebase email-link verification (when the staff opened the automatic Firebase email)
  if (AU.isSignInWithEmailLink(auth, location.href)) {
    try { const c = await AU.signInWithEmailLink(auth, INV.email, location.href); VERIFIED = (c.user && c.user.emailVerified !== false) ? (c.user.email || '').toLowerCase() : ''; }
    catch (e) { VERIFIED = ''; }
    history.replaceState(null, '', location.pathname + '?t=' + TOKEN);
  }
  DRAFT = Object.assign({}, INV.prefill || {}); VIS = Object.assign({ phone: false, whatsapp: false, email: true, linkedin: true, photo: true }, INV.visibility || {});
  if (INV.lang && !localStorage.getItem('nfc_lang')) prefs.lang = INV.lang;
  form();
}
function shell(inner) {
  document.title = t().title;
  $('#app').innerHTML = `<main class="cf"><header class="cover cf-cover"><div class="emb"><img src="assets/img/emblem.png" alt="" width="44" height="34"><b>${esc(SET.officeNameEn || 'UNESCO Dhaka Office')}<small>${esc(t().title)}</small></b></div>
    <div class="tg"><button data-act="lang">${prefs.lang === 'bn' ? 'EN' : 'বাং'}</button><button data-act="theme" aria-label="theme">${isDark() ? I.sun : I.moon}</button></div></header>${inner}
    <footer class="foot"><img src="assets/img/logo.webp" alt="UNESCO" width="93" height="56"></footer></main>`;
}
const card = (h, p) => `<section class="panel cf-msg"><h1 class="h2">${esc(h)}</h1><p class="m">${esc(p)}</p></section>`;
function form() {
  const tt = t(), L = prefs.lang === 'bn', ph = safePhoto(DRAFT.photo);
  const visBox = k => `<label class="vis"><input type="checkbox" data-vis="${k}" ${VIS[k] ? 'checked' : ''}> <span>${tt.show}</span></label>`;
  const privacy = (L ? SET.privacyBn : SET.privacyEn) || PRIVACY_DEF[prefs.lang];
  shell(`
  <section class="panel"><p><b>${tt.hello}, ${esc(DRAFT.nameEn || INV.name || '')}</b></p><p class="m" style="margin-top:6px">${tt.intro}</p>
    <p class="hint">${VERIFIED ? `✅ ${tt.verified}: ${esc(VERIFIED)}` : `🔗 ${tt.notverified}`} · ${tt.expires}: ${new Date(INV.expires).toLocaleDateString(L ? 'bn-BD' : 'en-GB')}</p>
    ${INV.status === 'returned' && INV.returnNote ? `<div class="notice">↩️ ${tt.returned} <b>${esc(INV.returnNote)}</b></div>` : ''}</section>
  <section class="panel"><h3>${tt.s1}</h3>
    <div class="phw"><div class="a" id="phv">${ph ? `<img src="${ph}" alt="">` : esc(initials(DRAFT.nameEn))}</div>
      <div><label class="btn sec file">${tt.upPhoto}<input type="file" accept="image/*" class="hidden" data-change="cphoto"></label>
      ${ph ? `<button class="btn red" data-act="crmphoto">${tt.rm}</button>` : ''}<div style="margin-top:8px">${visBox('photo')}</div></div></div>
    <div class="grid2">${FIELDS.map(([k, en, bn, n]) => `<div ${k.startsWith('bio') ? 'class="full"' : ''}><label for="c_${k}" class="lrow"><span>${L ? bn : en}</span>${HID.includes(k) ? visBox(k) : ''}</label>${k.startsWith('bio') ? `<textarea id="c_${k}" rows="2" maxlength="${n}">${esc(DRAFT[k])}</textarea>` : `<input id="c_${k}" maxlength="${n}" value="${esc(DRAFT[k])}" ${k === 'email' ? 'type="email"' : k === 'linkedin' ? 'type="url"' : k === 'phone' || k === 'whatsapp' ? 'type="tel"' : ''}>`}</div>`).join('')}</div>
    <p class="hint">${tt.s2}: ${L ? '"প্রোফাইলে দেখান" টিক তুলে দিলে সেই তথ্য শুধু অফিসের অ্যাডমিন দেখবেন, কার্ড স্ক্যান করা কেউ দেখবেন না।' : 'Untick "Show on profile" to keep that detail visible to office admins only.'}</p></section>
  <section class="panel"><h3>${tt.s3}</h3><div class="privbox">${esc(privacy)}</div>
    <label class="sw agree"><input type="checkbox" id="c_agree"> <span>${tt.agree}</span></label>
    <label for="c_full">${tt.fullName}</label><input id="c_full" maxlength="120" autocomplete="name">
    <label>${tt.sig}</label><p class="hint" style="margin:0 0 8px">${tt.sigHint}</p>
    <div class="sigrow"><div class="sigbox" id="sigv">${SIG ? `<img src="${SIG}" alt="signature">` : '—'}</div><label class="btn sec file">${tt.upSig}<input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" data-change="csig"></label></div>
    <div class="mrow"><button class="btn big" id="csub" data-act="csubmit">${tt.submit}</button></div>
    <p class="hint">Consent version ${CONSENT_VERSION}</p></section>`);
}
function readForm() { FIELDS.forEach(([k]) => { const el = $('#c_' + k); if (el) DRAFT[k] = el.value.trim(); }); document.querySelectorAll('[data-vis]').forEach(el => VIS[el.dataset.vis] = el.checked); }
function resize(file, maxW, maxH, type, q, cb) {
  if (!file || !/^image\//.test(file.type)) return toast('JPG/PNG');
  const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { cb(img); }; img.src = r.result; }; r.readAsDataURL(file);
}
Object.assign(ACT, {
  lang: () => { readForm(); toggleLang(); INV && DRAFT ? form() : boot(); },
  theme: () => { readForm(); toggleTheme(); INV ? form() : boot(); },
  cphoto: (_, el) => resize(el.files[0], 0, 0, '', 0, img => { const c = document.createElement('canvas'), Z = 240; c.width = c.height = Z; const x = c.getContext('2d'); const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, Z, Z); readForm(); DRAFT.photo = c.toDataURL('image/jpeg', .78); form(); }),
  crmphoto: () => { readForm(); DRAFT.photo = ''; form(); },
  csig: (_, el) => resize(el.files[0], 0, 0, '', 0, img => { const W = Math.min(600, img.width), H = Math.round(img.height * W / img.width), c = document.createElement('canvas'); c.width = W; c.height = Math.min(H, 300); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, W, H); readForm(); const agree = $('#c_agree').checked, full = $('#c_full').value; SIG = c.toDataURL('image/jpeg', .8); form(); $('#c_agree').checked = agree; $('#c_full').value = full; }),
  csubmit: async () => {
    const tt = t(); readForm();
    if (!DRAFT.nameEn || !DRAFT.titleEn) return toast(tt.need);
    if (DRAFT.linkedin && !safeUrl(DRAFT.linkedin)) return toast(tt.badLink);
    if (DRAFT.email && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(DRAFT.email)) return toast(tt.badMail);
    if (!$('#c_agree').checked) return toast(tt.needAgree);
    const full = $('#c_full').value.trim(); if (full.length < 3) return toast(tt.needName);
    if (!SIG) return toast(tt.needSig);
    const data = {}; FIELDS.forEach(([k]) => data[k] = DRAFT[k] || '');
    const b = $('#csub'); b.disabled = true; b.textContent = tt.sending;
    try {
      await F.setDoc(F.doc(db, 'submissions/' + TOKEN), { staffId: INV.staffId, data, visibility: { phone: !!VIS.phone, whatsapp: !!VIS.whatsapp, email: !!VIS.email, linkedin: !!VIS.linkedin, photo: !!VIS.photo },
        photo: safePhoto(DRAFT.photo), signature: SIG, consent: true, fullName: full.slice(0, 120), consentVersion: CONSENT_VERSION, submittedAt: F.serverTimestamp(), verifiedEmail: VERIFIED, lang: prefs.lang });
      try { if (auth.currentUser) await AU.signOut(auth); } catch (e) {}
      shell(card(tt.okT, tt.okP)); window.scrollTo(0, 0);
    } catch (e) { console.error(e); b.disabled = false; b.textContent = tt.submit; toast(tt.fail); }
  }
});
boot().catch(e => { console.error(e); shell(card(t().badT, t().badP)); });
