/**
 * Generates the ACES Warehouse OSHA Compliance Scorecard as a PDF.
 * Run:   cd tools && npm install && node generate-scorecard.js
 * Output: ../ACES_OSHA_Warehouse_Compliance_Scorecard.pdf
 *
 * 2026-10 accuracy pass (keep in sync with the OSHA library the ACES Audit
 * app uses — table osha_standards, verified against eCFR):
 *   1. Every citation re-checked. Five items cited the wrong paragraph, e.g.
 *      SDS access is 1910.1200(g)(8), not (e); junction box covers are
 *      1910.305(b)(2)(i), not 1910.303(b); door hardware is 1910.36(d)(1);
 *      aisle marking is 1910.176(a), not 1910.22(d)(1); 1910.178(n)(4) is
 *      "slow down and sound the horn", not separated walkways.
 *   2. Only OSHA's published 2026 maximum is shown ($16,550 per serious or
 *      other-than-serious violation). The $5,000 / $3,500 figures had no
 *      OSHA source and were removed.
 *   3. No item claims a record OSHA doesn't require — daily forklift
 *      examinations and monthly extinguisher checks must be done, not logged.
 *   4. Sprinkler clearance removed: 1910.159 covers only systems installed
 *      to meet an OSHA standard (1910.159(b)), which most warehouse
 *      sprinklers are not.
 *   5. Exposure wording fixed: $16,550 is the maximum, not the minimum, and
 *      the unsourced "5–10 citations" statistic is gone.
 *   6. Layout: rows size to their text (no clipped second lines), the intro
 *      no longer overlaps itself, and the file is a clean 3 pages instead of
 *      spilling onto 9.
 *
 * Penalty source: https://www.osha.gov/penalties (amounts after Jan. 15, 2026)
 */
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const OUTPUT = path.join(__dirname, '..', 'ACES_OSHA_Warehouse_Compliance_Scorecard.pdf')
const LOGO = path.join(__dirname, '..', 'logo.png')

// OSHA 2026 maximum penalties — https://www.osha.gov/penalties
const MAX_PENALTY = 16550   // serious or other-than-serious, per violation
const MAX_WILLFUL = 165514  // willful or repeated, per violation
const money = (n) => `$${n.toLocaleString('en-US')}`

// Brand
const NAVY = '#0B1D32'
const ORANGE = '#F07316'
const SLATE = '#94A3B8'
const ZEBRA = '#F8FAFC'
const TEXT = '#1A1A1A'
const TEXT_SOFT = '#475569'
const WHITE = '#FFFFFF'

// Page geometry
const PAGE_MARGIN = 40
const PAGE_WIDTH = 612   // 8.5"
const PAGE_HEIGHT = 792  // 11"
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN
const FOOTER_Y = PAGE_HEIGHT - 42
const CONTENT_LIMIT = FOOTER_Y - 10   // nothing in the body may pass this line

// Checklist columns
const X_NUM = PAGE_MARGIN + 4
const X_CITE = PAGE_MARGIN + 24
const CITE_W = 96
const X_TEXT = PAGE_MARGIN + 124
const X_YES = PAGE_MARGIN + CONTENT_WIDTH - 174
const X_NO = X_YES + 42
const X_NS = X_NO + 42
const X_PEN = X_YES + 122
const PEN_W = 52
const TEXT_W = X_YES - X_TEXT - 10
const ROW_MIN = 24
const ROW_PAD = 5

const doc = new PDFDocument({
  size: [PAGE_WIDTH, PAGE_HEIGHT],
  margin: PAGE_MARGIN,
  info: {
    Title: 'Warehouse OSHA Compliance Scorecard',
    Author: 'ACES Compliance Systems',
    Subject: 'OSHA 29 CFR 1910 Self-Assessment for Warehouses',
    Keywords: 'OSHA, warehouse, compliance, safety, 29 CFR 1910, Pennsylvania',
  },
})

