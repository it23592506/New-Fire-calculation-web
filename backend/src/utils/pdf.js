const fs = require("fs");
const PDFDocument = require("pdfkit");

const COMPANY_NAME = process.env.COMPANY_NAME || "ISA Fire Company";
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || "www.isa.lk";
const WATERMARK_TEXT = process.env.PDF_WATERMARK || "CONFIDENTIAL";
const ENGINEER_NAME = process.env.ENGINEER_NAME || "Chief Fire Engineer";
const ENGINEER_LICENSE = process.env.ENGINEER_LICENSE || "FSE-APPROVAL-PENDING";
const LOGO_PATH = process.env.COMPANY_LOGO_PATH;

const riskColor = (risk) => {
  if (risk === "Low") return "#047857";
  if (risk === "Medium") return "#b45309";
  if (risk === "High") return "#c2410c";
  return "#b91c1c";
};

const extinguisherTypeLabel = (type) => {
  const labels = {
    water: "Water FE",
    foam: "Foam FE",
    dry_powder: "Dry Powder FE",
    co2: "CO2 FE",
    wet_chemical: "Wet Chemical FE"
  };

  return labels[type] || type || "Water FE";
};

const drawWatermark = (doc) => {
  doc.save();
  doc.fillOpacity(0.08);
  doc.fillColor("#334155");
  doc.font("Helvetica-Bold");
  doc.rotate(-35, {
    origin: [doc.page.width / 2, doc.page.height / 2]
  });
  doc.fontSize(54).text(WATERMARK_TEXT, 0, doc.page.height / 2 - 24, {
    width: doc.page.width,
    align: "center"
  });
  doc.restore();
};

const drawBrand = (doc) => {
  const logoX = doc.page.width - 160;
  const logoY = 22;

  if (LOGO_PATH && fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, logoX, logoY, { fit: [100, 40], align: "right" });
  } else {
    doc.roundedRect(logoX, logoY, 100, 40, 6).fill("#1e293b");
    const companyShort = COMPANY_NAME.split(" ")[0].toUpperCase();
    doc
      .fillColor("#e2e8f0")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(companyShort, logoX + 5, logoY + 8, { width: 90, align: "center" });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#cbd5e1")
      .text(COMPANY_WEBSITE, logoX + 5, logoY + 22, { width: 90, align: "center" });
  }
};

const drawHeader = (doc, title, subtitle) => {
  drawWatermark(doc);
  doc.rect(0, 0, doc.page.width, 84).fill("#0f172a");
  drawBrand(doc);
  doc.fillColor("#ffffff").fontSize(21).text(title, 48, 28, { width: 280 });
  doc.fontSize(10).fillColor("#cbd5e1").text(subtitle, 48, 52);
  doc.moveDown(2.2);
};

const drawFooter = (doc, pageLabel = "") => {
  const y = doc.page.height - 42;
  doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor("#cbd5e1").stroke();
  doc.fillColor("#64748b").fontSize(9).font("Helvetica");
  doc.text(`${COMPANY_NAME} | ${COMPANY_WEBSITE}`, 48, y + 8);
  if (pageLabel) {
    doc.text(pageLabel, 48, y + 8, { width: doc.page.width - 96, align: "right" });
  }
};

const drawSignatureBlock = (doc) => {
  const top = doc.page.height - 140;
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text("Engineer Approval", 48, top);
  doc
    .moveTo(48, top + 34)
    .lineTo(240, top + 34)
    .strokeColor("#475569")
    .stroke();
  doc.font("Helvetica").fillColor("#334155").fontSize(9);
  doc.text(`Name: ${ENGINEER_NAME}`, 48, top + 40);
  doc.text(`License: ${ENGINEER_LICENSE}`, 48, top + 54);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 48, top + 68);
};

