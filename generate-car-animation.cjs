#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'index.html');

const CAR_W = 529;
const CAR_H = 205;
const LANE_GAP = 40;
const ROAD_Y = 184;
const ROAD_H = 5;
const ROAD_UNITS = 2;
const SCROLL_LOOP_VW = 100;
const SIGNS_PER_LOOP = 16;
const SIGN_SPACING_VW = 6.25;
const SIGN_POOL_SIZE = 12;
const SIGN_W = 96;
const SIGN_H = 156;
const SIGN_HALF_W = SIGN_W / 2;
const SIGN_TOP_OFFSET = 116;
const DEFAULT_TARGET_DISPLAY_KM = 60;
const MIN_TARGET_DISPLAY_KM = 10;
const DEFAULT_TARGET_HOURS = 1;
const MIN_TARGET_HOURS = 0.5;
const REFERENCE_KMH = 60;
const REFERENCE_KM_S = 6;
const JET_ENGINE_MIN_SPEED_KM_S = 20;
const ANIM_SPEED = 3;

function animDurationSec(value) {
  return `${parseFloat(value) / ANIM_SPEED}s`;
}

function animDelaySec(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n === 0) return '0s';
  return `${n / ANIM_SPEED}s`;
}

const CAR_ANIM = { drive: '8s', wheels: '1.03s', delay: '0s' };

const VARIANTS = [
  { id: '02', num: 2, name: 'Výpočet rychlosti', file: 'auto-02.svg', ...CAR_ANIM },
  { id: '07', num: 7, name: 'Výpočet vzdálenosti', file: 'auto-07.svg', ...CAR_ANIM },
  { id: '09', num: 9, name: 'Výpočet času', file: 'auto-09.svg', ...CAR_ANIM },
];

const WHEEL_CENTERS = [
  { x: 147.823, y: 150.696 },
  { x: 381.793, y: 150.696 },
];
const FRONT_WHEEL_X = WHEEL_CENTERS[1].x;
const CLOCK_SIZE = 72;
const CLOCK_TOP = 12;
const HUD_SHIFT_LEFT = 110;
const STOPWATCH_W = 104;
const STOPWATCH_H = 72;
const STOPWATCH_TOP_PATH =
  'M8.112 2.756V5.12V5.78C8.532 5.276 9.12 5.024 9.852 5.024C11.28 5.024 12.18 5.756 12.18 7.088V11H11.124V7.376C11.124 6.428 10.488 5.96 9.66 5.96C9.24 5.96 8.88 6.092 8.568 6.356C8.268 6.62 8.112 6.956 8.112 7.352V11H7.056V2.756H8.112ZM21.0283 5.24C21.3043 4.988 21.7483 4.988 22.0003 5.24C22.2763 5.492 22.2763 5.924 22.0003 6.176C21.7483 6.428 21.3043 6.428 21.0283 6.176C20.7523 5.924 20.7523 5.492 21.0283 5.24ZM21.0283 9.932C21.3043 9.68 21.7483 9.68 22.0003 9.932C22.2763 10.184 22.2763 10.616 22.0003 10.868C21.7483 11.12 21.3043 11.12 21.0283 10.868C20.7523 10.616 20.7523 10.184 21.0283 9.932ZM37.8143 5.024C39.2423 5.024 40.1423 5.756 40.1423 7.088V11H39.0863V7.376C39.0863 6.428 38.4503 5.96 37.6223 5.96C37.2023 5.96 36.8423 6.092 36.5423 6.356C36.2422 6.62 36.0863 6.956 36.0863 7.352V11H35.0303V7.376C35.0303 6.428 34.3943 5.96 33.5663 5.96C33.1463 5.96 32.7863 6.092 32.4743 6.356C32.1743 6.62 32.0183 6.956 32.0183 7.352V11H30.9623V5.144H31.9703V5.252V5.828C32.4143 5.288 33.0383 5.024 33.8303 5.024C34.7663 5.024 35.4263 5.372 35.7983 6.056C36.1223 5.516 36.8663 5.024 37.8143 5.024ZM42.7179 2.852C43.0419 2.852 43.3299 3.14 43.3299 3.476C43.3299 3.824 43.0419 4.112 42.7179 4.112C42.3699 4.112 42.0819 3.824 42.0819 3.476C42.0819 3.128 42.3699 2.852 42.7179 2.852ZM43.2339 5.144V11H42.1899V5.144H43.2339ZM48.1723 5.024C49.6003 5.024 50.5003 5.756 50.5003 7.088V11H49.4443V7.376C49.4443 6.428 48.8083 5.96 47.9803 5.96C47.5603 5.96 47.2003 6.092 46.8883 6.356C46.5883 6.62 46.4323 6.956 46.4323 7.352V11H45.3763V5.144H46.3843V5.24V5.828C46.8283 5.288 47.4283 5.024 48.1723 5.024Z';
const STOPWATCH_COLON_PATH =
  'M21.1455 25.24C21.4215 24.988 21.8655 24.988 22.1175 25.24C22.3935 25.492 22.3935 25.924 22.1175 26.176C21.8655 26.428 21.4215 26.428 21.1455 26.176C20.8695 25.924 20.8695 25.492 21.1455 25.24ZM21.1455 29.932C21.4215 29.68 21.8655 29.68 22.1175 29.932C22.3935 30.184 22.3935 30.616 22.1175 30.868C21.8655 31.12 21.4215 31.12 21.1455 30.868C20.8695 30.616 20.8695 30.184 21.1455 29.932Z';
const KM_PER_SECOND_HAND_REV = 1;
const KM_PER_MINUTE_HAND_REV = 60;
const KM_PER_HOUR_HAND_REV = KM_PER_MINUTE_HAND_REV * 12;
const REAL_SECONDS_PER_STOPWATCH_HOUR = 10;
const SPEEDO_MAX_KMH = 200;

function speedoAngleDeg(kmh) {
  const ratio = Math.min(Math.max(kmh, 0) / SPEEDO_MAX_KMH, 1);
  return 120 + ratio * 300;
}

function speedoTickMarks() {
  const ticks = [];
  const labels = [];
  for (let kmh = 0; kmh <= SPEEDO_MAX_KMH; kmh += 40) {
    const ratio = kmh / SPEEDO_MAX_KMH;
    const deg = 120 + ratio * 300;
    const a = ((deg - 90) * Math.PI) / 180;
    const major = kmh % 80 === 0;
    const r1 = major ? 27 : 29;
    const r2 = 35;
    const x1 = 40 + r1 * Math.cos(a);
    const y1 = 40 + r1 * Math.sin(a);
    const x2 = 40 + r2 * Math.cos(a);
    const y2 = 40 + r2 * Math.sin(a);
    ticks.push(
      `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${major ? '#374151' : '#9CA3AF'}" stroke-width="${major ? 1.8 : 1.1}" stroke-linecap="round"/>`
    );
    if (major || kmh === SPEEDO_MAX_KMH) {
      const lx = 40 + 22 * Math.cos(a);
      const ly = 40 + 22 * Math.sin(a);
      labels.push(
        `<text x="${fmt(lx)}" y="${fmt(ly)}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="600" fill="#6B7280">${kmh}</text>`
      );
    }
  }
  return { ticks: ticks.join('\n      '), labels: labels.join('\n      ') };
}

