import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const isValid = await verifyOTP(email, code);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 401 });
    }

    // Set secure HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set("foundero_session", email.toLowerCase().trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, message: "Session verified and logged in." });
  } catch (error: any) {
    console.error("Error in verify-otp route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
