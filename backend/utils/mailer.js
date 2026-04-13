import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API);
const FROM_ADDRESS = `MGC Building <${process.env.RESEND_FROM_EMAIL}>`;

export const sendMail = async ({ to, subject, html, attachments }) => {
  const payload = {
    from: FROM_ADDRESS,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  if (attachments?.length) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content ?? a.path,
    }));
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) throw new Error(`Resend error: ${error.message}`);

  return data;
};
