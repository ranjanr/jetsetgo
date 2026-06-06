import { NextResponse } from "next/server";
import { writeState, writeStepMarkdown, evaluateDependencies, StepData } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startup_name, product_idea, email, name, demoType } = body;

    // Handle high-fidelity demo venture initializations
    if (demoType === "sonicsight") {
      const demoSteps: Record<string, StepData> = {
        S1: {
          id: "S1",
          title: "Market Segmentation & Beachhead Selection",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We started by looking at all eyeglasses wearers, but decided to narrow down our beachhead.\n\nSelected Beachhead Segment: Remote WFH Knowledge Workers who wear premium, high-index prescription or blue-light glasses. They get frustrated with smudged lenses on endless video calls, have high disposable income, and value home office aesthetics.\n\nOther segments considered:\n- Elderly prescription wearers: Hard to reach online, lower purchasing velocity.\n- Industrial safety glasses wearers: Purchase decisions made by corporate procurement departments, very long sales cycles.",
          critic_alerts: [],
          structured_data: {
            markets: [
              { name: "Remote WFH Knowledge Workers", funded: "High", compelling_reason: "High", value: 9 },
              { name: "Elderly Prescription Wearers", funded: "Medium", compelling_reason: "Medium", value: 5 },
              { name: "Industrial Safety Glass Wearers", funded: "High", compelling_reason: "Low", value: 4 }
            ]
          },
          synthesized_output: "### S1: Beachhead Segmentation Summary (SonicSight)\n\nWe have narrowed down the beachhead to **Remote WFH Knowledge Workers** who wear premium lenses. This represents an attractive, high-margin niche with clear pain points (camera smudges) and immediate purchasing authority."
        },
        S2: {
          id: "S2",
          title: "The End-User Profile & Persona",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Our persona is Sarah Jenkins, a 34-year-old remote Software Product Manager living in Seattle.\n- She wears high-index prescription eyeglasses with blue-light coating.\n- She spends 8-10 hours a day in front of screens and on Zoom calls.\n- She is highly frustrated by lint, face oil, and smudges on her glasses that blur her vision during video presentations. She cleans them 4-5 times a day using shirts or tissues, which scratch the expensive coatings.\n- She values clean minimalist desk aesthetics (buys Grovemade accessories).",
          critic_alerts: [],
          structured_data: {
            persona_name: "Sarah Jenkins",
            role: "Remote Software Product Manager",
            pain_points: "Lint, face oil, and screen glare smudges on premium lenses; accidental scratches from dry clothing wipe-downs."
          },
          synthesized_output: "### S2: Persona Profile (Sarah Jenkins)\n\nSarah represents the premium WFH demographic. She values screen clarity and office design aesthetics. Our product must be compact, USB-C powered, and look beautiful on a walnut desk."
        },
        S3: {
          id: "S3",
          title: "The First 10 Customers",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We identified and interviewed 10 WFH remote workers in our network matching Sarah's profile. All 10 confirmed they clean their glasses multiple times a day and 8 of them expressed interest in an aesthetic automatic desktop box.\n\nWe estimate the total target demographic size at 350,000 workers in premium brackets. We assume a conservative 2% annual conversion rate, and set the retail price at $69.",
          critic_alerts: [],
          structured_data: {
            demographic_size: 350000,
            conversion_rate: 0.02,
            price_per_unit: 69,
            calculated_tam: 483000
          },
          synthesized_output: "### S3: TAM Sizing & Validation\n\nWith a bottom-up price of $69 and a 2% penetration rate among WFH knowledge workers, the beachhead TAM is estimated at **$483,000/year**."
        },
        S4: {
          id: "S4",
          title: "Full Life Cycle Use Case",
          status: "Verified",
          requires_resync: false,
          raw_submission: "1. **Discovery**: Sarah sees a clean-desk setup video on Instagram showing a sleek desktop box cleaning glasses.\n2. **Purchase**: Buys online via Shopify for $69.\n3. **Delivery/Setup**: Arrives in plastic-free packaging, plugs in via USB-C.\n4. **Use Case**: She drops her glasses in the box during her morning coffee break. Safe automated UV-C and gentle 45kHz sonic waves clean them in 90 seconds. She pulls them out clean and dry, ready for her next Zoom meeting.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S4: Daily Coffee-Break Cleaning Loop\n\nBy mapping the daily use case to a morning coffee break, we minimize adoption friction. The unit runs silently and plugs into standard desk docks."
        },
        S5: {
          id: "S5",
          title: "High-Level Product Specification",
          status: "Verified",
          requires_resync: false,
          raw_submission: "An aesthetic, desktop ultrasonic cleaning box.\n- Dimensions: 18cm x 9cm x 7cm (compact footprint).\n- Styling: Matte aluminum base with a walnut lid to match premium desk accessories.\n- Power: USB-C input (5V, 2A).\n- Transducers: Dual 45kHz piezoceramic ultrasonic transducers.\n- Safety: Automated shut-off lid sensor to prevent UV-C exposure when open.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S5: Physical Specifications Matrix\n\n- Dual 45kHz transducers for scratch-free cleaning.\n- USB-C Powered for clean cable management.\n- Matte aluminum / wood-grain premium finish."
        },
        S6: {
          id: "S6",
          title: "Quantified Value Proposition",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Our core benefit is time savings and lens preservation:\n- Prevents expensive scratches on high-index custom lenses (replacement cost of $200+).\n- Saves 5-10 minutes a day of lens-rubbing frustration.\n- Increases productivity and visual comfort during WFH screens usage.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S6: Quantified Value Proposition\n\nPreserving expensive lens coatings ($200+ replacement cost) against dry-wipe micro-scratches represents a direct, high-value ROI compared to manual wipes."
        },
        S7: {
          id: "S7",
          title: "Customer Acquisition & DMU",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We will target remote workers directly using visually engaging setup aesthetics videos on Pinterest and Instagram. The decision maker is the individual consumer (Sarah).",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S7: Direct Consumer Acquisition\n\nD2C e-commerce model where visual setup marketing drives immediate conversion without corporate gatekeepers."
        },
        S8: {
          id: "S8",
          title: "Business Model & Pricing Framework",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We sell direct-to-consumer (D2C) via e-commerce.\nUnit Price: $69.\nBill of Materials (BOM) & Manufacturing cost: $18.\nGross Margin: 74% ($51 profit per unit).\n\nSince it is a hardware product, we calculate LTV based on repeat lens wipes/cleansing fluid cartridge refills.\nAnnual cartridge refill: $25.\nRefill gross margin: 80% ($20 profit).\nAnnual cartridge churn rate: 15%.",
          critic_alerts: [],
          structured_data: {
            annual_price: 25,
            gross_margin: 0.8,
            churn_rate: 0.15,
            calculated_ltv: 133
          },
          synthesized_output: "### S8: Hardware Refill Economics\n\nSelling the initial box D2C yields $51 gross profit. Coupled with recurring cleaning cartridges ($25/year, 15% churn), the estimated Customer Lifetime Value is **$133**."
        },
        S9: {
          id: "S9",
          title: "Key Assumptions Identification",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We identified the top leap-of-faith assumptions for SonicSight:\n1. WFH workers care enough about desk aesthetics to pay $69 for a cleaning box.\n2. WFH workers will place a cleaning device on their office desks rather than keep it in the bathroom.\n3. The off-the-shelf piezoceramic transducers can clean face oil effectively without complex heating elements.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S9: Hardware Leap-of-Faith Assumptions\n\nOur primary risk is location and design: Will people place this prominently on their desk? The design must look extremely premium."
        },
        S10: {
          id: "S10",
          title: "Key Assumptions Testing",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We built 3 high-fidelity aesthetic prototypes (wood top + aluminum case) and placed them on early adopters' desks for 2 weeks. All 3 users kept them on their desks rather than relocating them. 2 adjacent coworkers asked where to buy it, validating visual desk interest.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S10: Location & Usability Test Results\n\nProto placements prove that premium desktop styling changes user behavior, shifting a bathroom utility to a home-office desk accessory."
        },
        S11: {
          id: "S11",
          title: "Minimum Viable Business Product (MVBP)",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Our MVBP will test value delivery and willingness to pay before full injection mold tooling.\nWe will assemble 15 prototype units using off-the-shelf 45kHz ultrasonic components housed inside a 3D-printed enclosure styled to look premium. We will sell these units to 10 early WFH customers for $69 to validate that they will actually pay and place it on their desks.",
          critic_alerts: [],
          structured_data: {
            features: [
              { id: 1, name: "45kHz Sonic Cleaning", benefit: "Scratch-free dirt release", priority: "High", budget: 1200, sprint: "Sprint 1" },
              { id: 2, name: "Premium Walnut Lid", benefit: "Office desk visual matching", priority: "Medium", budget: 600, sprint: "Sprint 2" },
              { id: 3, name: "USB-C Power Port", benefit: "Standard cable support", priority: "High", budget: 400, sprint: "Sprint 1" }
            ]
          },
          synthesized_output: "### S11: Hardware Prototype Sprint\n\nThe MVBP focuses on the core sonic functionality and USB-C powering inside a mock-up walnut case to test willingness-to-pay."
        },
        S12: {
          id: "S12",
          title: "Next Markets & Pitch Readiness",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Adjacent markets: Premium mechanical watch collectors (metal bracelet cleaning), audiophiles (in-ear monitor/hearing-aid cleaning). Pitch deck features visual prototyping stats and user retention counts.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S12: Scale Strategy\n\nExpansion to watch bracelet cleaning represents an adjacent $200M enthusiast market that values the exact same ultrasonic transducers."
        }
      };

      const stateObj = {
        startup_name: "SonicSight",
        last_updated: new Date().toISOString(),
        steps: demoSteps
      };

      await writeState(stateObj);
      await Promise.all(Object.values(demoSteps).map(step => writeStepMarkdown(step)));
      const { steps: finalSteps, alerts } = evaluateDependencies(stateObj.steps);
      return NextResponse.json({ ...stateObj, steps: finalSteps, alerts, message: "Successfully loaded SonicSight Hardware Demo Venture!" });
    }

    if (demoType === "flowpilot") {
      const demoSteps: Record<string, StepData> = {
        S1: {
          id: "S1",
          title: "Market Segmentation & Beachhead Selection",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We evaluated several trades segments (plumbers, electricians, HVAC).\n\nSelected Beachhead Segment: Solo independent residential plumbers. They are frequently stuck under sinks or driving, meaning they miss emergency calls (which represents lost jobs).\n\nOther segments considered:\n- Commercial HVAC technicians: Long service contracts, complex corporate billing.\n- Residential electricians: Lower emergency call frequency compared to plumbers.",
          critic_alerts: [],
          structured_data: {
            markets: [
              { name: "Solo Residential Plumbers", funded: "High", compelling_reason: "High", value: 10 },
              { name: "Residential Electricians", funded: "Medium", compelling_reason: "Medium", value: 6 },
              { name: "Commercial HVAC Contractors", funded: "High", compelling_reason: "Low", value: 5 }
            ]
          },
          synthesized_output: "### S1: Beachhead Selection Summary\n\nSolo residential plumbers are the ideal beachhead due to the immediate financial penalty of missed calls (which immediately route to competitors)."
        },
        S2: {
          id: "S2",
          title: "The End-User Profile & Persona",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Our persona is Bob Miller, a 45-year-old solo plumber running Miller Plumbing in Ohio.\n- He does residential service calls (emergency leaks, water heater swaps).\n- He spends 6-8 hours a day driving or crawling under sinks.\n- Top pain point: Missing emergency calls while working. When a homeowner's basement is flooding, they call 3-4 plumbers. The first one who answers gets the $300 job. Bob misses 3-4 calls a week, costing him over $1,000 in lost work.",
          critic_alerts: [],
          structured_data: {
            persona_name: "Bob Miller",
            role: "Solo Residential Plumber",
            pain_points: "Missed emergency calls when physically working under sinks, resulting in lost $300 jobs to competitors."
          },
          synthesized_output: "### S2: Persona Analysis (Bob Miller)\n\nBob needs a voice assistant that can answer instantly, quote basic prices (e.g. water heater diagnostic for $150), and book calendar slots directly."
        },
        S3: {
          id: "S3",
          title: "The First 10 Customers",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We cold-called and met with 12 solo plumbers in our local county. 10 of them confirmed that unanswered calls are their biggest source of lost revenue, and 7 agreed to try a voice co-pilot trial.\n\nWe estimate there are 110,000 solo plumbers nationally. Our target conversion is 5% with a software SaaS subscription of $150/month ($1,800/year).",
          critic_alerts: [],
          structured_data: {
            demographic_size: 110000,
            conversion_rate: 0.05,
            price_per_unit: 1800,
            calculated_tam: 9900000
          },
          synthesized_output: "### S3: B2B SaaS TAM Sizing\n\nWith 110,000 target solo plumbers, 5% penetration at $1,800/year yields a bottom-up TAM estimate of **$9,900,000/year**."
        },
        S4: {
          id: "S4",
          title: "Full Life Cycle Use Case",
          status: "Verified",
          requires_resync: false,
          raw_submission: "1. Homeowner calls Bob's plumbing number.\n2. FlowPilot AI answers with Bob's voice assistant clone.\n3. The assistant logs their leak issue, collects address details, quotes the $150 diagnostic fee, and books a calendar slot.\n4. Bob receives an SMS with the booking details while finishing his current job under the sink.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S4: Automated Dispatch Loop\n\nHomeowner calls -> Voice assistant answers -> Diagnostic booking confirmed -> Plumber receives direct SMS reminder."
        },
        S5: {
          id: "S5",
          title: "High-Level Product Specification",
          status: "Verified",
          requires_resync: false,
          raw_submission: "AI Dispatch Co-pilot Web Portal:\n- Twilio-based phone voice clone system answering inbound calls.\n- Google Calendar and Jobber CRM API integration.\n- Automated leak diagnosis intake via user SMS image links.\n- Admin dashboard displaying booking rates and missed-call captures.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S5: Software Systems Architecture\n\nIncludes B2B admin dashboard, Twilio voice routing nodes, and direct calendar synchronizations."
        },
        S6: {
          id: "S6",
          title: "Quantified Value Proposition",
          status: "Verified",
          requires_resync: false,
          raw_submission: "This shows our simple math to prove ROI:\n- Average plumbing call value: $300.\n- Average calls missed per week: 3 calls.\n- Total missed opportunity value: $900/week ($3,600/month).\n- FlowPilot AI subscription cost: $150/month.\n- Even if FlowPilot AI only captures 1 missed call per week, it generates an additional $1,200/month in revenue for Bob, yielding an 8x return on subscription investment.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S6: Plumber ROI Spreadsheet Math\n\n- Lost Revenue: 3 calls * $300 = $900/week.\n- Captured Revenue: 1 call * $300 * 4 weeks = $1,200/month.\n- Cost: $150/month.\n- Net ROI: $1,050/month increase (8x ROI)."
        },
        S7: {
          id: "S7",
          title: "Customer Acquisition & DMU",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Target DMU: Plumber business owner ( Bob Miller ).\nAcquisition channel: Cold-calling local plumbers via Google Maps and offering a 14-day free trial where we set up the virtual number for them.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S7: B2B acquisition strategy\n\nOffering a high-touch onboarding setup removes technical friction for tradesmen, maximizing free-to-paid conversions."
        },
        S8: {
          id: "S8",
          title: "Business Model & Pricing Framework",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We charge $150/month SaaS fee.\nGross Margin: 85% ($1,530 profit per year).\nChurn rate: 10% annual churn.",
          critic_alerts: [],
          structured_data: {
            annual_price: 1800,
            gross_margin: 0.85,
            churn_rate: 0.1,
            calculated_ltv: 15300
          },
          synthesized_output: "### S8: SaaS pricing economic model\n\nAt $150/month and 10% churn, our predicted B2B Customer Lifetime Value is **$15,300**."
        },
        S9: {
          id: "S9",
          title: "Key Assumptions Identification",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We identified the top leap-of-faith assumptions for FlowPilot:\n1. Plumbers will allow an AI to book appointments directly onto their Google Calendar.\n2. Homeowners calling in the middle of a flooding emergency will talk to an AI voice assistant instead of hanging up immediately.\n3. The AI can accurately diagnose basic leak issues from description/photos.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S9: Leap-of-Faith Assumptions\n\nOur biggest risk is homeowner trust: Will they book a job through an AI when their basement is actively flooding? We must test this first."
        },
        S10: {
          id: "S10",
          title: "Key Assumptions Testing",
          status: "Verified",
          requires_resync: false,
          raw_submission: "We tested Assumption 2 (homeowner trust) using a 'Wizard of Oz' simulation.\nWe routed a local plumber's phone line to a Google Voice number. When homeowners called, we played a realistic text-to-speech assistant prompt ('Hi, I am Miller Plumbing's virtual assistant...'). In the background, a team member typed responses live to route their emergency.\nOut of 15 emergency callers, 12 successfully booked their appointment through the assistant without hanging up, passing our validation threshold of 60%.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S10: Wizard of Oz Test Results\n\n- Total calls: 15\n- Booked via AI prompt: 12 (80%)\n- Target threshold: 60%\n- Result: PASS. Homeowners in emergencies will use a prompt-based voice router."
        },
        S11: {
          id: "S11",
          title: "Minimum Viable Business Product (MVBP)",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Our MVBP is a simple Twilio-based phone voice clone with Google Calendar booking integrations. We will run it for 5 local plumbers to capture live service calls.",
          critic_alerts: [],
          structured_data: {
            features: [
              { id: 1, name: "Voice Assistant Call Routing", benefit: "Instantly answers homeowner calls", priority: "High", budget: 3000, sprint: "Sprint 1" },
              { id: 2, name: "Google Calendar Booking Integration", benefit: "Routes bookings to calendar", priority: "High", budget: 2000, sprint: "Sprint 1" }
            ]
          },
          synthesized_output: "### S11: MVP Launch Roadmap\n\nFeatures focus exclusively on call response and scheduling to solve the plumber's primary pain point."
        },
        S12: {
          id: "S12",
          title: "Next Markets & Pitch Readiness",
          status: "Verified",
          requires_resync: false,
          raw_submission: "Expansion markets: Residential electricians, HVAC service contractors.\nPitch Deck is fully updated with verified customer conversion metrics and homeowner booking trust metrics.",
          critic_alerts: [],
          structured_data: {},
          synthesized_output: "### S12: Scale Strategy\n\nFollowing plumber market validation, we will roll out specialized templates for electrical and HVAC dispatch systems."
        }
      };

      const stateObj = {
        startup_name: "FlowPilot AI",
        last_updated: new Date().toISOString(),
        steps: demoSteps
      };

      await writeState(stateObj);
      await Promise.all(Object.values(demoSteps).map(step => writeStepMarkdown(step)));
      const { steps: finalSteps, alerts } = evaluateDependencies(stateObj.steps);
      return NextResponse.json({ ...stateObj, steps: finalSteps, alerts, message: "Successfully loaded FlowPilot AI Software Demo Venture!" });
    }

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
