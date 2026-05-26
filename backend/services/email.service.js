import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

const isEmailConfigured =
  process.env.NODEMAILER_USER && process.env.NODEMAILER_PASS;

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,

    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },

    tls: {
      rejectUnauthorized: false,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log("SMTP VERIFY ERROR:", error.message);
    } else {
      console.log("SMTP SERVER READY");
    }
  });

  console.log("Nodemailer SMTP Transporter configured.");
} else {
  console.log(
    "Nodemailer SMTP details missing. Emails & OTPs will log directly to console.",
  );
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (isEmailConfigured && transporter) {
    try {
      const mailOptions = {
        from: `"NexMart Marketplace" <${process.env.NODEMAILER_USER}>`,
        to,
        subject,
        text,
        html,
      };

      await transporter.sendMail(mailOptions);

      console.log(`Email successfully dispatched to ${to}`);

      return true;
    } catch (error) {
      console.error("SMTP Mail Dispatch Error:", error.message);
    }
  }

  // Fallback console logging
  console.log("\n--- [MOCK EMAIL DISPATCH] ---");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text:    ${text || "See HTML below"}`);

  if (html) {
    console.log(`HTML Body:\n${html}`);
  }

  console.log("------------------------------\n");

  return true;
};

export const sendSellerStatusEmail = async (
  email,
  shopName,
  status,
  feedback = "",
) => {
  const subject = `NexMart - Seller Application Update: ${status}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Application Status: ${status}</h2>

      <p>Hello,</p>

      <p>
        Your application for shop
        <strong>${shopName}</strong>
        has been
        <strong>${status.toLowerCase()}</strong>
        by the platform administrator.
      </p>

      ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ""}

      <p>
        If you have any questions, please contact the NexMart admin team.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Your shop application status: ${status}. Feedback: ${feedback}`,
  });
};
