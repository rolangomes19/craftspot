/* Aquiline homepage: scroll parallax, menus, tabs, industries, route map and split-flap board. No dependencies. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = () => mqReduce.matches;

/* Tune the hero scroll motion here. The photo drifts down at 0.28 of the scroll speed;
   the wing lags the page even more (0.86) while swinging anticlockwise at 0.04 degrees per pixel (16 degrees by 400px), so it lifts away more slowly than the picture. */
const PARALLAX = { photo: 0.28, wingDrift: 0.86, wingDeg: 0.04, copy: 0.12 };

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- Nav, hero and scroll-linked motion ---------- */
const nav = $('#nav'), hero = $('.hero'), media = $('.hero-media'), wing = $('.wing-tl'), copy = $('.hero-copy');
const stage = $('.fleet-stage'), livery = $('.livery-wrap');
let ticking = false;

function frame() {
  ticking = false;
  const y = scrollY;
  const h = hero.offsetHeight;
  // The nav stays clear over the hero so the wing can sweep behind the logo, and goes solid as the white curve arrives
  nav.classList.toggle('is-solid', y > h - 340);
  if (reduced()) return;
  if (y < h * 1.1) {
    media.style.transform = `translate3d(0, ${y * PARALLAX.photo}px, 0)`;
    wing.style.transform = `translate3d(0, ${y * PARALLAX.wingDrift}px, 0) rotate(${-y * PARALLAX.wingDeg}deg)`;
    copy.style.transform = `translate3d(0, ${y * PARALLAX.copy}px, 0)`;
    copy.style.opacity = Math.max(0, 1 - y / (h * 0.6));
  }
  const r = stage.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) {
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    livery.style.transform = `translate3d(${(1 - Math.min(1, p * 1.5)) * 80}px, 0, 0)`;
  }
}
const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue);
mqReduce.addEventListener('change', () => {
  if (reduced()) [media, wing, copy, livery].forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
  queue();
});
frame();

/* Pause control: stops the push-in, the stand-in for the background video */
const pause = $('.hero-pause');
pause.addEventListener('click', () => {
  const paused = pause.getAttribute('aria-pressed') !== 'true';
  pause.setAttribute('aria-pressed', paused);
  pause.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  $('.lbl', pause).textContent = paused ? 'Play' : 'Pause';
  hero.classList.toggle('is-paused', paused);
});
new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);

/* ---------- Menus ---------- */
const panels = { fleet: $('#mega-fleet'), sol: $('#mega-sol'), mobile: $('#mega-mobile') };
const menuBtns = $$('[data-menu]');
let openKey = null, closeTimer;

function setMenu(key) {
  clearTimeout(closeTimer);
  if (key === openKey) return;
  openKey = key;
  nav.classList.toggle('is-open', !!key);
  menuBtns.forEach(b => b.setAttribute('aria-expanded', b.dataset.menu === key));
  if (!key) return; // keep the old panel in place while the sheet folds away
  for (const k in panels) panels[k].hidden = k !== key;
  const p = panels[key];
  p.classList.remove('is-showing'); void p.offsetWidth; p.classList.add('is-showing');
}
const closeSoon = () => { clearTimeout(closeTimer); closeTimer = setTimeout(() => setMenu(null), 140); };

menuBtns.forEach(b => {
  b.addEventListener('mouseenter', () => { if (mqFine.matches && b.dataset.menu !== 'mobile') setMenu(b.dataset.menu); });
  b.addEventListener('click', e => {
    const key = b.dataset.menu;
    // A mouse click lands after hover already opened the menu, so it must not toggle it shut
    if (mqFine.matches && e.detail > 0 && key !== 'mobile') setMenu(key); else setMenu(openKey === key ? null : key);
  });
});
$$('.nav-links > a').forEach(a => a.addEventListener('mouseenter', () => setMenu(null)));
nav.addEventListener('mouseleave', closeSoon);
nav.addEventListener('mouseenter', () => clearTimeout(closeTimer));
nav.addEventListener('focusout', e => { if (openKey && e.relatedTarget && !nav.contains(e.relatedTarget)) setMenu(null); });
addEventListener('keydown', e => {
  if (e.key === 'Escape' && openKey) { const b = menuBtns.find(x => x.dataset.menu === openKey); setMenu(null); b && b.focus(); }
});
$('.mega').addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  setMenu(null);
  if (a.dataset.fleet) selectTab(a.dataset.fleet);
});

