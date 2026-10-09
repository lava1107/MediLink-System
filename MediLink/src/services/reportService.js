// Mock, REST-shaped service that builds tabular report rows from the shared app db.
// Export/print buttons in the UI call these and then simulate PDF/Excel generation
// until a real backend/report-generation endpoint is wired up.
import { formatCurrency, formatDate } from "../utils/format.js";
import { medicineStock } from "./medicineService.js";

export const REPORT_DEFINITIONS = [
  { key: "daily-sales", name: "Daily Sales", desc: "Sales broken down by day" },
  { key: "monthly-sales", name: "Monthly Sales", desc: "Revenue trend across months" },
  { key: "purchase", name: "Purchase Report", desc: "All purchases from suppliers" },
  { key: "supplier", name: "Supplier Report", desc: "Purchases grouped by supplier" },
  { key: "customer", name: "Customer Report", desc: "Spending grouped by customer" },
  { key: "medicine", name: "Medicine Report", desc: "Stock and sales by medicine" },
  { key: "branch-sales", name: "Branch Sales Report", desc: "Revenue grouped by branch" },
  { key: "reservation", name: "Reservation Report", desc: "Reservation activity & outcomes" },
  { key: "low-stock", name: "Low Stock Report", desc: "Batches below threshold" },
  { key: "near-expiry", name: "Near Expiry Report", desc: "Batches expiring within 30 days" },
  { key: "expired", name: "Expired Medicine Report", desc: "Already expired batches" },
];

export const REPORT_COLUMNS = {
  "daily-sales": ["Bill No.", "Customer", "Branch", "Amount", "Payment", "Date"],
  "monthly-sales": ["Bill No.", "Customer", "Branch", "Amount", "Payment", "Date"],
  purchase: ["Invoice", "Supplier", "Branch", "Amount", "Payment", "Date"],
  supplier: ["Supplier", "City", "GST No.", "Total Purchased"],
  customer: ["Customer", "Phone", "Orders", "Total Spend"],
  medicine: ["Medicine", "Category", "Stock", "Price"],
  "branch-sales": ["Branch", "Bills", "Revenue"],
  reservation: ["Customer", "Medicine", "Branch", "Status", "Date"],
  "low-stock": ["Medicine", "Branch", "Available Qty", "Rack"],
  "near-expiry": ["Medicine", "Branch", "Batch No.", "Expiry Date"],
  expired: ["Medicine", "Branch", "Batch No.", "Expiry Date"],
};

export function buildReportRows(key, db) {
  switch (key) {
    case "daily-sales":
    case "monthly-sales":
      return db.sales.map((s) => ({ id: s.id, cols: [s.bill, s.customer, s.branch, formatCurrency(s.amount), s.payment, formatDate(s.date)] }));
    case "purchase":
      return db.purchases.map((p) => ({ id: p.id, cols: [p.invoice, p.supplier, p.branch, formatCurrency(p.amount), p.payment, formatDate(p.date)] }));
    case "supplier":
      return db.suppliers.map((s) => ({
        id: s.id,
        cols: [s.name, s.city, s.gst, formatCurrency(db.purchases.filter((p) => p.supplier === s.name).reduce((a, p) => a + p.amount, 0))],
      }));
    case "customer":
      return db.customers.map((c) => ({
        id: c.id,
        cols: [c.name, c.phone, db.sales.filter((s) => s.customer === c.name).length, formatCurrency(db.sales.filter((s) => s.customer === c.name).reduce((a, s) => a + s.amount, 0))],
      }));
    case "medicine":
      return db.medicines.map((m) => ({ id: m.id, cols: [m.name, m.category, medicineStock(m, db.batches), formatCurrency(m.selling)] }));
    case "branch-sales":
      return db.branches.map((b) => ({
        id: b.id,
        cols: [b.name, db.sales.filter((s) => s.branch === b.name).length, formatCurrency(db.sales.filter((s) => s.branch === b.name).reduce((a, s) => a + s.amount, 0))],
      }));
    case "reservation":
      return db.reservations.map((r) => ({ id: r.id, cols: [r.customer, r.medicine, r.branch, r.status, formatDate(r.resDate)] }));
    case "low-stock":
      return db.batches.filter((b) => b.available > 0 && b.available <= 20).map((b) => ({ id: b.id, cols: [b.medicineName, b.branchName, b.available, b.rack] }));
    case "near-expiry":
      return db.batches.filter((b) => b.status === "Expiring Soon").map((b) => ({ id: b.id, cols: [b.medicineName, b.branchName, b.batchNo, formatDate(b.expiryDate)] }));
    case "expired":
      return db.batches.filter((b) => b.status === "Expired").map((b) => ({ id: b.id, cols: [b.medicineName, b.branchName, b.batchNo, formatDate(b.expiryDate)] }));
    default:
      return [];
  }
}
