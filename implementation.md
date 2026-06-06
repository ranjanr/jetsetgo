# Implementation Plan - Landing Page & AI Initialization

We will add a premium landing and onboarding login page where entrepreneurs can enter their startup name and product idea (e.g. "ultrasonic eyeglasses cleaning box"). The system will run an initialization routine to populate all 12 steps of the venture framework with tailored AI drafts and redirect them to their workspace.

---

## 🛣️ Updated Routing Structure

1. **`src/app/page.tsx` (NEW)**: Landing/login page. Enter name, email, startup name, and product idea.
2. **`src/app/workspace/page.tsx` (RELOCATED)**: The interactive editor dashboard (previously `src/app/page.tsx`).
3. **`src/app/api/workspace/initialize/route.ts` (NEW)**: Initializer endpoint that:
   - Receives startup name and product idea.
   - Bootstraps custom, tailored DE drafts for all 12 steps (e.g., S1 Market Matrix, S2 Persona, S3 TAM, S4 Use Case, S8 LTV, S11 Roadmap features) matching the product idea.
   - Syncs all step markdown files in `steps/` and saves `state.json`.

---

## 💾 AI Bootstrap Heuristics

When initializing the product idea, the `/api/workspace/initialize` route will parse the idea and generate themed draft payloads:

- **If idea is Eyeglasses Cleaning Box**:
  - **S1**: Segments like "Boutique Opticians", "Everyday Eyeglass Wearers", "Luxury Sunglasses Collectors".
  - **S3**: Demographic size = 15,000 opticians, conversion = 4%, price = $350, calculated TAM = $210,000.
  - **S8**: Price = $350, Margin = 70%, Churn = 15%, LTV = $1,633.
  - **S11**: Features like "40kHz Transducer Core", "UV Sanitization Lid", "Auto-drain fluid port".
- **For other ideas**:
  - Dynamically populate customized schemas referencing the specific keyword inputs of the product idea.

---

## 🎨 UI & Layout Design (Tailwind CSS v4.0)

- **Landing Page (`src/app/page.tsx`)**:
  - Full-screen modern gradient background (indigo/slate/black).
  - Premium header card.
  - Glassmorphic forms for credentials and idea submission.
  - Animated progress log displaying: `[Initializing AI agent pipeline...]`, `[Analyzing Beachhead Markets...]`, `[Structuring unit economics...]` during generation.
  - Smooth redirects to `/workspace`.

---

## 🏁 Verification Plan

### Manual Verification
- Deploy/run server.
- Navigate to `http://localhost:6001`.
- Enter "ultrasonic eyeglasses cleaning box" and startup name "SonicSight".
- Confirm progress loader, check redirect to `/workspace`.
- Check that Step 1, 3, 8, and 11 structured panels contain optician and ultrasonic cleaner data.
- Check that the files under `steps/` and `state.json` have been rewritten with the new startup info.
