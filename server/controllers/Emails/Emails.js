import nodemailer from "nodemailer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

function formatContent(text) {
  return text
    .split("\n")
    .map((str) => `${str}<br />`)
    .join("");
}

export async function replyEmail(userEmail, subject, message) {
  try {
    // Configure nodemailer with your email sending service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Neena" <novaegtech@gmail.com>',
      to: userEmail,
      subject: subject,
      html: `
        <div style="background-color: #f7f7f7; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/dc3jkijbn/image/upload/v1733468797/neena/logo_psnu1s.png" width="80" style="border-radius: 50%;" alt="Neena Logo" />
            <h1 style="font-weight: bold; color: #333; margin-top: 10px;">Neena</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">${formatContent(
              message
            )}</p>
          </div>
          <p style="font-size: 14px; color: #666;">Best Regards,<br/>Neena Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendAlertEmail(name, userEmail, phone, message, type, files) {
  try {
    // Configure nodemailer with your email sending service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare attachments
    const attachments = await Promise.all(files.map(async (fileUrl) => {
      try {
        const response = await axios({
          url: fileUrl,
          method: 'GET',
          responseType: 'stream',
        });

        const fileExtension = path.extname(fileUrl);
        const fileName = `${uuidv4()}${fileExtension}`;

        return {
          filename: fileName,
          content: response.data,
        };
      } catch (error) {
        console.error(`Error downloading file ${fileUrl}:`, error);
        return null;
      }
    }));

    // Filter out any null attachments (failed downloads)
    const validAttachments = attachments.filter(Boolean);

    await transporter.sendMail({
      from: '"Neena" <novaegtech@gmail.com>',
      to: process.env.EMAIL_USER,
      subject: "You have a new message",
      html: `
        <div style="background-color: #f7f7f7; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/dc3jkijbn/image/upload/v1733468797/neena/logo_psnu1s.png" width="80" style="border-radius: 50%;" alt="Neena Logo" />
            <h1 style="font-weight: bold; color: #333; margin-top: 10px;">Neena</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">You have a new message from ${name} (${userEmail}) (${phone}) Type:(${type}):</p>
            <p style="font-size: 16px; color: #333;">=====START OF MESSAGE=====</p>
            <p style="font-size: 16px; color: #333;">${formatContent(message)}</p>
            <p style="font-size: 16px; color: #333;">=====END OF MESSAGE=====</p>
            <a href="mailto:${userEmail}" style="font-size: 16px; color: #0000FF; text-decoration: underline;">Reply to ${name}</a>
            <p style="font-size: 16px; color: #333;">Please respond to the user as soon as possible.</p>
            <p style="font-size: 16px; color: #333;">Thank you!</p>
          </div>
          <p style="font-size: 14px; color: #666;">Best Regards,<br/>Neena Team</p>
        </div>
      `,
      attachments: validAttachments,
    });

  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendVerificationEmail(userEmail, code) {
  try {
    // Configure nodemailer with your email sending service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Neena" <novaegtech@gmail.com>',
      to: userEmail,
      subject: "Account Activation",
      html: `
        <div style="background-color: #f7f7f7; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/dc3jkijbn/image/upload/v1733468797/neena/logo_psnu1s.png" width="80" style="border-radius: 50%;" alt="Neena Logo" />
            <h1 style="font-weight: bold; color: #333; margin-top: 10px;">Neena</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Dear User,</p>
            <p style="font-size: 16px; color: #333;">Thank you for choosing Neena! Your account activation is almost complete.</p>
            <p style="font-size: 16px; color: #333;">To activate your account, please use the following activation code:</p>
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 24px; font-weight: bold; color: #333; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${code}</p>
            </div>
            <p style="font-size: 16px; color: #333;">Once activated, you can start exploring all the amazing features Neena has to offer!</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">If you did not request this activation code, please ignore this email.</p>
          <p style="font-size: 14px; color: #666;">Best Regards,<br/>Neena Team</p>
        </div>
        `,
    });
  } catch (error) {
    console.error("Error sending registration email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(userEmail, code) {
  try {
    // Configure nodemailer with your email sending service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Neena" <novaegtech@gmail.com>',
      to: userEmail,
      subject: "Password Reset",
      html: `
        <div style="background-color: #f7f7f7; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/dc3jkijbn/image/upload/v1733468797/neena/logo_psnu1s.png" width="80" style="border-radius: 50%;" alt="Neena Logo" />
            <h1 style="font-weight: bold; color: #333; margin-top: 10px;">Neena</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Dear User,</p>
            <p style="font-size: 16px; color: #333;">You've requested a password reset for your Neena account.</p>
            <p style="font-size: 16px; color: #333;">Please use the following code to reset your password:</p>
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 24px; font-weight: bold; color: #333; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${code}</p>
            </div>
            <p style="font-size: 16px; color: #333;">After resetting your password, you can log in to your Neena account.</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't request a password reset, please ignore this email.</p>
          <p style="font-size: 14px; color: #666;">Best Regards,<br/>Neena Team</p>
        </div>
        `,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

export async function sendAccountSuspendedEmail(
  userEmail,
  userName,
  reason,
  suspendedAt,
  suspendedTill
) {
  try {
    // Configure nodemailer with your email sending service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Neena" <novaegtech@gmail.com>',
      to: userEmail,
      subject: "Account Suspension Notice",
      html: `
        <div style="background-color: #f7f7f7; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/dc3jkijbn/image/upload/v1733468797/neena/logo_psnu1s.png" width="80" style="border-radius: 50%;" alt="Neena Logo" />
            <h1 style="font-weight: bold; color: #333; margin-top: 10px;">Neena</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Dear ${userName},</p>
            <p style="font-size: 16px; color: #333;">We regret to inform you that your Neena account has been suspended.</p>
            <p style="font-size: 16px; color: #333;">Reason for suspension: ${reason}</p>
            <p style="font-size: 16px; color: #333;">Suspension started at: ${suspendedAt}</p>
            <p style="font-size: 16px; color: #333;">Suspension ends at: ${suspendedTill}</p>
            <p style="font-size: 16px; color: #333;">Please contact our support team for further assistance.</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">If you believe this suspension is in error, please reach out to us immediately.</p>
          <p style="font-size: 14px; color: #666;">Best Regards,<br/>Neena Team</p>
        </div>
        `,
    });
  } catch (error) {
    console.error("Error sending account suspension email:", error);
    throw error;
  }
}

export async function sendPasswordChangedEmail(userEmail, userName) {
  try {
    // Configure nodemailer with your email sending service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Neena" <novaegtech@gmail.com>',
      to: userEmail,
      subject: "Password Changed",
      html: `
        <div style="background-color: #f7f7f7; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <img src="https://res.cloudinary.com/dc3jkijbn/image/upload/v1733468797/neena/logo_psnu1s.png" width="80" style="border-radius: 50%;" alt="Neena Logo" />
            <h1 style="font-weight: bold; color: #333; margin-top: 10px;">Neena</h1>
          </div>
          <div style="background-color: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Dear ${userName},</p>
            <p style="font-size: 16px; color: #333;">Your password for Neena has been successfully changed.</p>
            <p style="font-size: 16px; color: #333;">If you did not make this change, please contact our support team immediately.</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">For security reasons, we recommend you keep your password confidential and avoid sharing it with anyone.</p>
          <p style="font-size: 14px; color: #666;">Best Regards,<br/>Neena Team</p>
        </div>
        `,
    });
  } catch (error) {
    console.error("Error sending password changed email:", error);
    throw error;
  }
}
