import { NextResponse } from "next/server";
import { readUserCredentials, hashPassword } from "@/lib/workspace";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const creds = await readUserCredentials(emailLower);
    
    if (!creds) {
      return NextResponse.json({ error: "Invalid email address or password." }, { status: 401 });
    }

    const hashedInput = hashPassword(password);
    if (creds.passwordHash !== hashedInput) {
      return NextResponse.json({ error: "Invalid email address or password." }, { status: 401 });
    }

    // Set secure HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set("foundero_session", emailLower, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, message: "Logged in successfully." });
  } catch (error: any) {
    console.error("Error in login route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
