// Generates a real, downloadable PDF invoice for a completed sale using jsPDF +
// jspdf-autotable. Triggered from Sales & Billing when "Generate Bill" succeeds.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "./format.js";
import { T } from "./theme.js";

// Ensure autoTable plugin is registered on jsPDF class
try {
  if (typeof autoTable === "function") {
    autoTable(new jsPDF()); // registers on jsPDF prototype
  } else if (typeof autoTable?.applyPlugin === "function") {
    autoTable.applyPlugin(jsPDF);
  } else if (typeof autoTable?.default?.applyPlugin === "function") {
    autoTable.default.applyPlugin(jsPDF);
  }
} catch (e) {
  console.warn("[PDF] AutoTable initialization warning:", e.message);
}

/**
 * Safely parse a hex or css-variable color into an [r, g, b] array
 */
function hexToRgb(colorStr, fallback = [29, 111, 165]) {
  if (!colorStr) return fallback;
  try {
    // If it's a CSS variable like "var(--medilink-blue, #1D6FA5)"
    const match = colorStr.match(/#([0-9a-fA-F]{3,6})/);
    if (match) {
      let hex = match[1];
      if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
      }
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return [r, g, b];
      }
    }
  } catch (err) {
    console.warn("[PDF] Color parse fallback:", err);
  }
  return fallback;
}

function formatPdfCurrency(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

/**
 * Robust execution of autoTable with clean fallback to manual drawing if plugin unavailable
 */
function runAutoTable(doc, options) {
  // Try 1: doc.autoTable attached method
  if (typeof doc.autoTable === "function") {
    try {
      doc.autoTable(options);
      return;
    } catch (e) {
      console.warn("[PDF] doc.autoTable failed, trying fallback:", e.message);
    }
  }

  // Try 2: autoTable as standalone function
  const fn = typeof autoTable === "function" ? autoTable : autoTable?.default;
  if (typeof fn === "function") {
    try {
      fn(doc, options);
      return;
    } catch (e) {
      console.warn("[PDF] autoTable(doc, ...) failed, using native manual draw:", e.message);
    }
  }

  // Try 3: Manual native jsPDF fallback table drawing
  drawManualTable(doc, options);
}

/**
 * Native jsPDF table fallback that never crashes or relies on external plugins
 */
function drawManualTable(doc, options) {
  const { startY = 120, margin = { left: 40, right: 40 }, head = [], body = [] } = options;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin.left - margin.right;
  let currentY = startY;

  // Header row
  if (head.length > 0 && head[0].length > 0) {
    const colCount = head[0].length;
    const colWidth = contentWidth / colCount;

    doc.setFillColor(29, 111, 165);
    doc.rect(margin.left, currentY, contentWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);

    head[0].forEach((col, idx) => {
      doc.text(String(col), margin.left + idx * colWidth + 4, currentY + 13);
    });
    currentY += 20;
  }

  // Body rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  body.forEach((row, rowIdx) => {
    const colCount = row.length;
    const colWidth = contentWidth / colCount;

    if (rowIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin.left, currentY, contentWidth, 18, "F");
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin.left, currentY + 18, margin.left + contentWidth, currentY + 18);

    row.forEach((cell, idx) => {
      const text = String(cell ?? "");
      const truncated = text.length > 18 ? text.slice(0, 16) + ".." : text;
      doc.text(truncated, margin.left + idx * colWidth + 4, currentY + 12);
    });

    currentY += 18;
  });

  doc.lastAutoTable = { finalY: currentY };
}

/**
 * @param {object} params
 * @param {object} params.sale - the sale record returned by salesService.createSale (has .bill, .date, .payment, .amount)
 * @param {object} params.branch - branch object { name, address, city, state, pin, phone, email }
 * @param {string} params.customerName
 * @param {Array}  params.items - [{ name, generic, batchNo, expiryDate, qty, price, discount, gst, lineTotal }]
 * @param {number} params.subtotal
 * @param {number} params.discount
 * @param {number} params.gst
 * @param {number} params.grandTotal
 */
