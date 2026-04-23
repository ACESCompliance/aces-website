/**
 * Generates the ACES Warehouse OSHA Compliance Scorecard as a PDF.
 * Run:  node tools/generate-scorecard.js
 * Output: ../ACES_OSHA_Warehouse_Compliance_Scorecard.pdf
 *
 * Fixes in this version vs. the original:
 *   1. Footer instruction no longer says "Multiply by $16,550" — it says
 *      "Sum the penalty amounts next to each NO answer" (accurate math).
 *   2. Intro paragraph aligned with the scoring legend (was contradictory).
 *   3. Em-dash characters used properly (— not --).
 *   4. Item #17 CFR citation tightened to 1910.178(l)(1).
 */
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const OUTPUT = path.join(__dirname, '..', 'ACES_OSHA_Warehouse_Compliance_Scorecard.pdf')
const LOGO = path.join(__dirname, '..', 'logo.png')

// Brand
const NAVY = '#0B1D32'
const NAVY_LIGHT = '#132B47'
const ORANGE = '#F07316'
const SLATE = '#94A3B8'
const LIGHT = '#F1F5F9'
const ZEBRA = '#F8FAFC'
const TEXT = '#1A1A1A'
const TEXT_SOFT = '#475569'
const BORDER = '#E2E8F0'
const WHITE = '#FFFFFF'

// Page geometry
const PAGE_MARGIN = 40
const PAGE_WIDTH = 612   // 8.5"
const PAGE_HEIGHT = 792  // 11"
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN

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

doc.pipe(fs.createWriteStream(OUTPUT))

/* ---------- helpers ---------- */

function header() {
  // Navy header bar
  doc.rect(0, 0, PAGE_WIDTH, 110).fill(NAVY)

  // Logo (if present)
  if (fs.existsSync(LOGO)) {
    try {
      doc.image(LOGO, PAGE_MARGIN, 28, { width: 56, height: 56 })
    } catch (e) { /* ignore */ }
  }

  // Title
  doc.fillColor(WHITE)
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('Warehouse OSHA Compliance', PAGE_MARGIN + 72, 30)
     .text('Scorecard', PAGE_MARGIN + 72, 55)

  // Subhead
  doc.fillColor(SLATE)
     .font('Helvetica')
     .fontSize(10)
     .text('Self-Assessment Tool  |  29 CFR 1910 General Industry Standards', PAGE_MARGIN + 72, 85)
     .text('ACES Compliance Systems  |  acescompliancesystems@gmail.com', PAGE_MARGIN + 72, 98)

  // Orange rule
  doc.rect(PAGE_MARGIN, 128, CONTENT_WIDTH, 3).fill(ORANGE)
}

function continuationHeader() {
  // Navy strip
  doc.rect(0, 0, PAGE_WIDTH, 54).fill(NAVY)

  doc.fillColor(WHITE)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text('Warehouse OSHA Compliance Scorecard', PAGE_MARGIN, 20)

  doc.fillColor(ORANGE)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('(continued)', PAGE_MARGIN + 350, 22)

  // Orange rule
  doc.rect(PAGE_MARGIN, 72, CONTENT_WIDTH, 3).fill(ORANGE)
}

function footer(pageNum) {
  const y = PAGE_HEIGHT - 42
  doc.fillColor(SLATE)
     .font('Helvetica')
     .fontSize(9)
     .text(
       'ACES Compliance Systems  |  Jessup, Pennsylvania  |  acescompliancesystems@gmail.com',
       PAGE_MARGIN, y, { width: CONTENT_WIDTH, align: 'center' }
     )
  doc.fontSize(8)
     .text(
       'Based on 29 CFR 1910 General Industry Standards  |  2026 Penalty Rates',
       PAGE_MARGIN, y + 12, { width: CONTENT_WIDTH, align: 'center' }
     )
}

