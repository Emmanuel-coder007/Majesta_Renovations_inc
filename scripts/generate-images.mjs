/**
 * generate-images.mjs
 * ---------------------------------------------------------------------------
 * Builds every image asset in /public/images from original vector scenes and
 * rasterises them to WebP with sharp.
 *
 * WHY THIS EXISTS
 * Majesta Renovations has no real project photography and there was no prior
 * website to pull from. Rather than ship stock photos of somebody else's work
 * — or, worse, imply these are Majesta's completed projects — every asset here
 * is an original geometric illustration of the *kind* of work described. They
 * are deliberately illustrative, not photorealistic, so no visitor mistakes
 * them for a portfolio.
 *
 * Deleting this script is fine once real photos land. See README →
 * "Swapping in real photography".
 *
 * Outputs:
 *   public/images/*.webp          scene art at the right aspect ratios
 *   public/images/CREDITS.md      auto-generated inventory
 *   content/image-blur.json       tiny base64 LQIP per image, for next/image
 *   src/app/icon.png              favicon (Next App Router convention)
 *   src/app/apple-icon.png        apple touch icon
 *   public/icons/*.png            PWA manifest icons
 *
 * Run: npm run images
 * ---------------------------------------------------------------------------
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = join(ROOT, 'public', 'images');
const ICONS_DIR = join(ROOT, 'public', 'icons');
const APP_DIR = join(ROOT, 'src', 'app');
const CONTENT_DIR = join(ROOT, 'content');

/* -------------------------------------------------------------------------- */
/* Palette — one warm-neutral grade across the whole set                       */
/* -------------------------------------------------------------------------- */

const P = {
  ink: '#14120F',
  charcoal: '#26221D',
  slate: '#3D3730',
  stone: '#6B6156',
  clay: '#9A8B7A',
  sand: '#C4B5A2',
  linen: '#DED2C0',
  bone: '#EFE6D8',
  paper: '#F7F1E7',
  white: '#FCFAF6',

  oak: '#B98A55',
  oakDark: '#8E6539',
  oakLight: '#D7AF7E',
  walnut: '#6E4B2E',

  accent: '#FF6A00',
  accentSoft: '#F4A15C',
  accentDeep: '#C64F00',

  glass: '#BFCBC9',
  glassDeep: '#8FA3A1',
  steel: '#A8AAA6',

  sky: '#CFE0E6',
  skyWarm: '#F0DCC2',
  grass: '#8C9A6E',

  // "before" / dated palette
  datedWall: '#C9BE9A',
  datedCab: '#7C5B39',
  datedCabLight: '#9C7A50',
  datedFloor: '#A99C7E',
  concrete: '#B4B0A8',
  concreteDark: '#8E8A82',
};

/* -------------------------------------------------------------------------- */
/* Tiny deterministic PRNG so rebuilds are byte-identical                      */
/* -------------------------------------------------------------------------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* SVG primitives                                                              */
/* -------------------------------------------------------------------------- */

const n = (v) => Math.round(v * 100) / 100;

const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, w))}" height="${n(Math.max(0, h))}" fill="${fill}" ${extra}/>`;

const poly = (points, fill, extra = '') =>
  `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="${fill}" ${extra}/>`;

const line = (x1, y1, x2, y2, stroke, w = 2, extra = '') =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(w)}" ${extra}/>`;

const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" ${extra}/>`;

const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;

/* -------------------------------------------------------------------------- */
/* Scene furniture — reusable builders                                         */
/* -------------------------------------------------------------------------- */

/** Back wall + floor with a horizon line. Returns the horizon y. */
function room(w, h, opts = {}) {
  const {
    horizon = h * 0.68,
    wall = P.bone,
    wallShade = P.linen,
    floor = P.oak,
    floorShade = P.oakDark,
    planks = 9,
  } = opts;

  const out = [
    rect(0, 0, w, horizon, wall),
    // soft vertical falloff on the wall
    rect(0, 0, w, horizon, 'url(#wallGrad)'),
    rect(0, horizon, w, h - horizon, floor),
    rect(0, horizon, w, h - horizon, 'url(#floorGrad)'),
    // baseboard
    rect(0, horizon - h * 0.018, w, h * 0.018, wallShade),
    line(0, horizon, w, horizon, floorShade, Math.max(1, h * 0.003), 'opacity="0.5"'),
  ];

  // perspective floor planks converging slightly toward centre
  for (let i = 1; i < planks; i += 1) {
    const t = i / planks;
    const xTop = w * t;
    const xBottom = w * (0.5 + (t - 0.5) * 1.9);
    out.push(line(xTop, horizon, xBottom, h, floorShade, Math.max(1, w * 0.0015), 'opacity="0.28"'));
  }
  return { svg: out.join(''), horizon };
}

/** Base cabinet run with a countertop and door reveals. */
function baseCabinets({ x, y, w, h, doors = 4, body = P.linen, top = P.charcoal, handle = P.steel }) {
  const counterH = h * 0.11;
  const out = [
    rect(x, y, w, h, body),
    rect(x, y, w, h, 'url(#cabGrad)'),
    rect(x, y - counterH, w, counterH, top),
    rect(x, y - counterH, w, counterH * 0.32, P.slate, 'opacity="0.55"'),
  ];
  const dw = w / doors;
  for (let i = 0; i < doors; i += 1) {
    const dx = x + i * dw;
    out.push(rect(dx + dw * 0.04, y + h * 0.05, dw * 0.92, h * 0.9, 'none', `stroke="${P.clay}" stroke-width="${n(h * 0.012)}" opacity="0.5"`));
    out.push(rect(dx + dw * 0.5 - dw * 0.16, y + h * 0.14, dw * 0.32, h * 0.022, handle, 'opacity="0.85"'));
  }
  out.push(rect(x, y + h, w, h * 0.06, P.stone, 'opacity="0.35"')); // toe kick shadow
  return out.join('');
}

/** Upper wall cabinets. */
function upperCabinets({ x, y, w, h, doors = 3, body = P.paper }) {
  const out = [rect(x, y, w, h, body), rect(x, y, w, h, 'url(#cabGrad)')];
  const dw = w / doors;
  for (let i = 0; i < doors; i += 1) {
    const dx = x + i * dw;
    out.push(rect(dx + dw * 0.04, y + h * 0.06, dw * 0.92, h * 0.88, 'none', `stroke="${P.clay}" stroke-width="${n(h * 0.014)}" opacity="0.45"`));
    out.push(rect(dx + dw * 0.34, y + h * 0.76, dw * 0.32, h * 0.03, P.steel, 'opacity="0.8"'));
  }
  out.push(rect(x, y + h, w, h * 0.05, P.stone, 'opacity="0.28"'));
  return out.join('');
}

/** Kitchen island with a stone top and optional stools. */
function island({ x, y, w, h, stools = 0, body = P.charcoal, top = P.paper }) {
  const topH = h * 0.13;
  const out = [
    rect(x, y, w, h, body),
    rect(x, y, w, h, 'url(#darkGrad)'),
    rect(x - w * 0.02, y - topH, w * 1.04, topH, top),
    rect(x - w * 0.02, y - topH, w * 1.04, topH * 0.3, P.linen),
  ];
  for (let i = 0; i < stools; i += 1) {
    const sx = x + (w / (stools + 1)) * (i + 1);
    const sy = y + h * 0.42;
    out.push(rect(sx - w * 0.035, sy, w * 0.07, h * 0.09, P.oak, 'rx="4"'));
    out.push(rect(sx - w * 0.006, sy + h * 0.09, w * 0.012, h * 0.5, P.slate));
    out.push(rect(sx - w * 0.03, sy + h * 0.58, w * 0.06, h * 0.02, P.slate, 'rx="3"'));
  }
  return out.join('');
}

/** Window with mullions and a warm light spill. */
function windowFrame({ x, y, w, h, cols = 2, rows = 1, glass = P.sky, warm = true }) {
  const frame = Math.max(3, w * 0.035);
  const out = [
    rect(x - frame, y - frame, w + frame * 2, h + frame * 2, P.paper),
    rect(x, y, w, h, glass),
    rect(x, y, w, h, warm ? 'url(#glassWarm)' : 'url(#glassCool)'),
  ];
  for (let i = 1; i < cols; i += 1) out.push(rect(x + (w / cols) * i - frame * 0.35, y, frame * 0.7, h, P.paper));
  for (let i = 1; i < rows; i += 1) out.push(rect(x, y + (h / rows) * i - frame * 0.35, w, frame * 0.7, P.paper));
  out.push(rect(x, y, w, h, 'none', `stroke="${P.clay}" stroke-width="${n(frame * 0.5)}" opacity="0.5"`));
  return out.join('');
}

/** Light shaft cast from a window onto the floor. */
function lightShaft(x, y, w, h, spread = 1.6) {
  return poly(
    [
      [x, y],
      [x + w, y],
      [x + w * spread, h],
      [x - w * (spread - 1) * 0.4, h],
    ],
    'url(#shaft)',
    'opacity="0.5"',
  );
}