function speedometerMarkup() {
  const { ticks, labels } = speedoTickMarks();
  const arcStart = speedoAngleDeg(0);
  const arcEnd = speedoAngleDeg(SPEEDO_MAX_KMH);
  const a1 = ((arcStart - 90) * Math.PI) / 180;
  const a2 = ((arcEnd - 90) * Math.PI) / 180;
  const x1 = 40 + 33 * Math.cos(a1);
  const y1 = 40 + 33 * Math.sin(a1);
  const x2 = 40 + 33 * Math.cos(a2);
  const y2 = 40 + 33 * Math.sin(a2);
  return `<svg class="speedometer" width="${CLOCK_SIZE}" height="${CLOCK_SIZE}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Tachometr">
    <circle cx="40" cy="40" r="37" fill="#FFFFFF" stroke="#111827" stroke-width="2.5"/>
    <path d="M ${fmt(x1)} ${fmt(y1)} A 33 33 0 1 1 ${fmt(x2)} ${fmt(y2)}" stroke="#E5E7EB" stroke-width="4" stroke-linecap="round" fill="none"/>
    ${ticks}
    ${labels}
    <g class="speed-hand">
      <line x1="40" y1="40" x2="40" y2="14" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round"/>
    </g>
    <g class="speed-broken-mark" aria-hidden="true">
      <path d="M26 54 L54 26" stroke="#CBD5E1" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M20 42 L60 50" stroke="#E5E7EB" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="57" cy="57" r="1.4" fill="#9CA3AF" opacity="0.55"/>
      <circle cx="24" cy="30" r="1" fill="#9CA3AF" opacity="0.45"/>
    </g>
    <circle cx="40" cy="40" r="2.8" fill="#111827"/>
    <circle cx="40" cy="40" r="1.2" fill="#DC2626"/>
  </svg>`;
}

function clockTickMarks() {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    const x1 = 40 + 30 * Math.cos(a);
    const y1 = 40 + 30 * Math.sin(a);
    const x2 = 40 + 35 * Math.cos(a);
    const y2 = 40 + 35 * Math.sin(a);
    ticks.push(
      `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="#6B7280" stroke-width="1.6" stroke-linecap="round"/>`
    );
  }
  return ticks.join('\n      ');
}

function kmhFractionMarkup(extraClass = '') {
  const cls = extraClass ? `unit-fraction ${extraClass}` : 'unit-fraction';
  return `<span class="${cls}" aria-label="kilometrů za hodinu">
  <span class="unit-fraction-part">km</span>
  <span class="unit-fraction-bar" aria-hidden="true"></span>
  <span class="unit-fraction-part">h</span>
</span>`;
}

function clockMarkup() {
  return `<div class="top-hud">
  <div class="speed-question-panel" id="speedQuestionPanel">
    <p class="speed-question-text">Jakou rychlostí auto jede?</p>
    <div class="speed-answer-panel" id="speedAnswerRow">
      <input type="number" class="speed-answer-input" id="speedAnswerInput" min="0" step="1" inputmode="numeric" aria-label="Odpověď v kilometrech za hodinu" />
      ${kmhFractionMarkup()}
      <button type="button" class="speed-check-btn" id="speedCheckBtn" aria-label="Ověřit odpověď">✓</button>
    </div>
    <p class="speed-answer-feedback" id="speedAnswerFeedback" aria-live="polite"></p>
  </div>
  <div class="instrument-cluster" aria-label="Tachometr a hodiny">
  <div class="speed-stack">
  ${speedometerMarkup()}
  <div class="speed-readout" aria-live="polite">
    <span class="speed-readout-value" id="speedReadout">0</span><span class="speed-readout-unit">${kmhFractionMarkup('unit-fraction--readout')}</span>
  </div>
  </div>
  <div class="clock-stack">
  <svg class="analog-clock" width="${CLOCK_SIZE}" height="${CLOCK_SIZE}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="37" fill="#FFFFFF" stroke="#111827" stroke-width="2.5"/>
    ${clockTickMarks()}
    <g class="clock-hand clock-hand-hour">
      <line x1="40" y1="40" x2="40" y2="24" stroke="#111827" stroke-width="3.2" stroke-linecap="round"/>
    </g>
    <g class="clock-hand clock-hand-minute">
      <line x1="40" y1="40" x2="40" y2="16" stroke="#374151" stroke-width="2.4" stroke-linecap="round"/>
    </g>
    <g class="clock-hand clock-hand-second">
      <line x1="40" y1="44" x2="40" y2="12" stroke="#DC2626" stroke-width="1.2" stroke-linecap="round"/>
    </g>
    <circle cx="40" cy="40" r="2.8" fill="#111827"/>
    <circle cx="40" cy="40" r="1.2" fill="#DC2626"/>
  </svg>
  <svg class="stopwatch" width="${STOPWATCH_W}" height="${STOPWATCH_H}" viewBox="0 0 52 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${STOPWATCH_TOP_PATH}" fill="#C92020"/>
    <path d="${STOPWATCH_COLON_PATH}" fill="#C92020"/>
    <g class="stopwatch-digits">
      <text class="stopwatch-digit" data-stopwatch-part="h1" x="3.82" y="27.1" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="700" fill="#C92020">0</text>
      <text class="stopwatch-digit" data-stopwatch-part="h2" x="9.93" y="27.1" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="700" fill="#C92020">0</text>
      <text class="stopwatch-digit" data-stopwatch-part="m1" x="33.34" y="27.1" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="700" fill="#C92020">0</text>
      <text class="stopwatch-digit" data-stopwatch-part="m2" x="39.96" y="27.1" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" font-weight="700" fill="#C92020">0</text>
    </g>
  </svg>
  </div>
</div>
<div class="distance-readout" aria-live="polite">
  <span class="distance-readout-value" id="distanceReadout">0</span><span class="distance-readout-unit"> km</span>
</div>
</div>`;
}

function extractMaskedContent(svg, variantId) {
  const maskMatch = svg.match(/<mask[^>]*>[\s\S]*?<\/mask>/);
  if (!maskMatch) throw new Error('Mask nenalezena');
  const mask = maskMatch[0].replace(/id="[^"]+"/, `id="mask_car_${variantId}"`);

  const innerMatch = svg.match(/<g mask="url\(#([^)]+)\)">([\s\S]*)<\/g>\s*(?:<g>[\s\S]*?<\/g>\s*)?<\/svg>/);
  if (!innerMatch) throw new Error('Nelze parsovat SVG obsah');

  let inner = innerMatch[2];
  const opacityGroupMatch = inner.match(/<g opacity="0\.55">[\s\S]*?<\/g>/);
  const opacityGroup = opacityGroupMatch ? opacityGroupMatch[0] : '';
  if (opacityGroup) inner = inner.replace(opacityGroup, '');

  const pathRegex = /<path[\s\S]*?\/>/g;
  const paths = inner.match(pathRegex) || [];

  return {
    mask,
    wheelPaths: paths.slice(0, 14),
    bodyPaths: paths.slice(14),
    opacityGroup,
  };
}

function fmt(n) {
  return n.toFixed(2);
}

