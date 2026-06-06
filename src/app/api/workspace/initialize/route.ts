import { NextResponse } from "next/server";
import { writeState, writeStepMarkdown, evaluateDependencies, StepData } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startup_name, product_idea, email, name } = body;

    if (!startup_name || !product_idea) {
      return NextResponse.json({ error: "startup_name and product_idea are required" }, { status: 400 });
    }

    const isGlassCleaner = product_idea.toLowerCase().includes("glass") || product_idea.toLowerCase().includes("eyeglass");

    // Tailor the default data sets based on product idea
    const markets = isGlassCleaner ? [
      { name: "Retail Optician Boutiques", funded: "High", compelling_reason: "High", value: 9 },
      { name: "Everyday Prescription Glasses Wearers", funded: "Medium", compelling_reason: "High", value: 7 },
      { name: "Luxury Sunglasses Collectors", funded: "High", compelling_reason: "Medium", value: 8 }
    ] : [
      { name: "B2B Early Adopters", funded: "High", compelling_reason: "High", value: 8 },
      { name: "Tech-Savvy Consumer Segment", funded: "Medium", compelling_reason: "Medium", value: 6 },
      { name: "Enterprise Custom Clients", funded: "High", compelling_reason: "Low", value: 5 }
    ];

    const persona = isGlassCleaner ? {
      persona_name: "Sarah Jenkins",
      role: "Boutique Optician / Storefront Owner",
      pain_points: `Wants an instant, reliable, high-end eyeglasses cleaning device to sanitize custom acetate frames for customers on-the-spot during sizing consultations.`
    } : {
      persona_name: "Marcus Vance",
      role: "Operations Manager",
      pain_points: `Needs a simple, automated tool to bypass manual spreadsheets and reduce operational friction.`
    };

    const tam = isGlassCleaner ? {
      demographic_size: 15000,
      conversion_rate: 0.04,
      price_per_unit: 450,
      calculated_tam: 270000
    } : {
      demographic_size: 5000,
      conversion_rate: 0.05,
      price_per_unit: 1200,
      calculated_tam: 300000
    };

    const lifecycle = isGlassCleaner ? [
      "Discovery via optical trade shows",
      "Trial order for retail counter display",
      "Cleaning frames in front of walk-in customers",
      "Increasing walk-in trust and cleaning kit bundle sales",
      "Ordering wholesale bulk refills"
    ] : [
      "Online search discovery",
      "Self-serve sandbox onboarding",
      "Department pilot rollout",
      "Full annual contract subscription renewal"
    ];

    const spec = isGlassCleaner ? [
      { name: "40kHz Ultrasonic Tank Chamber", platform: "Hardware", complexity: "Medium" },
      { name: "UV-C Sterilization Sanitizer Module", platform: "Hardware", complexity: "Low" }
    ] : [
      { name: "Core Web Control Center Dashboard", platform: "Cloud Software", complexity: "Low" },
      { name: "Third-party CRM Integration API", platform: "Software Integration", complexity: "Medium" }
    ];

    const valueProp = isGlassCleaner ? [
      { benefit: "Increases storefront walk-in conversions by 15% and increases customer spend.", monetary_value: 12000 }
    ] : [
      { benefit: "Saves operators 4 hours/week in manual bookkeeping and reporting tasks.", monetary_value: 3600 }
    ];

    const ltv = isGlassCleaner ? {
      annual_price: 450,
      gross_margin: 0.75,
      churn_rate: 0.15,
      calculated_ltv: 2250
    } : {
      annual_price: 1200,
      gross_margin: 0.85,
      churn_rate: 0.10,
      calculated_ltv: 10200
    };

    const features = isGlassCleaner ? [
      { id: 1, name: "40kHz Transducer Core", benefit: "Lifts oil, fingerprints, and grit in 90 seconds", priority: "High", budget: 15000, sprint: "Sprint 1" },
      { id: 2, name: "UV-C Lid Sanitizer", benefit: "Kills surface bacteria on hinges during clean", priority: "Medium", budget: 8000, sprint: "Sprint 2" }
    ] : [
      { id: 1, name: "User Auth & Profile Setup", benefit: "Secure team invite workspace login", priority: "High", budget: 6000, sprint: "Sprint 1" },
      { id: 2, name: "Export API Engine", benefit: "Pulls formatted CSV matrices instantly", priority: "Medium", budget: 4500, sprint: "Sprint 2" }
    ];

    const rawSubmissions = {
      S1: `We mapped out three main market sectors for ${product_idea}. Our beachhead choice is ${markets[0].name} because they have immediate budgets and high buyer intent.`,
      S2: `${persona.persona_name} matches our exact end-user target. She is a ${persona.role} with the pain point: "${persona.pain_points}"`,
      S3: `Primary market validation sizing based on targeting ${tam.demographic_size} total prospects, assuming a conservative ${tam.conversion_rate * 100}% conversion at a $${tam.price_per_unit} unit price point.`,
      S4: `Full lifeycle use case maps across: ${lifecycle.join(" -> ")}.`,
      S5: `High-level specs for our MVP include: ${spec.map(s => `${s.name} (${s.platform})`).join(", ")}.`,
      S6: `Quantified Value Proposition: Our core benefit is "${valueProp[0].benefit}", resulting in an estimated $${valueProp[0].monetary_value}/year savings/value.`,
      S7: `We will acquire customers using primary founder sales outreach and industry-specific association partnerships.`,
      S8: `Pricing matrix: Annual unit contract value of $${ltv.annual_price} with ${ltv.gross_margin * 100}% margins and ${ltv.churn_rate * 100}% churn.`,
      S9: `Key assumptions to test: 1. Target customers have high budget intent. 2. Ultrasonic cleaning time under 2 mins is acceptable.`,
      S10: `We will test these assumptions using 10 face-to-face demo prototypes and landing page sign-up conversion metrics.`,
      S11: `Our Minimum Viable Business Product will feature a simple version of: ${features.map(f => f.name).join(", ")}.`,
      S12: `Once beachhead is secure, we will leverage optical chain distributors to expand.`
    };

    const steps: Record<string, StepData> = {
      S1: {
        id: "S1",
        title: "Market Segmentation & Beachhead Selection",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S1,
        critic_alerts: [],
        structured_data: { markets },
        synthesized_output: `### Synthesized Market Selection Strategy\n\nYour beachhead market is **${markets[0].name}**. This segment is well-funded (${markets[0].funded}) and exhibits high buy intent. Follow up by executing direct buyer interviews to confirm decision-maker timelines.`
      },
      S2: {
        id: "S2",
        title: "The End-User Profile & Persona",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S2,
        critic_alerts: [],
        structured_data: persona,
        synthesized_output: `### End-User Profile Overview\n\nTarget persona **${persona.persona_name}** represents the typical decision-maker. Pain point: *${persona.pain_points}*. Direct outreach campaigns must address this pain point explicitly.`
      },
      S3: {
        id: "S3",
        title: "The First 10 Customers",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S3,
        critic_alerts: [],
        structured_data: tam,
        synthesized_output: `### TAM Sizing Overview\n\nYour beachhead TAM is estimated at **$${tam.calculated_tam.toLocaleString()}** annually. Focus on securing your first 10 reference customers to validate this conversion index.`
      },
      S4: {
        id: "S4",
        title: "Full Life Cycle Use Case",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S4,
        critic_alerts: [],
        structured_data: { lifecycle_phases: lifecycle },
        synthesized_output: `### Customer Lifecycle Plan\n\n1. **Acquisition**: ${lifecycle[0]}.\n2. **Engagement**: ${lifecycle[2]}.\n3. **Monetization**: ${lifecycle[lifecycle.length - 1]}.`
      },
      S5: {
        id: "S5",
        title: "High-Level Product Specification",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S5,
        critic_alerts: [],
        structured_data: { specifications: spec },
        synthesized_output: `### High-Level Product Specifications\n\nYour primary product deliverables are: ${spec.map(s => `${s.name} (${s.platform})`).join(", ")}.`
      },
      S6: {
        id: "S6",
        title: "Quantified Value Proposition",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S6,
        critic_alerts: [],
        structured_data: { value_props: valueProp },
        synthesized_output: `### Quantified Value Proposition\n\nYour product creates **$${valueProp[0].monetary_value}/year** in economic value. Focus your sales pitch deck around this primary return on investment.`
      },
      S7: {
        id: "S7",
        title: "Customer Acquisition & Decision-Making Unit",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S7,
        critic_alerts: [],
        structured_data: {},
        synthesized_output: ""
      },
      S8: {
        id: "S8",
        title: "Business Model & Pricing Framework",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S8,
        critic_alerts: [],
        structured_data: ltv,
        synthesized_output: `### Unit Economics Sizing\n\nCalculated Life-Time Value is **$${ltv.calculated_ltv.toLocaleString()}** based on annual billing pricing of $${ltv.annual_price}. Aim for LTV/CAC ratio > 3:1.`
      },
      S9: {
        id: "S9",
        title: "Key Assumptions Identification",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S9,
        critic_alerts: [],
        structured_data: {},
        synthesized_output: ""
      },
      S10: {
        id: "S10",
        title: "Key Assumptions Testing",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S10,
        critic_alerts: [],
        structured_data: {},
        synthesized_output: ""
      },
      S11: {
        id: "S11",
        title: "Minimum Viable Business Product (MVBP)",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S11,
        critic_alerts: [],
        structured_data: { features },
        synthesized_output: `### MVBP Production Roadmap\n\nFeatures roadmap contains ${features.length} core features. Main feature is **${features[0].name}** targeting **${features[0].sprint}**.`
      },
      S12: {
        id: "S12",
        title: "Next Markets & Pitch Readiness",
        status: "Draft",
        requires_resync: false,
        raw_submission: rawSubmissions.S12,
        critic_alerts: [],
        structured_data: {},
        synthesized_output: ""
      }
    };

    const stateObj = {
      startup_name,
      last_updated: new Date().toISOString(),
      steps
    };

    // Save state.json
    await writeState(stateObj);

    // Sync all step markdown files in steps/
    await Promise.all(Object.values(steps).map(step => writeStepMarkdown(step)));

    const { steps: finalSteps, alerts } = evaluateDependencies(stateObj.steps);
    return NextResponse.json({ ...stateObj, steps: finalSteps, alerts, message: `Successfully initialized ${startup_name} with product idea context!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
