import { NextResponse } from "next/server";
import { readState, evaluateDependencies } from "@/lib/workspace";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("foundero_session")?.value;

    if (!email) {
      return NextResponse.json({ startup_name: "", last_updated: "", steps: {} });
    }

    const state = await readState(email);
    const { steps, alerts } = evaluateDependencies(state.steps);
    return NextResponse.json({ ...state, steps, alerts, session_email: email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
