import { Resend } from "resend";
import { config } from "dotenv";

config();

const isEmailConfigured = process.env.RESEND_API_KEY;

let resend = null;

if (isEmailConfigured) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("Resend Email Service configured.");
} else {
  console.log(
    "Resend API Key missing. Emails & OTPs will log directly to console.",
  );
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (isEmailConfigured && resend) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@resend.dev";

      await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      });

      console.log(`Email successfully dispatched to ${to}`);

      return true;
    } catch (error) {
      console.error("Resend Mail Dispatch Error:", error.message);
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

export const sendOtpEmail = async (email, otp) => {
  const subject = "NexMart - Confirm Your Email Address";

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; color: #333;">
      <h2 style="color: #4a154b; text-align: center;">
        Welcome to NexMart!
      </h2>

      <p>
        Thank you for registering. Please enter the following
        6-digit verification code to complete your signup process:
      </p>

      <div style="font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; color: #4a154b; letter-spacing: 5px;">
        ${otp}
      </div>

      <p>
        This code will expire in 10 minutes.
        If you did not request this code, please ignore this message.
      </p>

      <hr style="border: 0; border-top: 1px solid #eee;" />

      <p style="font-size: 11px; color: #999; text-align: center;">
        NexMart AI Multi-Vendor Marketplace, Inc.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Your NexMart OTP is ${otp}. Expires in 10 minutes.`,
  });
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
