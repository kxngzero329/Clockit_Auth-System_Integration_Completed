import nodemailer from "nodemailer";

export async function sendEmail(to, subject, html, text = "") {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Clock It" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || "Open this email in a browser to view the password reset link.",
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Email sending failed");
  }
}
