import nodemailer from 'nodemailer';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  const options = { from: `< Recipe Revere team ${EMAIL_USER}>`, to, subject, text, html };

  try {
    await transporter.sendMail(options);
  } catch (error) {
    throw error;
  }
};

export default sendEmail;
