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
const TARGET_KM_STEP = 10;
const DEFAULT_TARGET_SPEED_KMH = 60;
const MIN_TARGET_SPEED_KMH = 5;
const TARGET_SPEED_STEP = 5;
const DEFAULT_TARGET_HOURS = 1;
const MIN_TARGET_HOURS = 0.5;
const MAX_TARGET_HOURS = 99;
const TARGET_HOURS_STEP = 0.5;
const REFERENCE_KMH = 60;
const REFERENCE_KM_S = 6;
const JET_ENGINE_MIN_SPEED_KM_S = 20;
const ANIM_SPEED = 3;

function formatDecimalComma(value) {
  return String(value).replace('.', ',');
}

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
const HUD_SHIFT_LEFT = 170;
const CONTROLS_SHIFT_LEFT = 60;
const HUD_GAUGE_GAP = 100;
const ANSWER_TOLERANCE = 0.5;
const KM_PER_SECOND_HAND_REV = 1;
const KM_PER_MINUTE_HAND_REV = 60;
const KM_PER_HOUR_HAND_REV = KM_PER_MINUTE_HAND_REV * 12;
const REAL_SECONDS_PER_STOPWATCH_HOUR = 10;
const SPEEDO_DIAL_LABEL_MAX_KMH = 200;
const SPEEDO_NEEDLE_MAX_KMH = 240;
const SPEEDO_ZERO_GAP_DEG = 10;
const SPEEDO_SWEEP_DEG = 360 - SPEEDO_ZERO_GAP_DEG;
const SPEEDO_NEEDLE_RAMP_MS = 200;

function speedoAngleDeg(kmh) {
  const ratio = Math.min(Math.max(kmh, 0) / SPEEDO_NEEDLE_MAX_KMH, 1);
  return 120 + ratio * SPEEDO_SWEEP_DEG;
}