/* ---------- Hero-adjacent counters ---------- */
function countUp(el) {
  const to = +el.dataset.count, t0 = performance.now(), d = 1400;
  (function f(t) {
    const p = Math.min(1, (t - t0) / d);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}
const stats = $('.stats');
if (!reduced()) {
  const io = new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); $$('[data-count]', stats).forEach(countUp); } }, { threshold: 0.6 });
  io.observe(stats);
}

/* ---------- Card groups: one staggered entrance ---------- */
const rv = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); o.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' }); // not a threshold: a tall stacked grid on a phone would never reach it
$$('[data-rv]').forEach(el => rv.observe(el));

/* ---------- Industries ---------- */
const ac = (d, x = '') => `<path fill="currentColor" fill-opacity=".2" stroke="none" ${x} d="${d}"/>`;
const spark = '<path fill="currentColor" stroke="none" d="M41 2.5c.5 2.6 1.2 3.3 3.8 3.8-2.6.5-3.3 1.2-3.8 3.8-.5-2.6-1.2-3.3-3.8-3.8 2.6-.5 3.3-1.2 3.8-3.8z"/>';
const car = 'M5 31v-6.2a3 3 0 0 1 1.9-2.8L14 19l4.4-6.2a3 3 0 0 1 2.4-1.3H28a3 3 0 0 1 2.5 1.4L34.8 19l6.4 2.7A3 3 0 0 1 43 24.5V31a1.5 1.5 0 0 1-1.5 1.5H40M10 32.5H6.5A1.5 1.5 0 0 1 5 31M20 32.5h10M14 19h21';
const paw = 'M24 41c-5.5 0-9.8-2.3-9.8-6.2 0-4.8 4.3-10.3 9.8-10.3s9.8 5.5 9.8 10.3c0 3.9-4.3 6.2-9.8 6.2z';
const heart = 'M24 26s-9.5-5.8-9.5-12.6a5.2 5.2 0 0 1 9.5-2.9 5.2 5.2 0 0 1 9.5 2.9C33.5 20.2 24 26 24 26z';
const shield = 'M24 6 9 11.5v10.7c0 9.8 6.5 16.8 15 20.3 8.5-3.5 15-10.5 15-20.3V11.5z';
const drop = 'M24 5.5S11.5 19 11.5 28a12.5 12.5 0 0 0 25 0C36.5 19 24 5.5 24 5.5z';
const leaf = 'M8 38C8 22 18 12 36 10c1 20-8 30-26 28z';
const IND = [
  { n: 'E-commerce', k: 'ecommerce', p: 'Peak-season lift for marketplaces and integrators. Scheduled rotations and on-demand freighters keep fulfilment windows tight from hub to hub.', c: ['Scheduled rotations', 'Peak lift'],
    i: ac('M24 22 8 14.5 24 7l16 7.5z') + '<path d="M24 7 8 14.5v19L24 41l16-7.5v-19z"/><path d="M8 14.5 24 22l16-7.5M24 22v19M16 10.8l16 7.7"/>' },
  { n: 'Automotive', k: 'automotive', p: 'Production parts on line-down deadlines and finished vehicles on main-deck positions, moved between plants, ports and markets.', c: ['Line-down response', 'Vehicle loading'],
    i: ac('M17.5 19l3-4.5a1.5 1.5 0 0 1 1.2-.7h5.6a1.5 1.5 0 0 1 1.3.7l3 4.5z') + '<circle fill="currentColor" fill-opacity=".2" stroke="none" cx="15" cy="33" r="5"/><circle fill="currentColor" fill-opacity=".2" stroke="none" cx="35" cy="33" r="5"/>' + `<path d="${car}"/><circle cx="15" cy="33" r="5"/><circle cx="35" cy="33" r="5"/>` },
  { n: 'Live animals', k: 'animals', p: 'Horses, livestock and zoo transfers flown to IATA Live Animals Regulations, with attendants on board and handling planned at both ends.', c: ['IATA LAR', 'Attendants on board'],
    i: ac(paw) + `<path d="${paw}"/><ellipse cx="11.5" cy="22" rx="3.2" ry="4.6" transform="rotate(-18 11.5 22)"/><ellipse cx="19.5" cy="14" rx="3.4" ry="5"/><ellipse cx="29" cy="14" rx="3.4" ry="5"/><ellipse cx="36.5" cy="22" rx="3.2" ry="4.6" transform="rotate(18 36.5 22)"/>` },
  { n: 'Humanitarian', k: 'humanitarian', p: 'Relief cargo and evacuation flights mobilised in hours, coordinated with agencies, permits and ground teams on site.', c: ['Rapid mobilisation', 'Agency coordination'],
    i: ac(heart) + `<path d="${heart}"/><path d="M6 33.5c3 7.5 9.5 11 18 11s15-3.5 18-11"/><path d="M9.5 38.5c-1.5.4-3.2-.3-3.8-1.8M38.5 38.5c1.5.4 3.2-.3 3.8-1.8"/>` },
  { n: 'Oil and gas', k: 'oil', p: 'Drilling equipment, spares and crews flown to remote fields and offshore hubs, including dangerous goods by arrangement.', c: ['Remote fields', 'DG by arrangement'],
    i: ac('M11.7 29a12.3 12.3 0 0 0 24.6 0z') + `<path d="${drop}"/><path d="M18 30.5a6.5 6.5 0 0 0 6 6.5"/>` },
  { n: 'Perishables', k: 'perishables', p: 'Fresh produce, flowers and seafood moved under an unbroken cold chain, with temperature-logged handling from farm to market.', c: ['Cold chain', 'Temperature logging'],
    i: ac(leaf) + `<path d="${leaf}"/><path d="M8 38 27 19"/><path d="M39 33v12M33.8 36l10.4 6M44.2 36l-10.4 6"/>` },
  { n: 'Military and government', k: 'government', p: 'Logistics and personnel movements for ministries and defence agencies, flown with the clearances and discretion they require.', c: ['Diplomatic clearances', 'Secure handling'],
    i: ac(shield) + `<path d="${shield}"/><path d="M24 17.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z"/>` },
  { n: 'Outsized cargo', k: 'outsized', p: 'Engines, rotor blades and project cargo that will not fit a standard flight, planned around the 747 main-deck side door.', c: ['Main-deck loading', 'Project cargo'],
    i: ac('M10 15h28v22H10z') + '<path d="M10 15h28v22H10zM10 24h28M24 15v9M4 15h3.5M4 37h3.5M40.5 15H44M40.5 37H44M24 3.5v6M21 6.5l3-3 3 3"/>' },
];
const icon = (d, big) => `<svg class="ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${spark}</svg>`;
const acc = $('#acc');
acc.innerHTML = IND.map(d => `<li class="acard" tabindex="0"><div class="acard-short" aria-hidden="true">${icon(d.i)}<b>${d.n}</b></div><div class="acard-long">${icon(d.i)}<h3>${d.n}</h3><p>${d.p}</p><ul class="chips">${d.c.map(c => `<li>${c}</li>`).join('')}</ul><a class="link" href="#industries"><span>How we fly ${d.n.toLowerCase()}</span>${arrow}</a></div></li>`).join('');
const cards = $$('.acard', acc);
let intent;
function pick(i) {
  cards.forEach((c, j) => {
    const on = i === j;
    c.classList.toggle('is-active', on);
    on ? c.setAttribute('aria-current', 'true') : c.removeAttribute('aria-current');
    $('.acard-long', c).inert = !on;
    $('.acard-short', c).setAttribute('aria-hidden', on);
  });
}
cards.forEach((c, i) => {
  // A short pause before opening stops the row flickering as the pointer crosses it
  c.addEventListener('mouseenter', () => { clearTimeout(intent); intent = setTimeout(() => pick(i), 80); });
  c.addEventListener('mouseleave', () => clearTimeout(intent));
  c.addEventListener('focus', () => pick(i));
  c.addEventListener('click', () => pick(i));
  c.addEventListener('keydown', e => {
    if (e.target !== c) return;
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    cards[(i + d + cards.length) % cards.length].focus();
  });
});
pick(0);