function pendant({ x, y, drop, r, color = P.charcoal }) {
  return [
    line(x, y, x, y + drop, P.slate, Math.max(1.5, r * 0.09)),
    path(`M ${n(x - r)} ${n(y + drop + r * 0.8)} L ${n(x - r * 0.35)} ${n(y + drop)} L ${n(x + r * 0.35)} ${n(y + drop)} L ${n(x + r)} ${n(y + drop + r * 0.8)} Z`, color),
    `<ellipse cx="${n(x)}" cy="${n(y + drop + r * 0.8)}" rx="${n(r)}" ry="${n(r * 0.22)}" fill="${P.accentSoft}" opacity="0.9"/>`,
  ].join('');
}

function recessedLights(y, w, count, r) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const x = (w / (count + 1)) * (i + 1);
    out.push(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r)}" ry="${n(r * 0.4)}" fill="${P.paper}" opacity="0.95"/>`);
    out.push(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 0.55)}" ry="${n(r * 0.22)}" fill="${P.accentSoft}" opacity="0.85"/>`);
  }
  return out.join('');
}

/** Tile grid — set `offset` for a running-bond (subway) pattern. */
function tileGrid({ x, y, w, h, cols, rows, fill, grout = P.linen, offset = false, opacity = 1 }) {
  const tw = w / cols;
  const th = h / rows;
  const g = Math.max(1.2, tw * 0.045);
  const out = [rect(x, y, w, h, grout, `opacity="${opacity}"`)];
  for (let r = 0; r < rows; r += 1) {
    const shift = offset && r % 2 === 1 ? tw / 2 : 0;
    for (let c = -1; c <= cols; c += 1) {
      const tx = x + c * tw + shift;
      const tileW = Math.min(tx + tw, x + w) - Math.max(tx, x);
      if (tileW <= 0) continue;
      out.push(rect(Math.max(tx, x) + g / 2, y + r * th + g / 2, tileW - g, th - g, fill, `opacity="${opacity}"`));
    }
  }
  return out.join('');
}

/** Exposed stud wall with a top and bottom plate. */
function studWall({ x, y, w, h, spacing, wood = P.oakLight, shade = P.oakDark }) {
  const out = [rect(x, y, w, h, P.slate, 'opacity="0.25"')];
  const count = Math.max(2, Math.round(w / spacing));
  const step = w / count;
  for (let i = 0; i <= count; i += 1) {
    const sx = x + i * step;
    out.push(rect(sx - step * 0.06, y, step * 0.12, h, wood));
    out.push(rect(sx + step * 0.02, y, step * 0.04, h, shade, 'opacity="0.6"'));
  }
  out.push(rect(x, y, w, h * 0.045, wood)); // top plate
  out.push(rect(x, y + h - h * 0.045, w, h * 0.045, wood)); // bottom plate
  return out.join('');
}

/** Exposed ceiling joists seen from below. */
function joists({ x, y, w, h, count, wood = P.oakLight }) {
  const out = [rect(x, y, w, h, P.slate, 'opacity="0.3"')];
  const step = w / count;
  for (let i = 0; i < count; i += 1) {
    out.push(rect(x + i * step + step * 0.2, y, step * 0.34, h, wood));
    out.push(rect(x + i * step + step * 0.46, y, step * 0.08, h, P.charcoal, 'opacity="0.35"'));
  }
  return out.join('');
}

function sofa({ x, y, w, h, color = P.clay }) {
  return [
    rect(x, y + h * 0.35, w, h * 0.5, color, 'rx="6"'),
    rect(x + w * 0.03, y, w * 0.94, h * 0.45, color, 'rx="8"'),
    rect(x + w * 0.03, y + h * 0.3, w * 0.94, h * 0.12, P.stone, 'rx="4" opacity="0.35"'),
    rect(x, y + h * 0.35, w * 0.08, h * 0.5, P.stone, 'rx="6" opacity="0.3"'),
    rect(x + w * 0.92, y + h * 0.35, w * 0.08, h * 0.5, P.stone, 'rx="6" opacity="0.3"'),
    rect(x + w * 0.08, y + h * 0.85, w * 0.05, h * 0.13, P.walnut),
    rect(x + w * 0.87, y + h * 0.85, w * 0.05, h * 0.13, P.walnut),
  ].join('');
}

function rug({ cx, y, w, h, color = P.sand }) {
  return [
    `<ellipse cx="${n(cx)}" cy="${n(y)}" rx="${n(w / 2)}" ry="${n(h / 2)}" fill="${color}" opacity="0.85"/>`,
    `<ellipse cx="${n(cx)}" cy="${n(y)}" rx="${n(w / 2.6)}" ry="${n(h / 2.6)}" fill="none" stroke="${P.stone}" stroke-width="${n(h * 0.05)}" opacity="0.35"/>`,
  ].join('');
}

function plant({ x, y, s, color = P.grass }) {
  const out = [
    path(`M ${n(x - s * 0.28)} ${n(y)} L ${n(x + s * 0.28)} ${n(y)} L ${n(x + s * 0.2)} ${n(y + s * 0.42)} L ${n(x - s * 0.2)} ${n(y + s * 0.42)} Z`, P.oakDark),
  ];
  for (let i = -2; i <= 2; i += 1) {
    const lean = i * s * 0.16;
    out.push(
      path(
        `M ${n(x)} ${n(y)} Q ${n(x + lean * 1.4)} ${n(y - s * 0.55)} ${n(x + lean)} ${n(y - s * 0.95)}`,
        'none',
        `stroke="${color}" stroke-width="${n(s * 0.075)}" stroke-linecap="round" opacity="0.9"`,
      ),
    );
  }
  return out.join('');
}

/**
 * Worker silhouette — deliberately abstract. Faces and hands are the classic
 * failure mode of generated imagery, so there are none here: figures are
 * simplified shapes reading as "person on site", nothing more.
 */
function worker({ x, y, s, shirt = P.accent, arms = 'reach', flip = false }) {
  const d = flip ? -1 : 1;
  const arm = (x1, y1, x2, y2) =>
    path(
      `M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}`,
      'none',
      `stroke="${shirt}" stroke-width="${n(s * 0.095)}" stroke-linecap="round"`,
    );

  const shoulder = y - s * 1.08;
  const out = [
    // legs — slight stance so the figure does not read as standing to attention
    rect(x - s * 0.15, y - s * 0.58, s * 0.11, s * 0.58, P.slate, 'rx="3"'),
    rect(x + s * 0.04, y - s * 0.58, s * 0.11, s * 0.58, P.charcoal, 'rx="3"'),
    // torso, tapered
    path(
      `M ${n(x - s * 0.18)} ${n(y - s * 1.16)} L ${n(x + s * 0.18)} ${n(y - s * 1.16)} L ${n(x + s * 0.15)} ${n(y - s * 0.56)} L ${n(x - s * 0.15)} ${n(y - s * 0.56)} Z`,
      shirt,
    ),
    // head
    circle(x, y - s * 1.29, s * 0.115, P.sand),
    // hard hat — dome sits above the crown, brim across the forehead
    path(
      `M ${n(x - s * 0.155)} ${n(y - s * 1.37)} Q ${n(x)} ${n(y - s * 1.58)} ${n(x + s * 0.155)} ${n(y - s * 1.37)} Z`,
      P.accent,
    ),
    rect(x - s * 0.19, y - s * 1.385, s * 0.38, s * 0.04, P.accent, 'rx="2"'),
  ];

  if (arms === 'reach') {
    // one arm up to the work, one down at the side — reads as working, not waving
    out.push(arm(x + d * s * 0.15, shoulder, x + d * s * 0.36, y - s * 1.4));
    out.push(arm(x - d * s * 0.15, shoulder, x - d * s * 0.24, y - s * 0.78));
  } else if (arms === 'up') {
    out.push(arm(x + d * s * 0.15, shoulder, x + d * s * 0.34, y - s * 1.42));
    out.push(arm(x - d * s * 0.15, shoulder, x - d * s * 0.3, y - s * 1.36));
  } else {
    // both forward and down — leaning over a bench or drawings
    out.push(arm(x + d * s * 0.15, shoulder, x + d * s * 0.34, y - s * 0.76));
    out.push(arm(x - d * s * 0.15, shoulder, x - d * s * 0.2, y - s * 0.74));
  }
  return out.join('');
}

function sawhorse({ x, y, w, h, wood = P.oak }) {
  return [
    rect(x, y, w, h * 0.12, wood, 'rx="3"'),
    line(x + w * 0.12, y + h * 0.1, x + w * 0.02, y + h, wood, w * 0.045),
    line(x + w * 0.2, y + h * 0.1, x + w * 0.3, y + h, wood, w * 0.045),
    line(x + w * 0.8, y + h * 0.1, x + w * 0.7, y + h, wood, w * 0.045),
    line(x + w * 0.88, y + h * 0.1, x + w * 0.98, y + h, wood, w * 0.045),
  ].join('');
}

function spiritLevel({ x, y, w, h }) {
  return [
    rect(x, y, w, h, P.accent, 'rx="3"'),
    rect(x, y + h * 0.3, w, h * 0.4, P.accentDeep, 'opacity="0.4"'),
    rect(x + w * 0.44, y + h * 0.18, w * 0.12, h * 0.64, P.paper, 'rx="2"'),
    circle(x + w * 0.5, y + h * 0.5, h * 0.16, P.grass),
  ].join('');
}

