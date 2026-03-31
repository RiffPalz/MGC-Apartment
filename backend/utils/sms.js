import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SEMAPHORE_API = "https://api.semaphore.co/api/v4/messages";
const SENDER_NAME = "MGC Building";

/**
 * Send SMS via Semaphore
 */
export const sendSMS = async (to, body) => {
  if (!to || !body) return;

  // Format number to 63XXXXXXXXXX
  const digits = to.replace(/\D/g, "");
  const number = digits.startsWith("63")
    ? digits
    : `63${digits.replace(/^0/, "")}`;

  try {
    await axios.post(SEMAPHORE_API, {
      apikey: process.env.SEMAPHORE_API_KEY,
      number,
      message: body,
      sendername: SENDER_NAME,
    });
  } catch (err) {
    // Log error without interrupting main flow
    console.error(
      `[SMS] Failed to send to ${number}:`,
      err?.response?.data || err.message
    );
  }
};

/**
 * Send SMS to multiple recipients
 */
export const sendSMSBulk = async (numbers, body) => {
  const unique = [...new Set((numbers || []).filter(Boolean))];
  await Promise.allSettled(unique.map((n) => sendSMS(n, body)));
};