/* ---------- Fleet tabs ---------- */
const tabsEl = $('.tabs'), tabs = $$('.tab'), fleetPanels = { cargo: $('#panel-cargo'), pax: $('#panel-pax') }, more = $('#fleet-more');
const keys = ['cargo', 'pax'];
function placeTab() {
  const t = tabs.find(x => x.getAttribute('aria-selected') === 'true');
  tabsEl.style.setProperty('--x', t.offsetLeft + 'px');
  tabsEl.style.setProperty('--w', t.offsetWidth + 'px');
}
function selectTab(k, focus) {
  tabs.forEach((t, i) => { const on = keys[i] === k; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
  for (const key in fleetPanels) {
    const p = fleetPanels[key], on = key === k, wasHidden = p.hidden;
    p.hidden = !on;
    if (on && wasHidden) { p.classList.remove('is-showing'); void p.offsetWidth; p.classList.add('is-showing'); }
  }
  more.firstChild.textContent = `Learn more about our ${k === 'cargo' ? 'cargo' : 'passenger'} aircraft `;
  placeTab();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(keys[i]));
  t.addEventListener('keydown', e => {
    const to = { ArrowRight: 1 - i, ArrowLeft: 1 - i, Home: 0, End: 1 }[e.key]; // two tabs: either arrow flips to the other one
    if (to === undefined) return;
    e.preventDefault();
    selectTab(keys[to], true);
  });
});
placeTab();
requestAnimationFrame(() => tabsEl.classList.add('is-ready'));
addEventListener('resize', placeTab);
document.fonts && document.fonts.ready.then(placeTab);

