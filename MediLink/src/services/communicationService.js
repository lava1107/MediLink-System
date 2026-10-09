import { api } from "./api.js";

export const communicationService = {
  /**
   * Send an Email
   */
  async sendEmail(payload) {
    return await api.post("/communication/email", payload);
  },

  /**
   * Send WhatsApp notification
   */
  async sendWhatsApp(payload) {
    return await api.post("/communication/whatsapp", payload);
  },

  /**
   * Send an SMS (compatibility alias to WhatsApp)
   */
  async sendSMS(payload) {
    return await api.post("/communication/whatsapp", payload);
  },

  /**
   * Send Test Verification Email
   */
  async testEmail(email) {
    return await api.post("/communication/test-email", { email });
  },

  /**
   * Send Test Verification WhatsApp
   */
  async testWhatsApp(phone) {
    return await api.post("/communication/test-whatsapp", { phone });
  },

  /**
   * Send Test Verification SMS (alias)
   */
  async testSMS(phone) {
    return await api.post("/communication/test-whatsapp", { phone });
  },


  /**
   * Retrieve Communications History Logs
   */
  async getLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/communication/logs${query ? `?${query}` : ""}`;
    return await api.get(endpoint);
  },

  /**
   * Get Active Gateway Configuration
   */
  async getConfig() {
    return await api.get("/communication/config");
  },

  /**
   * Update Communication Configuration (SMTP / Twilio)
   */
  async updateConfig(config) {
    return await api.post("/communication/config", config);
  },

  /**
   * Quick trigger for common workflows (invoice, prescription, reservation, restock)
   */
  async quickSend(payload) {
    return await api.post("/communication/quick-send", payload);
  },
};

export default communicationService;