function wheelTexture(cx, cy) {
  const parts = [];
  const treadAngles = [8, 47, 91, 136, 178, 223, 268, 314, 349];

  for (const deg of treadAngles) {
    const a = (deg * Math.PI) / 180;
    const x1 = cx + 29.2 * Math.cos(a);
    const y1 = cy + 29.2 * Math.sin(a);
    const x2 = cx + 32.6 * Math.cos(a);
    const y2 = cy + 32.6 * Math.sin(a);
    parts.push(
      `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="#374151" stroke-width="1.1" stroke-linecap="round" opacity="0.42"/>`
    );
  }

  const spokeAngles = [14, 68, 142, 216, 298];
  for (const deg of spokeAngles) {
    const a = (deg * Math.PI) / 180;
    const x1 = cx + 4.5 * Math.cos(a);
    const y1 = cy + 4.5 * Math.sin(a);
    const x2 = cx + 15.8 * Math.cos(a);
    const y2 = cy + 15.8 * Math.sin(a);
    parts.push(
      `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="#9CA3AF" stroke-width="0.85" stroke-linecap="round" opacity="0.38"/>`
    );
  }

  const markA = (37 * Math.PI) / 180;
  parts.push(
    `<circle cx="${fmt(cx + 2.8 * Math.cos(markA))}" cy="${fmt(cy + 2.8 * Math.sin(markA))}" r="1.15" fill="#E5E7EB" opacity="0.75"/>`
  );

  const scratchA = (161 * Math.PI) / 180;
  parts.push(
    `<line x1="${fmt(cx + 30.8 * Math.cos(scratchA))}" y1="${fmt(cy + 30.8 * Math.sin(scratchA))}" x2="${fmt(cx + 33.2 * Math.cos(scratchA))}" y2="${fmt(cy + 33.2 * Math.sin(scratchA))}" stroke="#6B7280" stroke-width="1.35" stroke-linecap="round" opacity="0.5"/>`
  );

  return `<g class="wheel-texture">\n${parts.join('\n')}\n</g>`;
}

function kmSignMarkup(signIndex) {
  return `<div class="km-sign" data-sign-pool="${signIndex}" aria-label="0 km" hidden>
  <svg width="48" height="78" viewBox="0 0 48 78" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="36" height="36" rx="3" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2.5"/>
    <text class="km-num" x="24" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#111827">0</text>
    <text x="24" y="33" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" fill="#374151">km</text>
    <rect x="21" y="40" width="6" height="38" rx="1" fill="#9CA3AF"/>
  </svg>
</div>`;
}

function buildRoadUnit() {
  return `      <div class="scenery-unit">
        <div class="road" aria-hidden="true"></div>
      </div>`;
}

function buildSignsLayer() {
  const signs = Array.from({ length: SIGN_POOL_SIZE }, (_, i) => kmSignMarkup(i));
  return `    <div class="signs-layer">
${signs.join('\n').replace(/^/gm, '      ')}
    </div>`;
}

function buildSceneryScroll() {
  const roadUnits = Array.from({ length: ROAD_UNITS }, () => buildRoadUnit()).join('\n');
  return {
    roadHtml: roadUnits,
    signsHtml: buildSignsLayer(),
  };
}

function wheelGroup(paths, cx, cy, index) {
  const slice = paths.slice(index * 7, index * 7 + 7).join('\n');
  const texture = wheelTexture(cx, cy);
  return `<g class="wheel-anchor" transform="translate(${cx}, ${cy})">
  <g class="wheel-spin">
    <g transform="translate(${-cx}, ${-cy})">
${slice}
${texture}
    </g>
  </g>
</g>`;
}

function jetEngineMarkup(laneIndex) {
  const uid = `jet-${laneIndex}`;
  return `    <div class="jet-engine" aria-hidden="true">
      <svg width="160" height="72" viewBox="0 0 160 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${uid}-outer" x1="152" y1="36" x2="0" y2="36" gradientUnits="userSpaceOnUse">
            <stop stop-color="#44403C"/>
            <stop offset="0.1" stop-color="#EA580C"/>
            <stop offset="0.45" stop-color="#FBBF24"/>
            <stop offset="0.75" stop-color="#FEF08A"/>
            <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="${uid}-inner" x1="152" y1="36" x2="8" y2="36" gradientUnits="userSpaceOnUse">
            <stop stop-color="#DC2626"/>
            <stop offset="0.55" stop-color="#FACC15"/>
            <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect class="jet-nozzle" x="138" y="22" width="18" height="28" rx="4" fill="#1F2937" stroke="#111827" stroke-width="1.5"/>
        <path class="jet-flame jet-flame-outer" d="M138 36 C96 14 52 18 6 36 C52 54 96 58 138 36Z" fill="url(#${uid}-outer)"/>
        <path class="jet-flame jet-flame-inner" d="M138 36 C112 24 72 26 34 36 C72 46 112 48 138 36Z" fill="url(#${uid}-inner)"/>
        <path class="jet-flame jet-flame-core" d="M138 36 C118 30 92 31 58 36 C92 42 118 43 138 36Z" fill="#FFFBEB"/>
      </svg>
    </div>`;
}

function buildCar(variant, laneIndex) {
  const svgPath = path.join(ASSETS, variant.file);
  const svg = fs.readFileSync(svgPath, 'utf8');
  const { mask, wheelPaths, bodyPaths, opacityGroup } = extractMaskedContent(svg, variant.id);

  const maskRef = mask.match(/id="([^"]+)"/)[1];
  const body = bodyPaths.join('\n');
  const wheels = WHEEL_CENTERS.map((c, i) => wheelGroup(wheelPaths, c.x, c.y, i)).join('\n');
  const wheelClass = `wheel-spin-${laneIndex + 1}`;
  const wheelsWithClass = wheels.replace(/class="wheel-spin"/g, `class="wheel-spin ${wheelClass}"`);

  const scenery = buildSceneryScroll();

  return `  <div class="lane" data-car="${laneIndex + 1}" data-variant="${variant.num}" data-drive="${parseFloat(variant.drive)}" data-wheels="${parseFloat(variant.wheels)}" data-delay="${parseFloat(variant.delay)}">
    <div class="lane-clip">
      <div class="road-scroll scenery-scroll scenery-scroll-${laneIndex + 1}">
${scenery.roadHtml}
      </div>
      <div class="vegetation-layer" aria-hidden="true"></div>
    </div>
${scenery.signsHtml}
    <div class="car-drive">
${jetEngineMarkup(laneIndex)}
      <svg width="${CAR_W}" height="${CAR_H}" viewBox="0 0 ${CAR_W} ${CAR_H}" fill="none" xmlns="http://www.w3.org/2000/svg">
${mask.replace(/^/gm, '        ')}
        <g mask="url(#${maskRef})">
          <g class="car-body">
${body}
${opacityGroup}
          </g>
${wheelsWithClass.replace(/^/gm, '          ')}
        </g>
      </svg>
    </div>
  </div>`;
}

