import { Router } from "express";
import {
  login,
  getMe,
  logout,
  oauthLogin,
  getGoogleAuthUrl,
  handleGoogleCallback,
  verifyGoogleToken,
  getGoogleConfig,
  setGoogleConfig,
  sendGmailOtp,
  verifyGmailOtp,
  gmailDirectLogin,
  getGmailSmtpConfig,
  saveGmailSmtpConfig,
  testGmailSmtp,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/oauth", oauthLogin);
router.get("/google/config", getGoogleConfig);
router.post("/google/config", setGoogleConfig);
router.get("/google/url", getGoogleAuthUrl);
router.post("/google/callback", handleGoogleCallback);
router.get("/google/callback", handleGoogleCallback);
router.post("/google/verify-token", verifyGoogleToken);

// Real Gmail SMTP Authentication & Gateway
router.post("/gmail/send-otp", sendGmailOtp);
router.post("/gmail/verify-otp", verifyGmailOtp);
router.post("/gmail/direct-login", gmailDirectLogin);
router.get("/gmail/smtp-config", getGmailSmtpConfig);
router.post("/gmail/smtp-config", saveGmailSmtpConfig);
router.post("/gmail/test-smtp", testGmailSmtp);

router.get("/me", authenticateToken, getMe);
router.post("/logout", authenticateToken, logout);

export default router;
