// /utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mailhog',
  port: 1025,
  secure: false,
});

/**
 * Send an email with both text and HTML content
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text version of the email
 * @param {string} [html] - HTML version of the email (optional)
 * @returns {Promise} - Result of the sendMail operation
 */
export async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: '"HealthApp" <no-reply@healthapp.local>',
    to,
    subject,
    text,
    ...(html && { html }), // Only include html if provided
  };

  console.log('Sending email:', { to, subject, hasHtml: !!html });
  
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
