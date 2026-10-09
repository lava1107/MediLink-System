import { query } from "../config/db.js";
import { sendEmail, sendWhatsApp } from "./communicationService.js";

/**
 * MediLink Automated Expiry Alert Engine
 * Scans batches expiring in <= 7 days, 5 days, and 3 days,
 * and automatically dispatches real Email, WhatsApp, and In-App Notifications
 * to the particular pharmacist responsible for that branch.
 */

let lastScanTimestamp = null;
let cronIntervalId = null;

export async function checkAndNotifyExpiringBatches({ force = false, daysThreshold = 7 } = {}) {
  const scanTime = new Date();
  console.log(`[ExpiryAlertEngine] Starting automated expiry scan (Threshold: <= ${daysThreshold} days)...`);

  try {
    // 1. Query batches expiring within the specified threshold
    const expiringBatches = await query(
      `SELECT b.id, b.batch_no AS batchNo, b.medicine_id AS medicineId, m.name AS medicineName, m.generic,
              b.branch_id AS branchId, br.name AS branchName, br.city AS branchCity, br.phone AS branchPhone,
              DATE_FORMAT(b.expiry_date, '%Y-%m-%d') AS expiryDate,
              b.quantity, b.available, b.rack, b.status,
              DATEDIFF(b.expiry_date, CURDATE()) AS daysLeft
       FROM medicine_batches b
       JOIN medicines m ON b.medicine_id = m.id
       JOIN branches br ON b.branch_id = br.id
       WHERE b.available > 0
         AND DATEDIFF(b.expiry_date, CURDATE()) BETWEEN 0 AND ?
       ORDER BY b.expiry_date ASC`,
      [daysThreshold]
    );

    console.log(`[ExpiryAlertEngine] Found ${expiringBatches.length} batches expiring within ${daysThreshold} days.`);

    const results = {
      scannedAt: scanTime.toISOString(),
      totalExpiring: expiringBatches.length,
      critical3Days: 0,
      warning5Days: 0,
      notice7Days: 0,
      notificationsDispatched: 0,
      emailsSent: 0,
      whatsappSent: 0,
      details: [],
    };

    for (const batch of expiringBatches) {
      const daysLeft = Number(batch.daysLeft);
      let tier = "7-Day Notice";
      let urgencyColor = "#2563eb";
      let urgencyBg = "#eff6ff";
      let border = "#bfdbfe";

      if (daysLeft <= 3) {
        tier = "CRITICAL 3-DAY EXPIRY ALERT";
        urgencyColor = "#dc2626";
        urgencyBg = "#fef2f2";
        border = "#fecaca";
        results.critical3Days++;
      } else if (daysLeft <= 5) {
        tier = "WARNING 5-DAY EXPIRY ALERT";
        urgencyColor = "#d97706";
        urgencyBg = "#fffbeb";
        border = "#fde68a";
        results.warning5Days++;
      } else {
        tier = "7-DAY ADVANCE NOTICE";
        results.notice7Days++;
      }

      // 2. Fetch the particular active pharmacists assigned to this branch
      let pharmacists = await query(
        `SELECT u.id, u.name, u.email, u.phone, r.name AS role, b.name AS branchName
         FROM users u
         JOIN roles r ON u.role_id = r.id
         JOIN branches b ON u.branch_id = b.id
         WHERE u.branch_id = ?
           AND r.name = 'Pharmacist'
           AND u.status = 'Active'`,
        [batch.branchId]
      );

      // If no pharmacist is specifically assigned, notify branch Admin
      if (pharmacists.length === 0) {
        pharmacists = await query(
          `SELECT u.id, u.name, u.email, u.phone, r.name AS role, b.name AS branchName
           FROM users u
           JOIN roles r ON u.role_id = r.id
           JOIN branches b ON u.branch_id = b.id
           WHERE (u.branch_id = ? OR r.name = 'Admin')
             AND u.status = 'Active'
           LIMIT 2`,
          [batch.branchId]
        );
      }

      const batchReport = {
        batchNo: batch.batchNo,
        medicineName: batch.medicineName,
        generic: batch.generic,
        branchName: batch.branchName,
        expiryDate: batch.expiryDate,
        daysLeft,
        available: batch.available,
        rack: batch.rack,
        tier,
        alertedPharmacists: [],
      };

      for (const pharmacist of pharmacists) {
        const pharmacistEmail = pharmacist.email;
        const pharmacistPhone = pharmacist.phone || "+91 94431 00234";

        // A. Real Email Dispatch
        const emailSubject = `🚨 [MediLink ${tier}] ${batch.medicineName} (Batch ${batch.batchNo}) expires in ${daysLeft} days`;
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8fafc; margin:0; padding:20px;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
              <div style="background:linear-gradient(135deg, #132335 0%, #1D6FA5 100%); padding:20px 24px; color:#ffffff;">
                <div style="font-size:20px; font-weight:bold; letter-spacing:-0.5px;">MediLink Healthcare Systems</div>
                <div style="font-size:12px; color:#bfdbfe; text-transform:uppercase; margin-top:2px;">Automated Pharmacy Safety Protocol</div>
              </div>
              <div style="padding:24px;">
                <div style="background:${urgencyBg}; border:1px solid ${border}; border-left:5px solid ${urgencyColor}; border-radius:10px; padding:16px; margin-bottom:20px;">
                  <div style="font-size:16px; font-weight:bold; color:${urgencyColor};">${tier}</div>
                  <div style="font-size:13px; color:#334155; margin-top:4px;">
                    <strong>Attention Pharmacist ${pharmacist.name}:</strong> An active batch at <strong>${batch.branchName}</strong> is expiring in <strong>${daysLeft} days</strong> (${batch.expiryDate}).
                  </div>
                </div>

                <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:20px;">
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0; color:#64748b; font-weight:600; width:40%;">Medicine:</td>
                    <td style="padding:10px 0; color:#0f172a; font-weight:bold; font-size:14px;">${batch.medicineName} (${batch.generic || "Generic"})</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0; color:#64748b; font-weight:600;">Batch Number:</td>
                    <td style="padding:10px 0; color:#0f172a; font-family:monospace; font-weight:bold;">${batch.batchNo}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0; color:#64748b; font-weight:600;">Current Stock:</td>
                    <td style="padding:10px 0; color:#dc2626; font-weight:bold;">${batch.available} units available</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0; color:#64748b; font-weight:600;">Rack Location:</td>
                    <td style="padding:10px 0; color:#0f172a; font-weight:bold;">${batch.rack || "Dispensary Rack A"}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 0; color:#64748b; font-weight:600;">Expiry Date:</td>
                    <td style="padding:10px 0; color:${urgencyColor}; font-weight:bold;">${batch.expiryDate} (${daysLeft} days remaining)</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; color:#64748b; font-weight:600;">Responsible Branch:</td>
                    <td style="padding:10px 0; color:#0f172a; font-weight:bold;">${batch.branchName}</td>
                  </tr>
                </table>

                <div style="background:#f8fafc; border-radius:10px; padding:16px; border:1px solid #e2e8f0;">
                  <div style="font-size:12px; font-weight:bold; color:#1e293b; text-transform:uppercase; margin-bottom:8px;">Mandatory Pharmacist Actions:</div>
                  <ol style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
                    <li>Physically locate batch <strong>${batch.batchNo}</strong> in rack <strong>${batch.rack}</strong>.</li>
                    <li>Move remaining stock to the quarantine / near-expiry return bin.</li>
                    <li>Do not dispense this batch for prescriptions longer than ${daysLeft} days.</li>
                    <li>Notify branch manager for supplier return or credit adjustment.</li>
                  </ol>
                </div>
              </div>
              <div style="background:#f8fafc; padding:14px 24px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center;">
                MediLink Automated Safety Dispatch &bull; Pharmacist Recipient: ${pharmacist.name} &bull; ${new Date().toLocaleDateString()}
              </div>
            </div>
          </body>
          </html>
        `;

        let emailSent = false;
        try {
          await sendEmail({
            to: pharmacistEmail,
            toName: pharmacist.name,
            subject: emailSubject,
            message: `URGENT EXPIRY ALERT: ${batch.medicineName} (Batch ${batch.batchNo}) at ${batch.branchName} expires in ${daysLeft} days on ${batch.expiryDate}. ${batch.available} units in Rack ${batch.rack}. Pharmacist ${pharmacist.name}: Please quarantine immediately.`,
            html: emailHtml,
          });
          emailSent = true;
          results.emailsSent++;
        } catch (mailErr) {
          console.warn(`[ExpiryAlertEngine] Email dispatch note for ${pharmacistEmail}:`, mailErr.message);
        }

        // B. Real WhatsApp Dispatch
        const waMessage = `*MediLink Expiry Safety Alert* 🏥\n\nUrgent: *${batch.medicineName}* (Batch: *${batch.batchNo}*) at *${batch.branchName}* expires in *${daysLeft} days* on *${batch.expiryDate}*.\nQuantity: *${batch.available} units* in Rack: *${batch.rack}*.\nAction required by Pharmacist: *${pharmacist.name}*.`;
        let whatsappSent = false;
        try {
          await sendWhatsApp({
            toPhone: pharmacistPhone,
            toName: pharmacist.name,
            message: waMessage,
          });
          whatsappSent = true;
          results.whatsappSent++;
        } catch (waErr) {
          console.warn(`[ExpiryAlertEngine] WhatsApp dispatch note for ${pharmacistPhone}:`, waErr.message);
        }

        // C. Real In-App Notification in MySQL Database
        const notifId = `NOTIF-EXP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
        try {
          await query(
            `INSERT INTO notifications (id, type, title, \`desc\`, time, \`read\`, branch_id)
             VALUES (?, ?, ?, ?, ?, 0, ?)`,
            [
              notifId,
              daysLeft <= 3 ? "danger" : "warning",
              `🚨 ${tier}: ${batch.medicineName} (${daysLeft}d left)`,
              `Batch ${batch.batchNo} (${batch.available} units at ${batch.branchName}) expires on ${batch.expiryDate}. Notified Pharmacist: ${pharmacist.name} (${pharmacist.email}).`,
              "Just now",
              batch.branchId,
            ]
          );
          results.notificationsDispatched++;
        } catch (notifErr) {
          console.warn("[ExpiryAlertEngine] Notification table insert notice:", notifErr.message);
        }

        batchReport.alertedPharmacists.push({
          id: pharmacist.id,
          name: pharmacist.name,
          email: pharmacistEmail,
          phone: pharmacistPhone,
          emailSent,
          whatsappSent,
        });
      }

      results.details.push(batchReport);
    }

    lastScanTimestamp = new Date().toISOString();
    return {
      success: true,
      message: `Expiry scan completed. Alerted ${results.totalExpiring} expiring batches across branches.`,
      data: results,
    };
  } catch (error) {
    console.error("[ExpiryAlertEngine Error]:", error);
    throw error;
  }
}

/**
 * Start recurring background expiry scan scheduler (runs every 1 hour)
 */
export function startExpiryCron() {
  if (cronIntervalId) clearInterval(cronIntervalId);

  // Initial check 5 seconds after server startup
  setTimeout(() => {
    checkAndNotifyExpiringBatches({ daysThreshold: 7 }).catch((e) =>
      console.warn("[ExpiryAlertCron Startup Warning]:", e.message)
    );
  }, 5000);

  // Recurring check every 1 hour (3600000 ms)
  cronIntervalId = setInterval(() => {
    console.log("[ExpiryAlertCron] Running hourly recurring expiry scan...");
    checkAndNotifyExpiringBatches({ daysThreshold: 7 }).catch((e) =>
      console.warn("[ExpiryAlertCron Hourly Warning]:", e.message)
    );
  }, 3600000);

  console.log("[ExpiryAlertEngine] Automated hourly background scanner initialized.");
}

export function getLastScanTimestamp() {
  return lastScanTimestamp;
}