function sectionBar(title, y) {
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 26).fill(NAVY)
  doc.fillColor(WHITE)
     .font('Helvetica-Bold')
     .fontSize(10.5)
     .text(title, PAGE_MARGIN + 14, y + 8, { characterSpacing: 0.5 })
  // Right-side "PENALTY" label only on first section — but we'll draw it via row header instead
}

/**
 * Draw one question row.
 * x columns:
 *   number col    → PAGE_MARGIN .. +26
 *   citation col  → +26 .. +120
 *   text col      → +120 .. +380
 *   YES, NO, N/S boxes → +390, +430, +470
 *   penalty text  → +500 .. right margin
 */
function row(n, citation, text, penalty, y, zebra) {
  const rowHeight = 24
  const xNum = PAGE_MARGIN + 4
  const xCite = PAGE_MARGIN + 26
  const xText = PAGE_MARGIN + 118
  const xYes = PAGE_MARGIN + CONTENT_WIDTH - 174
  const xNo = xYes + 42
  const xNs = xNo + 42
  const xPen = xYes + 130

  if (zebra) {
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill(ZEBRA)
  }

  // Row number
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
     .text(`${n}.`, xNum, y + 8, { width: 18 })

  // CFR citation in orange brackets
  doc.fillColor(ORANGE).font('Courier-Bold').fontSize(8)
     .text(`[${citation}]`, xCite, y + 8.5, { width: 90 })

  // Question text
  doc.fillColor(TEXT).font('Helvetica').fontSize(9.5)
     .text(text, xText, y + 8, { width: xYes - xText - 8 })

  // Checkboxes (YES, NO, N/S)
  const boxSize = 10
  for (const bx of [xYes, xNo, xNs]) {
    doc.lineWidth(0.8).strokeColor('#CBD5E1')
       .rect(bx + 8, y + 7, boxSize, boxSize).stroke()
  }

  // Penalty
  doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(9.5)
     .text(`$${penalty.toLocaleString()}`, xPen, y + 8, { width: 52, align: 'right' })
}

function columnHeader(y) {
  const xYes = PAGE_MARGIN + CONTENT_WIDTH - 174
  const xNo = xYes + 42
  const xNs = xNo + 42
  const xPen = xYes + 130

  doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8)
     .text('YES', xYes, y, { width: 24, align: 'center', characterSpacing: 0.5 })
     .text('NO', xNo, y, { width: 24, align: 'center', characterSpacing: 0.5 })
     .text('N/S', xNs, y, { width: 24, align: 'center', characterSpacing: 0.5 })
     .text('PENALTY', xPen, y, { width: 60, align: 'right', characterSpacing: 0.5 })
}

/* ---------- content ---------- */

const PAGE_ONE = [
  // [sectionTitle, items] — items are [num, citation, text, penalty]
  ['STORAGE & MATERIAL HANDLING  (1910.176)', [
    [1, '1910.176(b)', 'All stacked materials are stable, interlocked, and secured against collapse', 16550],
    [2, '1910.176(b)', 'No materials overhang or extend beyond rack beam edges', 16550],
    [3, '1910.176(a)', 'Adequate clearance maintained in all aisles for forklift and pedestrian access', 16550],
    [4, '1910.176(c)', 'Storage areas clean and orderly \u2014 no broken pallets or accumulated debris', 3500],
  ]],
  ['WALKING-WORKING SURFACES & HOUSEKEEPING  (1910.22)', [
    [5, '1910.22(a)(1)', 'Floors clean, dry, and free of trip hazards (debris, tape, spills)', 5000],
    [6, '1910.22(a)(3)', 'No cracked concrete, potholes, or uneven surfaces in walkways', 5000],
    [7, '1910.22(d)(1)', 'Permanent aisles clearly marked with visible, non-faded paint or tape', 5000],
  ]],
  ['FIRE PROTECTION  (1910.157-159)', [
    [8, '1910.157(c)(1)', 'Fire extinguishers visible, accessible, and unobstructed', 16550],
    [9, '1910.157(e)(2)', 'Extinguisher inspection tags current (monthly checks documented)', 5000],
    [10, '1910.159(c)(10)', '18-inch clearance maintained below all sprinkler heads', 16550],
  ]],
  ['ELECTRICAL SAFETY  (1910.303-305)', [
    [11, '1910.303(g)(1)', '36-inch clear working space maintained in front of all electrical panels', 16550],
    [12, '1910.305(g)(1)', 'No extension cords used as permanent wiring', 5000],
    [13, '1910.303(b)', 'All junction box covers in place \u2014 no exposed wiring', 16550],
  ]],
]