/* ---------- Network: one list drives the pins, the routes and the board ---------- */
const AIR = [
  ['SHJ', 'Sharjah', 'United Arab Emirates', 43.52, 34.53, 'Hub'], ['KIV', 'Chișinău', 'Moldova', 29.15, 15.24, 'Base'],
  ['LGG', 'Liège', 'Belgium', 16.45, 11.93], ['IST', 'Istanbul', 'Türkiye', 29.05, 20.30], ['CAI', 'Cairo', 'Egypt', 30.49, 30.25],
  ['ADD', 'Addis Ababa', 'Ethiopia', 34.49, 49.13], ['NBO', 'Nairobi', 'Kenya', 33.48, 58.32], ['LOS', 'Lagos', 'Nigeria', 15.31, 51.27],
  ['JNB', 'Johannesburg', 'South Africa', 28.78, 80.48], ['ALA', 'Almaty', 'Kazakhstan', 55.16, 18.44], ['DEL', 'Delhi', 'India', 55.19, 31.64],
  ['HKG', 'Hong Kong', 'Hong Kong SAR', 75.09, 37.22], ['SIN', 'Singapore', 'Singapore', 69.72, 55.93], ['SYD', 'Sydney', 'Australia', 95.23, 87.46, '', 'l'],
];
const net = $('#network'), pinsEl = $('#pins'), routesEl = $('#routes'), boardEl = $('#board');
const xy = a => [a[3] * 18.5, a[4] * 11.2]; // percent of the map box to its 1850 x 1120 drawing space
const [hx, hy] = xy(AIR[0]);

