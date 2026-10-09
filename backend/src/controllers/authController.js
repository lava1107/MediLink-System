import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { JWT_SECRET } from "../config/env.js";
import { success, error } from "../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, "Please enter both username and password.", 400);
    }

    // Find user by username or email
    const users = await query(
      `SELECT u.id, u.name, u.username, u.email, u.password_hash, u.phone, u.status,
              r.name AS role, b.name AS branch, b.id AS branch_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN branches b ON u.branch_id = b.id
       WHERE LOWER(u.username) = LOWER(?) OR LOWER(u.email) = LOWER(?)`,
      [username, username]
    );

    if (users.length === 0) {
      return error(res, "No account found with that username or email.", 401);
    }

    const user = users[0];

    if (user.status !== "Active") {
      return error(res, "This account has been deactivated. Contact your administrator.", 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, "Invalid credentials. Please check your password.", 401);
    }

    // Format last login timestamp
    const now = new Date();
    const lastLoginFormatted = now.toISOString().slice(0, 10) + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    await query("UPDATE users SET last_login = ? WHERE id = ?", [lastLoginFormatted, user.id]);

    const payload = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      branch: user.branch,
      branchId: user.branch_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return success(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branch: user.branch,
        branchId: user.branch_id,
        status: user.status,
        lastLogin: lastLoginFormatted,
      },
    }, "Login successful");
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const users = await query(
      `SELECT u.id, u.name, u.username, u.email, u.phone, u.status, u.last_login,
              r.name AS role, b.name AS branch, b.id AS branch_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN branches b ON u.branch_id = b.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return error(res, "User not found", 404);
    }

    const user = users[0];
    return success(res, {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branch: user.branch,
      branchId: user.branch_id,
      status: user.status,
      lastLogin: user.last_login,
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  return success(res, null, "Logged out successfully");
}

async function loginOrCreateOauthUser(res, { email, name, avatar, provider = "Google", role = null }) {
  // Check if user exists by email
  let users = await query(
    `SELECT u.id, u.name, u.username, u.email, u.phone, u.status,
            r.name AS role, b.name AS branch, b.id AS branch_id
     FROM users u
     JOIN roles r ON u.role_id = r.id
     JOIN branches b ON u.branch_id = b.id
     WHERE LOWER(u.email) = LOWER(?)`,
    [email]
  );

  let user;
  if (users.length > 0) {
    user = users[0];
    if (user.status !== "Active") {
      return error(res, "This Google-linked account has been deactivated. Contact your administrator.", 403);
    }
    // Update role if requested role differs (e.g. elevate to Admin)
    if (role && role !== user.role) {
      const roles = await query("SELECT id FROM roles WHERE name = ? LIMIT 1", [role]);
      if (roles.length > 0) {
        await query("UPDATE users SET role_id = ? WHERE id = ?", [roles[0].id, user.id]);
        user.role = role;
      }
    }
  } else {
    // Automatically register new user under Pharmacist or specified role
    const targetRole = role || "Pharmacist";
    const roles = await query("SELECT id FROM roles WHERE name = ? LIMIT 1", [targetRole]);
    const roleId = roles[0]?.id || 2;
    const branches = await query("SELECT id, name FROM branches LIMIT 1");
    const branchId = branches[0]?.id || "BR-01";
    const branchName = branches[0]?.name || "Kovilpatti Branch";
    const newId = `USR-G-${Date.now().toString().slice(-4)}`;
    const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "guser";
    let username = baseUsername;
    const existingUser = await query("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUser.length > 0) {
      username = `${baseUsername}_${Date.now().toString().slice(-4)}`;
    }

    await query(
      `INSERT INTO users (id, name, username, email, password_hash, phone, role_id, branch_id, status, last_login)
       VALUES (?, ?, ?, ?, 'GOOGLE_OAUTH_AUTHENTICATED', '+91 99999 00000', ?, ?, 'Active', NOW())`,
      [newId, name || "Google User", username, email, roleId, branchId]
    );

    user = {
      id: newId,
      name: name || "Google User",
      username,
      email,
      phone: "+91 99999 00000",
      role: targetRole,
      branch: branchName,
      branch_id: branchId,
      status: "Active",
    };
  }

  const now = new Date();
  const lastLoginFormatted =
    now.toISOString().slice(0, 10) +
    " " +
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  await query("UPDATE users SET last_login = ? WHERE id = ?", [lastLoginFormatted, user.id]);

  const payload = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    branch: user.branch,
    branchId: user.branch_id || user.branchId,
    oauthProvider: provider,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  return success(
    res,
    {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branch: user.branch,
        branchId: user.branch_id || user.branchId,
        status: user.status || "Active",
        oauthProvider: provider,
        avatar: avatar || null,
        lastLogin: lastLoginFormatted,
      },
    },
    `Signed in via ${provider} OAuth successfully`
  );
}

export async function oauthLogin(req, res, next) {
  try {
    const { provider = "Google", email, name, avatar, role = "Admin" } = req.body;
    if (!email) {
      return error(res, "OAuth email is required", 400);
    }
    return await loginOrCreateOauthUser(res, { email, name, avatar, provider, role });
  } catch (err) {
    next(err);
  }
}

/**
/**
 * GET /api/auth/google/config
 * Returns current Google OAuth configuration status
 */
export function getGoogleConfig(req, res) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  const isConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim());
  const hasSecret = Boolean(GOOGLE_CLIENT_SECRET && GOOGLE_CLIENT_SECRET.trim());
  return success(res, {
    configured: isConfigured,
    hasSecret,
    clientId: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.trim() : null,
    callbackUrl: GOOGLE_CALLBACK_URL || "http://localhost:5173/auth/google/callback",
  });
}

/**
 * POST /api/auth/google/config
 * Updates runtime Google OAuth configuration in backend and persists to .env
 */
export function setGoogleConfig(req, res) {
  const { clientId, clientSecret, callbackUrl } = req.body || {};
  if (clientId !== undefined) process.env.GOOGLE_CLIENT_ID = String(clientId || "").trim();
  if (clientSecret !== undefined && clientSecret !== null) {
    process.env.GOOGLE_CLIENT_SECRET = String(clientSecret || "").trim();
  }
  if (callbackUrl) process.env.GOOGLE_CALLBACK_URL = String(callbackUrl).trim();

  const candidateEnvPaths = [
    path.resolve(__dirname, "../../.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend/.env"),
  ];

  for (const envPath of candidateEnvPaths) {
    try {
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        if (clientId !== undefined) {
          if (/^GOOGLE_CLIENT_ID=/m.test(envContent)) {
            envContent = envContent.replace(/^GOOGLE_CLIENT_ID=.*$/m, `GOOGLE_CLIENT_ID=${String(clientId || "").trim()}`);
          } else {
            envContent += `\nGOOGLE_CLIENT_ID=${String(clientId || "").trim()}`;
          }
        }
        if (clientSecret !== undefined && clientSecret !== null) {
          if (/^GOOGLE_CLIENT_SECRET=/m.test(envContent)) {
            envContent = envContent.replace(/^GOOGLE_CLIENT_SECRET=.*$/m, `GOOGLE_CLIENT_SECRET=${String(clientSecret || "").trim()}`);
          } else {
            envContent += `\nGOOGLE_CLIENT_SECRET=${String(clientSecret || "").trim()}`;
          }
        }
        if (callbackUrl) {
          if (/^GOOGLE_CALLBACK_URL=/m.test(envContent)) {
            envContent = envContent.replace(/^GOOGLE_CALLBACK_URL=.*$/m, `GOOGLE_CALLBACK_URL=${String(callbackUrl).trim()}`);
          } else {
            envContent += `\nGOOGLE_CALLBACK_URL=${String(callbackUrl).trim()}`;
          }
        }
        fs.writeFileSync(envPath, envContent, "utf-8");
      }
    } catch (fsErr) {
      console.warn("Could not write to .env at", envPath, fsErr.message);
    }
  }

  const isConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.trim());

  return success(
    res,
    {
      configured: isConfigured,
      hasSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim()),
      clientId: process.env.GOOGLE_CLIENT_ID,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5173/auth/google/callback",
    },
    "Google OAuth configuration updated"
  );
}

/**
 * GET /api/auth/google/url
 * Returns Google OAuth 2.0 authorization URL for real Google sign-in
 */
export function getGoogleAuthUrl(req, res) {
  const clientId = req.query?.clientId || process.env.GOOGLE_CLIENT_ID;
  const callback = req.query?.redirectUri || process.env.GOOGLE_CALLBACK_URL || "http://localhost:5173/auth/google/callback";

  if (!clientId || clientId.trim() === "") {
    return error(
      res,
      "Google OAuth not configured. Please provide or configure a valid Google Client ID.",
      400
    );
  }

  const scope = encodeURIComponent("openid email profile");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId.trim()
  )}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return success(res, { url, clientId: clientId.trim() }, "Google OAuth URL generated");
}

/**
 * POST /api/auth/google/callback
 * Exchanges authorization code for Google tokens and signs in user
 */
export async function handleGoogleCallback(req, res, next) {
  try {
    const code = req.body?.code || req.query?.code;
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return error(
        res,
        "Google OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend/.env.",
        400
      );
    }

    if (!code) {
      return error(res, "Authorization code is required for Google OAuth callback", 400);
    }

    const callback = GOOGLE_CALLBACK_URL || "http://localhost:5173/auth/google/callback";
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callback,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok || !tokenData.access_token) {
      return error(
        res,
        `Google OAuth token exchange failed: ${tokenData.error_description || tokenData.error || "Invalid authorization code"}`,
        401
      );
    }

    // Retrieve user profile from Google OpenID userinfo
    const userResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userResp.json();

    if (!profile.email) {
      return error(res, "Failed to retrieve verified email from Google OAuth profile", 400);
    }

    return await loginOrCreateOauthUser(res, {
      email: profile.email,
      name: profile.name || profile.given_name || profile.email.split("@")[0],
      avatar: profile.picture,
      provider: "Google",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/google/verify-token
 * Verifies Google ID token / Credential from Google Identity Services
 */
export async function verifyGoogleToken(req, res, next) {
  try {
    const { credential, idToken, accessToken, role } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify && !accessToken) {
      return error(res, "Google credential or token is required for verification", 400);
    }

    let email, name, picture;

    if (tokenToVerify) {
      const verifyResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
      const payload = await verifyResp.json();
      if (!verifyResp.ok || !payload.email) {
        return error(res, `Invalid Google token: ${payload.error_description || "Verification failed"}`, 401);
      }
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      const userResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await userResp.json();
      if (!profile.email) {
        return error(res, "Failed to retrieve user profile from Google", 401);
      }
      email = profile.email;
      name = profile.name;
      picture = profile.picture;
    }

    return await loginOrCreateOauthUser(res, {
      email,
      name,
      avatar: picture,
      provider: "Google",
      role: role || "Admin",
    });
  } catch (err) {
    next(err);
  }
}

// In-memory store for Gmail OTP verification: email.toLowerCase() -> { otp, expiresAt, name, attempts }
const gmailOtpStore = new Map();

/**
 * POST /api/auth/gmail/send-otp
 * Dispatches a real 6-digit verification code to the selected Gmail address via Nodemailer SMTP
 */
export async function sendGmailOtp(req, res, next) {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes("@")) {
      return error(res, "Please provide a valid Gmail / email address.", 400);
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name?.trim() || cleanEmail.split("@")[0];

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    gmailOtpStore.set(cleanEmail, {
      otp,
      expiresAt,
      name: cleanName,
      attempts: 0,
    });

    const emailSubject = `MediLink Security – Your Sign-in Verification Code: ${otp}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #132335 0%, #1D6FA5 100%); padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">MediLink Healthcare</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">Medical Shop Management System</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 18px; font-weight: 600;">Gmail Sign-In Verification</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Hello <strong>${cleanName}</strong>,<br/>
            You requested to sign in to <strong>MediLink</strong> with your Gmail account (<strong>${cleanEmail}</strong>). Please use the 6-digit verification code below:
          </p>
          <div style="background: #f0f7ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1D6FA5;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
            ⏱️ This code will expire in <strong>10 minutes</strong>. If you did not request this login code, you can safely ignore this email.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px; text-align: center;">
            MediLink Medical Shop Management System • Direct Gmail SMTP Gateway
          </div>
        </div>
      </div>
    `;

    let sendResult = null;
    let isLiveSmtp = false;
    let previewUrl = null;

    try {
      const { sendEmail } = await import("../services/communicationService.js");
      sendResult = await sendEmail({
        to: cleanEmail,
        toName: cleanName,
        subject: emailSubject,
        message: `Your MediLink verification code is: ${otp}. It expires in 10 minutes.`,
        html: emailHtml,
      });
      isLiveSmtp = Boolean(sendResult?.isRealDelivery);
      previewUrl = sendResult?.previewUrl;
    } catch (sendErr) {
      console.warn("[Gmail SMTP Send Warning]:", sendErr.message);
      return success(
        res,
        {
          sent: false,
          email: cleanEmail,
          otpSent: false,
          requiresSmtpConfig: true,
          smtpError: sendErr.message,
          devOtp: otp,
        },
        "SMTP configuration required for live email delivery"
      );
    }

    return success(
      res,
      {
        sent: true,
        email: cleanEmail,
        isLiveSmtp,
        previewUrl,
        devOtp: !isLiveSmtp ? otp : undefined,
      },
      isLiveSmtp
        ? `Verification code successfully dispatched to ${cleanEmail} via Live Gmail SMTP!`
        : `Verification code generated for ${cleanEmail} (Preview available)`
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/gmail/verify-otp
 * Verifies the 6-digit OTP and authenticates the user with their real Gmail account
 */
export async function verifyGmailOtp(req, res, next) {
  try {
    const { email, otp, name, role = "Admin" } = req.body;
    if (!email || !otp) {
      return error(res, "Gmail address and 6-digit verification code are required.", 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = gmailOtpStore.get(cleanEmail);

    if (!stored) {
      return error(res, "No active verification code found for this Gmail address. Please request a new code.", 400);
    }

    if (Date.now() > stored.expiresAt) {
      gmailOtpStore.delete(cleanEmail);
      return error(res, "Verification code has expired. Please request a new code.", 400);
    }

    if (stored.attempts >= 5) {
      gmailOtpStore.delete(cleanEmail);
      return error(res, "Too many incorrect verification attempts. Please request a new code.", 429);
    }

    if (String(stored.otp).trim() !== String(otp).trim()) {
      stored.attempts += 1;
      return error(res, "Invalid verification code. Please check your email inbox and try again.", 400);
    }

    // Successfully verified!
    gmailOtpStore.delete(cleanEmail);

    const displayName = name?.trim() || stored.name || cleanEmail.split("@")[0];
    return await loginOrCreateOauthUser(res, {
      email: cleanEmail,
      name: displayName,
      provider: "Google (Gmail SMTP)",
      role: role || "Admin",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/gmail/direct-login
 * Direct sign in with selected Gmail account + dispatches real SMTP login security notice
 */
export async function gmailDirectLogin(req, res, next) {
  try {
    const { email, name, role = "Admin" } = req.body;
    if (!email || !email.includes("@")) {
      return error(res, "Valid Gmail address is required.", 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split("@")[0];

    // Background security notification via SMTP
    (async () => {
      try {
        const { sendEmail } = await import("../services/communicationService.js");
        await sendEmail({
          to: cleanEmail,
          toName: displayName,
          subject: "MediLink Security Alert – Successful Sign-In with Gmail",
          message: `Your Gmail account ${cleanEmail} signed in to MediLink at ${new Date().toLocaleString()}.`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
              <div style="background: #1D6FA5; padding: 20px; text-align: center; color: #fff;">
                <h2 style="margin: 0; font-size: 18px;">MediLink Healthcare</h2>
                <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Sign-In Notification</p>
              </div>
              <div style="padding: 24px;">
                <p style="color: #334155; font-size: 14px; margin: 0 0 16px;">
                  Hello <strong>${displayName}</strong>,<br/>
                  Your Gmail account (<strong>${cleanEmail}</strong>) was just used to sign in to MediLink Healthcare Management System.
                </p>
                <div style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #475569; margin-bottom: 16px;">
                  <div>• <strong>Time:</strong> ${new Date().toLocaleString()}</div>
                  <div>• <strong>Assigned Role:</strong> ${role}</div>
                  <div>• <strong>Auth Method:</strong> Gmail Account Selection</div>
                </div>
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">If this was not you, please contact your pharmacy system administrator.</p>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.warn("[Login Alert Email Warning]:", e.message);
      }
    })();

    return await loginOrCreateOauthUser(res, {
      email: cleanEmail,
      name: displayName,
      provider: "Google (Gmail)",
      role: role || "Admin",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/gmail/smtp-config
 * Retrieves current Gmail SMTP gateway configuration
 */
export async function getGmailSmtpConfig(req, res, next) {
  try {
    const { getActiveConfig } = await import("../services/communicationService.js");
    const config = await getActiveConfig();
    return success(res, {
      configured: Boolean(config.smtpUser && config.smtpPass),
      smtpUser: config.smtpUser || process.env.EMAIL_USER || "",
      smtpHost: config.smtpHost || process.env.EMAIL_HOST || "smtp.gmail.com",
      smtpPort: config.smtpPort || process.env.EMAIL_PORT || 587,
      smtpFrom: config.smtpFrom || process.env.EMAIL_FROM || "MediLink Healthcare <noreply@medilink.com>",
      smtpSecure: config.smtpSecure || false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/gmail/smtp-config
 * Updates Gmail SMTP credentials (user, app password, host, port) in runtime, .env, and DB
 */
export async function saveGmailSmtpConfig(req, res, next) {
  try {
    const { smtpUser, smtpPass, smtpHost = "smtp.gmail.com", smtpPort = 587, smtpFrom, smtpSecure = false } = req.body || {};

    if (!smtpUser) {
      return error(res, "Gmail address (SMTP User) is required", 400);
    }

    const cleanUser = String(smtpUser).trim();
    const cleanPass = smtpPass !== undefined && smtpPass !== null && smtpPass !== "" ? String(smtpPass).trim() : undefined;
    const cleanHost = String(smtpHost || "smtp.gmail.com").trim();
    const cleanPort = Number(smtpPort) || 587;
    const cleanFrom = String(smtpFrom || `MediLink Healthcare <${cleanUser}>`).trim();

    // 1. Update in-memory process.env
    process.env.EMAIL_USER = cleanUser;
    process.env.SMTP_USER = cleanUser;
    if (cleanPass) {
      process.env.EMAIL_PASSWORD = cleanPass;
      process.env.SMTP_PASS = cleanPass;
    }
    process.env.EMAIL_HOST = cleanHost;
    process.env.SMTP_HOST = cleanHost;
    process.env.EMAIL_PORT = String(cleanPort);
    process.env.SMTP_PORT = String(cleanPort);
    process.env.EMAIL_FROM = cleanFrom;
    process.env.SMTP_FROM = cleanFrom;

    // 2. Persist to candidate .env paths
    const candidateEnvPaths = [
      path.resolve(__dirname, "../../.env"),
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "backend/.env"),
    ];

    for (const envPath of candidateEnvPaths) {
      try {
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, "utf-8");
          const updateOrAdd = (key, val) => {
            const regex = new RegExp(`^${key}=.*$`, "m");
            if (regex.test(envContent)) {
              envContent = envContent.replace(regex, `${key}=${val}`);
            } else {
              envContent += `\n${key}=${val}`;
            }
          };

          updateOrAdd("EMAIL_USER", cleanUser);
          if (cleanPass) updateOrAdd("EMAIL_PASSWORD", cleanPass);
          updateOrAdd("EMAIL_HOST", cleanHost);
          updateOrAdd("EMAIL_PORT", cleanPort);
          updateOrAdd("EMAIL_FROM", cleanFrom);
          updateOrAdd("EMAIL_SECURE", smtpSecure ? "true" : "false");

          fs.writeFileSync(envPath, envContent, "utf-8");
        }
      } catch (fsErr) {
        console.warn("Could not write .env at", envPath, fsErr.message);
      }
    }

    // 3. Save to database communication_settings
    try {
      const { saveConfig } = await import("../services/communicationService.js");
      await saveConfig({
        smtpUser: cleanUser,
        smtpPass: cleanPass || process.env.EMAIL_PASSWORD || "",
        smtpHost: cleanHost,
        smtpPort: cleanPort,
        smtpFrom: cleanFrom,
        smtpSecure,
      });
    } catch (dbErr) {
      console.warn("Could not save to communication_settings:", dbErr.message);
    }

    return success(
      res,
      {
        configured: Boolean(cleanUser && (cleanPass || process.env.EMAIL_PASSWORD)),
        smtpUser: cleanUser,
        smtpHost: cleanHost,
        smtpPort: cleanPort,
        smtpFrom: cleanFrom,
      },
      "Gmail SMTP Configuration saved successfully"
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/gmail/test-smtp
 * Verifies live SMTP credentials by sending a test message
 */
export async function testGmailSmtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return error(res, "Recipient email is required for SMTP test", 400);
    }
    const { sendEmail } = await import("../services/communicationService.js");
    const result = await sendEmail({
      to: email,
      toName: "MediLink Healthcare",
      subject: "MediLink Healthcare – Real Gmail SMTP Connection Verified",
      message: `Congratulations! Your Gmail SMTP connection is operational and verified at ${new Date().toLocaleString()}.`,
    });
    return success(res, result, `Test email successfully dispatched to ${email}!`);
  } catch (err) {
    return error(res, `Gmail SMTP Test Failed: ${err.message}`, 400);
  }
}
