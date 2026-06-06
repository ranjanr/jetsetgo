import { kv } from "@vercel/kv";

// In-memory fallback for local development (between hot-reloads)
const localOtpMap = new Map<string, { code: string; expiresAt: number }>();

/**
 * Generates a random 6-digit numeric OTP, saves it in KV (or memory) with a 5-minute TTL,
 * and prints it to the console for testing.
 */
export async function generateOTP(email: string): Promise<string> {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const ttlSeconds = 300; // 5 minutes
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const emailLower = email.toLowerCase().trim();
  const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (useKV) {
    try {
      await kv.set(`otp:${emailLower}`, code, { ex: ttlSeconds });
    } catch (error) {
      console.error("Error setting OTP in Vercel KV:", error);
      // Fallback to local map
      localOtpMap.set(emailLower, { code, expiresAt });
    }
  } else {
    localOtpMap.set(emailLower, { code, expiresAt });
  }

  // Log to server console so developers can find it during testing
  console.log(`\n==================================================`);
  console.log(`[OTP VERIFICATION] code for ${emailLower}: ${code}`);
  console.log(`==================================================\n`);

  return code;
}

/**
 * Verifies that the code matches the cached OTP for the email address.
 * Allows "123456" as a universal bypass code in development mode.
 */
export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const emailLower = email.toLowerCase().trim();
  const codeTrimmed = code.trim();

  // Development bypass code
  if (process.env.NODE_ENV === "development" && codeTrimmed === "123456") {
    console.log(`[OTP] Bypass code used for: ${emailLower}`);
    return true;
  }

  const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (useKV) {
    try {
      const storedCode = await kv.get<string>(`otp:${emailLower}`);
      if (storedCode && storedCode === codeTrimmed) {
        // Delete code after successful validation to prevent reuse
        await kv.del(`otp:${emailLower}`);
        return true;
      }
    } catch (error) {
      console.error("Error reading OTP from Vercel KV:", error);
    }
  }

  // Fallback to local map
  const cached = localOtpMap.get(emailLower);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      localOtpMap.delete(emailLower); // Expired
      return false;
    }
    if (cached.code === codeTrimmed) {
      localOtpMap.delete(emailLower); // Delete after single use
      return true;
    }
  }

  return false;
}
