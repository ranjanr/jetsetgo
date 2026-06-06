import { NextResponse } from "next/server";
import { readState, writeState, writeStepMarkdown, evaluateDependencies } from "@/lib/workspace";

export async function POST() {
  try {
    const state = await readState();

    // Reset requires_resync flags for S2, S3, S4, S6 as we sync the state
    await Promise.all(["S2", "S3", "S4", "S6"].map(async (key) => {
      if (state.steps[key]) {
        state.steps[key].requires_resync = false;
        await writeStepMarkdown(state.steps[key]);
      }
    }));

    await writeState(state);

    const { steps, alerts } = evaluateDependencies(state.steps);
    return NextResponse.json({ ...state, steps, alerts, message: "Workspace alignment synchronized successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