// Everything is placed at explicit coordinates. With the default bottom
// margin, text drawn near the foot of a page made PDFKit start a new page —
// that is how the previous version ended up 9 pages long, 7 of them nearly
// blank. A zero bottom margin stops those automatic page breaks.
doc.page.margins.bottom = 0
doc.on('pageAdded', () => { doc.page.margins.bottom = 0 })

doc.pipe(fs.createWriteStream(OUTPUT))

/* ---------- content ---------- */

// [sectionTitle, items]; items are [number, citation, text].
// Every item carries the same maximum (MAX_PENALTY): OSHA's 2026 cap is the
// same for serious and other-than-serious violations.
// Sections flow onto as many pages as they need (see "Checklist pages").
const SECTIONS = [
  ['STORAGE & MATERIAL HANDLING  (1910.176)', [
    [1, '1910.176(b)', 'Materials stored in tiers are stacked, blocked, interlocked, and limited in height so they are stable and secure against collapse'],
    [2, '1910.176(a)', 'Aisles and passageways kept clear and in good repair, with safe clearance for forklifts'],
    [3, '1910.176(a)', 'Permanent aisles and passageways appropriately marked'],
    [4, '1910.176(c)', 'Storage areas free of accumulated material that creates tripping, fire, explosion, or pest hazards'],
  ]],
  ['WALKING-WORKING SURFACES & HOUSEKEEPING  (1910.22)', [
    [5, '1910.22(a)(1)', 'Work areas, passageways, and storerooms kept clean, orderly, and sanitary'],
    [6, '1910.22(a)(3)', 'Walking surfaces free of hazards such as spills, leaks, loose boards, and protruding objects'],
    [7, '1910.22(d)', 'Hazardous surface conditions (holes, damaged flooring) repaired, or guarded until repaired, before anyone uses the surface'],
  ]],
  ['FIRE PROTECTION  (1910.157)', [
    [8, '1910.157(c)(1)', 'Fire extinguishers mounted, located, and identified so they are readily accessible'],
    [9, '1910.157(e)(2)', 'Every portable extinguisher visually inspected at least monthly'],
    [10, '1910.157(c)', 'Extinguishers fully charged, operable, and kept in their designated places'],
  ]],
  ['ELECTRICAL SAFETY  (1910.303-305)', [
    [11, '1910.303(g)(1)(ii)', 'Working space in front of electrical panels kept clear and never used for storage'],
    [12, '1910.305(g)', 'Extension cords not used as a substitute for permanent (fixed) wiring'],
    [13, '1910.305(b)(2)(i)', 'Every junction box, pull box, and fitting has its cover in place'],
  ]],
  ['EXIT ROUTES  (1910.36-37)', [
    [14, '1910.37(a)(3)', 'Exit routes free and unobstructed, with no materials or equipment in them, even temporarily'],
    [15, '1910.37(b)(6)', 'Exit signs illuminated by a reliable light source, or self-luminous'],
    [16, '1910.36(d)(1)', 'Exit doors open from the inside at all times without keys, tools, or special knowledge'],
  ]],
  ['POWERED INDUSTRIAL TRUCKS  (1910.178)', [
    [17, '1910.178(l)', 'Every forklift operator trained, evaluated, and certified, with a performance evaluation at least every 3 years'],
    [18, '1910.178(q)(7)', 'Each truck examined before use at least daily (after each shift if trucks run around the clock)'],
    [19, '1910.178(n)', 'Drivers slow down and sound the horn at cross aisles and wherever vision is obstructed'],
  ]],
  ['PPE & HAZARD COMMUNICATION  (1910.132, 1910.1200)', [
    [20, '1910.132(d)', 'PPE hazard assessment completed and certified in writing'],
    [21, '1910.132(a)', 'Employees use the PPE their hazard assessment requires, kept in reliable condition'],
    [22, '1910.1200(g)(8)', 'Safety data sheets readily accessible to employees during every work shift'],
  ]],
  ['EMERGENCY & GENERAL SAFETY', [
    [23, '1910.38(b)', 'Emergency action plan in writing, kept on site, and available to employees (where OSHA requires one)'],
    [24, '1910.151(b)', 'Adequate first aid supplies readily available'],
    [25, '1910.147(c)(4)', 'Written lockout/tagout procedures for servicing machines and conveyors'],
  ]],
]

