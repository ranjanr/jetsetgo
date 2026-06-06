import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readState, writeState, writeStepMarkdown, evaluateDependencies } from "@/lib/workspace";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("foundero_session")?.value;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const state = await readState(email);

    // Reset requires_resync flags for S2, S3, S4, S6 as we sync the state
    await Promise.all(["S2", "S3", "S4", "S6"].map(async (key) => {
      if (state.steps[key]) {
        state.steps[key].requires_resync = false;
        await writeStepMarkdown(state.steps[key], email);
      }
    }));

    await writeState(state, email);

    const { steps, alerts } = evaluateDependencies(state.steps);
    return NextResponse.json({ ...state, steps, alerts, message: "Workspace alignment synchronized successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
