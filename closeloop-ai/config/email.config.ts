// Email configuration for campaign notifications
export const EMAIL_CONFIG = {
  // Default recipients for campaign notifications
  // Note: Recipients should be passed from selected leads
  defaultRecipients: [] as string[],

  // SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASSWORD || "",
    },
  },

  // Email sender details
  from: process.env.SMTP_FROM || "CloseLoop AI <noreply@example.com>",

  // Email template settings
  templates: {
    campaignNotification: {
      subjectPrefix: "🚀 CloseLoop AI - ",
    },
  },
};

// Helper function to get recipients from environment or config
export function getEmailRecipients(): string[] {
  // Check if there are environment-specific recipients
  const envRecipients = process.env.EMAIL_RECIPIENTS;

  if (envRecipients) {
    return envRecipients.split(",").map((email) => email.trim());
  }

  return EMAIL_CONFIG.defaultRecipients;
}
