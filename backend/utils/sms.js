import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SEMAPHORE_API = "https://api.semaphore.co/api/v4/messages";
const SENDER_NAME = "capstoneweb";

/**
 * Sends a single SMS with automatic number formatting
 */
export const sendSMS = async (to, body) => {
  if (!to || !body) return;

  // Ensure number format is 63XXXXXXXXXX
  const digits = to.replace(/\D/g, "");
  const number = digits.startsWith("63")
    ? digits
    : `63${digits.replace(/^0/, "")}`;

  try {
    await axios.post(
      SEMAPHORE_API,
      {
        apikey: process.env.SEMAPHORE_API_KEY,
        number,
        message: body,
        sendername: SENDER_NAME,
      },
      { timeout: 8000 } // Stop waiting after 8 seconds
    );
  } catch (err) {
    console.error(`[SMS Error] ${number}:`, err?.response?.data || err.message);
  }
};

/**
 * Sends SMS to a list of numbers in small batches to avoid delays
 */
export const sendSMSBulk = async (numbers, body) => {
  if (!numbers?.length) return;

  const unique = [...new Set(numbers.filter(Boolean))];
  const BATCH_SIZE = 5;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);

    // Send current batch simultaneously
    await Promise.allSettled(batch.map((n) => sendSMS(n, body)));

    // Brief pause to prevent API/Carrier throttling
    if (i + BATCH_SIZE < unique.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
};