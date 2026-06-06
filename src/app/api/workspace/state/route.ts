import { NextResponse } from "next/server";
import { readState, evaluateDependencies } from "@/lib/workspace";

export async function GET() {
  try {
    const state = await readState();
    const { steps, alerts } = evaluateDependencies(state.steps);
    return NextResponse.json({ ...state, steps, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