function ladder({ x, y, w, h }) {
  const out = [
    line(x, y + h, x + w * 0.18, y, P.oakLight, w * 0.09),
    line(x + w, y + h, x + w * 0.82, y, P.oakLight, w * 0.09),
  ];
  for (let i = 1; i <= 5; i += 1) {
    const t = i / 6;
    const rungY = y + h - h * t;
    out.push(line(x + w * 0.18 * t, rungY, x + w - w * 0.18 * t, rungY, P.oak, w * 0.06));
  }
  return out.join('');
}

function dropSheet({ x, y, w, h }) {
  const r = mulberry32(7);
  const pts = [`M ${n(x)} ${n(y + h)}`];
  const steps = 8;
  for (let i = 0; i <= steps; i += 1) {
    const px = x + (w / steps) * i;
    const py = y + h * (0.1 + r() * 0.35);
    pts.push(`L ${n(px)} ${n(py)}`);
  }
  pts.push(`L ${n(x + w)} ${n(y + h)} Z`);
  return [
    path(pts.join(' '), P.paper, 'opacity="0.92"'),
    path(pts.join(' '), 'url(#sheetGrad)', 'opacity="0.6"'),
  ].join('');
}

function doorway({ x, y, w, h, frame = P.paper, inner = P.stone }) {
  const f = w * 0.07;
  return [
    rect(x - f, y - f, w + f * 2, h + f, frame),
    rect(x, y, w, h, inner),
    rect(x, y, w, h, 'url(#darkGrad)'),
  ].join('');
}

/** Simple exterior house volume for the addition / exterior scenes. */
function houseVolume({ x, y, w, h, wall = P.linen, roof = P.charcoal, windows = 2, pitch = 0.28 }) {
  const roofH = h * pitch;
  const out = [
    poly(
      [
        [x - w * 0.05, y],
        [x + w * 0.5, y - roofH],
        [x + w * 1.05, y],
      ],
      roof,
    ),
    rect(x, y, w, h, wall),
    rect(x, y, w, h, 'url(#cabGrad)'),
  ];
  for (let i = 0; i < windows; i += 1) {
    const ww = w / (windows * 2 + 1);
    const wx = x + ww * (i * 2 + 1);
    out.push(windowFrame({ x: wx, y: y + h * 0.22, w: ww, h: h * 0.34, cols: 2, rows: 1, glass: P.glassDeep, warm: false }));
  }
  return out.join('');
}

/* -------------------------------------------------------------------------- */
/* SVG document wrapper                                                        */
/* -------------------------------------------------------------------------- */

