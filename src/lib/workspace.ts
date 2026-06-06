import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";

const STATE_FILE_PATH = path.join(process.cwd(), "state.json");
const STEPS_DIR = path.join(process.cwd(), "steps");

export interface StepData {
  id: string;
  title: string;
  status: "Not Started" | "Draft" | "Verified";
  requires_resync: boolean;
  raw_submission: string;
  critic_alerts: string[];
  structured_data: any;
  synthesized_output: string;
}

export interface WorkspaceState {
  startup_name: string;
  last_updated: string;
  steps: Record<string, StepData>;
}

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

export async function readState(userId: string = "default"): Promise<WorkspaceState> {
  const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const sanitizedId = sanitizeUserId(userId);
  if (useKV) {
    try {
      const state = await kv.get<WorkspaceState>(`state:${sanitizedId}`);
      if (state) {
        return state;
      }
    } catch (error) {
      console.error("Error reading state from Vercel KV:", error);
    }
  }

  try {
    const userStatePath = userId === "default"
      ? STATE_FILE_PATH
      : path.join(process.cwd(), "users", sanitizedId, "state.json");

    if (fs.existsSync(userStatePath)) {
      const data = fs.readFileSync(userStatePath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading state.json:", error);
  }
  if (userId === "default") {
    return { startup_name: "JetSetGo", last_updated: new Date().toISOString(), steps: {} };
  } else {
    return { startup_name: "", last_updated: "", steps: {} };
  }
}

export async function writeState(state: WorkspaceState, userId: string = "default"): Promise<void> {
  state.last_updated = new Date().toISOString();
  const sanitizedId = sanitizeUserId(userId);
  
  const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (useKV) {
    try {
      await kv.set(`state:${sanitizedId}`, state);
      return;
    } catch (error) {
      console.error("Error writing state to Vercel KV:", error);
    }
  }

  try {
    const userDir = userId === "default"
      ? process.cwd()
      : path.join(process.cwd(), "users", sanitizedId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    const userStatePath = path.join(userDir, "state.json");
    fs.writeFileSync(userStatePath, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing state.json:", error);
  }
}

// 🌐 Gemini API Integration Wrapper with Retries and Model Fallbacks
export async function callGemini(
  prompt: string,
  responseJson: boolean = false,
  responseSchema?: any
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined.");
  }

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    let retries = 3;
    let delay = 500; // start with 500ms delay

    while (retries > 0) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: responseJson ? { 
              responseMimeType: "application/json",
              responseSchema: responseSchema || undefined
            } : undefined
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text.trim();
          }
        }

        const errText = await response.text();
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.error?.message || errText;
        } catch (_) {}

        lastError = new Error(`Model ${model} returned code ${response.status}: ${errMsg}`);

        // If it's a non-retryable error (e.g., 400 Bad Request, 403 Forbidden), fail fast to next model
        if (response.status !== 503 && response.status !== 429 && response.status !== 500) {
          break;
        }
      } catch (err: any) {
        lastError = err;
      }

      retries--;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff wait
      }
    }
  }

  throw lastError || new Error("Failed to communicate with Gemini API.");
}

// Heuristic Fallback Analysis (in case API key is missing)
export function runLocalCriticAnalysis(text: string): string[] {
  const alerts: string[] = [];
  if (!text) return alerts;

  const statRegex = /(\b\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T)?|\b\d{4,}\b|CAGR|growth rate|market size)\b/i;
  
  if (statRegex.test(text)) {
    const citationKeywords = /(interview|survey|called|spoke to|user research|validated by|customer feedback|tracking validation|primary source|citation)/i;
    if (!citationKeywords.test(text)) {
      alerts.push("[!! CRITIC ALERT: Unverified Synthetic Metric]");
    }
  }

  const everyoneRegex = /(everyone is my customer|all users|global market|every business|universal appeal|mass market)/i;
  if (everyoneRegex.test(text)) {
    alerts.push("[!! CRITIC ALERT: Mass Market Fallacy] 'Everyone is my customer' declaration detected. Narrow your target segments.");
  }

  return alerts;
}

// Helper utility to safely parse JSON from Gemini's output
function cleanAndParseJSON(jsonStr: string): any {
  let cleaned = jsonStr.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/i, "");
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON.parse failed on text:", jsonStr);
    throw error;
  }
}