const TOTAL_ITEMS = SECTIONS.reduce((n, [, items]) => n + items.length, 0)

/* ---------- helpers ---------- */

function header() {
  doc.rect(0, 0, PAGE_WIDTH, 110).fill(NAVY)

  // The logo is navy on a transparent background, so it disappears against
  // the navy header unless it sits on a white disc.
  if (fs.existsSync(LOGO)) {
    doc.circle(PAGE_MARGIN + 28, 56, 30).fill(WHITE)
    try {
      doc.image(LOGO, PAGE_MARGIN + 6, 34, { width: 44, height: 44 })
    } catch (e) { /* ignore */ }
  }

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
     .text('Warehouse OSHA Compliance', PAGE_MARGIN + 72, 30)
     .text('Scorecard', PAGE_MARGIN + 72, 55)

  doc.fillColor(SLATE).font('Helvetica').fontSize(10)
     .text('Self-Assessment Tool  |  29 CFR 1910 General Industry Standards', PAGE_MARGIN + 72, 85)
     .text('ACES Compliance Systems  |  acescompliancesystems@gmail.com', PAGE_MARGIN + 72, 98)

  doc.rect(PAGE_MARGIN, 128, CONTENT_WIDTH, 3).fill(ORANGE)
}

function continuationHeader() {
  doc.rect(0, 0, PAGE_WIDTH, 54).fill(NAVY)
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(14)
     .text('Warehouse OSHA Compliance Scorecard', PAGE_MARGIN, 20)
  doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(12)
     .text('(continued)', PAGE_MARGIN + 350, 22)
  doc.rect(PAGE_MARGIN, 72, CONTENT_WIDTH, 3).fill(ORANGE)
}

function footer() {
  doc.fillColor(SLATE).font('Helvetica').fontSize(9)
     .text('ACES Compliance Systems  |  Jessup, Pennsylvania  |  acescompliancesystems@gmail.com',
       PAGE_MARGIN, FOOTER_Y, { width: CONTENT_WIDTH, align: 'center' })
  doc.fontSize(8)
     .text('Based on 29 CFR 1910 General Industry Standards  |  OSHA 2026 maximum penalties',
       PAGE_MARGIN, FOOTER_Y + 12, { width: CONTENT_WIDTH, align: 'center' })
}

function assertFits(y, where) {
  if (y > CONTENT_LIMIT) {
    throw new Error(`Scorecard layout overflow on ${where}: content reaches y=${Math.round(y)}, limit is ${CONTENT_LIMIT}`)
  }
}

function para(text, y, { size = 9.5, color = TEXT_SOFT, gap = 5, font = 'Helvetica' } = {}) {
  const opts = { width: CONTENT_WIDTH, lineGap: 1.5 }
  doc.fillColor(color).font(font).fontSize(size).text(text, PAGE_MARGIN, y, opts)
  return y + doc.heightOfString(text, opts) + gap
}

function heading(text, y, underline = 150) {
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text(text, PAGE_MARGIN, y)
  doc.rect(PAGE_MARGIN, y + 18, underline, 1.5).fill(ORANGE)
  return y + 30
}

function sectionBar(title, y) {
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 26).fill(NAVY)
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10.5)
     .text(title, PAGE_MARGIN + 14, y + 8, { characterSpacing: 0.5 })
  return y + 26
}

function columnHeader(y) {
  doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8)
  doc.text('YES', X_YES, y, { width: 24, align: 'center', characterSpacing: 0.5 })
  doc.text('NO', X_NO, y, { width: 24, align: 'center', characterSpacing: 0.5 })
  doc.text('N/S', X_NS, y, { width: 24, align: 'center', characterSpacing: 0.5 })
  doc.text('UP TO', X_PEN, y, { width: PEN_W, align: 'right', characterSpacing: 0.5 })
  return y + 12
}

