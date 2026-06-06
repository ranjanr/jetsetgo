import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("foundero_session");
    return NextResponse.json({ success: true, message: "Signed out successfully." });
  } catch (error: any) {
    console.error("Error in sign-out route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