const addCoverPage = (doc, subtitle) => {
  drawHeader(doc, "Fire Safety Report", subtitle);
  doc.moveDown(0.8);
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(26).text(COMPANY_NAME, {
    align: "center"
  });
  doc.moveDown(0.4);
  doc.font("Helvetica").fillColor("#475569").fontSize(12).text("Engineering Assessment Portfolio", {
    align: "center"
  });
  doc.moveDown(1.2);
  doc
    .roundedRect(88, doc.y, doc.page.width - 176, 88, 12)
    .fillAndStroke("#f8fafc", "#cbd5e1");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("Prepared For", 110, doc.y - 70);
  doc.font("Helvetica").fontSize(12).text("Client / Facility: __________________________", 110, doc.y + 6);
  doc.text("Site Location: ______________________________", 110, doc.y + 8);
  doc.text("Prepared On: " + new Date().toLocaleString(), 110, doc.y + 8);
  drawFooter(doc, "Cover Page");
};

const addTableOfContents = (doc, entries) => {
  doc.addPage();
  drawHeader(doc, "Table of Contents", "Navigation for this report package");
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(13).text("Sections");
  doc.moveDown(0.6);

  entries.forEach((entry) => {
    const startY = doc.y;
    doc.font("Helvetica").fontSize(11).fillColor("#334155").text(entry.title, 56, startY, {
      width: 400
    });
    doc
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(String(entry.page), 460, startY, { width: 80, align: "right" });
    doc
      .moveTo(56, startY + 14)
      .lineTo(540, startY + 14)
      .strokeColor("#e2e8f0")
      .stroke();
    doc.moveDown(0.8);
  });

  drawFooter(doc, "Table of Contents");
};

const drawMetricRow = (doc, label, value) => {
  const currentY = doc.y;
  doc.fillColor("#334155").fontSize(11).font("Helvetica").text(label, 56, currentY);
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(String(value), 300, currentY);
  doc.font("Helvetica");
  doc.moveDown(0.5);
};