function itemTextHeight(text) {
  doc.font('Helvetica').fontSize(9.5)
  return doc.heightOfString(text, { width: TEXT_W, lineGap: 1 })
}

function rowHeight(text) {
  return Math.max(ROW_MIN, Math.ceil(itemTextHeight(text)) + 2 * ROW_PAD)
}

function sectionHeight([, items]) {
  return 26 + items.reduce((sum, [, , text]) => sum + rowHeight(text), 0)
}

/** Draws one checklist row sized to its text; returns the row height. */
function row(n, citation, text, y, zebra) {
  const textH = itemTextHeight(text)
  const h = rowHeight(text)
  const mid = y + h / 2

  if (zebra) doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, h).fill(ZEBRA)

  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
     .text(`${n}.`, X_NUM, mid - 5, { width: 20 })

  // Long citations (e.g. 1910.303(g)(1)(ii)) shrink to fit their column
  // instead of wrapping onto a second line.
  const label = `[${citation}]`
  let size = 8
  doc.font('Courier-Bold')
  while (size > 6 && doc.fontSize(size).widthOfString(label) > CITE_W) size -= 0.25
  doc.fillColor(ORANGE).fontSize(size)
     .text(label, X_CITE, mid - size * 0.55, { width: CITE_W + 6 })

  doc.fillColor(TEXT).font('Helvetica').fontSize(9.5)
     .text(text, X_TEXT, mid - textH / 2, { width: TEXT_W, lineGap: 1 })

  doc.lineWidth(0.8).strokeColor('#CBD5E1')
  for (const bx of [X_YES, X_NO, X_NS]) doc.rect(bx + 7, mid - 5, 10, 10).stroke()

  doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(9.5)
     .text(money(MAX_PENALTY), X_PEN, mid - 5, { width: PEN_W, align: 'right' })

  return h
}

let zebraIndex = 0
function section([title, items], y) {
  y = sectionBar(title, y)
  for (const [num, cite, text] of items) {
    y += row(num, cite, text, y, zebraIndex % 2 === 0)
    zebraIndex++
  }
  return y
}

let pageNo = 1
function newPage() {
  footer()
  doc.addPage()
  pageNo++
  continuationHeader()
  return 90
}

/* ---------- PAGE 1 ---------- */
header()

let y = 150
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
   .text('How to Use This Scorecard', PAGE_MARGIN, y)
doc.rect(PAGE_MARGIN, y + 16, 140, 1.5).fill(ORANGE)
y += 26

y = para('Walk your facility with this checklist. For each item, check YES (in place), NO (not in place), or N/S (not sure).', y)
y = para(`Every NO is a potential OSHA citation. The right-hand column shows OSHA's 2026 maximum penalty for a single serious or other-than-serious violation. Every N/S deserves a closer look.`, y)
y = para('On the last page, total your answers to get your score and estimate your exposure.', y)

y += 8
y = columnHeader(y)

/* ---------- Checklist pages ---------- */
// A section never splits across pages; if it won't fit, it starts the next one.
for (const sec of SECTIONS) {
  if (y + sectionHeight(sec) > CONTENT_LIMIT) y = columnHeader(newPage())
  y = section(sec, y)
  assertFits(y, `page ${pageNo}`)
}

/* ---------- Score, exposure, next step ---------- */
// Height of the score + exposure + CTA block as laid out below (~360pt),
// with a margin so it never collides with the disclaimer.
const SUMMARY_H = 380
const DISCLAIMER_Y = FOOTER_Y - 52
if (y + 24 + SUMMARY_H > DISCLAIMER_Y) y = newPage() + 6
else y += 24

y = heading('Your Compliance Score', y)