pinsEl.innerHTML = AIR.map(a => `<div class="pin${a[5] === 'Hub' ? ' hub' : ''}${a[6] ? ' l' : ''}" data-code="${a[0]}" style="left:${a[3]}%;top:${a[4]}%"><i></i><span>${a[0]}</span></div>`).join('');
routesEl.innerHTML = AIR.slice(1).map((a, i) => {
  const [x, y] = xy(a), mx = (hx + x) / 2, my = (hy + y) / 2 - Math.hypot(x - hx, y - hy) * 0.2;
  return `<path data-code="${a[0]}" pathLength="1" style="--i:${i}" d="M${hx.toFixed(1)} ${hy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
}).join('');

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const tile = ch => `<b class="fl" data-c="${ch}"><i class="up"><u>${ch}</u></i><i class="lo"><u>${ch}</u></i><i class="fu"><u></u></i><i class="fd"><u></u></i></b>`;
const rowHTML = a => `<li><button type="button" class="row" data-code="${a[0]}" aria-pressed="false" aria-label="${a[1]}, ${a[2]}, ${a[0]}${a[5] ? ', ' + a[5].toLowerCase() : ''}. Show route on map."><span class="flaps" aria-hidden="true">${[...a[0]].map(tile).join('')}</span><span class="city">${a[1]}<small>${a[2]}</small></span>${a[5] ? `<span class="tag${a[5] === 'Base' ? ' base' : ''}">${a[5]}</span>` : '<span></span>'}</button></li>`;
boardEl.innerHTML = [AIR.slice(0, 7), AIR.slice(7)].map(c => `<ul>${c.map(rowHTML).join('')}</ul>`).join('');

/* Route highlight: hover or focus previews, a click pins */
let hover = null, pinned = null;
function light() {
  const code = hover || pinned;
  routesEl.classList.toggle('has-on', !!code);
  $$('[data-code]', net).forEach(el => {
    const on = !!code && (el.dataset.code === code || (code === 'SHJ' && el.tagName === 'path'));
    el.classList.toggle('is-on', on);
  });
}
const setHover = c => { if (hover !== c) { hover = c; light(); } };
boardEl.addEventListener('mouseover', e => { const r = e.target.closest('.row'); if (r) setHover(r.dataset.code); });
boardEl.addEventListener('mouseleave', () => setHover(null));
boardEl.addEventListener('focusin', e => { const r = e.target.closest('.row'); if (r) setHover(r.dataset.code); });
boardEl.addEventListener('focusout', () => setHover(null));
boardEl.addEventListener('click', e => {
  const r = e.target.closest('.row');
  if (!r) return;
  pinned = pinned === r.dataset.code ? null : r.dataset.code;
  $$('.row', boardEl).forEach(x => x.setAttribute('aria-pressed', x.dataset.code === pinned));
  light();
});
pinsEl.addEventListener('mouseover', e => { const p = e.target.closest('.pin'); if (p) setHover(p.dataset.code); });
pinsEl.addEventListener('mouseleave', () => setHover(null));

/* Split-flap. Each step drops the old top half and raises the new bottom half over static halves;
   a tile walks the alphabet forward to its letter, the way a real board does. */
const HALF = 32; // ms per half-flip
const flaps = $$('.fl', boardEl);
const row = el => el.closest('.row');
function setChar(t, ch) {
  t.dataset.c = ch;
  $$('u', t).forEach((u, i) => { u.textContent = i < 2 ? ch : ''; });
}
async function step(t, ch) {
  const [up, lo, fu, fd] = $$('i', t);
  $('u', up).textContent = ch;
  $('u', fu).textContent = t.dataset.c;
  $('u', fd).textContent = ch;
  const a = fu.animate([{ transform: 'rotateX(0deg)', opacity: 1 }, { transform: 'rotateX(-90deg)', opacity: 1 }], { duration: HALF, easing: 'ease-in', fill: 'forwards' });
  await a.finished;
  const b = fd.animate([{ transform: 'rotateX(90deg)', opacity: 1 }, { transform: 'rotateX(0deg)', opacity: 1 }], { duration: HALF, easing: 'ease-out', fill: 'forwards' });
  await b.finished;
  $('u', lo).textContent = ch; t.dataset.c = ch; // settle and release in the same task so no frame shows a gap
  a.cancel(); b.cancel();
}
async function spin(t, target, full) {
  if (t._busy) return;
  t._busy = true;
  let n = (A.indexOf(target) - A.indexOf(t.dataset.c) + 26) % 26;
  if (!n && full) n = 26;
  for (let k = 1; k <= n; k++) await step(t, A[(A.indexOf(t.dataset.c) + 1) % 26]);
  t._busy = false;
}
const target = t => t.closest('.row').dataset.code[[...t.parentNode.children].indexOf(t)];

function boardLive() {
  boardEl.parentNode.classList.add('is-live');
  if (reduced()) return;
  $$('.row', boardEl).forEach((r, ri) => $$('.fl', r).forEach((t, ci) => {
    const to = target(t);
    setChar(t, A[(A.indexOf(to) - (5 + Math.floor(Math.random() * 9)) + 26) % 26]); // start a few letters short of the answer
    setTimeout(() => spin(t, to), (ri % 7) * 90 + ci * 70);
  }));
}
// Every so often one row cycles through the alphabet and lands on the same code, so the board reads as live
let boardInView = false, shuffle;
function ambient() {
  clearInterval(shuffle);
  if (reduced()) return;
  shuffle = setInterval(() => {
    if (!boardInView || document.hidden || boardEl.matches(':hover')) return;
    const r = $$('.row', boardEl)[Math.floor(Math.random() * AIR.length)];
    $$('.fl', r).forEach((t, ci) => setTimeout(() => spin(t, target(t), true), ci * 120));
  }, 8000);
}
new IntersectionObserver(([e]) => { boardInView = e.isIntersecting; }, { threshold: 0.3 }).observe(boardEl);
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); net.classList.add('is-in'); } }, { threshold: 0.2 }).observe(net);
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); boardLive(); ambient(); } }, { threshold: 0.35 }).observe(boardEl);

/* ---------- Partners ---------- */
$('#marquee').innerHTML = Array.from({ length: 16 }, (_, i) => `<li class="logo-slot"${i >= 8 ? ' aria-hidden="true"' : ''}>Partner logo ${String(i % 8 + 1).padStart(2, '0')}</li>`).join('');
})();
