const fs = require("fs");
const path = require("path");

const STATE_FILE_PATH = path.join(process.cwd(), "state.json");
const STEPS_DIR = path.join(process.cwd(), "steps");

function readState() {
  if (fs.existsSync(STATE_FILE_PATH)) {
    return JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf8"));
  }
  return null;
}

const stepFilenames = {
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

const stepPillars = {
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

function writeStepMarkdown(step) {
  const filename = stepFilenames[step.id];
  if (!filename) return;

  const filepath = path.join(STEPS_DIR, filename);
  const pillar = stepPillars[step.id] || "";

  let structuredSection = "*Structured tables, operational schemas, or timeline diagrams will be generated here.*";
  if (step.id === "S1" && step.structured_data?.markets) {
    const rows = step.structured_data.markets.map(m => 
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
    const rows = step.structured_data.features.map(f => 
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

  fs.writeFileSync(filepath, content, "utf8");
}

const state = readState();
if (state) {
  Object.values(state.steps).forEach(writeStepMarkdown);
  console.log("Markdown logs successfully synchronized.");
} else {
  console.log("state.json not found.");
}
