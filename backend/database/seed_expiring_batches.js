import { query } from "../src/config/db.js";

async function seedExpiringBatches() {
  console.log("Seeding real batches expiring in 3 days, 5 days, and 7 days...");

  const batches = [
    {
      id: "BAT-EXP-03D",
      batch_no: "AMX-EXP-03D",
      medicine_id: "MED-07", // Amoxicillin 500mg
      branch_id: "BR-01", // Kovilpatti Branch (Pharmacist: M. Rajan, Lavanya M)
      mfg_date: "2024-10-01",
      expiry_date: "2026-10-10", // 3 days from Oct 7
      quantity: 50,
      available: 28,
      purchase_price: 35.0,
      selling_price: 55.0,
      rack: "R-EMG-01",
      status: "Expiring Soon",
    },
    {
      id: "BAT-EXP-05D",
      batch_no: "AZI-EXP-05D",
      medicine_id: "MED-04", // Azithromycin 500mg
      branch_id: "BR-02", // Tirunelveli Branch (Pharmacist: K. Meenakshi, N. Bhuvaneshwari)
      mfg_date: "2024-10-01",
      expiry_date: "2026-10-12", // 5 days from Oct 7
      quantity: 80,
      available: 45,
      purchase_price: 60.0,
      selling_price: 90.0,
      rack: "R-ANT-02",
      status: "Expiring Soon",
    },
    {
      id: "BAT-EXP-07D",
      batch_no: "ASC-EXP-07D",
      medicine_id: "MED-13", // Ascoril Cough Syrup
      branch_id: "BR-03", // Madurai Branch (Pharmacist: P. Arun Kumar, M. Divya)
      mfg_date: "2024-10-01",
      expiry_date: "2026-10-14", // 7 days from Oct 7
      quantity: 100,
      available: 60,
      purchase_price: 45.0,
      selling_price: 75.0,
      rack: "R-SYR-03",
      status: "Expiring Soon",
    },
    {
      id: "BAT-EXP-03B",
      batch_no: "CAL-EXP-03B",
      medicine_id: "MED-12", // Calcium + D3 Tablets
      branch_id: "BR-01", // Kovilpatti Branch (Pharmacist: M. Rajan)
      mfg_date: "2024-10-01",
      expiry_date: "2026-10-10", // 3 days from Oct 7
      quantity: 60,
      available: 35,
      purchase_price: 25.0,
      selling_price: 42.0,
      rack: "R-SUP-01",
      status: "Expiring Soon",
    },
  ];

  for (const b of batches) {
    const existing = await query("SELECT id FROM medicine_batches WHERE id = ? OR batch_no = ?", [b.id, b.batch_no]);
    if (existing.length === 0) {
      await query(
        `INSERT INTO medicine_batches (id, batch_no, medicine_id, branch_id, mfg_date, expiry_date, quantity, available, purchase_price, selling_price, rack, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.batch_no,
          b.medicine_id,
          b.branch_id,
          b.mfg_date,
          b.expiry_date,
          b.quantity,
          b.available,
          b.purchase_price,
          b.selling_price,
          b.rack,
          b.status,
        ]
      );
      console.log(`Inserted batch ${b.batch_no} expiring on ${b.expiry_date} for branch ${b.branch_id}`);
    } else {
      await query(
        `UPDATE medicine_batches SET expiry_date = ?, available = ?, status = 'Expiring Soon' WHERE id = ?`,
        [b.expiry_date, b.available, existing[0].id]
      );
      console.log(`Updated batch ${b.batch_no} with expiry ${b.expiry_date}`);
    }
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seedExpiringBatches().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