function buildHtml() {
  const kmPerLoop = SIGNS_PER_LOOP;
  const lanes = VARIANTS.map((v, i) => buildCar(v, i)).join('\n\n');
  const cssWheels = VARIANTS.map((v, i) =>
    `    .scenery-scroll-${i + 1} { animation: scroll-road ${animDurationSec(v.drive)} linear infinite ${animDelaySec(v.delay)}; }
    .wheel-spin-${i + 1} { animation: wheels ${animDurationSec(v.wheels)} linear infinite ${animDelaySec(v.delay)}; }`
  ).join('\n');
  const viewRules = VARIANTS.map((_, i) =>
    `    .stage[data-view="${i + 1}"] .lane:not([data-car="${i + 1}"]) { display: none; }`
  ).join('\n');
  const buttons = VARIANTS.map((v, i) =>
    `    <button type="button" class="car-btn${i === 0 ? ' active' : ''}" data-car="${i + 1}">${v.name}</button>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Animace pohybu aut</title>
  <style>
    :root {
      --car-w: ${CAR_W}px;
      --car-h: ${CAR_H}px;
      --road-y: ${ROAD_Y}px;
      --road-h: ${ROAD_H}px;
      --car-offset-x: -60px;
      --clock-size: ${CLOCK_SIZE}px;
      --clock-top: ${CLOCK_TOP}px;
      --front-wheel-x: calc(50vw + var(--car-offset-x) - var(--car-w) / 2 + ${FRONT_WHEEL_X}px);
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #fff;
      overflow: hidden;
    }
    .stage {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${LANE_GAP}px;
      overflow: visible;
    }
    .top-hud {
      position: fixed;
      top: var(--clock-top);
      left: 50%;
      transform: translateX(calc(-50% - ${HUD_SHIFT_LEFT}px));
      z-index: 5;
      pointer-events: none;
    }
    .speed-question-panel {
      display: none;
      position: absolute;
      top: 4px;
      right: calc(100% + 12px);
      flex-direction: column;
      gap: 8px;
      width: 210px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
      pointer-events: auto;
    }
    .speed-question-panel.is-visible {
      display: flex;
    }
    .speed-question-text {
      margin: 0;
      font: 600 13px/1.35 system-ui, -apple-system, sans-serif;
      color: #111827;
    }
    .speed-answer-panel {
      display: flex;
      align-items: center;
      gap: 6px;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #374151;
    }
    .unit-fraction {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      line-height: 1;
      font-size: 0.82em;
      vertical-align: middle;
    }
    .unit-fraction-part {
      display: block;
    }
    .unit-fraction-bar {
      display: block;
      width: 100%;
      min-width: 1.35em;
      border-top: 1.2px solid currentColor;
      margin: 1px 0;
    }
    .unit-fraction--readout {
      margin-left: 4px;
      font-size: 0.72em;
    }
    .speed-check-btn {
      appearance: none;
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border: 1px solid #111827;
      background: #fff;
      color: #111827;
      border-radius: 8px;
      font: 700 14px/1 system-ui, -apple-system, sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .speed-check-btn:hover:not(:disabled) {
      background: #F3F4F6;
      border-color: #374151;
    }
    .speed-check-btn:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .speed-answer-panel.is-correct .speed-check-btn {
      border-color: #15803D;
      background: #16A34A;
      color: #fff;
    }
    .speed-answer-panel.is-correct .speed-check-btn:hover:not(:disabled) {
      background: #15803D;
      border-color: #166534;
    }
    .speed-answer-panel.is-wrong .speed-check-btn {
      border-color: #B91C1C;
      background: #DC2626;
      color: #fff;
    }
    .speed-answer-panel.is-wrong .speed-check-btn:hover:not(:disabled) {
      background: #B91C1C;
      border-color: #991B1B;
    }
    .speed-answer-feedback {
      margin: 0;
      min-height: 1.1em;
      font: 600 12px/1.3 system-ui, -apple-system, sans-serif;
      color: #6B7280;
    }
    .speed-answer-panel.is-correct .speed-answer-input {
      border-color: #16A34A;
    }
    .speed-answer-panel.is-wrong .speed-answer-input {
      border-color: #DC2626;
    }
    .speed-answer-feedback.is-correct {
      color: #15803D;
    }
    .speed-answer-feedback.is-wrong {
      color: #DC2626;
    }
    .speed-answer-input {
      width: 76px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      padding: 8px 10px;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #111827;
      text-align: center;
      background: #fff;
    }
    .speed-answer-input:focus {
      outline: 2px solid #93C5FD;
      border-color: #60A5FA;
    }
    .speed-answer-input:disabled {
      opacity: 0.55;
      cursor: default;
      background: #F3F4F6;
    }
    .instrument-cluster {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 12px;
    }
    .clock-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .speed-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .speed-readout {
      font: 700 15px/1.2 system-ui, -apple-system, sans-serif;
      color: #111827;
      letter-spacing: -0.02em;
      white-space: nowrap;
      filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9));
    }
    .speed-readout-unit {
      font-weight: 600;
      color: #6B7280;
    }
    .distance-readout {
      position: absolute;
      top: 26px;
      left: calc(100% + 12px);
      font: 700 15px/1.2 system-ui, -apple-system, sans-serif;
      color: #111827;
      letter-spacing: -0.02em;
      white-space: nowrap;
      filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9));
    }
    .distance-readout-value {
      display: inline-block;
      min-width: 3ch;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .distance-readout-unit {
      font-weight: 600;
      color: #6B7280;
    }
    .instrument-cluster .analog-clock {
      display: block;
      width: var(--clock-size);
      height: var(--clock-size);
      filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.12));
    }
    .instrument-cluster .speedometer {
      display: block;
      width: var(--clock-size);
      height: var(--clock-size);
      filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.12));
      transition: filter 0.25s ease, opacity 0.25s ease;
    }
    .speedometer .speed-broken-mark {
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .speedometer.is-broken {
      filter: grayscale(0.55) saturate(0.65) drop-shadow(0 2px 6px rgba(15, 23, 42, 0.08));
    }
    .speedometer.is-broken .speed-broken-mark {
      opacity: 1;
    }
    .speedometer.is-broken .speed-hand line {
      stroke: #9CA3AF;
      opacity: 0.75;
    }
    .speed-stack.speed-calc-mode .speed-readout {
      display: none;
    }
    .speed-hand {
      transform-box: view-box;
      transform-origin: 40px 40px;
      transform: rotate(var(--hand-speed, 120deg));
    }
    .instrument-cluster .stopwatch {
      display: block;
      width: ${STOPWATCH_W}px;
      height: ${STOPWATCH_H}px;
    }
    .clock-hand {
      transform-box: view-box;
      transform-origin: 40px 40px;
    }
    .clock-hand-hour {
      transform: rotate(var(--hand-hour, 0deg));
    }
    .clock-hand-minute {
      transform: rotate(var(--hand-min, 0deg));
    }
    .clock-hand-second {
      transform: rotate(var(--hand-sec, 0deg));
    }
    .controls {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      max-width: calc(100vw - 32px);
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      z-index: 10;
    }
    .car-picker {
      position: fixed;
      top: 12px;
      right: 12px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      z-index: 10;
    }
    .car-btn {
      appearance: none;
      border: 1px solid #D1D5DB;
      background: #fff;
      color: #374151;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      padding: 9px 14px;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .car-btn:hover {
      border-color: #9CA3AF;
      background: #F9FAFB;
    }
    .car-btn.active {
      background: #111827;
      border-color: #111827;
      color: #fff;
    }
    .car-btn:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .start-btn {
      appearance: none;
      border: 1px solid #15803D;
      background: #16A34A;
      color: #fff;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      padding: 9px 18px;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, opacity 0.15s;
    }
    .start-btn:hover:not(:disabled) {
      background: #15803D;
      border-color: #166534;
    }
    .start-btn:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .pause-btn {
      appearance: none;
      border: 1px solid #D97706;
      background: #F59E0B;
      color: #fff;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      padding: 9px 18px;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, opacity 0.15s;
    }
    .pause-btn:hover:not(:disabled) {
      background: #D97706;
      border-color: #B45309;
    }
    .pause-btn:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .distance-field {
      display: flex;
      align-items: center;
      gap: 6px;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #374151;
      white-space: nowrap;
    }
    .distance-field input {
      width: 76px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      padding: 8px 10px;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #111827;
      text-align: center;
      background: #fff;
    }
    .distance-field input:focus {
      outline: 2px solid #93C5FD;
      border-color: #60A5FA;
    }
    .distance-field input.time-part {
      width: 52px;
    }
    .distance-field input:disabled {
      opacity: 0.55;
      cursor: default;
      background: #F3F4F6;
    }
    .lane {
      position: relative;
      width: 100vw;
      height: var(--car-h);
      overflow: visible;
      flex-shrink: 0;
    }
    .lane-clip {
      position: absolute;
      inset: 0;
      overflow: hidden;
      z-index: 0;
    }
    .road-scroll {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      width: max-content;
      height: 100%;
      will-change: transform;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      z-index: 0;
    }
    .signs-layer {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
    }
    .vegetation-layer {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      overflow: visible;
    }
    .vegetation-item {
      position: absolute;
      left: 0;
      bottom: calc(var(--car-h) - var(--road-y));
      transform: translateX(110vw);
      will-change: transform;
    }
    .stage.is-running .vegetation-item {
      animation: veg-drift var(--veg-duration, 12s) linear forwards;
    }
    .vegetation-sprite {
      transform: scale(var(--veg-scale, 1));
      transform-origin: bottom center;
    }
    .vegetation-item svg {
      display: block;
    }
    @keyframes veg-drift {
      from { transform: translate3d(110vw, 0, 0); }
      to { transform: translate3d(-20vw, 0, 0); }
    }
    .scenery-unit {
      position: relative;
      width: 100vw;
      height: 100%;
      flex-shrink: 0;
    }
    .road {
      position: absolute;
      left: 0;
      top: var(--road-y);
      width: 100%;
      height: var(--road-h);
      background: #111827;
    }
    .km-sign {
      position: absolute;
      top: calc(var(--road-y) - ${SIGN_TOP_OFFSET}px);
      left: calc(var(--front-wheel-x) - ${SIGN_HALF_W}px);
      width: ${SIGN_W}px;
      height: ${SIGN_H}px;
      pointer-events: none;
      will-change: transform;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
    }
    .km-sign svg {
      display: block;
      width: 100%;
      height: 100%;
    }
${viewRules}
    .car-drive {
      position: absolute;
      top: 0;
      left: 50%;
      width: var(--car-w);
      height: var(--car-h);
      transform: translateX(calc(-50% + var(--car-offset-x)));
      z-index: 2;
      overflow: visible;
    }
    .car-drive > svg {
      position: relative;
      z-index: 1;
      display: block;
      width: var(--car-w);
      height: var(--car-h);
    }
    .jet-engine {
      position: absolute;
      left: -148px;
      top: 68px;
      width: 160px;
      height: 72px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s ease, visibility 0.35s;
      pointer-events: none;
      z-index: 0;
    }
    .car-drive.has-jet-engine .jet-engine {
      opacity: 1;
      visibility: visible;
    }
    .jet-engine svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      filter: drop-shadow(0 0 14px rgba(251, 146, 60, 0.85)) drop-shadow(0 0 28px rgba(239, 68, 68, 0.45));
    }
    .jet-flame {
      transform-box: fill-box;
      transform-origin: 86% 50%;
    }
    .car-drive.has-jet-engine .jet-flame-outer {
      animation: jet-pulse-outer 0.14s ease-in-out infinite alternate;
    }
    .car-drive.has-jet-engine .jet-flame-inner {
      animation: jet-pulse-inner 0.09s ease-in-out infinite alternate-reverse;
    }
    .car-drive.has-jet-engine .jet-flame-core {
      animation: jet-pulse-core 0.07s ease-in-out infinite alternate;
    }
    @keyframes jet-pulse-outer {
      from { transform: scaleX(0.88) scaleY(1.06); opacity: 0.88; }
      to { transform: scaleX(1.18) scaleY(0.88); opacity: 1; }
    }
    @keyframes jet-pulse-inner {
      from { transform: scaleX(0.86) scaleY(1.04); opacity: 0.9; }
      to { transform: scaleX(1.14) scaleY(0.9); opacity: 1; }
    }
    @keyframes jet-pulse-core {
      from { transform: scaleX(0.84) scaleY(1); opacity: 0.82; }
      to { transform: scaleX(1.12) scaleY(0.94); opacity: 1; }
    }
    .wheel-spin {
      transform-box: fill-box;
      transform-origin: center;
      will-change: transform;
    }
    @keyframes scroll-road {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-${SCROLL_LOOP_VW}vw, 0, 0); }
    }
    @keyframes wheels {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
${cssWheels}
    .road-scroll,
    .wheel-spin {
      animation-play-state: paused;
    }
    .stage.is-running .road-scroll,
    .stage.is-running .wheel-spin {
      animation-play-state: running;
    }
    @media (prefers-reduced-motion: reduce) {
      .road-scroll, .wheel-spin, .vegetation-item { animation: none !important; }
      .jet-flame { animation: none !important; }
    }
  </style>
</head>
<body>
${clockMarkup()}

<div class="stage" data-view="1">

${lanes}
</div>

<nav class="controls" aria-label="Ovládání animace">
    <label class="distance-field" for="targetKmInput">
      <span>Cíl</span>
      <input type="number" id="targetKmInput" min="${MIN_TARGET_DISPLAY_KM}" step="10" value="${DEFAULT_TARGET_DISPLAY_KM}" aria-label="Cílová vzdálenost v kilometrech" />
      <span>km</span>
    </label>
    <label class="distance-field" for="targetHoursInput">
      <span>Čas</span>
      <input type="number" class="time-part" id="targetHoursInput" min="${MIN_TARGET_HOURS}" max="99" step="0.5" value="${DEFAULT_TARGET_HOURS}" aria-label="Hodiny na stopkách" />
      <span>h</span>
    </label>
    <button type="button" class="start-btn" id="startBtn">Spustit</button>
    <button type="button" class="pause-btn" id="pauseBtn" disabled>Pauza</button>
</nav>

<nav class="car-picker" aria-label="Výběr auta">
${buttons}
</nav>

<script>
  const stage = document.querySelector('.stage');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const targetKmInput = document.getElementById('targetKmInput');
  const targetHoursInput = document.getElementById('targetHoursInput');
  const carButtons = document.querySelectorAll('.car-btn');
  const MIN_TARGET_DISPLAY_KM = ${MIN_TARGET_DISPLAY_KM};
  const DEFAULT_TARGET_DISPLAY_KM = ${DEFAULT_TARGET_DISPLAY_KM};
  const DEFAULT_TARGET_HOURS = ${DEFAULT_TARGET_HOURS};
  const MIN_TARGET_HOURS = ${MIN_TARGET_HOURS};
  const REFERENCE_KMH = ${REFERENCE_KMH};
  const REFERENCE_KM_S = ${REFERENCE_KM_S};
  const JET_ENGINE_MIN_SPEED_KM_S = ${JET_ENGINE_MIN_SPEED_KM_S};
  const SPEEDO_MAX_KMH = ${SPEEDO_MAX_KMH};
  const KM_PER_LOOP = ${kmPerLoop};
  const SIGN_SPACING_VW = ${SIGN_SPACING_VW};
  const SIGN_W = ${SIGN_W};
  const SIGN_HALF_W = ${SIGN_HALF_W};
  const CAR_OFFSET_X = -60;
  const CAR_W_JS = ${CAR_W};
  const FRONT_WHEEL_X_JS = ${FRONT_WHEEL_X};
  const KM_PER_SECOND_HAND_REV = ${KM_PER_SECOND_HAND_REV};
  const KM_PER_MINUTE_HAND_REV = ${KM_PER_MINUTE_HAND_REV};
  const KM_PER_HOUR_HAND_REV = ${KM_PER_HOUR_HAND_REV};
  const REAL_SECONDS_PER_STOPWATCH_HOUR = ${REAL_SECONDS_PER_STOPWATCH_HOUR};
  const ANIM_SPEED = ${ANIM_SPEED};
  let baseKm = 0;
  let targetTravelKm = 0;
  let finished = false;
  let paused = false;
  let runStartTime = null;
  let runFinishTime = null;
  let pauseStartTime = null;
  let pausedTotalMs = 0;
  let currentRunAnimSpeed = ANIM_SPEED;
  let currentRunSpeedKmS = 0;
  const instrumentCluster = document.querySelector('.instrument-cluster');
  const speedStack = document.querySelector('.speed-stack');
  const speedometerEl = document.querySelector('.speedometer');
  const speedQuestionPanel = document.getElementById('speedQuestionPanel');
  const speedAnswerInput = document.getElementById('speedAnswerInput');
  const speedCheckBtn = document.getElementById('speedCheckBtn');
  const speedAnswerRow = document.getElementById('speedAnswerRow');
  const speedAnswerFeedback = document.getElementById('speedAnswerFeedback');
  const distanceReadout = document.getElementById('distanceReadout');
  const speedReadout = document.getElementById('speedReadout');
  const SPEED_CALC_CAR = '1';

  function getActiveLane() {
    return document.querySelector('.lane[data-car="' + stage.dataset.view + '"]');
  }

  function getActiveRoadScroll() {
    const lane = getActiveLane();
    return lane ? lane.querySelector('.road-scroll') : null;
  }

  function getFrontWheelLeftPx() {
    const vw = window.innerWidth;
    return (vw / 2) + CAR_OFFSET_X - (CAR_W_JS / 2) + FRONT_WHEEL_X_JS;
  }

  function getRoadScrollOffsetPx(scroll) {
    if (!scroll) return 0;
    const transform = getComputedStyle(scroll).transform;
    if (transform === 'none') return 0;
    return new DOMMatrix(transform).m41;
  }

  function getTravelKm() {
    if (finished) return targetTravelKm;
    const scroll = getActiveRoadScroll();
    if (!scroll) return baseKm;
    const loopWidthPx = window.innerWidth * (${SCROLL_LOOP_VW} / 100);
    if (!loopWidthPx) return baseKm;
    const offsetPx = getRoadScrollOffsetPx(scroll);
    if (!stage.classList.contains('is-running') && offsetPx === 0) return baseKm;
    const progress = ((-offsetPx % loopWidthPx) + loopWidthPx) % loopWidthPx / loopWidthPx;
    return baseKm + progress * KM_PER_LOOP;
  }

  function handAngle(revolutions) {
    const turn = ((revolutions % 1) + 1) % 1;
    return (turn * 360) + 'deg';
  }

  function getElapsedRunSeconds() {
    if (runStartTime === null) return 0;
    let end = runFinishTime !== null ? runFinishTime : performance.now();
    if (paused && pauseStartTime !== null) end = pauseStartTime;
    return Math.max(0, (end - runStartTime - pausedTotalMs) / 1000);
  }

  function getStopwatchParts() {
    const totalStopwatchMinutes = (getElapsedRunSeconds() / REAL_SECONDS_PER_STOPWATCH_HOUR) * 60;
    const hours = Math.floor(totalStopwatchMinutes / 60);
    const minutes = Math.floor(totalStopwatchMinutes % 60);
    return {
      h1: Math.floor(hours / 10) % 10,
      h2: hours % 10,
      m1: Math.floor(minutes / 10),
      m2: minutes % 10,
    };
  }

  function isSpeedCalcMode() {
    return stage.dataset.view === SPEED_CALC_CAR;
  }

  function getCurrentSpeedKmh() {
    if (!stage.classList.contains('is-running')) return 0;
    return currentRunSpeedKmS * REFERENCE_KMH / REFERENCE_KM_S;
  }

  function speedHandAngle(kmh) {
    const ratio = Math.min(Math.max(kmh, 0) / SPEEDO_MAX_KMH, 1);
    return (120 + ratio * 300) + 'deg';
  }

  function getCorrectSpeedKmh() {
    return Math.round(getTargetDisplayKm() / getTargetStopwatchHours());
  }

  function clearSpeedAnswerFeedback() {
    if (speedAnswerRow) {
      speedAnswerRow.classList.remove('is-correct', 'is-wrong');
    }
    if (speedAnswerFeedback) {
      speedAnswerFeedback.textContent = '';
      speedAnswerFeedback.classList.remove('is-correct', 'is-wrong');
    }
  }

  function verifySpeedAnswer() {
    if (!speedAnswerInput) return;
    const raw = Number(speedAnswerInput.value);
    clearSpeedAnswerFeedback();
    if (!Number.isFinite(raw)) {
      if (speedAnswerRow) speedAnswerRow.classList.add('is-wrong');
      if (speedAnswerFeedback) {
        speedAnswerFeedback.textContent = 'Zadej číslo';
        speedAnswerFeedback.classList.add('is-wrong');
      }
      return;
    }
    const isCorrect = Math.round(raw) === getCorrectSpeedKmh();
    if (speedAnswerRow) speedAnswerRow.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    if (speedAnswerFeedback) {
      speedAnswerFeedback.textContent = isCorrect ? 'Správně!' : 'Špatně';
      speedAnswerFeedback.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    }
  }

  function updateSpeedQuestionPanel() {
    const show = isSpeedCalcMode() && runStartTime !== null;
    if (speedQuestionPanel) {
      speedQuestionPanel.classList.toggle('is-visible', show);
    }
    if (speedAnswerInput) {
      speedAnswerInput.disabled = !show;
    }
    if (speedCheckBtn) {
      speedCheckBtn.disabled = !show;
    }
    if (!show) clearSpeedAnswerFeedback();
  }

  function updateSpeedometer() {
    const speedCalcMode = isSpeedCalcMode();
    if (speedStack) speedStack.classList.toggle('speed-calc-mode', speedCalcMode);
    if (speedometerEl) speedometerEl.classList.toggle('is-broken', speedCalcMode);

    if (speedCalcMode) {
      if (instrumentCluster) instrumentCluster.style.setProperty('--hand-speed', '120deg');
      return;
    }

    const kmh = getCurrentSpeedKmh();
    const rounded = Math.round(kmh);
    if (instrumentCluster) {
      instrumentCluster.style.setProperty('--hand-speed', speedHandAngle(kmh));
    }
    if (speedReadout && speedReadout.textContent !== String(rounded)) {
      speedReadout.textContent = String(rounded);
    }
  }

  function updateDistanceReadout() {
    if (!distanceReadout) return;
    const km = Math.round(getTravelKm());
    const text = String(km);
    if (distanceReadout.textContent !== text) distanceReadout.textContent = text;
  }

  function updateStopwatch() {
    if (!instrumentCluster) return;
    const parts = getStopwatchParts();
    instrumentCluster.querySelectorAll('.stopwatch-digit').forEach((el) => {
      const key = el.getAttribute('data-stopwatch-part');
      const value = parts[key];
      if (value === undefined) return;
      const text = String(value);
      if (el.textContent !== text) el.textContent = text;
    });
  }

  function getTargetDisplayKm() {
    const raw = Number(targetKmInput.value);
    if (!Number.isFinite(raw)) return DEFAULT_TARGET_DISPLAY_KM;
    return Math.max(MIN_TARGET_DISPLAY_KM, Math.round(raw));
  }

  function getTargetStopwatchHours() {
    const raw = Number(targetHoursInput.value);
    if (!Number.isFinite(raw)) {
      targetHoursInput.value = DEFAULT_TARGET_HOURS;
      return DEFAULT_TARGET_HOURS;
    }
    const hours = Math.max(MIN_TARGET_HOURS, Math.round(raw * 2) / 2);
    targetHoursInput.value = hours;
    return hours;
  }

  function getRequiredRealSpeedKmS() {
    const km = getTargetDisplayKm();
    const stopwatchHours = getTargetStopwatchHours();
    const kmh = km / stopwatchHours;
    return kmh * REFERENCE_KM_S / REFERENCE_KMH;
  }

  function updateJetEngine() {
    const showJet = !finished
      && currentRunSpeedKmS >= JET_ENGINE_MIN_SPEED_KM_S
      && runStartTime !== null
      && (stage.classList.contains('is-running') || stage.classList.contains('is-paused'));
    document.querySelectorAll('.car-drive').forEach((carDrive) => {
      const lane = carDrive.closest('.lane');
      const isActive = lane && lane.dataset.car === stage.dataset.view;
      carDrive.classList.toggle('has-jet-engine', showJet && isActive);
    });
  }

  function applyRunSpeed(realKmPerSec) {
    const lane = getActiveLane();
    if (!lane) return;
    const baseDrive = Number(lane.dataset.drive);
    const baseWheels = Number(lane.dataset.wheels);
    const baseDelay = Number(lane.dataset.delay);
    if (!Number.isFinite(baseDrive) || !Number.isFinite(baseWheels)) return;

    const animSpeed = realKmPerSec * baseDrive / KM_PER_LOOP;
    currentRunAnimSpeed = animSpeed > 0 ? animSpeed : ANIM_SPEED;

    const driveSec = baseDrive / currentRunAnimSpeed;
    const wheelsSec = baseWheels / currentRunAnimSpeed;
    const delaySec = baseDelay / currentRunAnimSpeed;

    lane.querySelectorAll('.road-scroll, .wheel-spin').forEach((el) => {
      el.style.animationDuration = (el.classList.contains('road-scroll') ? driveSec : wheelsSec).toFixed(4) + 's';
      el.style.animationDelay = delaySec.toFixed(4) + 's';
      el.style.animationTimingFunction = 'linear';
      el.style.animationIterationCount = 'infinite';
    });

    currentRunSpeedKmS = realKmPerSec > 0 ? realKmPerSec : 0;
    updateJetEngine();
  }

  function snapToTargetKm() {
    const scroll = getActiveRoadScroll();
    const lane = getActiveLane();
    if (!scroll || !lane) return;

    const loopWidthPx = window.innerWidth * (${SCROLL_LOOP_VW} / 100);
    if (!loopWidthPx) return;

    baseKm = Math.floor(targetTravelKm / KM_PER_LOOP) * KM_PER_LOOP;
    const progress = (targetTravelKm - baseKm) / KM_PER_LOOP;
    const offsetPx = -progress * loopWidthPx;

    const baseDrive = Number(lane.dataset.drive);
    const baseWheels = Number(lane.dataset.wheels);
    const baseDelay = Number(lane.dataset.delay);
    const driveSec = baseDrive / currentRunAnimSpeed;
    const wheelsSec = baseWheels / currentRunAnimSpeed;
    const delaySec = baseDelay / currentRunAnimSpeed;
    const totalElapsed = (targetTravelKm / KM_PER_LOOP) * driveSec;
    const wheelTurn = ((totalElapsed - delaySec) / wheelsSec) % 1;
    const wheelDeg = ((wheelTurn % 1) + 1) % 1 * 360;

    scroll.style.animation = 'none';
    scroll.style.transform = 'translate3d(' + offsetPx + 'px, 0, 0)';

    lane.querySelectorAll('.wheel-spin').forEach((wheel) => {
      wheel.style.animation = 'none';
      wheel.style.transform = 'rotate(' + wheelDeg + 'deg)';
    });
  }

  function freezeVegetation() {
    document.querySelectorAll('.vegetation-item').forEach((el) => {
      const transform = getComputedStyle(el).transform;
      el.style.animation = 'none';
      if (transform !== 'none') {
        el.style.transform = transform;
      }
    });
  }

  function pauseRun() {
    if (finished || paused || !stage.classList.contains('is-running')) return;
    paused = true;
    pauseStartTime = performance.now();
    freezeVegetation();
    stage.classList.remove('is-running');
    stage.classList.add('is-paused');
    if (vegTimer) {
      clearInterval(vegTimer);
      vegTimer = null;
    }
    pauseBtn.textContent = 'Pokračovat';
    updateJetEngine();
  }

  function resumeRun() {
    if (finished || !paused) return;
    pausedTotalMs += performance.now() - pauseStartTime;
    pauseStartTime = null;
    paused = false;
    stage.classList.remove('is-paused');
    stage.classList.add('is-running');
    pauseBtn.textContent = 'Pauza';
    startVegetation();
    updateJetEngine();
  }

  function resetAnimationElement(el) {
    el.style.animation = 'none';
    el.style.transform = '';
    el.style.animationDuration = '';
    el.style.animationDelay = '';
    el.style.animationTimingFunction = '';
    el.style.animationIterationCount = '';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function resetToStart() {
    finished = false;
    paused = false;
    pausedTotalMs = 0;
    pauseStartTime = null;
    baseKm = 0;
    targetTravelKm = 0;
    runStartTime = null;
    runFinishTime = null;
    currentRunSpeedKmS = 0;
    currentRunAnimSpeed = ANIM_SPEED;

    stage.classList.remove('is-running', 'is-paused');

    document.querySelectorAll('.road-scroll, .wheel-spin').forEach(resetAnimationElement);
    document.querySelectorAll('.vegetation-item').forEach((el) => el.remove());
    document.querySelectorAll('.car-drive').forEach((el) => el.classList.remove('has-jet-engine'));
    if (vegTimer) {
      clearInterval(vegTimer);
      vegTimer = null;
    }

    targetKmInput.value = DEFAULT_TARGET_DISPLAY_KM;
    targetHoursInput.value = DEFAULT_TARGET_HOURS;
    carButtons.forEach((btn, i) => {
      btn.classList.toggle('active', i === 0);
      btn.disabled = false;
    });
    if (carButtons.length) {
      stage.dataset.view = carButtons[0].dataset.car;
    }

    startBtn.disabled = false;
    startBtn.textContent = 'Spustit';
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pauza';
    targetKmInput.disabled = false;
    targetHoursInput.disabled = false;
    if (speedAnswerInput) speedAnswerInput.value = '';
    clearSpeedAnswerFeedback();

    if (instrumentCluster) {
      instrumentCluster.style.setProperty('--hand-sec', handAngle(0));
      instrumentCluster.style.setProperty('--hand-min', handAngle(0));
      instrumentCluster.style.setProperty('--hand-hour', handAngle(0));
      instrumentCluster.style.setProperty('--hand-speed', '120deg');
    }

    updateKmSigns();
    updateDistanceReadout();
    updateSpeedometer();
    updateSpeedQuestionPanel();
    updateStopwatch();
    updateJetEngine();
  }

  function stopAtDestination() {
    if (finished) return;
    finished = true;
    runFinishTime = performance.now();
    snapToTargetKm();
    freezeVegetation();
    stage.classList.remove('is-running');
    updateJetEngine();
    if (vegTimer) {
      clearInterval(vegTimer);
      vegTimer = null;
    }
    startBtn.disabled = false;
    startBtn.textContent = 'Zpět na start';
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pauza';
    targetKmInput.disabled = true;
    targetHoursInput.disabled = true;
    carButtons.forEach((btn) => { btn.disabled = true; });
  }

  function updateClock() {
    const km = getTravelKm();
    updateKmSigns();
    updateDistanceReadout();
    updateSpeedometer();
    updateStopwatch();
    if (stage.classList.contains('is-running') && getTravelKm() >= targetTravelKm) {
      stopAtDestination();
    }
    if (instrumentCluster) {
      instrumentCluster.style.setProperty('--hand-sec', handAngle(km / KM_PER_SECOND_HAND_REV));
      instrumentCluster.style.setProperty('--hand-min', handAngle(km / KM_PER_MINUTE_HAND_REV));
      instrumentCluster.style.setProperty('--hand-hour', handAngle(km / KM_PER_HOUR_HAND_REV));
    }
    requestAnimationFrame(updateClock);
  }

  function kmFontSize(km) {
    if (km >= 100) return 11;
    if (km >= 10) return 13;
    return 16;
  }

  function updateKmSigns() {
    const lane = getActiveLane();
    if (!lane) return;
    const travelKm = getTravelKm();
    const vw = window.innerWidth;
    const frontWheelPx = getFrontWheelLeftPx();
    const signWidthVw = (SIGN_W / vw) * 100;
    const hideLeftVw = ((SIGN_HALF_W - frontWheelPx) / vw) * 100 - signWidthVw;
    const hideRightVw = 105;
    const markers = [];
    const startKm = Math.max(0, Math.floor(travelKm / 10) * 10 - 20);
    const endKm = Math.ceil(travelKm / 10) * 10 + 50;

    for (let km = startKm; km <= endKm; km += 10) {
      const distVw = (km - travelKm) * SIGN_SPACING_VW;
      if (distVw > hideLeftVw && distVw < hideRightVw) {
        markers.push({ km, distVw });
      }
    }

    markers.sort((a, b) => a.distVw - b.distVw);

    lane.querySelectorAll('.km-sign').forEach((sign, i) => {
      if (i < markers.length) {
        const { km, distVw } = markers[i];
        const distPx = (distVw / 100) * vw;
        sign.style.transform = 'translate3d(' + distPx + 'px, 0, 0)';
        const num = sign.querySelector('.km-num');
        if (Number(sign.dataset.displayKm) !== km) {
          num.textContent = km;
          num.setAttribute('font-size', kmFontSize(km));
          sign.dataset.displayKm = String(km);
        }
        sign.setAttribute('aria-label', km + ' km');
        sign.hidden = false;
      } else {
        delete sign.dataset.displayKm;
        sign.hidden = true;
      }
    });
  }

  function isActiveScenery(scenery) {
    const lane = scenery.closest('.lane');
    return lane && lane.dataset.car === stage.dataset.view;
  }

  document.querySelectorAll('.road-scroll').forEach((scenery) => {
    scenery.addEventListener('animationiteration', () => {
      if (!isActiveScenery(scenery)) return;
      baseKm += KM_PER_LOOP;
    });
  });

  let vegTimer = null;

  function vegetationSvg(type) {
    if (type === 'bush') {
      return '<svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
        + '<ellipse cx="13" cy="15" rx="12" ry="9" fill="#15803D"/>'
        + '<ellipse cx="27" cy="13" rx="11" ry="8" fill="#22C55E"/>'
        + '<ellipse cx="20" cy="17" rx="10" ry="7" fill="#16A34A"/>'
        + '</svg>';
    }
    if (type === 'pine') {
      return '<svg width="30" height="52" viewBox="0 0 30 52" fill="none" xmlns="http://www.w3.org/2000/svg">'
        + '<rect x="13" y="38" width="4" height="14" fill="#78350F"/>'
        + '<path d="M15 4L26 22H19L24 34H16L20 44H10L14 34H6L11 22H4L15 4Z" fill="#166534"/>'
        + '<path d="M15 10L22 22H17L20 30H12L15 22H8L15 10Z" fill="#22C55E" opacity="0.85"/>'
        + '</svg>';
    }
    return '<svg width="34" height="50" viewBox="0 0 34 50" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '<rect x="15" y="34" width="4" height="16" fill="#92400E"/>'
      + '<circle cx="17" cy="22" r="15" fill="#16A34A"/>'
      + '<circle cx="11" cy="18" r="10" fill="#22C55E" opacity="0.9"/>'
      + '<circle cx="23" cy="20" r="9" fill="#15803D" opacity="0.8"/>'
      + '</svg>';
  }

  function spawnVegetation() {
    if (!stage.classList.contains('is-running')) return;
    const lane = document.querySelector('.lane[data-car="' + stage.dataset.view + '"]');
    if (!lane) return;
    const layer = lane.querySelector('.vegetation-layer');
    const types = ['tree', 'bush', 'pine'];
    const type = types[Math.floor(Math.random() * types.length)];
    const el = document.createElement('div');
    el.className = 'vegetation-item';
    const duration = (9 + Math.random() * 11) / currentRunAnimSpeed;
    const baseScale = 0.65 + Math.random() * 0.55;
    const scale = type === 'bush' ? baseScale : baseScale * 2;
    const bottom = 14 + Math.random() * 28;
    el.style.setProperty('--veg-duration', duration.toFixed(2) + 's');
    el.style.setProperty('--veg-scale', scale.toFixed(2));
    el.style.bottom = bottom + 'px';
    el.innerHTML = '<div class="vegetation-sprite">' + vegetationSvg(type) + '</div>';
    el.addEventListener('animationend', () => el.remove());
    layer.appendChild(el);
  }

  function startVegetation() {
    if (vegTimer) return;
    spawnVegetation();
    spawnVegetation();
    spawnVegetation();
    vegTimer = setInterval(() => {
      if (Math.random() < 0.72) spawnVegetation();
    }, (900 + Math.random() * 1400) / currentRunAnimSpeed);
  }

  startBtn.addEventListener('click', () => {
    if (finished || stage.classList.contains('is-running') || paused) {
      resetToStart();
      return;
    }
    const targetDisplayKm = getTargetDisplayKm();
    targetKmInput.value = targetDisplayKm;
    targetTravelKm = targetDisplayKm;
    getTargetStopwatchHours();
    applyRunSpeed(getRequiredRealSpeedKmS());
    finished = false;
    paused = false;
    pausedTotalMs = 0;
    pauseStartTime = null;
    runStartTime = performance.now();
    runFinishTime = null;
    stage.classList.add('is-running');
    updateJetEngine();
    updateSpeedQuestionPanel();
    startBtn.disabled = false;
    startBtn.textContent = 'Zpět na start';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pauza';
    targetKmInput.disabled = true;
    targetHoursInput.disabled = true;
    carButtons.forEach((btn) => { btn.disabled = true; });
    startVegetation();
  });

  pauseBtn.addEventListener('click', () => {
    if (paused) resumeRun();
    else pauseRun();
  });

  carButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (finished || stage.classList.contains('is-running') || paused) return;
      carButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      stage.dataset.view = btn.dataset.car;
      if (speedAnswerInput) speedAnswerInput.value = '';
      clearSpeedAnswerFeedback();
      updateSpeedometer();
      updateSpeedQuestionPanel();
    });
  });

  if (speedCheckBtn) {
    speedCheckBtn.addEventListener('click', verifySpeedAnswer);
  }
  if (speedAnswerInput) {
    speedAnswerInput.addEventListener('input', clearSpeedAnswerFeedback);
  }

  updateKmSigns();
  updateSpeedometer();
  updateSpeedQuestionPanel();
  updateStopwatch();
  updateClock();
</script>
</body>
</html>
`;
}

const html = buildHtml();
fs.writeFileSync(OUT, html);
console.log('Vygenerováno:', OUT);