function document_(w, h, body, opts = {}) {
  const { grain = 0.055, vignette = 0.3, grade = 'warm' } = opts;

  const grades = {
    warm: '',
    // Dated "before" shots: desaturated and slightly cooled, so the
    // before/after pairs read at a glance.
    dated:
      '<filter id="grade" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="saturate" values="0.55"/>' +
      '<feColorMatrix type="matrix" values="0.94 0 0 0 0.01  0 0.95 0 0 0.01  0 0 1.02 0 0.02  0 0 0 1 0"/>' +
      '</filter>',
    // CTA band sits under white text, so it is graded down.
    moody:
      '<filter id="grade" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="saturate" values="0.85"/>' +
      '<feComponentTransfer><feFuncR type="linear" slope="0.72"/><feFuncG type="linear" slope="0.7"/><feFuncB type="linear" slope="0.72"/></feComponentTransfer>' +
      '</filter>',
  };

  const gradeFilter = grades[grade] ?? '';
  const gradeAttr = grade === 'warm' ? '' : 'filter="url(#grade)"';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${P.white}" stop-opacity="0.5"/>
    <stop offset="60%" stop-color="${P.white}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="${P.stone}" stop-opacity="0.18"/>
  </linearGradient>
  <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${P.ink}" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="${P.white}" stop-opacity="0.1"/>
  </linearGradient>
  <linearGradient id="cabGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${P.white}" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="${P.ink}" stop-opacity="0.14"/>
  </linearGradient>
  <linearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${P.white}" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="${P.ink}" stop-opacity="0.3"/>
  </linearGradient>
  <linearGradient id="glassWarm" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="${P.skyWarm}" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="${P.accentSoft}" stop-opacity="0.5"/>
  </linearGradient>
  <linearGradient id="glassCool" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="${P.sky}" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="${P.glassDeep}" stop-opacity="0.6"/>
  </linearGradient>
  <linearGradient id="sheetGrad" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="${P.white}" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="${P.clay}" stop-opacity="0.5"/>
  </linearGradient>
  <linearGradient id="shaft" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0%" stop-color="${P.skyWarm}" stop-opacity="0.85"/>
    <stop offset="100%" stop-color="${P.skyWarm}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${P.sky}"/>
    <stop offset="100%" stop-color="${P.skyWarm}"/>
  </linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.45" r="0.78">
    <stop offset="55%" stop-color="${P.ink}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${P.ink}" stop-opacity="${vignette}"/>
  </radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="11" result="noise"/>
    <feColorMatrix in="noise" type="saturate" values="0"/>
  </filter>
  ${gradeFilter}
</defs>
<g ${gradeAttr}>
${body}
</g>
<rect width="${w}" height="${h}" fill="url(#vig)"/>
<rect width="${w}" height="${h}" filter="url(#grain)" opacity="${grain}" style="mix-blend-mode:overlay"/>
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Scenes                                                                      */
/* -------------------------------------------------------------------------- */

const scenes = {
  /* ---- Heroes -------------------------------------------------------- */

  kitchenWide: (w, h) => {
    const { horizon, svg } = room(w, h, { horizon: h * 0.7 });
    const b = [svg];
    // right-hand window + late afternoon shaft
    b.push(windowFrame({ x: w * 0.66, y: h * 0.14, w: w * 0.26, h: h * 0.4, cols: 3, rows: 2 }));
    b.push(lightShaft(w * 0.66, h * 0.54, w * 0.26, h, 1.5));
    // left cabinet run
    b.push(upperCabinets({ x: w * 0.04, y: h * 0.16, w: w * 0.32, h: h * 0.2, doors: 4 }));
    b.push(tileGrid({ x: w * 0.04, y: h * 0.36, w: w * 0.32, h: h * 0.12, cols: 10, rows: 2, fill: P.paper, grout: P.sand, offset: true }));
    b.push(baseCabinets({ x: w * 0.04, y: h * 0.5, w: w * 0.32, h: h * 0.2, doors: 4 }));
    // tall pantry
    b.push(rect(w * 0.38, h * 0.16, w * 0.11, h * 0.54, P.linen));
    b.push(rect(w * 0.38, h * 0.16, w * 0.11, h * 0.54, 'url(#cabGrad)'));
    b.push(rect(w * 0.43, h * 0.16, w * 0.006, h * 0.54, P.clay, 'opacity="0.5"'));
    // island
    b.push(island({ x: w * 0.32, y: h * 0.74, w: w * 0.36, h: h * 0.2, stools: 3 }));
    b.push(pendant({ x: w * 0.42, y: 0, drop: h * 0.34, r: w * 0.022 }));
    b.push(pendant({ x: w * 0.5, y: 0, drop: h * 0.34, r: w * 0.022 }));
    b.push(pendant({ x: w * 0.58, y: 0, drop: h * 0.34, r: w * 0.022 }));
    b.push(plant({ x: w * 0.94, y: horizon + h * 0.16, s: h * 0.2 }));
    return document_(w, h, b.join(''), { vignette: 0.34 });
  },

  midRenovation: (w, h) => {
    const b = [
      rect(0, 0, w, h * 0.72, P.linen),
      rect(0, 0, w, h * 0.72, 'url(#wallGrad)'),
      rect(0, h * 0.72, w, h * 0.28, P.concrete),
      rect(0, h * 0.72, w, h * 0.28, 'url(#floorGrad)'),
    ];
    b.push(joists({ x: 0, y: 0, w, h: h * 0.11, count: 14 }));
    b.push(studWall({ x: w * 0.05, y: h * 0.11, w: w * 0.4, h: h * 0.61, spacing: w * 0.055 }));
    // half-hung drywall on the right
    b.push(rect(w * 0.52, h * 0.11, w * 0.44, h * 0.4, P.bone));
    b.push(rect(w * 0.52, h * 0.11, w * 0.44, h * 0.4, 'url(#cabGrad)'));
    b.push(line(w * 0.74, h * 0.11, w * 0.74, h * 0.51, P.clay, w * 0.004, 'opacity="0.7"'));
    b.push(studWall({ x: w * 0.52, y: h * 0.51, w: w * 0.44, h: h * 0.21, spacing: w * 0.055 }));
    b.push(windowFrame({ x: w * 0.62, y: h * 0.18, w: w * 0.2, h: h * 0.24, cols: 2, rows: 1 }));
    b.push(dropSheet({ x: 0, y: h * 0.66, w: w * 0.62, h: h * 0.34 }));
    b.push(ladder({ x: w * 0.46, y: h * 0.2, w: w * 0.07, h: h * 0.55 }));
    b.push(sawhorse({ x: w * 0.66, y: h * 0.62, w: w * 0.24, h: h * 0.22 }));
    b.push(spiritLevel({ x: w * 0.68, y: h * 0.585, w: w * 0.2, h: h * 0.035 }));
    return document_(w, h, b.join(''), { vignette: 0.36, grain: 0.07 });
  },

  livingWide: (w, h) => {
    const { horizon, svg } = room(w, h, { horizon: h * 0.66 });
    const b = [svg];
    b.push(windowFrame({ x: w * 0.06, y: h * 0.12, w: w * 0.24, h: h * 0.42, cols: 2, rows: 2 }));
    b.push(windowFrame({ x: w * 0.7, y: h * 0.12, w: w * 0.24, h: h * 0.42, cols: 2, rows: 2 }));
    b.push(lightShaft(w * 0.06, h * 0.54, w * 0.24, h, 1.4));
    b.push(rect(w * 0.38, h * 0.18, w * 0.24, h * 0.36, P.charcoal));
    b.push(rect(w * 0.38, h * 0.18, w * 0.24, h * 0.36, 'url(#darkGrad)'));
    b.push(rect(w * 0.4, h * 0.4, w * 0.2, h * 0.02, P.accent, 'opacity="0.85"'));
    b.push(rug({ cx: w * 0.5, y: horizon + h * 0.2, w: w * 0.5, h: h * 0.2 }));
    b.push(sofa({ x: w * 0.3, y: horizon - h * 0.02, w: w * 0.4, h: h * 0.24 }));
    b.push(plant({ x: w * 0.86, y: horizon + h * 0.1, s: h * 0.24 }));
    b.push(recessedLights(h * 0.04, w, 5, w * 0.016));
    return document_(w, h, b.join(''), { vignette: 0.32 });
  },

  /* ---- Rooms --------------------------------------------------------- */

  kitchenCard: (w, h) => {
    const { svg } = room(w, h, { horizon: h * 0.72 });
    const b = [svg];
    b.push(windowFrame({ x: w * 0.72, y: h * 0.16, w: w * 0.22, h: h * 0.32, cols: 2, rows: 1 }));
    b.push(upperCabinets({ x: w * 0.06, y: h * 0.14, w: w * 0.44, h: h * 0.22, doors: 3 }));
    b.push(tileGrid({ x: w * 0.06, y: h * 0.36, w: w * 0.44, h: h * 0.14, cols: 9, rows: 2, fill: P.paper, grout: P.sand, offset: true }));
    b.push(baseCabinets({ x: w * 0.06, y: h * 0.52, w: w * 0.6, h: h * 0.2, doors: 5 }));
    b.push(island({ x: w * 0.24, y: h * 0.78, w: w * 0.5, h: h * 0.18, stools: 2 }));
    b.push(pendant({ x: w * 0.38, y: 0, drop: h * 0.34, r: w * 0.032 }));
    b.push(pendant({ x: w * 0.58, y: 0, drop: h * 0.34, r: w * 0.032 }));
    return document_(w, h, b.join(''));
  },

  galleyKitchen: (w, h) => {
    const { svg } = room(w, h, { horizon: h * 0.74 });
    const b = [svg];
    b.push(windowFrame({ x: w * 0.32, y: h * 0.18, w: w * 0.36, h: h * 0.24, cols: 2, rows: 1 }));
    b.push(upperCabinets({ x: 0, y: h * 0.12, w: w * 0.26, h: h * 0.26, doors: 2 }));
    b.push(upperCabinets({ x: w * 0.74, y: h * 0.12, w: w * 0.26, h: h * 0.26, doors: 2 }));
    b.push(tileGrid({ x: 0, y: h * 0.44, w, h: h * 0.14, cols: 12, rows: 3, fill: P.paper, grout: P.sand, offset: true }));
    b.push(baseCabinets({ x: 0, y: h * 0.6, w, h: h * 0.16, doors: 6 }));
    b.push(rect(0, h * 0.42, w, h * 0.012, P.accentSoft, 'opacity="0.75"')); // under-cabinet light
    b.push(plant({ x: w * 0.12, y: h * 0.56, s: h * 0.09 }));
    return document_(w, h, b.join(''));
  },

  bathroom: (w, h, opts = {}) => {
    const accessible = opts.accessible === true;
    const b = [
      rect(0, 0, w, h * 0.8, P.bone),
      rect(0, 0, w, h * 0.8, 'url(#wallGrad)'),
      rect(0, h * 0.8, w, h * 0.2, P.linen),
    ];
    // floor tile
    b.push(tileGrid({ x: 0, y: h * 0.8, w, h: h * 0.2, cols: 8, rows: 2, fill: P.sand, grout: P.linen }));
    // shower enclosure, fully tiled
    b.push(tileGrid({ x: w * 0.04, y: h * 0.06, w: w * 0.44, h: h * 0.76, cols: 6, rows: 12, fill: P.linen, grout: P.paper, offset: true }));
    // glass panel
    b.push(rect(w * 0.46, h * 0.06, w * 0.03, h * 0.76, P.glass, 'opacity="0.55"'));
    b.push(rect(w * 0.46, h * 0.06, w * 0.008, h * 0.76, P.steel));
    // shower head + arm
    b.push(rect(w * 0.24, h * 0.12, w * 0.012, h * 0.06, P.steel));
    b.push(rect(w * 0.19, h * 0.17, w * 0.11, h * 0.022, P.steel, 'rx="4"'));
    // vanity
    b.push(rect(w * 0.56, h * 0.5, w * 0.38, h * 0.3, P.walnut));
    b.push(rect(w * 0.56, h * 0.5, w * 0.38, h * 0.3, 'url(#cabGrad)'));
    b.push(rect(w * 0.54, h * 0.46, w * 0.42, h * 0.05, P.paper));
    b.push(`<ellipse cx="${n(w * 0.75)}" cy="${n(h * 0.485)}" rx="${n(w * 0.09)}" ry="${n(h * 0.018)}" fill="${P.white}"/>`);
    b.push(rect(w * 0.745, h * 0.4, w * 0.012, h * 0.07, P.steel));
    b.push(rect(w * 0.745, h * 0.4, w * 0.05, h * 0.014, P.steel, 'rx="4"'));
    // mirror
    b.push(rect(w * 0.62, h * 0.1, w * 0.26, h * 0.26, P.glass, 'rx="4"'));
    b.push(rect(w * 0.62, h * 0.1, w * 0.26, h * 0.26, 'url(#glassCool)', 'rx="4"'));
    if (accessible) {
      // grab bars, level entry, fold-down bench
      b.push(rect(w * 0.08, h * 0.46, w * 0.3, h * 0.028, P.accent, 'rx="8"'));
      b.push(rect(w * 0.36, h * 0.3, w * 0.028, h * 0.3, P.accent, 'rx="8"'));
      b.push(rect(w * 0.06, h * 0.58, w * 0.2, h * 0.05, P.oakLight, 'rx="4"'));
      b.push(rect(w * 0.58, h * 0.44, w * 0.16, h * 0.024, P.accent, 'rx="8"'));
      // level threshold: no curb, just a drain line
      b.push(rect(w * 0.06, h * 0.8, w * 0.4, h * 0.012, P.steel, 'opacity="0.8"'));
    } else {
      b.push(rect(w * 0.06, h * 0.79, w * 0.4, h * 0.03, P.paper)); // low curb
      b.push(plant({ x: w * 0.9, y: h * 0.46, s: h * 0.1 }));
    }
    return document_(w, h, b.join(''), { vignette: 0.26 });
  },

  basementFinished: (w, h) => {
    const { horizon, svg } = room(w, h, { horizon: h * 0.74, wall: P.linen, floor: P.oakDark, floorShade: P.walnut });
    const b = [svg];
    b.push(rect(0, 0, w, h * 0.09, P.paper)); // dropped ceiling
    b.push(recessedLights(h * 0.05, w, 4, w * 0.03));
    b.push(rect(w * 0.06, h * 0.16, w * 0.3, h * 0.34, P.charcoal));
    b.push(rect(w * 0.06, h * 0.16, w * 0.3, h * 0.34, 'url(#darkGrad)'));
    b.push(rect(w * 0.09, h * 0.42, w * 0.24, h * 0.02, P.accent, 'opacity="0.8"'));
    b.push(windowFrame({ x: w * 0.7, y: h * 0.14, w: w * 0.22, h: h * 0.14, cols: 2, rows: 1, glass: P.glassDeep, warm: false }));
    b.push(rug({ cx: w * 0.5, y: horizon + h * 0.14, w: w * 0.6, h: h * 0.16 }));
    b.push(sofa({ x: w * 0.42, y: horizon - h * 0.14, w: w * 0.46, h: h * 0.24, color: P.stone }));
    b.push(plant({ x: w * 0.12, y: horizon - h * 0.01, s: h * 0.16 }));
    return document_(w, h, b.join(''), { vignette: 0.34 });
  },

  basementUnfinished: (w, h) => {
    const b = [
      rect(0, 0, w, h * 0.78, P.concreteDark),
      rect(0, 0, w, h * 0.78, 'url(#wallGrad)'),
      rect(0, h * 0.78, w, h * 0.22, P.concrete),
      rect(0, h * 0.78, w, h * 0.22, 'url(#floorGrad)'),
    ];
    b.push(joists({ x: 0, y: 0, w, h: h * 0.14, count: 12 }));
    // ducting
    b.push(rect(0, h * 0.15, w, h * 0.05, P.steel, 'opacity="0.85"'));
    b.push(rect(w * 0.3, h * 0.2, w * 0.06, h * 0.14, P.steel, 'opacity="0.7"'));
    // block wall coursing
    for (let i = 1; i < 7; i += 1) {
      b.push(line(0, h * (0.2 + i * 0.083), w, h * (0.2 + i * 0.083), P.concreteDark, h * 0.004, 'opacity="0.5"'));
    }
    for (let i = 0; i < 10; i += 1) {
      b.push(line(w * (i / 10), h * 0.2, w * (i / 10), h * 0.78, P.concreteDark, h * 0.003, 'opacity="0.3"'));
    }
    // small hopper window + bare bulb
    b.push(windowFrame({ x: w * 0.72, y: h * 0.24, w: w * 0.18, h: h * 0.1, cols: 2, rows: 1, glass: P.glassDeep, warm: false }));
    b.push(line(w * 0.24, h * 0.14, w * 0.24, h * 0.3, P.charcoal, w * 0.004));
    b.push(circle(w * 0.24, h * 0.32, w * 0.022, P.accentSoft));
    // support post
    b.push(rect(w * 0.5, h * 0.14, w * 0.035, h * 0.64, P.steel));
    return document_(w, h, b.join(''), { grade: 'dated', vignette: 0.42, grain: 0.08 });
  },

  basementExcavation: (w, h) => {
    const b = [
      rect(0, 0, w, h * 0.55, P.concreteDark),
      rect(0, 0, w, h * 0.55, 'url(#wallGrad)'),
    ];
    b.push(joists({ x: 0, y: 0, w, h: h * 0.13, count: 12 }));
    // existing slab edge, then dug-out ground below
    b.push(rect(0, h * 0.55, w, h * 0.06, P.concrete));
    b.push(rect(0, h * 0.61, w, h * 0.39, P.walnut));
    b.push(rect(0, h * 0.61, w, h * 0.39, 'url(#floorGrad)'));
    // excavation steps / benching
    b.push(poly([[0, h * 0.61], [w * 0.34, h * 0.61], [w * 0.34, h * 0.74], [w * 0.66, h * 0.74], [w * 0.66, h * 0.88], [0, h * 0.88]], P.oakDark, 'opacity="0.55"'));
    // underpinning blocks
    for (let i = 0; i < 5; i += 1) {
      b.push(rect(w * (0.02 + i * 0.2), h * 0.55, w * 0.16, h * 0.14, P.concrete, 'opacity="0.9"'));
      b.push(rect(w * (0.02 + i * 0.2), h * 0.55, w * 0.16, h * 0.14, 'none', `stroke="${P.concreteDark}" stroke-width="${n(w * 0.004)}"`));
    }
    // shoring post + wheelbarrow-ish shape
    b.push(rect(w * 0.78, h * 0.13, w * 0.03, h * 0.42, P.steel));
    b.push(worker({ x: w * 0.24, y: h * 0.86, s: h * 0.3, arms: 'down' }));
    return document_(w, h, b.join(''), { vignette: 0.4, grain: 0.075 });
  },

  additionExterior: (w, h, opts = {}) => {
    const secondStorey = opts.secondStorey === true;
    const b = [
      rect(0, 0, w, h * 0.74, 'url(#skyGrad)'),
      rect(0, h * 0.74, w, h * 0.26, P.grass),
      rect(0, h * 0.74, w, h * 0.26, 'url(#floorGrad)'),
    ];
    if (secondStorey) {
      b.push(rect(w * 0.16, h * 0.46, w * 0.68, h * 0.28, P.linen));
      b.push(rect(w * 0.16, h * 0.46, w * 0.68, h * 0.28, 'url(#cabGrad)'));
      b.push(windowFrame({ x: w * 0.24, y: h * 0.54, w: w * 0.16, h: h * 0.13, cols: 2, rows: 1, glass: P.glassDeep, warm: false }));
      b.push(windowFrame({ x: w * 0.6, y: h * 0.54, w: w * 0.16, h: h * 0.13, cols: 2, rows: 1, glass: P.glassDeep, warm: false }));
      // new storey, lighter and set apart
      b.push(houseVolume({ x: w * 0.16, y: h * 0.18, w: w * 0.68, h: h * 0.28, wall: P.paper, roof: P.slate, windows: 3, pitch: 0.5 }));
      b.push(rect(w * 0.16, h * 0.455, w * 0.68, h * 0.014, P.accent, 'opacity="0.9"')); // junction line
    } else {
      b.push(houseVolume({ x: w * 0.04, y: h * 0.34, w: w * 0.5, h: h * 0.4, windows: 2, pitch: 0.34 }));
      // new flat-roof rear extension in a lighter tone
      b.push(rect(w * 0.54, h * 0.42, w * 0.42, h * 0.32, P.paper));
      b.push(rect(w * 0.54, h * 0.42, w * 0.42, h * 0.32, 'url(#cabGrad)'));
      b.push(rect(w * 0.52, h * 0.395, w * 0.46, h * 0.035, P.charcoal));
      b.push(windowFrame({ x: w * 0.58, y: h * 0.48, w: w * 0.34, h: h * 0.22, cols: 3, rows: 1 }));
      b.push(rect(w * 0.535, h * 0.42, w * 0.012, h * 0.32, P.accent, 'opacity="0.9"'));
    }
    b.push(plant({ x: w * 0.9, y: h * 0.86, s: h * 0.24 }));
    b.push(plant({ x: w * 0.07, y: h * 0.9, s: h * 0.18 }));
    return document_(w, h, b.join(''), { vignette: 0.28 });
  },

  officeFitout: (w, h) => {
    const { svg } = room(w, h, { horizon: h * 0.76, wall: P.bone, floor: P.stone, floorShade: P.slate, planks: 12 });
    const b = [svg];
    b.push(rect(0, 0, w, h * 0.07, P.paper));
    // linear ceiling lights
    for (let i = 0; i < 3; i += 1) {
      b.push(rect(w * (0.1 + i * 0.3), h * 0.03, w * 0.22, h * 0.016, P.white));
      b.push(rect(w * (0.1 + i * 0.3), h * 0.046, w * 0.22, h * 0.01, P.accentSoft, 'opacity="0.7"'));
    }
    // glass partitions
    b.push(rect(w * 0.04, h * 0.16, w * 0.42, h * 0.6, P.glass, 'opacity="0.4"'));
    b.push(rect(w * 0.04, h * 0.16, w * 0.42, h * 0.6, 'none', `stroke="${P.charcoal}" stroke-width="${n(w * 0.007)}"`));
    b.push(rect(w * 0.25, h * 0.16, w * 0.008, h * 0.6, P.charcoal));
    b.push(rect(w * 0.56, h * 0.16, w * 0.4, h * 0.6, P.glass, 'opacity="0.4"'));
    b.push(rect(w * 0.56, h * 0.16, w * 0.4, h * 0.6, 'none', `stroke="${P.charcoal}" stroke-width="${n(w * 0.007)}"`));
    b.push(rect(w * 0.76, h * 0.16, w * 0.008, h * 0.6, P.charcoal));
    // desks behind the glass
    b.push(rect(w * 0.08, h * 0.58, w * 0.16, h * 0.03, P.oakLight));
    b.push(rect(w * 0.3, h * 0.58, w * 0.13, h * 0.03, P.oakLight));
    b.push(rect(w * 0.6, h * 0.58, w * 0.16, h * 0.03, P.oakLight));
    b.push(rect(w * 0.82, h * 0.58, w * 0.12, h * 0.03, P.oakLight));
    b.push(rect(w * 0.48, h * 0.3, w * 0.04, h * 0.46, P.accent, 'opacity="0.9"')); // accent column
    return document_(w, h, b.join(''), { vignette: 0.24 });
  },

  retailUnit: (w, h) => {
    const { svg } = room(w, h, { horizon: h * 0.78, wall: P.paper, floor: P.concrete, floorShade: P.concreteDark, planks: 6 });
    const b = [svg];
    // storefront glazing on the right
    b.push(rect(w * 0.56, h * 0.1, w * 0.4, h * 0.68, P.glass));
    b.push(rect(w * 0.56, h * 0.1, w * 0.4, h * 0.68, 'url(#glassWarm)'));
    b.push(rect(w * 0.56, h * 0.1, w * 0.4, h * 0.68, 'none', `stroke="${P.charcoal}" stroke-width="${n(w * 0.01)}"`));
    b.push(rect(w * 0.75, h * 0.1, w * 0.01, h * 0.68, P.charcoal));
    // display wall left with slat detail
    b.push(rect(w * 0.04, h * 0.12, w * 0.44, h * 0.62, P.walnut));
    for (let i = 0; i < 12; i += 1) {
      b.push(rect(w * 0.04, h * (0.14 + i * 0.05), w * 0.44, h * 0.012, P.oakLight, 'opacity="0.55"'));
    }
    b.push(rect(w * 0.1, h * 0.3, w * 0.32, h * 0.025, P.paper)); // shelf
    b.push(rect(w * 0.1, h * 0.48, w * 0.32, h * 0.025, P.paper));
    b.push(rect(w * 0.04, h * 0.74, w * 0.44, h * 0.02, P.accent, 'opacity="0.9"'));
    b.push(rect(w * 0.2, h * 0.02, w * 0.12, h * 0.06, P.charcoal)); // track light bar
    b.push(recessedLights(h * 0.05, w, 5, w * 0.022));
    return document_(w, h, b.join(''), { vignette: 0.26 });
  },

  garage: (w, h) => {
    const b = [
      rect(0, 0, w, h * 0.76, P.linen),
      rect(0, 0, w, h * 0.76, 'url(#wallGrad)'),
      rect(0, h * 0.76, w, h * 0.24, P.concrete),
      rect(0, h * 0.76, w, h * 0.24, 'url(#floorGrad)'),
    ];
    // sectional door panels
    b.push(rect(w * 0.5, h * 0.1, w * 0.46, h * 0.66, P.paper));
    for (let i = 0; i < 5; i += 1) {
      b.push(rect(w * 0.5, h * (0.1 + i * 0.132), w * 0.46, h * 0.12, P.bone));
      b.push(rect(w * 0.5, h * (0.1 + i * 0.132), w * 0.46, h * 0.12, 'none', `stroke="${P.clay}" stroke-width="${n(h * 0.005)}"`));
    }
    // workbench + pegboard
    b.push(rect(w * 0.04, h * 0.2, w * 0.36, h * 0.26, P.sand));
    const r = mulberry32(3);
    for (let i = 0; i < 40; i += 1) {
      b.push(circle(w * (0.06 + r() * 0.32), h * (0.22 + r() * 0.22), w * 0.005, P.clay, 'opacity="0.6"'));
    }
    b.push(rect(w * 0.04, h * 0.5, w * 0.4, h * 0.05, P.oak));
    b.push(rect(w * 0.05, h * 0.55, w * 0.03, h * 0.21, P.slate));
    b.push(rect(w * 0.4, h * 0.55, w * 0.03, h * 0.21, P.slate));
    b.push(rect(0, h * 0.76, w, h * 0.24, P.steel, 'opacity="0.12"')); // sealed floor sheen
    b.push(rect(0, h * 0.02, w, h * 0.02, P.charcoal));
    b.push(recessedLights(h * 0.06, w, 3, w * 0.024));
    return document_(w, h, b.join(''), { vignette: 0.3 });
  },

  strippedRoom: (w, h) => {
    const b = [
      rect(0, 0, w, h * 0.76, P.concreteDark),
      rect(0, 0, w, h * 0.76, 'url(#wallGrad)'),
      rect(0, h * 0.76, w, h * 0.24, P.concrete),
    ];
    b.push(joists({ x: 0, y: 0, w, h: h * 0.12, count: 13 }));
    b.push(studWall({ x: 0, y: h * 0.12, w: w * 0.62, h: h * 0.64, spacing: w * 0.06 }));
    // cut line where damaged drywall was removed
    b.push(rect(w * 0.64, h * 0.12, w * 0.36, h * 0.36, P.bone));
    b.push(rect(w * 0.64, h * 0.12, w * 0.36, h * 0.36, 'url(#cabGrad)'));
    b.push(line(w * 0.64, h * 0.48, w, h * 0.48, P.charcoal, h * 0.006, 'opacity="0.6"'));
    b.push(studWall({ x: w * 0.64, y: h * 0.48, w: w * 0.36, h: h * 0.28, spacing: w * 0.06 }));
    // moisture staining, kept muted
    b.push(`<ellipse cx="${n(w * 0.82)}" cy="${n(h * 0.28)}" rx="${n(w * 0.13)}" ry="${n(h * 0.1)}" fill="${P.stone}" opacity="0.3"/>`);
    b.push(rect(w * 0.06, h * 0.62, w * 0.16, h * 0.14, P.accent, 'rx="4" opacity="0.85"')); // dehumidifier
    b.push(rect(w * 0.09, h * 0.65, w * 0.1, h * 0.05, P.charcoal, 'rx="2"'));
    b.push(dropSheet({ x: 0, y: h * 0.74, w: w * 0.5, h: h * 0.26 }));
    return document_(w, h, b.join(''), { grade: 'dated', vignette: 0.4, grain: 0.08 });
  },

  rentalUnit: (w, h) => {
    const { horizon, svg } = room(w, h, { horizon: h * 0.74, wall: P.paper });
    const b = [svg];
    b.push(doorway({ x: w * 0.08, y: h * 0.2, w: w * 0.18, h: h * 0.54 }));
    b.push(circle(w * 0.235, h * 0.5, w * 0.012, P.steel));
    b.push(windowFrame({ x: w * 0.62, y: h * 0.18, w: w * 0.3, h: h * 0.34, cols: 2, rows: 2 }));
    b.push(lightShaft(w * 0.62, h * 0.52, w * 0.3, h, 1.3));
    b.push(baseCabinets({ x: w * 0.32, y: h * 0.54, w: w * 0.22, h: h * 0.2, doors: 2 }));
    b.push(upperCabinets({ x: w * 0.32, y: h * 0.2, w: w * 0.22, h: h * 0.16, doors: 2 }));
    b.push(rug({ cx: w * 0.6, y: horizon + h * 0.14, w: w * 0.42, h: h * 0.16 }));
    b.push(plant({ x: w * 0.9, y: horizon + h * 0.06, s: h * 0.16 }));
    return document_(w, h, b.join(''));
  },

  interiorExterior: (w, h) => {
    const b = [];
    // left: interior
    b.push(rect(0, 0, w * 0.5, h * 0.74, P.bone));
    b.push(rect(0, 0, w * 0.5, h * 0.74, 'url(#wallGrad)'));
    b.push(rect(0, h * 0.74, w * 0.5, h * 0.26, P.oak));
    b.push(rect(0, h * 0.74, w * 0.5, h * 0.26, 'url(#floorGrad)'));
    b.push(upperCabinets({ x: w * 0.05, y: h * 0.18, w: w * 0.38, h: h * 0.18, doors: 3 }));
    b.push(rect(w * 0.05, h * 0.42, w * 0.38, h * 0.3, P.linen));
    b.push(rect(w * 0.05, h * 0.42, w * 0.38, h * 0.3, 'url(#cabGrad)'));
    b.push(rect(w * 0.05, h * 0.72, w * 0.38, h * 0.02, P.paper));
    // right: exterior facade
    b.push(rect(w * 0.5, 0, w * 0.5, h * 0.74, 'url(#skyGrad)'));
    b.push(rect(w * 0.5, h * 0.74, w * 0.5, h * 0.26, P.grass));
    b.push(rect(w * 0.56, h * 0.2, w * 0.38, h * 0.54, P.walnut));
    for (let i = 0; i < 10; i += 1) {
      b.push(rect(w * 0.56, h * (0.21 + i * 0.053), w * 0.38, h * 0.03, P.oakDark, 'opacity="0.6"'));
    }
    b.push(windowFrame({ x: w * 0.63, y: h * 0.3, w: w * 0.24, h: h * 0.2, cols: 2, rows: 1, glass: P.glassDeep, warm: false }));
    // the seam between the two halves
    b.push(rect(w * 0.5 - w * 0.006, 0, w * 0.012, h, P.accent, 'opacity="0.95"'));
    return document_(w, h, b.join(''), { vignette: 0.3 });
  },

  /* ---- Before / after kitchen ---------------------------------------- */

  datedKitchen: (w, h) => {
    const { svg } = room(w, h, {
      horizon: h * 0.74,
      wall: P.datedWall,
      wallShade: P.clay,
      floor: P.datedFloor,
      floorShade: P.stone,
      planks: 6,
    });
    const b = [svg];
    // low soffit above the uppers — the classic dated giveaway
    b.push(rect(0, 0, w, h * 0.14, P.datedWall));
    b.push(rect(0, h * 0.14, w, h * 0.01, P.stone, 'opacity="0.5"'));
    b.push(upperCabinets({ x: 0, y: h * 0.15, w: w * 0.56, h: h * 0.22, doors: 4, body: P.datedCab }));
    b.push(rect(w * 0.06, h * 0.37, w * 0.5, h * 0.14, P.datedWall));
    b.push(tileGrid({ x: 0, y: h * 0.37, w: w * 0.56, h: h * 0.14, cols: 6, rows: 2, fill: P.clay, grout: P.stone }));
    b.push(baseCabinets({ x: 0, y: h * 0.55, w: w * 0.68, h: h * 0.19, doors: 5, body: P.datedCab, top: P.datedCabLight, handle: P.oakDark }));
    // small window, poor light
    b.push(windowFrame({ x: w * 0.72, y: h * 0.24, w: w * 0.18, h: h * 0.18, cols: 1, rows: 1, glass: P.glassDeep, warm: false }));
    // single dim ceiling fixture
    b.push(`<ellipse cx="${n(w * 0.5)}" cy="${n(h * 0.155)}" rx="${n(w * 0.07)}" ry="${n(h * 0.022)}" fill="${P.datedWall}" opacity="0.9"/>`);
    b.push(rect(w * 0.74, h * 0.55, w * 0.2, h * 0.19, P.datedCabLight));
    return document_(w, h, b.join(''), { grade: 'dated', vignette: 0.42, grain: 0.085 });
  },

  /* ---- Crew ---------------------------------------------------------- */

  crewCabinetry: (w, h) => {
    const { horizon, svg } = room(w, h, { horizon: h * 0.8 });
    const b = [svg];
    b.push(studWall({ x: w * 0.78, y: 0, w: w * 0.22, h: h * 0.8, spacing: w * 0.06 }));
    b.push(baseCabinets({ x: w * 0.3, y: h * 0.58, w: w * 0.4, h: h * 0.22, doors: 3 }));
    // the upper cabinet being lifted into place — hands meet its bottom corners
    b.push(rect(w * 0.36, h * 0.2, w * 0.28, h * 0.22, P.paper));
    b.push(rect(w * 0.36, h * 0.2, w * 0.28, h * 0.22, 'url(#cabGrad)'));
    b.push(rect(w * 0.36, h * 0.2, w * 0.28, h * 0.22, 'none', `stroke="${P.clay}" stroke-width="${n(h * 0.006)}"`));
    b.push(rect(w * 0.5, h * 0.2, w * 0.004, h * 0.22, P.clay, 'opacity="0.6"'));
    // levelled layout line the cabinet is being set to
    b.push(line(0, h * 0.2, w, h * 0.2, P.accent, h * 0.005, 'opacity="0.9" stroke-dasharray="16 11"'));
    b.push(dropSheet({ x: 0, y: h * 0.9, w, h: h * 0.1 }));
    b.push(worker({ x: w * 0.28, y: horizon + h * 0.04, s: h * 0.3, arms: 'reach' }));
    b.push(worker({ x: w * 0.72, y: horizon + h * 0.04, s: h * 0.3, arms: 'reach', flip: true, shirt: P.slate }));
    return document_(w, h, b.join(''), { vignette: 0.32 });
  },

  crewPlans: (w, h) => {
    const b = [
      rect(0, 0, w, h * 0.76, P.linen),
      rect(0, 0, w, h * 0.76, 'url(#wallGrad)'),
      rect(0, h * 0.76, w, h * 0.24, P.concrete),
      rect(0, h * 0.76, w, h * 0.24, 'url(#floorGrad)'),
    ];
    b.push(studWall({ x: 0, y: h * 0.06, w: w * 0.34, h: h * 0.7, spacing: w * 0.07 }));
    b.push(windowFrame({ x: w * 0.62, y: h * 0.12, w: w * 0.3, h: h * 0.26, cols: 2, rows: 1 }));
    b.push(lightShaft(w * 0.62, h * 0.38, w * 0.3, h, 1.3));
    // contractor stood at the trestle, leaning over the drawings
    b.push(worker({ x: w * 0.26, y: h * 0.95, s: h * 0.3, arms: 'down', shirt: P.accent }));
    b.push(sawhorse({ x: w * 0.4, y: h * 0.62, w: w * 0.5, h: h * 0.26 }));
    // drawings laid across the trestle top
    b.push(rect(w * 0.4, h * 0.575, w * 0.5, h * 0.055, P.paper, 'rx="2"'));
    b.push(rect(w * 0.44, h * 0.59, w * 0.3, h * 0.007, P.glassDeep, 'opacity="0.8"'));
    b.push(rect(w * 0.44, h * 0.605, w * 0.22, h * 0.007, P.glassDeep, 'opacity="0.6"'));
    b.push(rect(w * 0.78, h * 0.545, w * 0.1, h * 0.09, P.paper, `rx="2" transform="rotate(-7 ${n(w * 0.83)} ${n(h * 0.59)})"`));
    b.push(spiritLevel({ x: w * 0.06, y: h * 0.71, w: w * 0.16, h: h * 0.028 }));
    return document_(w, h, b.join(''), { vignette: 0.32 });
  },

  /* ---- Textures ------------------------------------------------------ */

  drywallTexture: (w, h) => {
    const r = mulberry32(21);
    const b = [rect(0, 0, w, h, P.bone), rect(0, 0, w, h, 'url(#wallGrad)')];
    // taped seams
    b.push(rect(w * 0.33, 0, w * 0.02, h, P.paper, 'opacity="0.8"'));
    b.push(rect(0, h * 0.58, w, w * 0.016, P.paper, 'opacity="0.7"'));
    // sanding swirls
    for (let i = 0; i < 26; i += 1) {
      const cx = r() * w;
      const cy = r() * h;
      const rad = w * (0.02 + r() * 0.05);
      b.push(circle(cx, cy, rad, 'none', `stroke="${P.linen}" stroke-width="${n(w * 0.003)}" opacity="0.4"`));
    }
    // screw dimples
    for (let i = 0; i < 18; i += 1) {
      b.push(circle(w * (0.34 + r() * 0.02), h * (0.05 + r() * 0.9), w * 0.004, P.linen, 'opacity="0.7"'));
    }
    return document_(w, h, b.join(''), { vignette: 0.2, grain: 0.11 });
  },

  oakTexture: (w, h) => {
    const r = mulberry32(33);
    const b = [rect(0, 0, w, h, P.oak)];
    const rows = 5;
    const rowH = h / rows;
    for (let row = 0; row < rows; row += 1) {
      let x = -w * 0.1 * row;
      while (x < w) {
        const pw = w * (0.22 + r() * 0.2);
        const tone = [P.oak, P.oakLight, P.oakDark, P.walnut][Math.floor(r() * 4)];
        b.push(rect(x, row * rowH, pw - w * 0.004, rowH - h * 0.006, tone, 'opacity="0.85"'));
        // grain lines
        for (let g = 0; g < 5; g += 1) {
          const gy = row * rowH + rowH * (0.12 + g * 0.19);
          b.push(
            path(
              `M ${n(x)} ${n(gy)} Q ${n(x + pw * 0.5)} ${n(gy + (r() - 0.5) * rowH * 0.22)} ${n(x + pw)} ${n(gy)}`,
              'none',
              `stroke="${P.walnut}" stroke-width="${n(h * 0.004)}" opacity="0.28"`,
            ),
          );
        }
        x += pw;
      }
    }
    return document_(w, h, b.join(''), { vignette: 0.28, grain: 0.09 });
  },

  subwayTexture: (w, h) =>
    document_(
      w,
      h,
      [
        tileGrid({ x: 0, y: 0, w, h, cols: 9, rows: 7, fill: P.paper, grout: P.sand, offset: true }),
        rect(0, 0, w, h, 'url(#wallGrad)'),
        rect(0, 0, w, h, 'url(#glassWarm)', 'opacity="0.14"'),
      ].join(''),
      { vignette: 0.24, grain: 0.06 },
    ),
};

/* -------------------------------------------------------------------------- */
/* Manifest — every file that gets written                                     */
/* -------------------------------------------------------------------------- */

const W16 = 2400;
const H16 = 1350;
const W43 = 1600;
const H43 = 1200;
const W34 = 1200;
const H34 = 1600;
const WT = 1600;
const HT = 900;

const manifest = [
  // Heroes (16:9)
  ['hero-kitchen', W16, H16, () => scenes.kitchenWide(W16, H16), 'Hero — bright renovated open-plan kitchen, late-afternoon light'],
  ['hero-renovation-in-progress', W16, H16, () => scenes.midRenovation(W16, H16), 'Secondary hero — mid-renovation interior: exposed studs, drop sheets, level on a sawhorse'],
  ['cta-band', W16, H16, () => scenes.livingWide(W16, H16), 'CTA band background — renovated living space, graded down for overlaid text'],

  // Service cards (4:3)
  ['service-general', W43, H43, () => scenes.livingWide(W43, H43), 'Service card — general renovations'],
  ['service-kitchen', W43, H43, () => scenes.kitchenCard(W43, H43), 'Service card — kitchen renovations'],
  ['service-bathroom', W43, H43, () => scenes.bathroom(W43, H43), 'Service card — bathroom renovations, tiled walk-in shower'],
  ['service-basement', W43, H43, () => scenes.basementFinished(W43, H43), 'Service card — basement renovations'],
  ['service-addition', W43, H43, () => scenes.additionExterior(W43, H43), 'Service card — home additions and extensions'],
  ['service-whole-house', W43, H43, () => scenes.kitchenWide(W43, H43), 'Service card — whole-house / ground floor renovation'],
  ['service-interior-exterior', W43, H43, () => scenes.interiorExterior(W43, H43), 'Service card — interior and exterior renovation'],
  ['service-commercial', W43, H43, () => scenes.officeFitout(W43, H43), 'Service card — commercial and office fit-out'],
  ['service-rental', W43, H43, () => scenes.rentalUnit(W43, H43), 'Service card — rental property renovation'],
  ['service-garage', W43, H43, () => scenes.garage(W43, H43), 'Service card — garage renovation'],
  ['service-post-disaster', W43, H43, () => scenes.strippedRoom(W43, H43), 'Service card — post-disaster restoration'],
  ['service-accessibility', W43, H43, () => scenes.bathroom(W43, H43, { accessible: true }), 'Service card — home accessibility adaptation, grab bars and level-entry shower'],
  ['service-excavation', W43, H43, () => scenes.basementExcavation(W43, H43), 'Service card — interior excavation'],

  // Gallery
  ['gallery-kitchen-01', W43, H43, () => scenes.kitchenCard(W43, H43), 'Gallery — open-plan kitchen'],
  ['gallery-kitchen-02', W34, H34, () => scenes.galleyKitchen(W34, H34), 'Gallery — galley kitchen (portrait)'],
  ['gallery-bathroom-01', W34, H34, () => scenes.bathroom(W34, H34), 'Gallery — tiled walk-in shower (portrait)'],
  ['gallery-bathroom-02', W43, H43, () => scenes.bathroom(W43, H43, { accessible: true }), 'Gallery — accessible bathroom'],
  ['gallery-basement-01', W43, H43, () => scenes.basementFinished(W43, H43), 'Gallery — finished basement'],
  ['gallery-basement-02', W43, H43, () => scenes.basementExcavation(W43, H43), 'Gallery — basement interior excavation'],
  ['gallery-addition-01', W43, H43, () => scenes.additionExterior(W43, H43), 'Gallery — rear extension'],
  ['gallery-addition-02', W34, H34, () => scenes.additionExterior(W34, H34, { secondStorey: true }), 'Gallery — second-storey addition (portrait)'],
  ['gallery-commercial-01', W43, H43, () => scenes.officeFitout(W43, H43), 'Gallery — office fit-out'],
  ['gallery-commercial-02', W43, H43, () => scenes.retailUnit(W43, H43), 'Gallery — retail unit'],

  // Crew candids
  ['crew-cabinetry', W43, H43, () => scenes.crewCabinetry(W43, H43), 'Crew — contractors installing cabinetry'],
  ['crew-plans', W43, H43, () => scenes.crewPlans(W43, H43), 'Crew — contractor reviewing plans on site'],

  // Before / after pairs
  ['before-kitchen', W43, H43, () => scenes.datedKitchen(W43, H43), 'Before — dated kitchen'],
  ['after-kitchen', W43, H43, () => scenes.kitchenCard(W43, H43), 'After — renovated kitchen'],
  ['before-basement', W43, H43, () => scenes.basementUnfinished(W43, H43), 'Before — unfinished basement'],
  ['after-basement', W43, H43, () => scenes.basementFinished(W43, H43), 'After — finished basement'],

  // Section divider textures
  ['texture-drywall', WT, HT, () => scenes.drywallTexture(WT, HT), 'Texture — sanded drywall with taped seams'],
  ['texture-oak', WT, HT, () => scenes.oakTexture(WT, HT), 'Texture — oak flooring detail'],
  ['texture-subway-tile', WT, HT, () => scenes.subwayTexture(WT, HT), 'Texture — subway tile close-up'],
];

/* -------------------------------------------------------------------------- */
/* Logo mark — pure paths, no text, so it rasterises without any font          */
/* -------------------------------------------------------------------------- */

function markSvg({ size = 512, bg = P.ink, fg = P.accent, padding = true } = {}) {
  const s = size;
  const u = s / 100;
  const stroke = 12 * u;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${padding ? `<rect width="${s}" height="${s}" fill="${bg}"/>` : ''}
  <path d="M ${18 * u} ${80 * u} L ${18 * u} ${24 * u} L ${50 * u} ${56 * u} L ${82 * u} ${24 * u} L ${82 * u} ${80 * u}"
        fill="none" stroke="${fg}" stroke-width="${stroke}" stroke-linejoin="miter" stroke-linecap="butt"/>
  <rect x="${18 * u}" y="${86 * u}" width="${64 * u}" height="${6 * u}" fill="${fg}" opacity="0.55"/>
</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Build                                                                       */
/* -------------------------------------------------------------------------- */

async function ensureDirs() {
  await Promise.all([
    mkdir(IMAGES_DIR, { recursive: true }),
    mkdir(ICONS_DIR, { recursive: true }),
    mkdir(APP_DIR, { recursive: true }),
    mkdir(CONTENT_DIR, { recursive: true }),
  ]);
}

/** Tiny base64 LQIP for next/image `placeholder="blur"`. */
async function blurDataUrl(svgBuffer) {
  const buf = await sharp(svgBuffer, { density: 72 })
    .resize(20, 20, { fit: 'inside' })
    .webp({ quality: 30, alphaQuality: 30 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function main() {
  await ensureDirs();

  const blurMap = {};
  const credits = [];

  for (const [name, w, h, render, caption] of manifest) {
    const svgString = render();
    const svgBuffer = Buffer.from(svgString);
    const outPath = join(IMAGES_DIR, `${name}.webp`);

    await sharp(svgBuffer, { density: 96 })
      .resize(w, h, { fit: 'cover' })
      .webp({ quality: 82, effort: 5 })
      .toFile(outPath);

    blurMap[`/images/${name}.webp`] = await blurDataUrl(svgBuffer);
    credits.push({ name: `${name}.webp`, w, h, caption });
    process.stdout.write(`  ✓ ${name}.webp  ${w}×${h}\n`);
  }

  // ---- Favicons and app icons ---------------------------------------------
  const iconSvg = Buffer.from(markSvg({ size: 512 }));
  await sharp(iconSvg).resize(512, 512).png().toFile(join(APP_DIR, 'icon.png'));
  await sharp(iconSvg).resize(180, 180).png().toFile(join(APP_DIR, 'apple-icon.png'));
  await sharp(iconSvg).resize(192, 192).png().toFile(join(ICONS_DIR, 'icon-192.png'));
  await sharp(iconSvg).resize(512, 512).png().toFile(join(ICONS_DIR, 'icon-512.png'));
  await sharp(Buffer.from(markSvg({ size: 512, padding: false })))
    .resize(512, 512)
    .png()
    .toFile(join(ICONS_DIR, 'mark-transparent.png'));
  process.stdout.write('  ✓ favicons + app icons\n');

  // ---- Blur map ------------------------------------------------------------
  await writeFile(
    join(CONTENT_DIR, 'image-blur.json'),
    `${JSON.stringify(blurMap, null, 2)}\n`,
    'utf8',
  );

  // ---- CREDITS.md ----------------------------------------------------------
  const creditsMd = `# Image credits and provenance

> **Every image in this directory is AI-generated placeholder art.**
> None of them are photographs. None of them show work actually completed by
> Majesta Renovations inc. They exist so the site can be built, reviewed and
> deployed before real project photography is available.

Generated by [\`scripts/generate-images.mjs\`](../../scripts/generate-images.mjs) —
original vector scenes composed in code and rasterised to WebP with \`sharp\`.
Re-run with \`npm run images\`.

**Method:** AI-generated (Claude, via a deterministic vector-drawing script). No
photographic source material, no stock library, no third-party assets. Nothing
here carries a licence obligation, and nothing here is anyone else's work.

**Style:** deliberately illustrative rather than photorealistic. That is a
choice, not a limitation — a stylised illustration cannot be mistaken for a
photograph of a finished job, whereas a photorealistic render of a kitchen
Majesta never built would be misleading to a customer.

## What to replace before launch

Everything below. Keep the filename and aspect ratio and no code changes are
needed. Then update the matching \`alt\` text in
[\`content/site-data.json\`](../../content/site-data.json) — in **both** locales —
so it describes the real photograph, and re-run \`npm run images\` is **not**
needed (it would overwrite them). Instead, delete the entry from the manifest in
the script, or delete the script entirely once every image is real.

See also [\`content/MISSING.md\`](../../content/MISSING.md) § 5.

## Inventory

| File | Dimensions | Ratio | Depicts |
| --- | --- | --- | --- |
${credits
  .map((c) => {
    const ratio = Math.abs(c.w / c.h - 16 / 9) < 0.02 ? '16:9' : Math.abs(c.w / c.h - 4 / 3) < 0.02 ? '4:3' : Math.abs(c.w / c.h - 3 / 4) < 0.02 ? '3:4' : `${c.w}:${c.h}`;
    return `| \`${c.name}\` | ${c.w}×${c.h} | ${ratio} | ${c.caption} |`;
  })
  .join('\n')}

## Logo and icons

The wordmark is an **original** design created for this project — see
[\`src/components/brand/logo.tsx\`](../../src/components/brand/logo.tsx) for the
lockup and \`markSvg()\` in the generation script for the standalone \`M\` mark.
No existing Majesta brand assets were found; if any turn up, they take
precedence.

| File | Purpose |
| --- | --- |
| \`src/app/icon.png\` | Favicon (Next.js App Router convention) |
| \`src/app/apple-icon.png\` | Apple touch icon, 180×180 |
| \`public/icons/icon-192.png\` | PWA manifest icon |
| \`public/icons/icon-512.png\` | PWA manifest icon |
| \`public/icons/mark-transparent.png\` | Transparent-background mark |

Open Graph images are **not** in this directory — they are rendered per-locale at
request time by \`src/app/[locale]/opengraph-image.tsx\` so the text uses the real
site typography.

---

_Generated automatically. Last written by \`npm run images\`._
`;

  await writeFile(join(IMAGES_DIR, 'CREDITS.md'), creditsMd, 'utf8');
  process.stdout.write(`\n  ✓ CREDITS.md + image-blur.json\n`);
  process.stdout.write(`\nDone — ${manifest.length} images written to public/images/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
