import Razorpay from "razorpay";
import { prisma } from "./database";

// Provided Razorpay API credentials
const fallback_key_id = process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_KEY_ID || "rzp_test_TflwpulcLtIS0O";
const fallback_key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || "ZdnzwpP946i4HxScAhg6VdCc";

export const getRazorpayConfig = async () => {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });
    
    const key_id = (settings?.razorpayKeyId && settings.razorpayKeyId.trim()) ? settings.razorpayKeyId.trim() : fallback_key_id;
    const key_secret = (settings?.razorpayKeySecret && settings.razorpayKeySecret.trim()) ? settings.razorpayKeySecret.trim() : fallback_key_secret;
    
    return { key_id, key_secret };
  } catch (error) {
    console.error("Failed to fetch Razorpay config from DB, using fallback", error);
    return { key_id: fallback_key_id, key_secret: fallback_key_secret };
  }
};

export const getRazorpayInstance = async () => {
  const { key_id, key_secret } = await getRazorpayConfig();
  return new Razorpay({
    key_id,
    key_secret,
  });
};

export const getRazorpayKeyId = async (): Promise<string> => {
  const { key_id } = await getRazorpayConfig();
  return key_id;
};

export const getRazorpayKeySecret = async (): Promise<string> => {
  const { key_secret } = await getRazorpayConfig();
  return key_secret;
};

export const getRazorpayWebhookSecret = (): string =>
  process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || "";
