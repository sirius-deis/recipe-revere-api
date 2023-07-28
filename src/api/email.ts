import nodemailer from 'nodemailer';
import ejs from 'ejs';
import htmlToText from 'html-to-text';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

const __dirname = dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

try {
  transporter.verify();
} catch (error) {
  throw error;
}

const sendEmail = async (
  to: string,
  subject: string,
  template: string,
  context: { title: string; firstName?: string; link: string },
) => {
  const rendered = await ejs.renderFile(`${__dirname}/templates/${template}.ejs`, {
    ...context,
    homeLink: '',
    logo: '',
    from: 'RecipeRevere Team',
  });

  const options = {
    from: `< RecipeRevere Team ${EMAIL_USER}>`,
    to,
    subject,
    html: rendered,
    text: htmlToText.convert(rendered),
  };

  try {
    await transporter.sendMail(options);
  } catch (error) {
    throw error;
  }
};

export default sendEmail;