// Left: tally box
const boxH = 96
doc.lineWidth(1).strokeColor(NAVY).rect(PAGE_MARGIN, y, 230, boxH).stroke()
doc.fillColor(TEXT).font('Helvetica').fontSize(10)
   .text(`Total YES answers:   _____ / ${TOTAL_ITEMS}`, PAGE_MARGIN + 14, y + 12)
   .text('Total NO answers:    _____', PAGE_MARGIN + 14, y + 32)
   .text('Total N/S answers:   _____', PAGE_MARGIN + 14, y + 52)
doc.font('Helvetica-Bold')
   .text(`Score:  YES ÷ ${TOTAL_ITEMS} =  _____ %`, PAGE_MARGIN + 14, y + 72)

// Right: scoring legend
const lx = PAGE_MARGIN + 250
const legendItems = [
  { color: '#16A34A', range: '90-100%', label: 'Strong compliance posture' },
  { color: ORANGE, range: '70-89%', label: 'Gaps that need attention' },
  { color: '#DC2626', range: 'Below 70%', label: 'Significant OSHA exposure' },
  { color: '#7F1D1D', range: 'Below 50%', label: 'Urgent: high citation risk' },
]
let ly = y + 10
for (const li of legendItems) {
  doc.rect(lx, ly + 3, 10, 10).fill(li.color)
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text(li.range, lx + 18, ly + 3, { width: 70 })
  doc.fillColor(TEXT).font('Helvetica').fontSize(10).text(li.label, lx + 88, ly + 3, { width: 190 })
  ly += 19
}

y += boxH + 30

y = heading('What Is Your Exposure?', y)
y = para(
  `Each NO is a potential citation. ${money(MAX_PENALTY)} is OSHA's 2026 maximum for one serious or ` +
  `other-than-serious violation; willful or repeated violations can reach ${money(MAX_WILLFUL)} each. ` +
  'Actual penalties depend on severity and probability, and OSHA can reduce them for company size, good faith, and history.',
  y,
)
y += 8
doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10.5)
   .text(`NO answers  ______   ×   ${money(MAX_PENALTY)}   =   $ ________________   estimated maximum exposure`, PAGE_MARGIN, y)
y += 40

// CTA card
const ctaH = 86
doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, ctaH).fill(NAVY)
doc.rect(PAGE_MARGIN, y, 4, ctaH).fill(ORANGE)
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
   .text('Want the Full Picture?', PAGE_MARGIN + 18, y + 12)
doc.fillColor(SLATE).font('Helvetica').fontSize(9.5)
   .text(
     'This scorecard covers 25 common warehouse citation areas. A full ACES audit reviews photos of your ' +
     'facility against 146 OSHA standards and returns specific CFR citations, penalty exposure, and ' +
     'recommended corrective actions.',
     PAGE_MARGIN + 18, y + 31, { width: CONTENT_WIDTH - 36, lineGap: 1 },
   )
doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10)
   .text('Request your free 30-minute consultation:', PAGE_MARGIN + 18, y + ctaH - 20)
doc.fillColor(WHITE)
   .text('acescompliancesystems.com', PAGE_MARGIN + 232, y + ctaH - 20)
y += ctaH
if (y > DISCLAIMER_Y - 8) {
  throw new Error(`Scorecard layout overflow on page ${pageNo}: summary reaches y=${Math.round(y)}, disclaimer starts at ${DISCLAIMER_Y}`)
}

// Disclaimer
doc.fillColor(SLATE).font('Helvetica-Oblique').fontSize(7.5)
   .text(
     'This scorecard is an educational self-assessment tool. It is not legal advice or a formal safety audit, and a YES ' +
     'on every item does not mean a facility is fully compliant. Some requirements apply only in certain conditions ' +
     '(for example, a written emergency action plan where an OSHA standard requires one). Penalty figures are OSHA\'s ' +
     '2026 maximum amounts, published at osha.gov/penalties.',
     PAGE_MARGIN, DISCLAIMER_Y, { width: CONTENT_WIDTH, align: 'center', lineGap: 1 },
   )

footer()

doc.end()
console.log(`Generated: ${OUTPUT}`)