const drawSingleReportBody = (doc, report) => {
  doc.moveDown(0.2);
  doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(report.title, 56);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b");
  doc.text(`Report ID: ${report._id}`, 56);
  doc.text(`Generated: ${new Date(report.createdAt).toLocaleString()}`, 56);
  doc.moveDown(0.4);

  const riskY = doc.y;
  doc
    .roundedRect(56, riskY, doc.page.width - 112, 32, 8)
    .fill(riskColor(report.riskCategory));
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(`Risk Category: ${report.riskCategory}`, 70, riskY + 8);
  doc.moveDown(1.2);

  // Show relevant metrics based on calculator type
  const calcType = report.calculatorType || 'fire';

  if (calcType === 'fire') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Input Summary", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Floor Area (m²)", report.area);
    drawMetricRow(doc, "Combustible Weight (kg)", report.weight);
    drawMetricRow(doc, "Calorific Value (kcal/kg)", report.cv);

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Calculated Output", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Fire Load (MJ)", report.fireLoad);
    drawMetricRow(doc, "Required Extinguishers", report.extinguishers);
    drawMetricRow(doc, "Hydrant Flow (LPM)", report.hydrantFlowLpm);
    drawMetricRow(doc, "Detector Count", report.detectorCount);
  } else if (calcType === 'extinguisher') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Extinguisher Requirements", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "FE Type", extinguisherTypeLabel(report.extinguisherType));
    drawMetricRow(doc, "Floor Area (m²)", report.area);
    drawMetricRow(doc, "Number of Units", report.extinguishers);
    drawMetricRow(doc, "Coverage per Unit (m²)", report.fireLoad);
    drawMetricRow(doc, "Distance Coefficient", report.cv);
  } else if (calcType === 'hydrant') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Hydrant System Design", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Floor Area (m²)", report.area);
    drawMetricRow(doc, "Water Demand (m³)", report.weight);
    drawMetricRow(doc, "Flow Rate (LPM)", report.hydrantFlowLpm);
    drawMetricRow(doc, "Design Head (m)", report.cv);
  } else if (calcType === 'detection') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Detection System Design", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Floor Area (m²)", report.area);
    drawMetricRow(doc, "Detector Count", report.detectorCount);
    drawMetricRow(doc, "Coverage per Detector (m²)", report.cv);
    drawMetricRow(doc, "Spacing (m)", report.fireLoad);
  } else if (calcType === 'sprinkler') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Sprinkler Demand", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Design Area (m²)", report.area);
    drawMetricRow(doc, "Density (L/min/m²)", report.cv);
    drawMetricRow(doc, "Demand (L/min)", report.hydrantFlowLpm);
    drawMetricRow(doc, "Demand (m³/h)", report.weight);
  } else if (calcType === 'water_tank') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Fire Water Tank Sizing", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Sprinkler Flow (L/min)", report.area);
    drawMetricRow(doc, "Hydrant Flow (L/min)", report.weight);
    drawMetricRow(doc, "Duration (hours)", report.cv);
    drawMetricRow(doc, "Total Flow (L/min)", report.hydrantFlowLpm);
    drawMetricRow(doc, "Required Volume (m³)", report.fireLoad);
  } else if (calcType === 'evacuation') {
    const margin = Number((report.detectorCount - report.hydrantFlowLpm).toFixed(2));
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Evacuation Time Summary", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Detection Time (min)", report.area);
    drawMetricRow(doc, "Alarm Time (min)", report.weight);
    drawMetricRow(doc, "Pre-movement Time (min)", report.cv);
    drawMetricRow(doc, "Travel Time (min)", report.fireLoad);
    drawMetricRow(doc, "RSET (min)", report.hydrantFlowLpm);
    drawMetricRow(doc, "ASET (min)", report.detectorCount);
    drawMetricRow(doc, "Margin (min)", margin);
  } else if (calcType === 'area') {
    doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Area Dimensions & Volume", 56);
    doc.moveDown(0.4);
    doc.font("Helvetica");
    drawMetricRow(doc, "Floor Area (m²)", report.area);
    drawMetricRow(doc, "Volume (m³)", report.weight);
    drawMetricRow(doc, "Ventilation Factor", report.cv);
    drawMetricRow(doc, "Height Coefficient", report.fireLoad);
  }

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Recommendation", 56);
  doc.font("Helvetica").fillColor("#334155").fontSize(10);
  const recommendation =
    report.riskCategory === "Critical"
      ? "Immediate engineering review is recommended. Upgrade suppression, response time, and evacuation readiness."
      : report.riskCategory === "High"
        ? "Review fire load controls and improve detector and hydrant readiness for faster response."
        : report.riskCategory === "Medium"
          ? "Maintain current controls and perform periodic drills and system checks."
          : "Current controls are adequate. Continue routine inspections and preventive maintenance.";
  doc.text(recommendation, { lineGap: 3 });

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(12).text("Fire Safety Tips", 56);
  doc.font("Helvetica").fillColor("#334155").fontSize(10);
  const fireSafetyTips = `• Install smoke detectors on every level and test monthly
• Maintain clear exit routes and keep them unobstructed
• Do not overload electrical outlets or use damaged cords
• Keep flammable materials away from potential heat sources
• Store hazardous chemicals safely and separately
• Practice emergency evacuation plans quarterly
• Know two escape routes from your work area
• Keep fire extinguishers accessible and staff trained
• Perform regular maintenance on fire safety equipment
• Report fire hazards immediately to management`;
  doc.text(fireSafetyTips, { lineGap: 2 });

  drawSignatureBlock(doc);
};

const createReportPdf = (report) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addCoverPage(doc, "Single Detailed Engineering Assessment");
    addTableOfContents(doc, [
      { title: "Cover Page", page: 1 },
      { title: report.title, page: 3 }
    ]);
    doc.addPage();
    drawHeader(doc, "Fire Safety Report", "Detailed Engineering Assessment");
    drawSingleReportBody(doc, report);
     drawFooter(doc, "Page 3");

    doc.end();
  });

const createFullReportPdf = (reports) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const tocEntries = [{ title: "Cover Page", page: 1 }, { title: "Table of Contents", page: 2 }];
    reports.forEach((report, index) => {
      tocEntries.push({ title: report.title || `Report ${index + 1}`, page: index + 3 });
    });

    addCoverPage(doc, `Full Portfolio • ${reports.length} Reports`);
    addTableOfContents(doc, tocEntries);

    reports.forEach((report, index) => {
      doc.addPage();
      drawHeader(doc, `Report ${index + 1} of ${reports.length}`, "Fire Safety Portfolio");
      drawSingleReportBody(doc, report);
      drawFooter(doc, `Page ${index + 3}`);
    });

    doc.end();
  });

module.exports = { createReportPdf, createFullReportPdf };
