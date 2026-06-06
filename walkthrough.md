# Foundero Startup Accelerator Implementation Walkthrough

We have built a fully interactive full-stack Next.js application named **Foundero** (configured for `https://foundero.app/`) inside the `/Users/ranjanr/Desktop/VibeCoding/jetsetgo` folder. It integrates a 12-step matrix with active dependency tracking, a new onboarding launcher, and Critic agent auditing.

## 📁 Key File Map

### 1. Onboarding & Initializer Routes
- [src/app/page.tsx](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/page.tsx): Premium onboarding landing page. Founder inputs names and raw product ideas. Features the new logo, top header navigation, and bottom footer links.
- [src/app/api/workspace/initialize/route.ts](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/api/workspace/initialize/route.ts): Bootstraps custom steps (e.g. S1 Matrix, S3 TAM, S8 LTV, S11 Roadmap features) depending on the keyword context of the submitted product idea.

### 2. State Logic & Endpoints
- [state.json](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/state.json): Master database containing the 12 steps, completion states, downstream sync flags, and structured table/spreadsheet objects.
- [src/lib/workspace.ts](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/lib/workspace.ts): State helper library containing loader/writer routines, state machine dependency checkers, and the Critic agent pattern-matching engine.
- [src/app/api/workspace/state/route.ts](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/api/workspace/state/route.ts): GET endpoint returning the live workspace matrix coupled with active warnings.
- [src/app/api/workspace/update-step/route.ts](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/api/workspace/update-step/route.ts): POST endpoint processing text drafts and spreadsheet inputs, triggering critic checks and marking downstream steps for sync.
- [src/app/api/workspace/resync/route.ts](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/api/workspace/resync/route.ts): POST endpoint executing the alignment loop and clearing sync flags.

### 3. Frontend Dashboards
- [src/app/workspace/page.tsx](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/workspace/page.tsx): Main interactive workspace dashboard. Includes:
  - Six collapsible theme blocks with status indicators (⚪, 🟡, 🔴, 🟢).
  - Step 1 Selection Criteria Matrix (High/Medium/Low rating selectors).
  - Step 3 TAM Estimation Formula Sheet (Live React calculation).
  - Step 8 LTV Economics Formula Sheet (Live React calculation).
  - Step 11 MVBP Features Grid (Editable feature rows).
- [src/app/mentor/page.tsx](file:///Users/ranjanr/Desktop/VibeCoding/jetsetgo/src/app/mentor/page.tsx): Cohort administrator control hub collecting warning logs and monitoring cohort progression.

---

## ⚙️ Backend State Machine & Dependency Rules

1. **Beachhead Selection (S1)**: Foundations. Locked at start but unlocks all downstream steps once it hits `Draft` or `Verified`. Modifying S1 flips `requires_resync` to `true` for S2, S3, S4, and S6.
2. **Persona (S2) & Use Case (S4)**: Unlocked by S1.
3. **First 10 Customers (S3)**: Requires S1; triggers a soft-dependency warning alert if S2 is unstarted.
4. **Product Spec (S5)**: Unlocked by S4.
5. **Value Prop (S6)**: Unlocked by S4; displays a warning if S5 is empty.
6. **Pitch Readiness (S12)**: Hard-locked until S11 is active; warns if any parent S1-S11 is not verified.

---

## 🧪 Verification & Build Results
- **Foundero Visual Rebranding**:
  - Designed and generated a minimalist geometric logo icon `public/foundero_logo.png` showcasing an abstract letter 'F' forming a dynamic forward-pointing arrow.
  - Reorganized the onboarding landing page (`src/app/page.tsx`) to incorporate a premium sticky top Header (with logo and navigation links) and a responsive bottom Footer featuring support/legal links (Privacy Policy, Terms of Service, Contact Support, Documentation).
  - Restructured the landing page layout for high legibility, clean styling, and mobile responsiveness.
- **Vercel Cloud Storage Persistence**: Migrated state management from synchronous local disk operations (`fs.writeFileSync`) to asynchronous **Vercel KV** and **Vercel Blob** cloud storage APIs.
- **Local Development Fallbacks**: Designed fallback code paths that automatically use the local filesystem (`state.json` and `steps/` folder) if Vercel API credentials are not found in the `.env.local` config, preserving developer setup simplicity.
- **Color-Coded Save & Resync Notifications**: Replaced native browser `alert()` popups for both saving steps and executing state resynchronizations with animated status transitions on their respective action buttons:
  - **Save Step**: Turns green (`bg-emerald-600`) and displays **"Saved ✓"** for 2.5 seconds upon success.
  - **Resync (`/resync`)**: Sidebar button turns green (`bg-emerald-600`) and displays **"Synced ✓"** for 2.5 seconds, while inline warning buttons highlight to green (**"synced ✓"**).
- **ReferenceError Fix**: Resolved a variable scoping issue inside `saveStepData` (undefined `data` object reference) to ensure the local state synchronization behaves cleanly.
- Run command `npm run build` completed successfully with:
  - `✓ Compiled successfully`
  - Zero TypeScript compile-time errors or Turbopack bundling warnings.

---

## 🚀 How to Run Locally / Deploy

### Local Development (Uses local fallback storage)
Start the local development server by running:
```bash
npm run dev
```
Open [http://localhost:6001/workspace](http://localhost:6001/workspace) to access the dashboard.

### Vercel Deployment (Uses cloud storage)
1. Add `@vercel/kv` and `@vercel/blob` integrations in your Vercel Project Dashboard.
2. The code automatically detects the injected environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, `BLOB_READ_WRITE_TOKEN`) and redirects all read/write/markdown operations to the cloud.