const PAGE_TWO = [
  ['EXIT ROUTES  (1910.36-37)', [
    [14, '1910.37(a)(3)', 'All exit routes clear and unobstructed by stored materials', 16550],
    [15, '1910.37(b)(6)', 'Exit signs illuminated and clearly visible from all directions', 5000],
    [16, '1910.36(b)(2)', 'Exit doors open in direction of travel and are not locked from inside', 16550],
  ]],
  ['POWERED INDUSTRIAL TRUCKS  (1910.178)', [
    [17, '1910.178(l)(1)', 'All forklift operators trained, evaluated, and certified', 16550],
    [18, '1910.178(q)(7)', 'Daily pre-operation inspections documented for each truck', 5000],
    [19, '1910.178(n)(4)', 'Pedestrian and forklift traffic paths clearly separated', 16550],
  ]],
  ['PPE & HAZARD COMMUNICATION  (1910.132, 1910.1200)', [
    [20, '1910.132(d)', 'Written PPE hazard assessment completed and on file', 16550],
    [21, '1910.132(a)', 'Employees wearing required PPE (safety shoes, hi-vis, hard hats)', 16550],
    [22, '1910.1200(e)', 'SDS sheets accessible and chemical containers properly labeled', 16550],
  ]],
  ['EMERGENCY & GENERAL SAFETY', [
    [23, '1910.38(a)', 'Written emergency action plan in place and communicated to employees', 5000],
    [24, '1910.151(b)', 'First aid supplies readily available and adequately stocked', 5000],
    [25, '1910.147(c)(1)', 'Lockout/tagout program documented for equipment servicing', 16550],
  ]],
]

/* ---------- PAGE 1 ---------- */
header()

// Intro
let y = 150
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
   .text('How to Use This Scorecard', PAGE_MARGIN, y)
// Orange underline
doc.rect(PAGE_MARGIN, y + 16, 140, 1.5).fill(ORANGE)

y += 26
doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(9.5)
   .text(
     'Walk your facility with this checklist. For each item, check YES (compliant), NO (violation), or NOT SURE.',
     PAGE_MARGIN, y, { width: CONTENT_WIDTH, lineGap: 1.5 }
   )
y += 14
doc.text(
  'Every NO answer is a potential OSHA citation. Penalty amounts per item are shown on the right. Every NOT SURE needs investigation.',
  PAGE_MARGIN, y, { width: CONTENT_WIDTH, lineGap: 1.5 }
)
y += 14
doc.text(
  'At the bottom, sum the penalty amounts to calculate your exposure. If you score below 90%, your facility has compliance gaps worth addressing.',
  PAGE_MARGIN, y, { width: CONTENT_WIDTH, lineGap: 1.5 }
)

y += 30
columnHeader(y)
y += 12

// Sections + rows for page 1
let itemCounter = 0
for (const [title, items] of PAGE_ONE) {
  sectionBar(title, y)
  y += 26
  for (const [num, cite, text, pen] of items) {
    row(num, cite, text, pen, y, itemCounter % 2 === 0)
    y += 24
    itemCounter++
  }
}

footer(1)

/* ---------- PAGE 2 ---------- */
doc.addPage()
continuationHeader()

y = 90
columnHeader(y)
y += 12

for (const [title, items] of PAGE_TWO) {
  sectionBar(title, y)
  y += 26
  for (const [num, cite, text, pen] of items) {
    row(num, cite, text, pen, y, itemCounter % 2 === 0)
    y += 24
    itemCounter++
  }
}

/* ---------- Compliance score box ---------- */
y += 14

doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13)
   .text('Your Compliance Score', PAGE_MARGIN, y)
doc.rect(PAGE_MARGIN, y + 18, 150, 1.5).fill(ORANGE)

y += 30

// Left: score tally box
doc.lineWidth(1).strokeColor(NAVY)
   .rect(PAGE_MARGIN, y, 220, 74).stroke()
doc.fillColor(TEXT).font('Helvetica').fontSize(10)
   .text('Total YES answers:   _____ / 25', PAGE_MARGIN + 14, y + 10)
   .text('Total NO answers:    _____', PAGE_MARGIN + 14, y + 28)
   .text('Total NOT SURE:      _____', PAGE_MARGIN + 14, y + 46)

// Right: scoring legend
const lx = PAGE_MARGIN + 240
const legendItems = [
  { color: '#16A34A', range: '90-100%', label: 'Strong compliance posture' },
  { color: ORANGE,    range: '70-89%',  label: 'Gaps that need attention' },
  { color: '#DC2626', range: 'Below 70%', label: 'Significant OSHA exposure' },
  { color: '#7F1D1D', range: 'Below 50%', label: 'Urgent \u2014 high citation risk' },
]
let ly = y + 4
for (const li of legendItems) {
  doc.rect(lx, ly + 3, 10, 10).fill(li.color)
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
     .text(li.range, lx + 18, ly + 3, { width: 70 })
  doc.fillColor(TEXT).font('Helvetica').fontSize(10)
     .text(li.label, lx + 88, ly + 3, { width: 180 })
  ly += 17
}

y += 92

/* ---------- Exposure section ---------- */
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
   .text('WHAT IS YOUR EXPOSURE?', PAGE_MARGIN, y, { characterSpacing: 0.5 })
y += 18
doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(9.5)
   .text(
     'Sum the penalty amounts next to each NO answer. That is your minimum OSHA penalty exposure if an inspector walks in tomorrow. Most warehouse inspections result in 5\u201310 citations totaling $50,000 or more.',
     PAGE_MARGIN, y, { width: CONTENT_WIDTH, lineGap: 1.5 }
   )
y += 30
doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
   .text('Your estimated exposure:  $', PAGE_MARGIN, y)
// Underline for their number
doc.rect(PAGE_MARGIN + 180, y + 11, 150, 1).fill(NAVY)

y += 24

/* ---------- CTA card ---------- */
const ctaY = y + 4
doc.rect(PAGE_MARGIN, ctaY, CONTENT_WIDTH, 80).fill(NAVY)
doc.rect(PAGE_MARGIN, ctaY, 4, 80).fill(ORANGE)

doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
   .text('Want the Full Picture?', PAGE_MARGIN + 18, ctaY + 12)

doc.fillColor(SLATE).font('Helvetica').fontSize(9.5)
   .text(
     'This scorecard covers the top 25 citation areas. A full ACES compliance audit covers 135+ OSHA standards with AI photo analysis, specific CFR citations, penalty exposure calculations, and corrective action plans.',
     PAGE_MARGIN + 18, ctaY + 30, { width: CONTENT_WIDTH - 36, lineGap: 1 }
   )

doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10)
   .text('Request your free 30-minute consultation:', PAGE_MARGIN + 18, ctaY + 60)
doc.fillColor(WHITE)
   .text('acescompliancesystems.netlify.app', PAGE_MARGIN + 232, ctaY + 60)

// Disclaimer
const discY = PAGE_HEIGHT - 78
doc.fillColor(SLATE).font('Helvetica-Oblique').fontSize(7.5)
   .text(
     'This scorecard is provided as an educational self-assessment tool and does not constitute legal advice or a formal safety audit. Estimated penalties are based on 2026 OSHA maximum penalty guidelines. For a comprehensive assessment, contact ACES Compliance Systems.',
     PAGE_MARGIN, discY, { width: CONTENT_WIDTH, align: 'center', lineGap: 1 }
   )

footer(2)

doc.end()
console.log(`Generated: ${OUTPUT}`)