// 🧠 Dynamic AI generator for Pillar 1 and general steps
export async function runAIStepAnalysis(
  stepId: string,
  rawSubmission: string,
  productIdea: string,
  currentState: any
): Promise<{ critic_alerts: string[]; structured_data: any; synthesized_output: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return Local Fallback
    const localAlerts = runLocalCriticAnalysis(rawSubmission);
    
    // Auto-generate helper content locally
    const synthText = `### Local Mode Action Plan (No API Key)\n\nBased on your raw inputs, here is your aligned execution strategy:\n\n1. **Validated Core Facts**: Focus on your documented observations and interview answers.\n2. **Immediate Action Steps**:\n   - Review identified critic alerts (if any) and compile missing primary validation.\n   - Proceed to the next step once criteria alignment is locked.\n\n*Heversal local synthesis active. Add GEMINI_API_KEY in .env.local for full AI reasoning.*`;
    
    return {
      critic_alerts: localAlerts,
      structured_data: currentState.structured_data || {},
      synthesized_output: synthText
    };
  }

  // Define response schemas to guarantee valid JSON structure and formatting
  let schema: any = undefined;
  let prompt = "";
  
  const commonInstructions = `
CRITICAL JSON FORMATTING RULES:
1. You MUST return a single, valid JSON object matching the requested schema.
2. To avoid escaping errors, do NOT use double quotes (") inside your "synthesized_output" markdown text. Instead, use single quotes (') or markdown styling (*italics* or **bold**).
3. Do NOT include literal unescaped newlines or tabs inside any JSON string values; write "\\n" for newlines.
`;

  if (stepId === "S1") {
    schema = {
      type: "OBJECT",
      properties: {
        critic_alerts: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        markets: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              funded: { type: "STRING", enum: ["High", "Medium", "Low"] },
              compelling_reason: { type: "STRING", enum: ["High", "Medium", "Low"] },
              value: { type: "INTEGER" }
            },
            required: ["name", "funded", "compelling_reason", "value"]
          }
        },
        synthesized_output: { type: "STRING" }
      },
      required: ["critic_alerts", "markets", "synthesized_output"]
    };

    prompt = `You are the Critic (BATCH_RUN_1), Structure (BATCH_RUN_2), and Synthesizer (BATCH_RUN_3) agents. 
The product concept is "${productIdea}". The entrepreneur submitted these raw market segmentation notes: "${rawSubmission}".

Analyze this:
1. Critic: Spot logical leaps, confirmation bias, or unverified claims. If statistics, growth rates, or sizing are claimed without an interview or survey cited, include "[!! CRITIC ALERT: Unverified Synthetic Metric]". If they claim mass market appeal or "everyone", include "[!! CRITIC ALERT: Mass Market Fallacy]".
2. Structure: Extract target market segments and score them from 1 to 10 on priority.
3. Synthesizer: Output a polished, actionable markdown action plan.
${commonInstructions}`;
  } else if (stepId === "S2") {
    const beachheadName = currentState.steps?.["S1"]?.structured_data?.markets?.[0]?.name || "Beachhead Market";
    schema = {
      type: "OBJECT",
      properties: {
        critic_alerts: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        persona_name: { type: "STRING" },
        role: { type: "STRING" },
        pain_points: { type: "STRING" },
        synthesized_output: { type: "STRING" }
      },
      required: ["critic_alerts", "persona_name", "role", "pain_points", "synthesized_output"]
    };

    prompt = `You are the Critic, Structure, and Synthesizer agents.
Product: "${productIdea}". Beachhead Market: "${beachheadName}". 
Raw persona notes: "${rawSubmission}".

Analyze this:
1. Critic: Spot leaps or unverified assumptions about user habits or demographics.
2. Structure: Extract the persona's name, role, and key pain points.
3. Synthesizer: Provide an actionable persona summary in markdown.
${commonInstructions}`;
  } else if (stepId === "S3") {
    const personaName = currentState.steps?.["S2"]?.structured_data?.persona_name || "Target Persona";
    const personaRole = currentState.steps?.["S2"]?.structured_data?.role || "Target Role";
    schema = {
      type: "OBJECT",
      properties: {
        critic_alerts: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        demographic_size: { type: "INTEGER" },
        conversion_rate: { type: "NUMBER" },
        price_per_unit: { type: "INTEGER" },
        synthesized_output: { type: "STRING" }
      },
      required: ["critic_alerts", "demographic_size", "conversion_rate", "price_per_unit", "synthesized_output"]
    };

    prompt = `You are the Critic, Structure, and Synthesizer agents.
Product: "${productIdea}". Target Persona: "${personaName}" (${personaRole}).
Raw customer validation notes: "${rawSubmission}".

Analyze this:
1. Critic: Check if they spoke to 10 potential customers or cited interview insights. Add unverified metric warnings if necessary.
2. Structure: Extrapolate TAM inputs (Demographic size [integer], conversion rate [float, 0 to 1], and price per contract [integer]).
3. Synthesizer: Provide a customer validation and pricing checklist in markdown.
${commonInstructions}`;
  } else {
    schema = {
      type: "OBJECT",
      properties: {
        critic_alerts: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        structured_data: { type: "OBJECT" },
        synthesized_output: { type: "STRING" }
      },
      required: ["critic_alerts", "structured_data", "synthesized_output"]
    };

    // General steps prompt
    prompt = `You are the Critic, Structure, and Synthesizer agents.
Product Idea: "${productIdea}". Step: "${stepId}".
User raw submission: "${rawSubmission}".

Analyze this:
1. Critic: Spot leaps, unverified claims, or economic fallacies.
2. Structure: Extract relevant key details.
3. Synthesizer: Output a polished, actionable plan in markdown.
${commonInstructions}`;
  }

  try {
    const aiResponse = await callGemini(prompt, true, schema);
    const parsed = cleanAndParseJSON(aiResponse);

    // Schema normalization
    let structured_data: any = {};
    if (stepId === "S1") {
      structured_data = { markets: parsed.markets || [] };
    } else if (stepId === "S2") {
      structured_data = {
        persona_name: parsed.persona_name || "",
        role: parsed.role || "",
        pain_points: parsed.pain_points || ""
      };
    } else if (stepId === "S3") {
      const demographic = Number(parsed.demographic_size) || 0;
      const conversion = Number(parsed.conversion_rate) || 0;
      const price = Number(parsed.price_per_unit) || 0;
      structured_data = {
        demographic_size: demographic,
        conversion_rate: conversion,
        price_per_unit: price,
        calculated_tam: Math.round(demographic * conversion * price)
      };
    } else {
      structured_data = parsed.structured_data || {};
    }

    return {
      critic_alerts: parsed.critic_alerts || [],
      structured_data,
      synthesized_output: parsed.synthesized_output || ""
    };
  } catch (error: any) {
    console.error("Gemini AI generation failed, falling back to local logic:", error);
    const localAlerts = runLocalCriticAnalysis(rawSubmission);
    return {
      critic_alerts: [...localAlerts, `[!! SYSTEM WARNING: AI Generation failed: ${error.message}]`],
      structured_data: currentState.steps?.[stepId]?.structured_data || {},
      synthesized_output: `### Error Fallback Action Plan\n\nAI generation encountered an error: ${error.message}. Review your inputs locally.`
    };
  }
}