function speedoTickMarks() {
  const ticks = [];
  const labels = [];
  for (let kmh = 0; kmh <= SPEEDO_DIAL_LABEL_MAX_KMH; kmh += 40) {
    const ratio = kmh / SPEEDO_NEEDLE_MAX_KMH;
    const deg = 120 + ratio * SPEEDO_SWEEP_DEG;
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
    if (major || kmh === SPEEDO_DIAL_LABEL_MAX_KMH) {
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
  const arcEnd = speedoAngleDeg(SPEEDO_NEEDLE_MAX_KMH);
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
    <foreignObject class="speedometer-unit" x="24" y="47" width="32" height="20">
      <div xmlns="http://www.w3.org/1999/xhtml" class="speedometer-unit-inner">${kmhFractionMarkup('unit-fraction--speedo')}</div>
    </foreignObject>
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

function answerKeypadMarkup() {
  const digitBtns = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((n) => `<button type="button" class="answer-keypad-key" data-key="${n}">${n}</button>`)
    .join('\n    ');
  return `<div class="answer-keypad" id="answerKeypad" hidden aria-label="Číselná klávesnice">
  <div class="answer-keypad-grid" id="answerKeypadGrid" role="group" aria-label="Číslice">
    ${digitBtns}
    <button type="button" class="answer-keypad-key answer-keypad-key--comma" id="answerKeypadComma" data-key=",">,</button>
    <button type="button" class="answer-keypad-key" data-key="0">0</button>
    <button type="button" class="answer-keypad-key" data-key="backspace" aria-label="Smazat">⌫</button>
  </div>
  <div class="answer-keypad-actions">
    <button type="button" class="answer-keypad-action answer-keypad-check" id="answerKeypadCheck" data-key="submit" aria-label="Ověřit odpověď">✓</button>
    <button type="button" class="answer-keypad-action answer-keypad-close" id="answerKeypadClose" data-key="close" aria-label="Zavřít klávesnici">×</button>
  </div>
</div>`;
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
  <div class="instrument-cluster" aria-label="Tachometr a hodiny">
  <div class="speed-stack">
  ${speedometerMarkup()}
  <div class="speed-readout" aria-live="polite">
    <span class="speed-readout-value" id="speedReadout">0</span><span class="speed-readout-unit">${kmhFractionMarkup('unit-fraction--readout')}</span>
  </div>
  </div>
  <div class="clock-stack" id="clockStack">
  <svg class="analog-clock" id="analogClockEl" width="${CLOCK_SIZE}" height="${CLOCK_SIZE}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <g class="clock-broken-mark" aria-hidden="true">
      <path d="M26 54 L54 26" stroke="#CBD5E1" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M20 42 L60 50" stroke="#E5E7EB" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="57" cy="57" r="1.4" fill="#9CA3AF" opacity="0.55"/>
      <circle cx="24" cy="30" r="1" fill="#9CA3AF" opacity="0.45"/>
    </g>
    <circle cx="40" cy="40" r="2.8" fill="#111827"/>
    <circle cx="40" cy="40" r="1.2" fill="#DC2626"/>
  </svg>
  <div class="stopwatch" id="stopwatchEl" aria-live="polite">00 h : 00 min</div>
  <div class="hud-question-slot">
  ${answerKeypadMarkup()}
    <div class="speed-question-panel" id="speedQuestionPanel">
      <div class="calc-question-row">
        <p class="speed-question-text" id="speedQuestionText">Jakou rychlostí auto jede?</p>
        <div class="speed-answer-panel" id="speedAnswerRow">
          <input type="text" class="speed-answer-input" id="speedAnswerInput" readonly inputmode="none" autocomplete="off" aria-label="Odpověď v kilometrech za hodinu" />
          ${kmhFractionMarkup()}
        </div>
      </div>
      <p class="speed-answer-feedback" id="speedAnswerFeedback" aria-live="polite"></p>
    </div>
    <div class="distance-question-panel" id="distanceQuestionPanel">
      <div class="calc-question-row">
        <p class="distance-question-text" id="distanceQuestionText">Jak daleko auto dojede?</p>
        <div class="distance-answer-panel" id="distanceAnswerRow">
          <input type="text" class="distance-answer-input" id="distanceAnswerInput" readonly inputmode="none" autocomplete="off" aria-label="Odpověď v kilometrech" />
          <span>km</span>
        </div>
      </div>
      <p class="distance-answer-feedback" id="distanceAnswerFeedback" aria-live="polite"></p>
    </div>
    <div class="time-question-panel" id="timeQuestionPanel">
      <div class="calc-question-row">
        <p class="time-question-text" id="timeQuestionText">Jak dlouho auto pojede?</p>
        <div class="time-answer-panel" id="timeAnswerRow">
          <input type="text" class="time-answer-input" id="timeAnswerInput" readonly inputmode="none" autocomplete="off" aria-label="Odpověď v hodinách" />
          <span>h</span>
        </div>
      </div>
      <p class="time-answer-feedback" id="timeAnswerFeedback" aria-live="polite"></p>
    </div>
  </div>
  </div>
</div>
<div class="distance-readout-wrap">
  <div class="distance-readout" id="distanceReadoutEl" aria-live="polite">
    <svg class="distance-readout-icon" width="30" height="12" viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 9.5 Q15 1.5 28 9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M11 7.8 L19 6.2" stroke="currentColor" stroke-width="1.1" stroke-dasharray="2.2 2.2" stroke-linecap="round" opacity="0.55"/>
    </svg>
    <span class="distance-readout-value" id="distanceReadout">0</span>
    <span class="distance-readout-unit">km</span>
  </div>
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
    .hud-question-slot {
      position: absolute;
      top: calc(100% + 40px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 6;
      width: max-content;
      max-width: min(380px, calc(100vw - 48px));
      pointer-events: none;
    }
    .hud-question-slot .answer-keypad,
    .hud-question-slot .speed-question-panel,
    .hud-question-slot .distance-question-panel,
    .hud-question-slot .time-question-panel {
      pointer-events: auto;
    }
    .speed-question-panel,
    .distance-question-panel,
    .time-question-panel {
      display: none;
      flex-direction: column;
      gap: 8px;
      width: max-content;
      max-width: min(380px, calc(100vw - 48px));
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    }
    .speed-question-panel.is-visible,
    .distance-question-panel.is-visible,
    .time-question-panel.is-visible {
      display: flex;
    }
    .calc-question-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .speed-question-text,
    .distance-question-text,
    .time-question-text {
      flex-shrink: 0;
    }
    .speed-question-text,
    .distance-question-text,
    .time-question-text {
      margin: 0;
      font: 600 13px/1.35 system-ui, -apple-system, sans-serif;
      color: #111827;
    }
    .speed-answer-panel,
    .distance-answer-panel,
    .time-answer-panel {
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
    .speedometer-unit {
      pointer-events: none;
      overflow: visible;
    }
    .speedometer-unit-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #6B7280;
    }
    .unit-fraction--speedo {
      font: 600 6.5px/1 system-ui, -apple-system, sans-serif;
    }
    .unit-fraction--speedo .unit-fraction-bar {
      min-width: 14px;
      border-top-width: 0.8px;
      margin: 0.5px 0;
    }
    .speed-check-btn,
    .distance-check-btn,
    .time-check-btn {
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
    .speed-check-btn:hover:not(:disabled),
    .distance-check-btn:hover:not(:disabled),
    .time-check-btn:hover:not(:disabled) {
      background: #F3F4F6;
      border-color: #374151;
    }
    .speed-check-btn:disabled,
    .distance-check-btn:disabled,
    .time-check-btn:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .speed-answer-panel.is-correct .speed-check-btn,
    .distance-answer-panel.is-correct .distance-check-btn,
    .time-answer-panel.is-correct .time-check-btn {
      border-color: #15803D;
      background: #16A34A;
      color: #fff;
    }
    .speed-answer-panel.is-correct .speed-check-btn:hover:not(:disabled),
    .distance-answer-panel.is-correct .distance-check-btn:hover:not(:disabled),
    .time-answer-panel.is-correct .time-check-btn:hover:not(:disabled) {
      background: #15803D;
      border-color: #166534;
    }
    .speed-answer-panel.is-wrong .speed-check-btn,
    .distance-answer-panel.is-wrong .distance-check-btn,
    .time-answer-panel.is-wrong .time-check-btn {
      border-color: #B91C1C;
      background: #DC2626;
      color: #fff;
    }
    .speed-answer-panel.is-wrong .speed-check-btn:hover:not(:disabled),
    .distance-answer-panel.is-wrong .distance-check-btn:hover:not(:disabled),
    .time-answer-panel.is-wrong .time-check-btn:hover:not(:disabled) {
      background: #B91C1C;
      border-color: #991B1B;
    }
    .speed-answer-panel.is-approximate .speed-check-btn,
    .distance-answer-panel.is-approximate .distance-check-btn,
    .time-answer-panel.is-approximate .time-check-btn {
      border-color: #EA580C;
      background: #F97316;
      color: #fff;
    }
    .speed-answer-panel.is-approximate .speed-check-btn:hover:not(:disabled),
    .distance-answer-panel.is-approximate .distance-check-btn:hover:not(:disabled),
    .time-answer-panel.is-approximate .time-check-btn:hover:not(:disabled) {
      background: #EA580C;
      border-color: #C2410C;
    }
    .speed-answer-feedback,
    .distance-answer-feedback,
    .time-answer-feedback {
      margin: 0;
      min-height: 1.1em;
      font: 600 12px/1.3 system-ui, -apple-system, sans-serif;
      color: #6B7280;
    }
    .speed-answer-panel.is-correct .speed-answer-input,
    .distance-answer-panel.is-correct .distance-answer-input,
    .time-answer-panel.is-correct .time-answer-input {
      border-color: #16A34A;
    }
    .speed-answer-panel.is-wrong .speed-answer-input,
    .distance-answer-panel.is-wrong .distance-answer-input,
    .time-answer-panel.is-wrong .time-answer-input {
      border-color: #DC2626;
    }
    .speed-answer-panel.is-approximate .speed-answer-input,
    .distance-answer-panel.is-approximate .distance-answer-input,
    .time-answer-panel.is-approximate .time-answer-input {
      border-color: #F97316;
    }
    .speed-answer-feedback.is-correct,
    .distance-answer-feedback.is-correct,
    .time-answer-feedback.is-correct {
      color: #15803D;
    }
    .speed-answer-feedback.is-wrong,
    .distance-answer-feedback.is-wrong,
    .time-answer-feedback.is-wrong {
      color: #DC2626;
    }
    .speed-answer-feedback.is-approximate,
    .distance-answer-feedback.is-approximate,
    .time-answer-feedback.is-approximate {
      color: #EA580C;
    }
    .speed-answer-input,
    .distance-answer-input,
    .time-answer-input {
      width: 76px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      padding: 8px 10px;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #111827;
      text-align: center;
      background: #fff;
    }
    .speed-answer-input:focus,
    .distance-answer-input:focus,
    .time-answer-input:focus {
      outline: 2px solid #93C5FD;
      border-color: #60A5FA;
    }
    .speed-answer-input:disabled,
    .distance-answer-input:disabled,
    .time-answer-input:disabled {
      opacity: 0.55;
      cursor: default;
      background: #F3F4F6;
    }
    .instrument-cluster {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: ${HUD_GAUGE_GAP}px;
    }
    .clock-stack {
      position: relative;
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
    .distance-readout-wrap {
      position: absolute;
      top: 0;
      left: calc(100% + ${HUD_GAUGE_GAP}px);
      display: flex;
      align-items: center;
      min-height: var(--clock-size);
      pointer-events: none;
    }
    .distance-readout {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      min-width: 58px;
      padding: 7px 11px 8px;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
      border: 2px solid #111827;
      border-radius: 14px;
      box-shadow:
        0 2px 6px rgba(15, 23, 42, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.85);
      transition: filter 0.25s ease, opacity 0.25s ease, border-color 0.25s ease;
    }
    .distance-readout.is-broken {
      filter: grayscale(0.55) saturate(0.65);
      border-color: #9CA3AF;
      box-shadow:
        0 2px 6px rgba(15, 23, 42, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }
    .distance-readout-icon {
      display: block;
      width: 30px;
      height: 12px;
      margin-bottom: 2px;
      color: #6B7280;
    }
    .distance-readout.is-broken .distance-readout-icon {
      color: #9CA3AF;
    }
    .distance-readout.is-broken .distance-readout-value,
    .distance-readout.is-broken .distance-readout-unit {
      color: #9CA3AF;
    }
    .distance-readout-value {
      display: block;
      min-width: 2.5ch;
      text-align: center;
      font: 700 22px/1.05 system-ui, -apple-system, sans-serif;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
      color: #111827;
    }
    .distance-readout-unit {
      display: block;
      font: 600 10px/1 system-ui, -apple-system, sans-serif;
      letter-spacing: 0.02em;
      color: #6B7280;
    }
    .instrument-cluster .analog-clock {
      display: block;
      width: var(--clock-size);
      height: var(--clock-size);
      filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.12));
      transition: filter 0.25s ease, opacity 0.25s ease;
    }
    .analog-clock .clock-broken-mark {
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .analog-clock.is-broken {
      filter: grayscale(0.55) saturate(0.65) drop-shadow(0 2px 6px rgba(15, 23, 42, 0.08));
    }
    .analog-clock.is-broken .clock-broken-mark {
      opacity: 1;
    }
    .analog-clock.is-broken .clock-hand line {
      stroke: #9CA3AF;
      opacity: 0.75;
    }
    .clock-stack.time-calc-mode .stopwatch {
      visibility: hidden;
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
    .speedometer.is-broken .speedometer-unit-inner {
      color: #9CA3AF;
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
      font: 700 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #C92020;
      letter-spacing: -0.01em;
      white-space: nowrap;
      text-align: center;
      font-variant-numeric: tabular-nums;
      filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9));
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
    .controls-wrap {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(calc(-50% - ${CONTROLS_SHIFT_LEFT}px));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      max-width: calc(100vw - 32px);
      z-index: 10;
    }
    .controls {
      width: 100%;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }
    .controls-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .setting-panel {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      width: 100%;
    }
    .setting-panel[hidden] {
      display: none !important;
    }
    .setting-panel .distance-field {
      flex: 1;
      min-width: 0;
    }
    .setting-steppers {
      display: flex;
      flex-direction: row;
      gap: 4px;
      flex-shrink: 0;
      margin-left: auto;
    }
    .controls-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      width: 100%;
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
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #374151;
      white-space: nowrap;
    }
    .distance-field-label {
      font-size: 11px;
      line-height: 1;
      color: #6B7280;
      letter-spacing: 0.02em;
    }
    .distance-field-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .var-equals {
      font: 600 13px/1.2 system-ui, -apple-system, sans-serif;
      color: #374151;
    }
    .var-equals em {
      font-style: italic;
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
      width: 48px;
      padding-left: 6px;
      padding-right: 6px;
      cursor: default;
    }
    .value-step-btn {
      appearance: none;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border: 1px solid #D1D5DB;
      background: #F9FAFB;
      color: #111827;
      border-radius: 10px;
      font: 700 20px/1 system-ui, -apple-system, sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .value-step-btn:hover:not(:disabled) {
      background: #F3F4F6;
      border-color: #9CA3AF;
    }
    .value-step-btn:active:not(:disabled) {
      background: #E5E7EB;
    }
    .value-step-btn:disabled {
      opacity: 0.55;
      cursor: default;
    }
    @media (pointer: coarse) {
      .value-step-btn {
        width: 44px;
        height: 44px;
      }
    }
    .answer-keypad {
      position: absolute;
      right: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
      padding: 10px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    }
    .answer-keypad[hidden] {
      display: none !important;
    }
    body.is-keypad-open .stage,
    body.is-keypad-open .controls-wrap,
    body.is-keypad-open .car-picker,
    body.is-keypad-open .instrument-cluster > .speed-stack,
    body.is-keypad-open .instrument-cluster .analog-clock,
    body.is-keypad-open .instrument-cluster .stopwatch,
    body.is-keypad-open .distance-readout-wrap {
      filter: blur(4px);
      transition: filter 0.2s ease;
    }
    body.is-keypad-open .controls-wrap,
    body.is-keypad-open .car-picker {
      pointer-events: none;
    }
    .answer-keypad-grid {
      display: grid;
      grid-template-columns: repeat(3, 56px);
      gap: 8px;
    }
    .answer-keypad-key {
      appearance: none;
      width: 56px;
      height: 48px;
      border: 1px solid #D1D5DB;
      background: #F9FAFB;
      color: #111827;
      border-radius: 12px;
      font: 700 20px/1 system-ui, -apple-system, sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .answer-keypad-key:hover:not(:disabled) {
      background: #F3F4F6;
      border-color: #9CA3AF;
    }
    .answer-keypad-key:active:not(:disabled) {
      background: #E5E7EB;
    }
    .answer-keypad-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }
    .answer-keypad-action {
      appearance: none;
      height: 48px;
      border: 1px solid #111827;
      background: #fff;
      color: #111827;
      border-radius: 12px;
      font: 700 20px/1 system-ui, -apple-system, sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .answer-keypad-action:hover:not(:disabled) {
      background: #F3F4F6;
      border-color: #374151;
    }
    .answer-keypad-action:active:not(:disabled) {
      background: #E5E7EB;
    }
    .answer-keypad-check.is-correct {
      border-color: #15803D;
      background: #16A34A;
      color: #fff;
    }
    .answer-keypad-check.is-correct:hover:not(:disabled) {
      background: #15803D;
      border-color: #166534;
    }
    .answer-keypad-check.is-approximate {
      border-color: #EA580C;
      background: #F97316;
      color: #fff;
    }
    .answer-keypad-check.is-approximate:hover:not(:disabled) {
      background: #EA580C;
      border-color: #C2410C;
    }
    .answer-keypad-check.is-wrong {
      border-color: #B91C1C;
      background: #DC2626;
      color: #fff;
    }
    .answer-keypad-check.is-wrong:hover:not(:disabled) {
      background: #B91C1C;
      border-color: #991B1B;
    }
    @media (pointer: coarse) {
      .answer-keypad-grid {
        grid-template-columns: repeat(3, 60px);
        gap: 10px;
      }
      .answer-keypad-key {
        width: 60px;
        height: 52px;
        font-size: 22px;
      }
      .answer-keypad-action {
        height: 52px;
        font-size: 22px;
      }
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
      isolation: isolate;
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
    }
    .road-scroll {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      width: max-content;
      height: 100%;
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
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
    .scenery-unit + .scenery-unit {
      margin-left: -1px;
    }
    .road {
      position: absolute;
      left: -1px;
      top: var(--road-y);
      width: calc(100% + 2px);
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
      body.is-keypad-open .stage,
      body.is-keypad-open .controls-wrap,
      body.is-keypad-open .car-picker,
      body.is-keypad-open .instrument-cluster > .speed-stack,
      body.is-keypad-open .instrument-cluster .analog-clock,
      body.is-keypad-open .instrument-cluster .stopwatch,
      body.is-keypad-open .distance-readout-wrap {
        transition: none;
      }
    }
  </style>
</head>
<body>
${clockMarkup()}

<div class="stage" data-view="1">

${lanes}
</div>

<div class="controls-wrap">
<nav class="controls" aria-label="Ovládání animace">
  <div class="controls-fields">
    <div class="setting-panel" id="goalSettingPanel" aria-label="Nastavení cíle">
      <div class="distance-field">
        <span class="distance-field-label">Cíl</span>
        <span class="distance-field-row">
          <span class="var-equals" aria-hidden="true"><em>s</em> =</span>
          <input type="text" id="targetKmInput" value="${DEFAULT_TARGET_DISPLAY_KM}" readonly tabindex="-1" aria-label="Cílová vzdálenost v kilometrech" aria-live="polite" />
          <span>km</span>
        </span>
      </div>
      <div class="setting-steppers">
        <button type="button" class="value-step-btn" id="targetKmDec" aria-label="Zkrátit cíl o 10 kilometrů">−</button>
        <button type="button" class="value-step-btn" id="targetKmInc" aria-label="Prodloužit cíl o 10 kilometrů">+</button>
      </div>
    </div>
    <div class="setting-panel" id="speedSettingPanel" hidden aria-label="Nastavení rychlosti">
      <div class="distance-field">
        <span class="distance-field-label">Rychlost</span>
        <span class="distance-field-row">
          <span class="var-equals" aria-hidden="true"><em>v</em> =</span>
          <input type="text" id="targetSpeedInput" value="${DEFAULT_TARGET_SPEED_KMH}" readonly tabindex="-1" aria-label="Rychlost v kilometrech za hodinu" aria-live="polite" />
          ${kmhFractionMarkup()}
        </span>
      </div>
      <div class="setting-steppers">
        <button type="button" class="value-step-btn" id="targetSpeedDec" aria-label="Zpomalit o 5 kilometrů za hodinu">−</button>
        <button type="button" class="value-step-btn" id="targetSpeedInc" aria-label="Zrychlit o 5 kilometrů za hodinu">+</button>
      </div>
    </div>
    <div class="setting-panel" id="timeSettingPanel" aria-label="Nastavení času">
      <div class="distance-field">
        <span class="distance-field-label">Čas</span>
        <span class="distance-field-row">
          <span class="var-equals" aria-hidden="true"><em>t</em> =</span>
          <input type="text" class="time-part" id="targetHoursInput" value="${formatDecimalComma(DEFAULT_TARGET_HOURS)}" readonly tabindex="-1" aria-label="Hodiny na stopkách" aria-live="polite" />
          <span>h</span>
        </span>
      </div>
      <div class="setting-steppers">
        <button type="button" class="value-step-btn" id="targetHoursDec" aria-label="Zkrátit čas o půl hodiny">−</button>
        <button type="button" class="value-step-btn" id="targetHoursInc" aria-label="Prodloužit čas o půl hodiny">+</button>
      </div>
    </div>
  </div>
</nav>
  <div class="controls-actions">
    <button type="button" class="start-btn" id="startBtn">Spustit</button>
    <button type="button" class="pause-btn" id="pauseBtn" disabled>Pauza</button>
  </div>
</div>

<nav class="car-picker" aria-label="Výběr auta">
${buttons}
</nav>

<script>
  const stage = document.querySelector('.stage');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const goalSettingPanel = document.getElementById('goalSettingPanel');
  const speedSettingPanel = document.getElementById('speedSettingPanel');
  const timeSettingPanel = document.getElementById('timeSettingPanel');
  const clockStack = document.getElementById('clockStack');
  const analogClockEl = document.getElementById('analogClockEl');
  const targetKmInput = document.getElementById('targetKmInput');
  const targetKmDec = document.getElementById('targetKmDec');
  const targetKmInc = document.getElementById('targetKmInc');
  const targetSpeedInput = document.getElementById('targetSpeedInput');
  const targetSpeedDec = document.getElementById('targetSpeedDec');
  const targetSpeedInc = document.getElementById('targetSpeedInc');
  const targetHoursInput = document.getElementById('targetHoursInput');
  const targetHoursDec = document.getElementById('targetHoursDec');
  const targetHoursInc = document.getElementById('targetHoursInc');
  const carButtons = document.querySelectorAll('.car-btn');
  const MIN_TARGET_DISPLAY_KM = ${MIN_TARGET_DISPLAY_KM};
  const TARGET_KM_STEP = ${TARGET_KM_STEP};
  const DEFAULT_TARGET_DISPLAY_KM = ${DEFAULT_TARGET_DISPLAY_KM};
  const MIN_TARGET_SPEED_KMH = ${MIN_TARGET_SPEED_KMH};
  const TARGET_SPEED_STEP = ${TARGET_SPEED_STEP};
  const DEFAULT_TARGET_SPEED_KMH = ${DEFAULT_TARGET_SPEED_KMH};
  const DEFAULT_TARGET_HOURS = ${DEFAULT_TARGET_HOURS};
  const MIN_TARGET_HOURS = ${MIN_TARGET_HOURS};
  const MAX_TARGET_HOURS = ${MAX_TARGET_HOURS};
  const TARGET_HOURS_STEP = ${TARGET_HOURS_STEP};
  const REFERENCE_KMH = ${REFERENCE_KMH};
  const REFERENCE_KM_S = ${REFERENCE_KM_S};
  const JET_ENGINE_MIN_SPEED_KM_S = ${JET_ENGINE_MIN_SPEED_KM_S};
  const SPEEDO_NEEDLE_MAX_KMH = ${SPEEDO_NEEDLE_MAX_KMH};
  const SPEEDO_SWEEP_DEG = ${SPEEDO_SWEEP_DEG};
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
  const ANSWER_TOLERANCE = ${ANSWER_TOLERANCE};
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
  let displayedSpeedKmh = 0;
  let speedNeedleAnimStartMs = null;
  let speedNeedleFromKmh = 0;
  let speedNeedleToKmh = 0;
  const SPEEDO_NEEDLE_RAMP_MS = ${SPEEDO_NEEDLE_RAMP_MS};
  const instrumentCluster = document.querySelector('.instrument-cluster');
  const stopwatchEl = document.getElementById('stopwatchEl');
  const speedStack = document.querySelector('.speed-stack');
  const speedometerEl = document.querySelector('.speedometer');
  const speedQuestionPanel = document.getElementById('speedQuestionPanel');
  const speedQuestionText = document.getElementById('speedQuestionText');
  const speedAnswerInput = document.getElementById('speedAnswerInput');
  const speedAnswerRow = document.getElementById('speedAnswerRow');
  const speedAnswerFeedback = document.getElementById('speedAnswerFeedback');
  const distanceReadoutEl = document.getElementById('distanceReadoutEl');
  const distanceReadout = document.getElementById('distanceReadout');
  const distanceQuestionPanel = document.getElementById('distanceQuestionPanel');
  const distanceQuestionText = document.getElementById('distanceQuestionText');
  const distanceAnswerInput = document.getElementById('distanceAnswerInput');
  const distanceAnswerRow = document.getElementById('distanceAnswerRow');
  const distanceAnswerFeedback = document.getElementById('distanceAnswerFeedback');
  const speedReadout = document.getElementById('speedReadout');
  const timeQuestionPanel = document.getElementById('timeQuestionPanel');
  const timeQuestionText = document.getElementById('timeQuestionText');
  const timeAnswerInput = document.getElementById('timeAnswerInput');
  const timeAnswerRow = document.getElementById('timeAnswerRow');
  const timeAnswerFeedback = document.getElementById('timeAnswerFeedback');
  const answerKeypad = document.getElementById('answerKeypad');
  const answerKeypadCheck = document.getElementById('answerKeypadCheck');
  const answerInputs = [speedAnswerInput, distanceAnswerInput, timeAnswerInput].filter(Boolean);
  let activeAnswerInput = null;
  const SPEED_CALC_CAR = '1';
  const DISTANCE_CALC_CAR = '2';
  const TIME_CALC_CAR = '3';

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

  function parseInlineTranslateX(scroll) {
    const transform = scroll.style.transform;
    if (!transform) return null;
    const match = transform.match(/translate3d\\(\\s*([-\\d.]+)px/);
    return match ? parseFloat(match[1]) : null;
  }

  function getRoadScrollOffsetPx(scroll) {
    if (!scroll) return 0;

    if (scroll.style.animation === 'none') {
      const inline = parseInlineTranslateX(scroll);
      if (inline !== null) return inline;
    }

    const anims = scroll.getAnimations();
    for (let i = 0; i < anims.length; i++) {
      const effect = anims[i].effect;
      if (!effect || typeof effect.getComputedTiming !== 'function') continue;
      const timing = effect.getComputedTiming();
      const duration = timing.duration;
      const currentTime = timing.currentTime;
      const iterationProgress = timing.progress;
      if (!duration || !Number.isFinite(duration) || duration <= 0) continue;
      if (currentTime === null || !Number.isFinite(currentTime)) continue;
      if (iterationProgress === null || !Number.isFinite(iterationProgress)) continue;
      const loopWidthPx = window.innerWidth * (${SCROLL_LOOP_VW} / 100);
      if (!loopWidthPx) continue;
      const completedIterations = Math.floor(currentTime / duration);
      return -(completedIterations + iterationProgress) * loopWidthPx;
    }

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
    if (
      !stage.classList.contains('is-running')
      && !stage.classList.contains('is-paused')
      && offsetPx === 0
    ) {
      return baseKm;
    }

    const scrolledPx = Math.max(0, -offsetPx);
    const km = baseKm + (scrolledPx / loopWidthPx) * KM_PER_LOOP;

    if (
      runStartTime !== null
      && (stage.classList.contains('is-running') || stage.classList.contains('is-paused'))
    ) {
      return Math.min(km, targetTravelKm);
    }
    return km;
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

  function getStopwatchText() {
    const totalStopwatchMinutes = (getElapsedRunSeconds() / REAL_SECONDS_PER_STOPWATCH_HOUR) * 60;
    const hours = Math.floor(totalStopwatchMinutes / 60);
    const minutes = Math.floor(totalStopwatchMinutes % 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return \`\${hh} h : \${mm} min\`;
  }

  function isSpeedCalcMode() {
    return stage.dataset.view === SPEED_CALC_CAR;
  }

  function isDistanceCalcMode() {
    return stage.dataset.view === DISTANCE_CALC_CAR;
  }

  function isTimeCalcMode() {
    return stage.dataset.view === TIME_CALC_CAR;
  }

  function getTargetSpeedometerKmh() {
    if (!stage.classList.contains('is-running') && !stage.classList.contains('is-paused')) return 0;
    if (runStartTime === null) return 0;
    return currentRunSpeedKmS * REFERENCE_KMH / REFERENCE_KM_S;
  }

  function getCurrentSpeedKmh() {
    return getTargetSpeedometerKmh();
  }

  function speedHandAngle(kmh) {
    const ratio = Math.min(Math.max(kmh, 0) / SPEEDO_NEEDLE_MAX_KMH, 1);
    return (120 + ratio * SPEEDO_SWEEP_DEG) + 'deg';
  }

  function getExactSpeedKmh() {
    return getTargetDisplayKm() / getTargetStopwatchHours();
  }

  function getCorrectSpeedKmh() {
    return Math.round(getExactSpeedKmh());
  }

  function setAnswerInputValue(input, value) {
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function syncKeypadCheckFeedback(className) {
    if (!answerKeypadCheck) return;
    answerKeypadCheck.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    if (className) answerKeypadCheck.classList.add(className);
  }

  function getAnswerRowForInput(input) {
    if (input === speedAnswerInput) return speedAnswerRow;
    if (input === distanceAnswerInput) return distanceAnswerRow;
    if (input === timeAnswerInput) return timeAnswerRow;
    return null;
  }

  function getAnswerRowFeedbackClass(rowEl) {
    if (!rowEl) return null;
    if (rowEl.classList.contains('is-correct')) return 'is-correct';
    if (rowEl.classList.contains('is-approximate')) return 'is-approximate';
    if (rowEl.classList.contains('is-wrong')) return 'is-wrong';
    return null;
  }

  function syncKeypadCheckFromInput(input) {
    if (!input || !input.value.trim()) {
      syncKeypadCheckFeedback(null);
      return;
    }
    syncKeypadCheckFeedback(getAnswerRowFeedbackClass(getAnswerRowForInput(input)));
  }

  function setKeypadOpen(open) {
    document.body.classList.toggle('is-keypad-open', open);
  }

  function hideAnswerKeypad() {
    activeAnswerInput = null;
    syncKeypadCheckFeedback(null);
    if (answerKeypad) answerKeypad.hidden = true;
    setKeypadOpen(false);
  }

  function submitActiveAnswer() {
    if (activeAnswerInput === speedAnswerInput) verifySpeedAnswer();
    else if (activeAnswerInput === distanceAnswerInput) verifyDistanceAnswer();
    else if (activeAnswerInput === timeAnswerInput) verifyTimeAnswer();
  }

  function showAnswerKeypad(input) {
    if (!answerKeypad || !input || input.disabled) return;
    activeAnswerInput = input;
    answerKeypad.hidden = false;
    setKeypadOpen(true);
    syncKeypadCheckFromInput(input);
  }

  function handleAnswerKeypadKey(key) {
    if (!activeAnswerInput) return;
    const current = activeAnswerInput.value;
    if (key === 'backspace') {
      setAnswerInputValue(activeAnswerInput, current.slice(0, -1));
      return;
    }
    if (key === ',') {
      if (current.includes(',')) return;
      setAnswerInputValue(activeAnswerInput, current + ',');
      return;
    }
    if (key < '0' || key > '9') return;
    if (current === '0') {
      setAnswerInputValue(activeAnswerInput, key);
      return;
    }
    setAnswerInputValue(activeAnswerInput, current + key);
  }

  function initAnswerKeypad() {
    if (answerKeypad) {
      answerKeypad.addEventListener('pointerdown', (event) => {
        event.preventDefault();
      });
      answerKeypad.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-key]');
        if (!btn) return;
        const key = btn.getAttribute('data-key');
        if (key === 'submit') {
          submitActiveAnswer();
          return;
        }
        if (key === 'close') {
          hideAnswerKeypad();
          return;
        }
        handleAnswerKeypadKey(key);
      });
    }
    answerInputs.forEach((input) => {
      input.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        showAnswerKeypad(input);
      });
      input.addEventListener('focus', () => showAnswerKeypad(input));
    });
    document.addEventListener('pointerdown', (event) => {
      if (!answerKeypad || answerKeypad.hidden) return;
      const target = event.target;
      if (answerKeypad.contains(target)) return;
      if (answerInputs.some((input) => input === target || input.contains(target))) return;
      hideAnswerKeypad();
    });
  }

  function evaluateAnswer(userValue, correctValue) {
    const diff = Math.abs(userValue - correctValue);
    if (diff < 1e-9) return 'exact';
    if (diff <= ANSWER_TOLERANCE) return 'approximate';
    return 'wrong';
  }

  function applyAnswerFeedback(rowEl, feedbackEl, result, invalidMessage) {
    const messages = {
      exact: 'Správně!',
      approximate: 'Přibližně správně',
      wrong: 'Špatně',
    };
    const className = result === 'exact'
      ? 'is-correct'
      : result === 'approximate'
        ? 'is-approximate'
        : 'is-wrong';
    if (rowEl) {
      rowEl.classList.remove('is-correct', 'is-approximate', 'is-wrong');
      rowEl.classList.add(className);
    }
    if (feedbackEl) {
      feedbackEl.textContent = invalidMessage || messages[result];
      feedbackEl.classList.remove('is-correct', 'is-approximate', 'is-wrong');
      feedbackEl.classList.add(className);
    }
    syncKeypadCheckFeedback(className);
  }

  function clearSpeedAnswerFeedback() {
    if (speedAnswerRow) {
      speedAnswerRow.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    }
    if (speedAnswerFeedback) {
      speedAnswerFeedback.textContent = '';
      speedAnswerFeedback.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    }
    if (activeAnswerInput === speedAnswerInput) syncKeypadCheckFeedback(null);
  }

  function verifySpeedAnswer() {
    if (!speedAnswerInput) return;
    const raw = parseHoursInput(speedAnswerInput.value);
    clearSpeedAnswerFeedback();
    if (!Number.isFinite(raw)) {
      applyAnswerFeedback(speedAnswerRow, speedAnswerFeedback, 'wrong', 'Zadej číslo');
      return;
    }
    applyAnswerFeedback(speedAnswerRow, speedAnswerFeedback, evaluateAnswer(raw, getExactSpeedKmh()));
  }

  function updateSpeedQuestionPanel() {
    const show = isSpeedCalcMode() && runStartTime !== null;
    if (speedQuestionPanel) {
      speedQuestionPanel.classList.toggle('is-visible', show);
    }
    if (speedQuestionText) {
      speedQuestionText.textContent = finished
        ? 'Jakou rychlostí auto jelo?'
        : 'Jakou rychlostí auto jede?';
    }
    if (speedAnswerInput) {
      speedAnswerInput.disabled = !show;
    }
    if (!show) {
      clearSpeedAnswerFeedback();
      if (activeAnswerInput === speedAnswerInput) hideAnswerKeypad();
    }
  }

  function getExactDistanceKm() {
    return getTargetSpeedKmh() * getTargetStopwatchHours();
  }

  function getCorrectDistanceKm() {
    return Math.round(getExactDistanceKm());
  }

  function clearDistanceAnswerFeedback() {
    if (distanceAnswerRow) {
      distanceAnswerRow.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    }
    if (distanceAnswerFeedback) {
      distanceAnswerFeedback.textContent = '';
      distanceAnswerFeedback.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    }
    if (activeAnswerInput === distanceAnswerInput) syncKeypadCheckFeedback(null);
  }

  function verifyDistanceAnswer() {
    if (!distanceAnswerInput) return;
    const raw = parseHoursInput(distanceAnswerInput.value);
    clearDistanceAnswerFeedback();
    if (!Number.isFinite(raw)) {
      applyAnswerFeedback(distanceAnswerRow, distanceAnswerFeedback, 'wrong', 'Zadej číslo');
      return;
    }
    applyAnswerFeedback(distanceAnswerRow, distanceAnswerFeedback, evaluateAnswer(raw, getExactDistanceKm()));
  }

  function updateDistanceQuestionPanel() {
    const show = isDistanceCalcMode() && runStartTime !== null;
    if (distanceQuestionPanel) {
      distanceQuestionPanel.classList.toggle('is-visible', show);
    }
    if (distanceQuestionText) {
      distanceQuestionText.textContent = finished
        ? 'Jak daleko auto dojelo?'
        : 'Jak daleko auto dojede?';
    }
    if (distanceAnswerInput) {
      distanceAnswerInput.disabled = !show;
    }
    if (!show) {
      clearDistanceAnswerFeedback();
      if (activeAnswerInput === distanceAnswerInput) hideAnswerKeypad();
    }
  }

  function getExactTimeHours() {
    return getTargetDisplayKm() / getTargetSpeedKmh();
  }

  function getCorrectTimeHours() {
    return Math.round(getExactTimeHours() * 2) / 2;
  }

  function clearTimeAnswerFeedback() {
    if (timeAnswerRow) {
      timeAnswerRow.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    }
    if (timeAnswerFeedback) {
      timeAnswerFeedback.textContent = '';
      timeAnswerFeedback.classList.remove('is-correct', 'is-approximate', 'is-wrong');
    }
    if (activeAnswerInput === timeAnswerInput) syncKeypadCheckFeedback(null);
  }

  function verifyTimeAnswer() {
    if (!timeAnswerInput) return;
    const raw = parseHoursInput(timeAnswerInput.value);
    clearTimeAnswerFeedback();
    if (!Number.isFinite(raw)) {
      applyAnswerFeedback(timeAnswerRow, timeAnswerFeedback, 'wrong', 'Zadej číslo');
      return;
    }
    applyAnswerFeedback(timeAnswerRow, timeAnswerFeedback, evaluateAnswer(raw, getExactTimeHours()));
  }

  function updateTimeQuestionPanel() {
    const show = isTimeCalcMode() && runStartTime !== null;
    if (timeQuestionPanel) {
      timeQuestionPanel.classList.toggle('is-visible', show);
    }
    if (timeQuestionText) {
      timeQuestionText.textContent = finished
        ? 'Jak dlouho auto jelo?'
        : 'Jak dlouho auto pojede?';
    }
    if (timeAnswerInput) {
      timeAnswerInput.disabled = !show;
    }
    if (!show) {
      clearTimeAnswerFeedback();
      if (activeAnswerInput === timeAnswerInput) hideAnswerKeypad();
    }
  }

  function updateAnalogClock() {
    const timeCalcMode = isTimeCalcMode();
    if (clockStack) clockStack.classList.toggle('time-calc-mode', timeCalcMode);
    if (analogClockEl) analogClockEl.classList.toggle('is-broken', timeCalcMode);

    if (timeCalcMode) {
      if (instrumentCluster) {
        instrumentCluster.style.setProperty('--hand-sec', handAngle(0));
        instrumentCluster.style.setProperty('--hand-min', handAngle(0));
        instrumentCluster.style.setProperty('--hand-hour', handAngle(0));
      }
      return false;
    }
    return true;
  }

  function updateSettingPanels() {
    const distanceMode = isDistanceCalcMode();
    const timeMode = isTimeCalcMode();
    if (goalSettingPanel) goalSettingPanel.hidden = distanceMode;
    if (speedSettingPanel) speedSettingPanel.hidden = !(distanceMode || timeMode);
    if (timeSettingPanel) timeSettingPanel.hidden = timeMode;
  }

  function updateSpeedometer() {
    const speedCalcMode = isSpeedCalcMode();
    if (speedStack) speedStack.classList.toggle('speed-calc-mode', speedCalcMode);
    if (speedometerEl) speedometerEl.classList.toggle('is-broken', speedCalcMode);

    if (speedCalcMode) {
      displayedSpeedKmh = 0;
      speedNeedleAnimStartMs = null;
      speedNeedleFromKmh = 0;
      speedNeedleToKmh = 0;
      if (instrumentCluster) instrumentCluster.style.setProperty('--hand-speed', '120deg');
      return;
    }

    const targetKmh = getTargetSpeedometerKmh();
    if (speedNeedleAnimStartMs === null || speedNeedleToKmh !== targetKmh) {
      speedNeedleFromKmh = displayedSpeedKmh;
      speedNeedleToKmh = targetKmh;
      speedNeedleAnimStartMs = performance.now();
    }

    const progress = Math.min(1, (performance.now() - speedNeedleAnimStartMs) / SPEEDO_NEEDLE_RAMP_MS);
    displayedSpeedKmh = speedNeedleFromKmh + (speedNeedleToKmh - speedNeedleFromKmh) * progress;

    const rounded = Math.round(displayedSpeedKmh);
    if (instrumentCluster) {
      instrumentCluster.style.setProperty('--hand-speed', speedHandAngle(displayedSpeedKmh));
    }
    if (speedReadout && speedReadout.textContent !== String(rounded)) {
      speedReadout.textContent = String(rounded);
    }
  }

  function updateDistanceReadout() {
    if (distanceReadoutEl) {
      distanceReadoutEl.classList.toggle('is-broken', isDistanceCalcMode());
    }
    if (!distanceReadout) return;
    if (isDistanceCalcMode()) {
      if (distanceReadout.textContent !== '—') distanceReadout.textContent = '—';
      return;
    }
    const km = Math.round(getTravelKm());
    const text = String(km);
    if (distanceReadout.textContent !== text) distanceReadout.textContent = text;
  }

  function updateStopwatch() {
    if (!stopwatchEl || isTimeCalcMode()) return;
    const text = getStopwatchText();
    if (stopwatchEl.textContent !== text) stopwatchEl.textContent = text;
  }

  function setTargetKm(km) {
    const clamped = Math.max(
      MIN_TARGET_DISPLAY_KM,
      Math.round(km / TARGET_KM_STEP) * TARGET_KM_STEP
    );
    if (targetKmInput) targetKmInput.value = String(clamped);
    return clamped;
  }

  function setKmControlsEnabled(enabled) {
    if (targetKmInput) targetKmInput.disabled = !enabled;
    if (targetKmDec) targetKmDec.disabled = !enabled;
    if (targetKmInc) targetKmInc.disabled = !enabled;
  }

  function getTargetDisplayKm() {
    const raw = Number(targetKmInput && targetKmInput.value);
    if (!Number.isFinite(raw)) {
      return setTargetKm(DEFAULT_TARGET_DISPLAY_KM);
    }
    return setTargetKm(raw);
  }

  function setTargetSpeed(kmh) {
    const clamped = Math.max(
      MIN_TARGET_SPEED_KMH,
      Math.round(kmh / TARGET_SPEED_STEP) * TARGET_SPEED_STEP
    );
    if (targetSpeedInput) targetSpeedInput.value = String(clamped);
    return clamped;
  }

  function setSpeedControlsEnabled(enabled) {
    if (targetSpeedInput) targetSpeedInput.disabled = !enabled;
    if (targetSpeedDec) targetSpeedDec.disabled = !enabled;
    if (targetSpeedInc) targetSpeedInc.disabled = !enabled;
  }

  function getTargetSpeedKmh() {
    const raw = Number(targetSpeedInput && targetSpeedInput.value);
    if (!Number.isFinite(raw)) {
      return setTargetSpeed(DEFAULT_TARGET_SPEED_KMH);
    }
    return setTargetSpeed(raw);
  }

  function formatHoursDisplay(hours) {
    return String(hours).replace('.', ',');
  }

  function parseHoursInput(value) {
    return Number(String(value).replace(',', '.'));
  }

  function setTargetHours(hours) {
    const clamped = Math.max(
      MIN_TARGET_HOURS,
      Math.min(MAX_TARGET_HOURS, Math.round(hours * 2) / 2)
    );
    if (targetHoursInput) targetHoursInput.value = formatHoursDisplay(clamped);
    return clamped;
  }

  function setHoursControlsEnabled(enabled) {
    if (targetHoursInput) targetHoursInput.disabled = !enabled;
    if (targetHoursDec) targetHoursDec.disabled = !enabled;
    if (targetHoursInc) targetHoursInc.disabled = !enabled;
  }

  function getTargetStopwatchHours() {
    const raw = parseHoursInput(targetHoursInput && targetHoursInput.value);
    if (!Number.isFinite(raw)) {
      return setTargetHours(DEFAULT_TARGET_HOURS);
    }
    return setTargetHours(raw);
  }

  function getRequiredRealSpeedKmS() {
    const stopwatchHours = getTargetStopwatchHours();
    const kmh = isDistanceCalcMode() || isTimeCalcMode()
      ? getTargetSpeedKmh()
      : getTargetDisplayKm() / stopwatchHours;
    return kmh * REFERENCE_KM_S / REFERENCE_KMH;
  }

  function getRunTargetKm() {
    if (isDistanceCalcMode()) {
      return Math.round(getTargetSpeedKmh() * getTargetStopwatchHours());
    }
    return getTargetDisplayKm();
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
      el.style.animation = 'none';
      el.style.transform = '';
      void el.offsetWidth;
      el.style.animation = '';
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
    displayedSpeedKmh = 0;
    speedNeedleAnimStartMs = null;
    speedNeedleFromKmh = 0;
    speedNeedleToKmh = 0;

    stage.classList.remove('is-running', 'is-paused');

    document.querySelectorAll('.road-scroll, .wheel-spin').forEach(resetAnimationElement);
    document.querySelectorAll('.vegetation-item').forEach((el) => el.remove());
    document.querySelectorAll('.car-drive').forEach((el) => el.classList.remove('has-jet-engine'));
    if (vegTimer) {
      clearInterval(vegTimer);
      vegTimer = null;
    }

    setTargetKm(DEFAULT_TARGET_DISPLAY_KM);
    setTargetSpeed(DEFAULT_TARGET_SPEED_KMH);
    setTargetHours(DEFAULT_TARGET_HOURS);
    const activeCar = stage.dataset.view || carButtons[0]?.dataset.car;
    carButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.car === activeCar);
      btn.disabled = false;
    });
    if (activeCar) {
      stage.dataset.view = activeCar;
    }

    startBtn.disabled = false;
    startBtn.textContent = 'Spustit';
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pauza';
    setKmControlsEnabled(true);
    setSpeedControlsEnabled(true);
    setHoursControlsEnabled(true);
    if (speedAnswerInput) speedAnswerInput.value = '';
    if (distanceAnswerInput) distanceAnswerInput.value = '';
    if (timeAnswerInput) timeAnswerInput.value = '';
    clearSpeedAnswerFeedback();
    clearDistanceAnswerFeedback();
    clearTimeAnswerFeedback();
    hideAnswerKeypad();

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
    updateDistanceQuestionPanel();
    updateTimeQuestionPanel();
    updateAnalogClock();
    updateSettingPanels();
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
    setKmControlsEnabled(false);
    setSpeedControlsEnabled(false);
    setHoursControlsEnabled(false);
    carButtons.forEach((btn) => { btn.disabled = true; });
    updateSpeedQuestionPanel();
    updateDistanceQuestionPanel();
    updateTimeQuestionPanel();
  }

  function updateClock() {
    const km = getTravelKm();
    updateKmSigns(km);
    updateDistanceReadout();
    updateSpeedometer();
    updateStopwatch();
    if (stage.classList.contains('is-running') && km >= targetTravelKm) {
      stopAtDestination();
    }
    if (updateAnalogClock() && instrumentCluster) {
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

  function updateKmSigns(travelKm) {
    const lane = getActiveLane();
    if (!lane) return;
    if (travelKm === undefined) travelKm = getTravelKm();
    const vw = window.innerWidth;
    const frontWheelPx = getFrontWheelLeftPx();
    const signWidthVw = (SIGN_W / vw) * 100;
    const hideLeftVw = ((SIGN_HALF_W - frontWheelPx) / vw) * 100 - signWidthVw;
    const hideRightVw = 105;
    let markers = [];

    if (isDistanceCalcMode()) {
      const destKm = runStartTime !== null ? targetTravelKm : getCorrectDistanceKm();
      const candidates = [
        { km: 0, distVw: (0 - travelKm) * SIGN_SPACING_VW, label: '0' },
        { km: destKm, distVw: (destKm - travelKm) * SIGN_SPACING_VW, label: '?' },
      ];
      for (const marker of candidates) {
        if (marker.distVw > hideLeftVw && marker.distVw < hideRightVw) {
          markers.push(marker);
        }
      }
    } else {
      const startKm = Math.max(0, Math.floor(travelKm / 10) * 10 - 20);
      const endKm = Math.ceil(travelKm / 10) * 10 + 50;

      for (let km = startKm; km <= endKm; km += 10) {
        const distVw = (km - travelKm) * SIGN_SPACING_VW;
        if (distVw > hideLeftVw && distVw < hideRightVw) {
          markers.push({ km, distVw });
        }
      }
    }

    markers.sort((a, b) => a.distVw - b.distVw);

    lane.querySelectorAll('.km-sign').forEach((sign, i) => {
      if (i < markers.length) {
        const { km, distVw, label } = markers[i];
        const distPx = (distVw / 100) * vw;
        const displayText = label !== undefined ? label : String(km);
        sign.style.transform = 'translate3d(' + distPx + 'px, 0, 0)';
        const num = sign.querySelector('.km-num');
        if (sign.dataset.displayLabel !== displayText) {
          num.textContent = displayText;
          num.setAttribute('font-size', displayText === '?' ? '16' : kmFontSize(km));
          sign.dataset.displayLabel = displayText;
        }
        sign.setAttribute('aria-label', displayText === '?' ? '? km' : km + ' km');
        sign.hidden = false;
      } else {
        delete sign.dataset.displayLabel;
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
    if (isDistanceCalcMode() || isTimeCalcMode()) {
      getTargetSpeedKmh();
    }
    if (!isDistanceCalcMode()) {
      getTargetDisplayKm();
    }
    if (!isTimeCalcMode() && !isDistanceCalcMode()) {
      getTargetStopwatchHours();
    } else if (isDistanceCalcMode()) {
      getTargetStopwatchHours();
    }
    targetTravelKm = getRunTargetKm();
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
    updateDistanceQuestionPanel();
    updateTimeQuestionPanel();
    startBtn.disabled = false;
    startBtn.textContent = 'Zpět na start';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pauza';
    if (isDistanceCalcMode()) {
      setSpeedControlsEnabled(false);
      setHoursControlsEnabled(false);
    } else if (isTimeCalcMode()) {
      setKmControlsEnabled(false);
      setSpeedControlsEnabled(false);
    } else {
      setKmControlsEnabled(false);
      setHoursControlsEnabled(false);
    }
    carButtons.forEach((btn) => { btn.disabled = true; });
    startVegetation();
  });

  if (targetKmDec) {
    targetKmDec.addEventListener('click', () => {
      setTargetKm(Number(targetKmInput.value) - TARGET_KM_STEP);
    });
  }
  if (targetKmInc) {
    targetKmInc.addEventListener('click', () => {
      setTargetKm(Number(targetKmInput.value) + TARGET_KM_STEP);
    });
  }
  if (targetSpeedDec) {
    targetSpeedDec.addEventListener('click', () => {
      setTargetSpeed(Number(targetSpeedInput.value) - TARGET_SPEED_STEP);
    });
  }
  if (targetSpeedInc) {
    targetSpeedInc.addEventListener('click', () => {
      setTargetSpeed(Number(targetSpeedInput.value) + TARGET_SPEED_STEP);
    });
  }
  if (targetHoursDec) {
    targetHoursDec.addEventListener('click', () => {
      setTargetHours(parseHoursInput(targetHoursInput.value) - TARGET_HOURS_STEP);
    });
  }
  if (targetHoursInc) {
    targetHoursInc.addEventListener('click', () => {
      setTargetHours(parseHoursInput(targetHoursInput.value) + TARGET_HOURS_STEP);
    });
  }

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
      if (distanceAnswerInput) distanceAnswerInput.value = '';
      if (timeAnswerInput) timeAnswerInput.value = '';
      clearSpeedAnswerFeedback();
      clearDistanceAnswerFeedback();
      clearTimeAnswerFeedback();
      hideAnswerKeypad();
      updateSettingPanels();
      updateSpeedometer();
      updateAnalogClock();
      updateSpeedQuestionPanel();
      updateDistanceQuestionPanel();
      updateTimeQuestionPanel();
      updateDistanceReadout();
    });
  });

  if (speedAnswerInput) {
    speedAnswerInput.addEventListener('input', clearSpeedAnswerFeedback);
  }
  if (distanceAnswerInput) {
    distanceAnswerInput.addEventListener('input', clearDistanceAnswerFeedback);
  }
  if (timeAnswerInput) {
    timeAnswerInput.addEventListener('input', clearTimeAnswerFeedback);
  }

  initAnswerKeypad();

  updateKmSigns();
  updateSettingPanels();
  updateSpeedometer();
  updateAnalogClock();
  updateSpeedQuestionPanel();
  updateDistanceQuestionPanel();
  updateTimeQuestionPanel();
  updateDistanceReadout();
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
