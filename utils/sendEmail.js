const { BrevoClient } = require("@getbrevo/brevo");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    if (!user.email) throw new Error("User email is required");
    if (!user.firstName) throw new Error("User firstName is required");

    this.to = user.email;
    this.firstName = user.firstName;
    this.fromEmail = process.env.EMAIL_FROM;
    this.fromName = "GymBro Admin";
    this.url = url;

    this.client = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    });
  }

  async sendEmail(html, subject) {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: [
          {
            email: this.to,
            name: this.firstName,
          },
        ],
        subject,
        htmlContent: html,
        textContent: htmlToText(html),
      });

      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error.message);
      console.error("Status:", error.status || error.response?.statusCode);
      console.error("Body:", error.body || error.response?.body);
      throw error;
    }
  }

  async sendVerificationEmail() {
    const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111;">
    <h2 style="margin: 0 0 8px;">Hey ${this.firstName}! Welcome to GymBro 💪</h2>

    <p style="margin: 0 0 14px;">
      You're one step away from activating your account.
      Confirm your email to unlock your dashboard and start tracking your progress.
    </p>

    <a href="${this.url}" style="display: inline-block; padding: 12px 18px; background: #22c55e; color: #0b1220; text-decoration: none; font-weight: 700; border-radius: 10px;">
      Verify Email
    </a>

    <p style="margin: 16px 0 6px; color: #444; font-size: 13px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>

    <p style="margin: 0; font-size: 13px;">
      <a href="${this.url}" style="color: #2563eb; word-break: break-all;">
        ${this.url}
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 18px 0;" />

    <p style="margin: 0; color: #666; font-size: 12px;">
      If you didn't create a GymBro account, you can safely ignore this email.
    </p>
  </div>
`;

    await this.sendEmail(html, "Verify Your Email");
  }

  async sendPasswordReset() {
    const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111;">
    <h2 style="margin: 0 0 8px;">Reset Your Password</h2>

    <p style="margin: 0 0 14px;">
      You requested a password reset. Click the button below to reset your password.
      This link is valid for only 10 minutes.
    </p>

    <a href="${this.url}" style="display: inline-block; padding: 12px 18px; background: #22c55e; color: #0b1220; text-decoration: none; font-weight: 700; border-radius: 10px;">
      Reset Password
    </a>

    <p style="margin: 16px 0 6px; color: #444; font-size: 13px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>

    <p style="margin: 0; font-size: 13px;">
      <a href="${this.url}" style="color: #2563eb; word-break: break-all;">
        ${this.url}
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 18px 0;" />

    <p style="margin: 0; color: #666; font-size: 12px;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>
`;

    await this.sendEmail(html, "Reset Your Password");
  }
};