// Maps step ID to its markdown file name
const stepFilenames: Record<string, string> = {
  S1: "S1_market_segmentation.md",
  S2: "S2_end_user_profile.md",
  S3: "S3_first_10_customers.md",
  S4: "S4_lifecycle_use_case.md",
  S5: "S5_high_level_spec.md",
  S6: "S6_quantified_value_prop.md",
  S7: "S7_customer_acquisition.md",
  S8: "S8_business_model.md",
  S9: "S9_key_assumptions.md",
  S10: "S10_assumptions_testing.md",
  S11: "S11_mvbp.md",
  S12: "S12_next_markets.md"
};

const stepPillars: Record<string, string> = {
  S1: "Pillar 1: Who Is Your Customer?",
  S2: "Pillar 1: Who Is Your Customer?",
  S3: "Pillar 1: Who Is Your Customer?",
  S4: "Pillar 2: What Can You Do For Your Customer?",
  S5: "Pillar 2: What Can You Do For Your Customer?",
  S6: "Pillar 2: What Can You Do For Your Customer?",
  S7: "Pillar 3: How Does Your Customer Acquire Your Product?",
  S8: "Pillar 4: How Do You Make Money Off Your Product?",
  S9: "Pillar 5: How Do You Design and Build Your Product?",
  S10: "Pillar 5: How Do You Design and Build Your Product?",
  S11: "Pillar 5: How Do You Design and Build Your Product?",
  S12: "Pillar 6: How Do You Scale Your Business?"
};

