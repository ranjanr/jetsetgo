import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readState, writeState, runAIStepAnalysis, writeStepMarkdown, evaluateDependencies } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("foundero_session")?.value;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const { stepId, raw_submission, status, structured_data } = body;

    if (!stepId) {
      return NextResponse.json({ error: "stepId is required" }, { status: 400 });
    }

    const state = await readState(email);
    const step = state.steps[stepId];
    if (!step) {
      return NextResponse.json({ error: `Step ${stepId} not found` }, { status: 404 });
    }

    if (raw_submission !== undefined) {
      step.raw_submission = raw_submission;
      
      // Extract startup context or beachhead description
      const productIdea = state.steps["S1"]?.raw_submission || state.startup_name || "a startup";
      
      // Run Gemini AI Multi-Agent analysis (Critic, Structure, Synthesizer)
      const aiResults = await runAIStepAnalysis(
        stepId,
        raw_submission,
        productIdea,
        state
      );

      step.critic_alerts = aiResults.critic_alerts;
      // Only set structured data if it was returned and not empty
      if (Object.keys(aiResults.structured_data).length > 0) {
        step.structured_data = aiResults.structured_data;
      }
      step.synthesized_output = aiResults.synthesized_output;
    }

    if (status !== undefined) {
      step.status = status;
    } else if (step.status === "Not Started" && (raw_submission || structured_data)) {
      step.status = "Draft";
    }

    if (structured_data !== undefined) {
      // Re-calculate formula-driven fields on save for safety
      if (stepId === "S3") {
        const d = structured_data;
        const demographic = Number(d.demographic_size) || 0;
        const conversion = Number(d.conversion_rate) || 0;
        const price = Number(d.price_per_unit) || 0;
        structured_data.calculated_tam = Math.round(demographic * conversion * price);
      } else if (stepId === "S8") {
        const d = structured_data;
        const price = Number(d.annual_price) || 0;
        const margin = Number(d.gross_margin) || 0;
        const churn = Number(d.churn_rate) || 0.1; // avoid divide by zero
        structured_data.calculated_ltv = Math.round((price * margin) / churn);
      }
      step.structured_data = structured_data;
    }

    // Flag downstream steps if S1 is modified
    if (stepId === "S1") {
      await Promise.all(["S2", "S3", "S4", "S6"].map(async (key) => {
        if (state.steps[key]) {
          state.steps[key].requires_resync = true;
          await writeStepMarkdown(state.steps[key], email);
        }
      }));
    }

    // Write markdown log
    await writeStepMarkdown(step, email);

    // Save master state
    await writeState(state, email);

    const { steps, alerts } = evaluateDependencies(state.steps);
    return NextResponse.json({ ...state, steps, alerts });
  } catch (error: any) {
    console.error("Update step failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
