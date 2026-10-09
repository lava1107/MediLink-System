import { query } from "../src/config/db.js";

async function run() {
  console.log("Checking customer Febi...");
  const existingCust = await query(
    "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ?",
    ["%Febi%", "%9655838904%"]
  );

  if (existingCust.length === 0) {
    await query(
      "INSERT INTO customers (id, name, phone, email, address, rx_ref) VALUES (?, ?, ?, ?, ?, ?)",
      ["CUS-09", "Febi", "9655838904", "febi@gmail.com", "10 Church Street, Kovilpatti", "RX-9912"]
    );
    console.log("Inserted customer Febi into customers table.");
  } else {
    await query(
      "UPDATE customers SET phone = '9655838904' WHERE id = ?",
      [existingCust[0].id]
    );
    console.log("Updated existing customer Febi with phone 9655838904.");
  }

  console.log("Checking reservation RSV-10 for Febi...");
  const existingRes = await query("SELECT * FROM reservations WHERE id = ?", ["RSV-10"]);
  if (existingRes.length > 0) {
    await query(
      "UPDATE reservations SET customer_id = 'CUS-09', customer_name = 'Febi', customer_phone = '9655838904', status = 'Pending', medicine_name = 'Human Mixtard Insulin', branch_name = 'Kovilpatti Branch', quantity = 2 WHERE id = 'RSV-10'"
    );
    console.log("Updated reservation RSV-10 for Febi to Pending.");
  } else {
    await query(
      "INSERT INTO reservations (id, customer_id, customer_name, customer_phone, medicine_id, medicine_name, branch_id, branch_name, quantity, res_date, expiry, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Pending', 'Pharmacist')",
      ["RSV-10", "CUS-09", "Febi", "9655838904", "MED-16", "Human Mixtard Insulin", "BR-01", "Kovilpatti Branch", 2]
    );
    console.log("Inserted reservation RSV-10 for Febi.");
  }

  const result = await query("SELECT * FROM reservations WHERE customer_name = 'Febi'");
  console.log("Febi Reservation in DB:", JSON.stringify(result, null, 2));
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