export function generateInvoicePdf({ sale, branch, customerName, items = [], subtotal, discount, gst, grandTotal }) {
  if (!sale) {
    throw new Error("Cannot generate invoice: Sale data is missing.");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;

  const [blueR, blueG, blueB] = hexToRgb(T.blue, [29, 111, 165]);
  const [navyR, navyG, navyB] = hexToRgb(T.navy, [19, 35, 53]);

  // Header banner
  doc.setFillColor(blueR, blueG, blueB);
  doc.rect(0, 0, pageWidth, 75, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MediLink", marginX, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Medical Shop Management System • Official Tax Invoice", marginX, 50);
  doc.setFontSize(8.5);
  doc.text("GST Compliant Pharmacy Billing", marginX, 63);

  const billNo = sale.bill || sale.invoice || sale.id || "MDL/26-27/0001";
  const saleDate = sale.date || new Date().toISOString().slice(0, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TAX INVOICE", pageWidth - marginX, 32, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Invoice No: ${billNo}`, pageWidth - marginX, 48, { align: "right" });
  doc.text(`Date: ${formatDate(saleDate)}`, pageWidth - marginX, 62, { align: "right" });

  // Branch & Customer Info Block
  doc.setTextColor(navyR, navyG, navyB);
  let y = 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Branch Details", marginX, y);
  doc.text("Billed To (Customer)", pageWidth / 2 + 10, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text(branch?.name || sale.branch || "MediLink Healthcare Branch", marginX, y);
  doc.text(customerName || sale.customer || "Walk-in Customer", pageWidth / 2 + 10, y);

  doc.setFont("helvetica", "normal");
  y += 14;
  const branchAddr = branch?.address ? `${branch.address}, ${branch.city || ""}` : "Primary Medical Center";
  doc.text(branchAddr, marginX, y);
  if (customerName && customerName !== "Walk-in Customer") {
    doc.text("Patient / Retail Customer", pageWidth / 2 + 10, y);
  }
  y += 14;
  if (branch?.phone) doc.text(`Phone: ${branch.phone}`, marginX, y);
  if (branch?.email) doc.text(`Email: ${branch.email}`, pageWidth / 2 + 10, y);
  y += 18;

  // Line items table
  const rows = items.map((it) => [
    it.name || "Medicine",
    it.generic || "-",
    it.batchNo || "-",
    it.expiryDate ? formatDate(it.expiryDate) : "-",
    String(it.qty || 1),
    formatPdfCurrency(it.price),
    `${it.discount || 0}%`,
    `${it.gst || 0}%`,
    formatPdfCurrency(it.lineTotal),
  ]);

  runAutoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["Medicine", "Generic Name", "Batch No.", "Expiry", "Qty", "Unit Price", "Disc.", "GST", "Line Total"]],
    body: rows,
    styles: { fontSize: 8.5, cellPadding: 4, font: "helvetica", overflow: "linebreak" },
    headStyles: { fillColor: [blueR, blueG, blueB], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: { halign: "center" },
      5: { halign: "right" },
      6: { halign: "center" },
      7: { halign: "center" },
      8: { halign: "right" },
    },
  });

  const finalTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 100;
  const totalsX = pageWidth - marginX;
  let ty = finalTableY + 20;

  // Check page overflow
  if (ty + 130 > pageHeight) {
    doc.addPage();
    ty = 50;
  }

  // Totals Block
  doc.setFontSize(9.5);
  const totalLine = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totalsX - 160, ty);
    doc.text(value, totalsX, ty, { align: "right" });
    ty += 16;
  };

  const computedSub = subtotal !== undefined ? subtotal : items.reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0);
  const computedDisc = discount !== undefined ? discount : items.reduce((a, i) => a + ((i.price || 0) * (i.qty || 1) * (i.discount || 0)) / 100, 0);
  const computedGst = gst !== undefined ? gst : items.reduce((a, i) => a + (((i.price || 0) * (i.qty || 1) - ((i.price || 0) * (i.qty || 1) * (i.discount || 0)) / 100) * (i.gst || 0)) / 100, 0);
  const computedTotal = grandTotal !== undefined ? grandTotal : sale.amount || Math.round(computedSub - computedDisc + computedGst);

  totalLine("Subtotal", formatPdfCurrency(computedSub));
  totalLine("Discount", `-${formatPdfCurrency(computedDisc)}`);
  totalLine("GST Tax", `+${formatPdfCurrency(computedGst)}`);
  doc.setDrawColor(210, 220, 230);
  doc.line(totalsX - 160, ty - 4, totalsX, ty - 4);
  totalLine("Grand Total", formatPdfCurrency(computedTotal), true);
  totalLine("Payment Method", sale.payment || "Cash");
  if (sale.pharmacist) {
    totalLine("Billed By Pharmacist", sale.pharmacist);
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(140, 150, 160);
  doc.text(
    "Thank you for choosing MediLink. This is an authenticated computer-generated invoice.",
    marginX,
    pageHeight - 30
  );

  const safeName = String(billNo).replace(/[\\/]/g, "-");
  const filename = `MediLink_Invoice_${safeName}.pdf`;

  // Generate Blob & Blob URL for robust browser downloads and viewing
  let blob = null;
  let blobUrl = null;
  try {
    blob = doc.output("blob");
    if (typeof window !== "undefined" && window.URL && window.URL.createObjectURL) {
      blobUrl = window.URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn("[PDF] Blob creation warning:", e.message);
  }

  // Trigger download safely
  try {
    if (typeof window !== "undefined") {
      if (blobUrl) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          try {
            document.body.removeChild(link);
          } catch (e) {
            /* ignore */
          }
        }, 150);
      } else {
        doc.save(filename);
      }
    } else {
      doc.save(filename);
    }
  } catch (saveErr) {
    console.warn("[PDF] Direct save warning, falling back to doc.save:", saveErr.message);
    doc.save(filename);
  }

  return { success: true, filename, doc, blob, blobUrl };
}