export async function writeStepMarkdown(step: StepData, userId: string = "default"): Promise<void> {
  const filename = stepFilenames[step.id];
  if (!filename) return;
  const pillar = stepPillars[step.id] || "";

  let structuredSection = "*Structured tables, operational schemas, or timeline diagrams will be generated here.*";
  if (step.id === "S1" && step.structured_data?.markets) {
    const rows = step.structured_data.markets.map((m: any) => 
      `| ${m.name} | ${m.funded} | ${m.compelling_reason} | ${m.value} |`
    ).join("\n");
    structuredSection = `### Beachhead Evaluation Matrix\n\n| Segment | Well-Funded? | Compelling Reason? | Priority Score (1-10) |\n| :--- | :--- | :--- | :---: |\n${rows}`;
  } else if (step.id === "S3" && step.structured_data) {
    const d = step.structured_data;
    structuredSection = `### Top-Down TAM Estimation\n\n| Variable | Value | Description |\n| :--- | :--- | :--- |\n| Target Demographic Size | ${d.demographic_size || 0} | Total potential accounts |\n| Conversion Rate | ${(d.conversion_rate || 0) * 100}% | Expected conversion rate |\n| Price Per Unit / Annual contract | $${d.price_per_unit || 0} | Average value per customer |\n| **Total Addressable Market (TAM)** | **$${d.calculated_tam || 0}** | Estimated TAM (demographic * conversion * price) |`;
  } else if (step.id === "S8" && step.structured_data) {
    const d = step.structured_data;
    structuredSection = `### Life-Time Value (LTV) Spreadsheet\n\n| Variable | Value | Description |\n| :--- | :--- | :--- |\n| Annual Pricing / Unit Price | $${d.annual_price || 0} | Revenue per customer per year |\n| Gross Margin | ${(d.gross_margin || 0) * 100}% | Revenue minus cost of goods sold |\n| Churn Rate | ${(d.churn_rate || 0) * 100}% | Annual rate of customer attrition |\n| **Calculated LTV** | **$${d.calculated_ltv || 0}** | LTV = (Annual Pricing * Gross Margin) / Churn Rate |`;
  } else if (step.id === "S11" && step.structured_data?.features) {
    const rows = step.structured_data.features.map((f: any) => 
      `| ${f.name} | ${f.benefit} | ${f.priority} | $${f.budget} | ${f.sprint} |`
    ).join("\n");
    structuredSection = `### MVBP Roadmap Kanban Grid\n\n| Feature | User Benefit | Priority | Budget ($) | Sprint Timeline |\n| :--- | :--- | :--- | :---: | :--- |\n${rows}`;
  }

  const criticSection = step.critic_alerts.length > 0 
    ? step.critic_alerts.join("\n\n") 
    : "*No alerts active. Assumptions clear.*";

  const content = `# ${step.id}: ${step.title}
**Pillar**: ${pillar}
**Status**: ${step.status}
**Resync Required**: ${step.requires_resync ? "Yes" : "No"}

---

## 📥 Raw Submission
${step.raw_submission || "*No data submitted yet.*"}

---

## 🔍 Critic Agent Evaluation (BATCH_RUN_1)
${criticSection}

---

## 📊 Structured Breakdown (BATCH_RUN_2)
${structuredSection}

---

## 🎯 Synthesized Guide & Plan (BATCH_RUN_3)
${step.synthesized_output || "*A polished, actionable, execution-focused plan will be output here.*"}
`;

  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const sanitizedId = sanitizeUserId(userId);
  if (useBlob) {
    try {
      const blobPath = `users/${sanitizedId}/steps/${filename}`;
      await put(blobPath, content, {
        access: "public",
        addRandomSuffix: false,
      });
      return;
    } catch (error) {
      console.error("Error writing step markdown to Vercel Blob:", error);
    }
  }

  try {
    const userStepsDir = userId === "default"
      ? STEPS_DIR
      : path.join(process.cwd(), "users", sanitizedId, "steps");

    if (!fs.existsSync(userStepsDir)) {
      fs.mkdirSync(userStepsDir, { recursive: true });
    }
    const filepath = path.join(userStepsDir, filename);
    fs.writeFileSync(filepath, content, "utf8");
  } catch (error) {
    console.error("Error writing step markdown file locally:", error);
  }
}

export function evaluateDependencies(steps: Record<string, StepData>): { steps: Record<string, StepData>; alerts: { stepId: string; type: string; message: string }[] } {
  const alerts: { stepId: string; type: string; message: string }[] = [];

  const s1Active = steps["S1"]?.status !== "Not Started";
  const s4Active = steps["S4"]?.status !== "Not Started";
  const s11Active = steps["S11"]?.status !== "Not Started";

  if (s1Active) {
    if (steps["S2"]?.status === "Not Started") {
      alerts.push({
        stepId: "S3",
        type: "warning",
        message: "Soft-Dependency Alert: Step 2 Persona has not been defined yet. Ensure customer alignment before targeting first 10 accounts."
      });
    }
  }

  if (s4Active) {
    const s5Empty = steps["S5"]?.status === "Not Started" || !steps["S5"]?.raw_submission;
    if (s5Empty) {
      alerts.push({
        stepId: "S6",
        type: "warning",
        message: "Soft-Dependency Alert: Step 5 (High-Level Spec) details are empty. Quantified value prop might lack product spec backing."
      });
    }
  }

  if (s11Active) {
    const unverifiedParents = Object.keys(steps).filter(
      key => key !== "S12" && steps[key].status !== "Verified"
    );
    if (unverifiedParents.length > 0) {
      alerts.push({
        stepId: "S12",
        type: "warning",
        message: `Soft-Dependency Alert: The following parent steps have not been explicitly verified: ${unverifiedParents.join(", ")}.`
      });
    }
  }

  return { steps, alerts };
}
