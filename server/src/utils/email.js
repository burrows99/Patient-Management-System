// /utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mailhog',
  port: 1025,
  secure: false,
});

export async function sendEmail(to, subject, text) {
  return await transporter.sendMail({
    from: '"HealthApp" <no-reply@healthapp.local>',
    to,
    subject,
    text,
  });
}
