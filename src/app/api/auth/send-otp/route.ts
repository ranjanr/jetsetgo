import { NextResponse } from "next/server";
import { generateOTP } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const code = await generateOTP(email);
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json({
      success: true,
      message: "Verification code generated and sent.",
      ...(isDev ? { debugCode: code } : {})
    });
  } catch (error: any) {
    console.error("Error in send-otp route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
