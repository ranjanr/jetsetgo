"use client";

import { useEffect, useState } from "react";

interface MarketSegment {
  name: string;
  funded: "High" | "Medium" | "Low";
  compelling_reason: "High" | "Medium" | "Low";
  value: number;
}

interface S3Data {
  demographic_size: number;
  conversion_rate: number;
  price_per_unit: number;
  calculated_tam: number;
}

interface S8Data {
  annual_price: number;
  gross_margin: number;
  churn_rate: number;
  calculated_ltv: number;
}

interface FeatureItem {
  id: number;
  name: string;
  benefit: string;
  priority: "High" | "Medium" | "Low";
  budget: number;
  sprint: string;
}

interface Step {
  id: string;
  title: string;
  status: "Not Started" | "Draft" | "Verified";
  requires_resync: boolean;
  raw_submission: string;
  critic_alerts: string[];
  structured_data: any;
  synthesized_output: string;
}

interface WorkspaceState {
  startup_name: string;
  last_updated: string;
  steps: Record<string, Step>;
  alerts: { stepId: string; type: string; message: string }[];
}

const PILLARS = [
  {
    name: "Pillar 1: Who Is Your Customer?",
    steps: [
      { id: "S1", name: "Market Segmentation & Beachhead Selection" },
      { id: "S2", name: "The End-User Profile & Persona" },
      { id: "S3", name: "The First 10 Customers" },
    ],
  },
  {
    name: "Pillar 2: What Can You Do?",
    steps: [
      { id: "S4", name: "Full Life Cycle Use Case" },
      { id: "S5", name: "High-Level Product Specification" },
      { id: "S6", name: "Quantified Value Proposition" },
    ],
  },
  {
    name: "Pillar 3: Acquisition",
    steps: [
      { id: "S7", name: "Customer Acquisition & DMU" },
    ],
  },
  {
    name: "Pillar 4: Business Model",
    steps: [
      { id: "S8", name: "Business Model & Pricing Framework" },
    ],
  },
  {
    name: "Pillar 5: Design & Build",
    steps: [
      { id: "S9", name: "Key Assumptions Identification" },
      { id: "S10", name: "Key Assumptions Testing" },
      { id: "S11", name: "Minimum Viable Business Product (MVBP)" },
    ],
  },
  {
    name: "Pillar 6: Scale & Pitch",
    steps: [
      { id: "S12", name: "Next Markets & Pitch Readiness" },
    ],
  },
];

export default function WorkspaceDashboard() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string>("S1");
  const [rawSubmission, setRawSubmission] = useState<string>("");
  const [status, setStatus] = useState<"Not Started" | "Draft" | "Verified">("Not Started");
  const [structuredData, setStructuredData] = useState<any>({});
  const [collapsedPillars, setCollapsedPillars] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Fetch workspace state
  const fetchState = async () => {
    try {
      const res = await fetch("/api/workspace/state");
      const data = await res.json();
      setState(data);
      if (data.steps && data.steps[selectedStepId]) {
        const step = data.steps[selectedStepId];
        setRawSubmission(step.raw_submission || "");
        setStatus(step.status || "Not Started");
        setStructuredData(step.structured_data || {});
      }
    } catch (error) {
      console.error("Failed to load state:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Update form inputs when selected step changes
  useEffect(() => {
    if (state && state.steps && state.steps[selectedStepId]) {
      const step = state.steps[selectedStepId];
      setRawSubmission(step.raw_submission || "");
      setStatus(step.status || "Not Started");
      setStructuredData(step.structured_data || {});
    }
  }, [selectedStepId, state]);

  // Collapsing sidebar pillars
  const togglePillar = (name: string) => {
    setCollapsedPillars((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Helper check for unlocking step logic
  const isStepLocked = (stepId: string) => {
    if (!state) return true;
    const s1Status = state.steps["S1"]?.status || "Not Started";
    const s4Status = state.steps["S4"]?.status || "Not Started";
    const s11Status = state.steps["S11"]?.status || "Not Started";

    if (stepId === "S1") return false;
    if (stepId === "S2" || stepId === "S4" || stepId === "S3") {
      return s1Status === "Not Started";
    }
    if (stepId === "S5" || stepId === "S6") {
      return s4Status === "Not Started";
    }
    if (stepId === "S12") {
      return s11Status === "Not Started";
    }
    return false; // Steps 7, 8, 9, 10, 11 default to always unlocked
  };

  // Trigger manual resync command
  const triggerResync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/workspace/resync", { method: "POST" });
      const data = await res.json();
      setState(data);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    } catch (error) {
      console.error("Failed to resync:", error);
    } finally {
      setSyncing(false);
    }
  };

  // Save current step data
  const saveStepData = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/workspace/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId: selectedStepId,
          raw_submission: rawSubmission,
          status,
          structured_data: structuredData,
        }),
      });
      const data = await res.json();
      setState(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error("Failed to save step:", error);
    } finally {
      setSaving(false);
    }
  };

  // Render the badge light icon for each step
  const renderBadgeIcon = (step: Step) => {
    const isLocked = isStepLocked(step.id);
    const hasSoftAlert = state?.alerts.some((a) => a.stepId === step.id);
    const requiresResync = step.requires_resync;

    if (isLocked) {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-xs border border-slate-700 text-slate-100 font-bold">
          ⚪
        </span>
      );
    }
    if (requiresResync || hasSoftAlert) {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-950 text-xs border border-rose-500/50 text-rose-400 font-bold" title="Out of sync / Warning">
          🔴
        </span>
      );
    }
    if (step.status === "Verified") {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-xs border border-emerald-500/50 text-emerald-400 font-bold" title="Verified">
          🟢
        </span>
      );
    }
    if (step.status === "Draft") {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-950 text-xs border border-amber-500/50 text-amber-400 font-bold" title="Draft active">
          🟡
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-xs border border-slate-700 text-slate-100 font-bold">
        ⚪
      </span>
    );
  };

  // STEP 1 MATRIX: ADD SEGMENT
  const addS1Market = () => {
    const markets = [...(structuredData.markets || [])];
    markets.push({ name: "New Segment", funded: "Medium", compelling_reason: "Medium", value: 5 });
    setStructuredData({ ...structuredData, markets });
  };

  // STEP 1 MATRIX: CHANGE VALUE
  const updateS1Market = (index: number, key: keyof MarketSegment, val: any) => {
    const markets = [...(structuredData.markets || [])];
    markets[index] = { ...markets[index], [key]: val };
    setStructuredData({ ...structuredData, markets });
  };

  // STEP 1 MATRIX: REMOVE
  const removeS1Market = (index: number) => {
    const markets = (structuredData.markets || []).filter((_: any, idx: number) => idx !== index);
    setStructuredData({ ...structuredData, markets });
  };

  // S3 Spreadsheets: Change values and calculate TAM live
  const updateS3Spreadsheet = (key: keyof S3Data, val: number) => {
    const updated = { ...structuredData, [key]: val };
    const demographic = Number(updated.demographic_size) || 0;
    const conversion = Number(updated.conversion_rate) || 0;
    const price = Number(updated.price_per_unit) || 0;
    updated.calculated_tam = Math.round(demographic * conversion * price);
    setStructuredData(updated);
  };

  // S8 Spreadsheets: Change values and calculate LTV live
  const updateS8Spreadsheet = (key: keyof S8Data, val: number) => {
    const updated = { ...structuredData, [key]: val };
    const price = Number(updated.annual_price) || 0;
    const margin = Number(updated.gross_margin) || 0;
    const churn = Number(updated.churn_rate) || 0.1;
    updated.calculated_ltv = Math.round((price * margin) / churn);
    setStructuredData(updated);
  };

  // S11 Kanban Roadmap: Edit feature row
  const updateS11Feature = (index: number, key: keyof FeatureItem, val: any) => {
    const features = [...(structuredData.features || [])];
    features[index] = { ...features[index], [key]: val };
    setStructuredData({ ...structuredData, features });
  };

  const addS11Feature = () => {
    const features = [...(structuredData.features || [])];
    const newId = features.length > 0 ? Math.max(...features.map((f: any) => f.id)) + 1 : 1;
    features.push({
      id: newId,
      name: "New Feature",
      benefit: "Saves Time",
      priority: "Medium",
      budget: 5000,
      sprint: "Sprint 1",
    });
    setStructuredData({ ...structuredData, features });
  };

  const removeS11Feature = (index: number) => {
    const features = (structuredData.features || []).filter((_: any, idx: number) => idx !== index);
    setStructuredData({ ...structuredData, features });
  };

  if (loading || !state) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="font-mono text-sm tracking-widest text-slate-200">LOADING NAVIGATOR STATE...</p>
        </div>
      </div>
    );
  }

  const activeStep = state.steps[selectedStepId];
  const stepLocked = isStepLocked(selectedStepId);
  const activeStepAlerts = state.alerts.filter((a) => a.stepId === selectedStepId);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="w-full border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <img 
              src="/foundero_logo.png" 
              alt="Foundero Logo" 
              className="w-8 h-8 object-cover rounded-lg border border-slate-800"
            />
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              Foundero
            </span>
          </a>
          <nav className="flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="/" className="hover:text-slate-200 transition">Home</a>
            <a href="/workspace" className="hover:text-slate-200 transition">Workspace</a>
            <a href="/mentor" className="hover:text-slate-200 transition">Mentor Portal</a>
          </nav>
        </div>
      </header>

      {/* Main split dashboard area */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. SIDEBAR NAVIGATION */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {state.startup_name}
              </h1>
              <p className="text-xs text-slate-100 font-mono">Foundero Workspace</p>
            </div>
            <button
              onClick={triggerResync}
              disabled={syncing}
              className={`px-2 py-1 text-xs border active:scale-95 transition rounded flex items-center gap-1 font-mono cursor-pointer ${
                syncSuccess
                  ? "bg-emerald-600 border-emerald-500 text-white font-bold"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-violet-300"
              }`}
            >
              {syncing ? "Sync..." : syncSuccess ? "Synced ✓" : "/resync"}
            </button>
          </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {PILLARS.map((pillar) => {
            const isCollapsed = collapsedPillars[pillar.name];
            return (
              <div key={pillar.name} className="space-y-1">
                <button
                  onClick={() => togglePillar(pillar.name)}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold text-slate-200 tracking-wider flex items-center justify-between hover:bg-slate-800/40 rounded transition"
                >
                  <span>{pillar.name}</span>
                  <span className="text-slate-400">{isCollapsed ? "▼" : "▲"}</span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pl-2 border-l border-slate-800/50 ml-2">
                    {pillar.steps.map((step) => {
                      const isSelected = selectedStepId === step.id;
                      const locked = isStepLocked(step.id);
                      const stepObj = state.steps[step.id];
                      return (
                        <button
                          key={step.id}
                          onClick={() => !locked && setSelectedStepId(step.id)}
                          disabled={locked}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded transition text-left ${
                            isSelected
                              ? "bg-slate-800/90 text-violet-300 border border-slate-700 font-semibold"
                              : locked
                              ? "text-slate-400 cursor-not-allowed"
                              : "text-slate-100 hover:bg-slate-850 hover:text-white"
                          }`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <strong className="font-mono text-[10px] bg-slate-800 px-1 py-0.5 rounded text-slate-200 border border-slate-700/50">
                              {step.id}
                            </strong>{" "}
                            {step.name}
                          </span>
                          <span>{renderBadgeIcon(stepObj)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {stepLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
            <span className="text-5xl mb-4">🔒</span>
            <h2 className="text-xl font-bold mb-2">Step Hard-Locked</h2>
            <p className="text-slate-200 text-sm mb-4">
              Step <span className="font-bold text-violet-400">{selectedStepId}</span> requires a validated or draft foundational customer input in Step 1 (Beachhead Selection).
            </p>
            <button
              onClick={() => setSelectedStepId("S1")}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded font-semibold text-xs tracking-wider uppercase transition"
            >
              Go to Step 1 Select Beachhead
            </button>
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-violet-400 bg-violet-950/60 border border-violet-800/50 px-2 py-0.5 rounded font-semibold">
                    {selectedStepId}
                  </span>
                  <span className="text-xs text-slate-100 font-mono">
                    {activeStep.requires_resync ? "⚠️ Out of Sync" : "✓ Aligned"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mt-1 text-slate-100">{activeStep.title}</h2>
              </div>

              {/* Status / Save */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">
                  <label className="text-[10px] text-slate-100 uppercase tracking-wider font-mono">Status:</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none border-none cursor-pointer font-semibold"
                  >
                    <option value="Not Started" className="bg-slate-900">Not Started</option>
                    <option value="Draft" className="bg-slate-900">Draft</option>
                    <option value="Verified" className="bg-slate-900">Verified & Locked</option>
                  </select>
                </div>

                <button
                  onClick={saveStepData}
                  disabled={saving}
                  className={`px-4 py-2 rounded text-xs font-bold tracking-wide transition shadow cursor-pointer ${
                    saveSuccess
                      ? "bg-emerald-600 text-white shadow-emerald-900/40 border border-emerald-500"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed shadow-violet-900/40 border border-transparent"
                  }`}
                >
                  {saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Step"}
                </button>
              </div>
            </div>

            {/* 💡 Collapsible Concept Guide */}
            <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs tracking-wider uppercase font-mono">
                  <span>💡</span> Concept Guide & Purpose
                </div>
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[10px] text-slate-300 hover:text-slate-100 underline font-mono cursor-pointer"
                >
                  {showGuide ? "[ Hide Guide ]" : "[ Show Guide ]"}
                </button>
              </div>
              
              {showGuide && (
                <div className="text-sm text-slate-200 leading-relaxed font-sans border-t border-slate-850/60 pt-3 space-y-2">
                  <p>
                    {STEP_GUIDES[selectedStepId]?.purpose}
                  </p>
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 mt-2">
                    <strong className="text-xs font-semibold text-slate-100 uppercase tracking-wider block font-mono mb-1">
                      Action Focus:
                    </strong>
                    <p className="text-xs text-slate-350">
                      {STEP_GUIDES[selectedStepId]?.focus}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Downstream sync alert */}
            {activeStep.requires_resync && (
              <div className="p-4 rounded border border-rose-950 bg-rose-950/10 text-rose-300 text-xs flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold">Downstream Out-of-Sync Warning</p>
                  <p className="text-slate-200 mt-0.5">
                    Parent assumptions in Step 1 Selection have changed. Please review calculations below and trigger <button onClick={triggerResync} disabled={syncing} className={`underline font-semibold font-mono cursor-pointer transition ${syncSuccess ? "text-emerald-400" : "text-rose-200 hover:text-rose-100"}`}>{syncing ? "syncing..." : syncSuccess ? "synced ✓" : "/resync"}</button> to align.
                  </p>
                </div>
              </div>
            )}

            {/* Soft-dependency Warnings */}
            {activeStepAlerts.map((alert, idx) => (
              <div key={idx} className="p-4 rounded border border-amber-950 bg-amber-950/15 text-amber-300 text-xs flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <p className="font-medium">{alert.message}</p>
              </div>
            ))}

            {/* 3. INTERACTIVE COMPONENTS */}
            <section className="bg-slate-900/40 border border-slate-850 p-6 rounded-lg space-y-4 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">Interactive Modeling Matrix</h3>
              
              {/* S1: BEACHHEAD SELECTION MATRIX */}
              {selectedStepId === "S1" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-200">
                          <th className="p-3">Market Segment</th>
                          <th className="p-3">Well-Funded?</th>
                          <th className="p-3">Compelling Reason to Buy?</th>
                          <th className="p-3 text-center">Score (1-10)</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(structuredData.markets || []).map((m: MarketSegment, idx: number) => (
                          <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/10">
                            <td className="p-3 font-semibold text-slate-200">
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => updateS1Market(idx, "name", e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 focus:border-violet-500 focus:outline-none w-full"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={m.funded}
                                onChange={(e) => updateS1Market(idx, "funded", e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                              >
                                <option value="High">High 🟢</option>
                                <option value="Medium">Medium 🟡</option>
                                <option value="Low">Low 🔴</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={m.compelling_reason}
                                onChange={(e) => updateS1Market(idx, "compelling_reason", e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                              >
                                <option value="High">High 🟢</option>
                                <option value="Medium">Medium 🟡</option>
                                <option value="Low">Low 🔴</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={m.value}
                                onChange={(e) => updateS1Market(idx, "value", parseInt(e.target.value) || 0)}
                                className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 text-center focus:border-violet-500 focus:outline-none w-16"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => removeS1Market(idx)}
                                className="text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={addS1Market}
                    className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-100 rounded font-semibold transition"
                  >
                    + Add New Segment
                  </button>
                </div>
              )}

              {/* S3: TAM FORMULA SPREADSHEET */}
              {selectedStepId === "S3" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-100 uppercase font-mono">Formula Inputs</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-slate-200 mb-1">Target Demographic Size</label>
                        <input
                          type="number"
                          value={structuredData.demographic_size || 0}
                          onChange={(e) => updateS3Spreadsheet("demographic_size", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 focus:border-violet-500 focus:outline-none text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-200 mb-1">Conversion Rate (0 to 1)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={structuredData.conversion_rate || 0}
                          onChange={(e) => updateS3Spreadsheet("conversion_rate", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 focus:border-violet-500 focus:outline-none text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-200 mb-1">Price Per Unit / Contract Value ($)</label>
                        <input
                          type="number"
                          value={structuredData.price_per_unit || 0}
                          onChange={(e) => updateS3Spreadsheet("price_per_unit", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 focus:border-violet-500 focus:outline-none text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-6 rounded flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 uppercase font-mono mb-2">LTV/TAM Calculation</h4>
                      <p className="text-xs text-slate-200">
                        Top-down calculation evaluates total capital available per year in this subsegment segment:
                      </p>
                      <p className="text-[10px] font-mono text-violet-400 mt-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                        TAM = (Demographic Size * Conversion %) * Price/Contract
                      </p>
                    </div>
                    <div className="mt-6 border-t border-slate-850 pt-4">
                      <span className="text-xs text-slate-100 uppercase tracking-wider block font-mono">Calculated TAM:</span>
                      <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-mono">
                        ${(structuredData.calculated_tam || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* S8: BUSINESS MODEL & LTV SPREADSHEET */}
              {selectedStepId === "S8" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-100 uppercase font-mono">Pricing Variables</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-slate-200 mb-1">Annual Subscription / Value ($)</label>
                        <input
                          type="number"
                          value={structuredData.annual_price || 0}
                          onChange={(e) => updateS8Spreadsheet("annual_price", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 focus:border-violet-500 focus:outline-none text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-200 mb-1">Gross Margin (0 to 1)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          value={structuredData.gross_margin || 0}
                          onChange={(e) => updateS8Spreadsheet("gross_margin", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 focus:border-violet-500 focus:outline-none text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-200 mb-1">Annual Churn Rate (0 to 1)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="1"
                          value={structuredData.churn_rate || 0.1}
                          onChange={(e) => updateS8Spreadsheet("churn_rate", parseFloat(e.target.value) || 0.1)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 focus:border-violet-500 focus:outline-none text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-6 rounded flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 uppercase font-mono mb-2">Calculated Unit Economics</h4>
                      <p className="text-xs text-slate-200">
                        Life-Time Value (LTV) indicates the net margin yield predicted over the contract lifecycle:
                      </p>
                      <p className="text-[10px] font-mono text-violet-400 mt-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                        LTV = (Annual Contract * Gross Margin) / Annual Churn Rate
                      </p>
                    </div>
                    <div className="mt-6 border-t border-slate-850 pt-4">
                      <span className="text-xs text-slate-100 uppercase tracking-wider block font-mono">Predicted LTV:</span>
                      <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-mono">
                        ${(structuredData.calculated_ltv || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* S11: MVBP ROADMAP GRID */}
              {selectedStepId === "S11" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-200">
                          <th className="p-3">Feature</th>
                          <th className="p-3">User Benefit</th>
                          <th className="p-3">Priority</th>
                          <th className="p-3">Est. Budget ($)</th>
                          <th className="p-3">Sprint Timeline</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(structuredData.features || []).map((f: FeatureItem, idx: number) => (
                          <tr key={f.id} className="border-b border-slate-800 hover:bg-slate-800/10">
                            <td className="p-3">
                              <input
                                type="text"
                                value={f.name}
                                onChange={(e) => updateS11Feature(idx, "name", e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 focus:border-violet-500 focus:outline-none w-full font-semibold text-slate-200"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={f.benefit}
                                onChange={(e) => updateS11Feature(idx, "benefit", e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 focus:border-violet-500 focus:outline-none w-full text-slate-100"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={f.priority}
                                onChange={(e) => updateS11Feature(idx, "priority", e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                              >
                                <option value="High">High 🔴</option>
                                <option value="Medium">Medium 🟡</option>
                                <option value="Low">Low 🟢</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={f.budget}
                                onChange={(e) => updateS11Feature(idx, "budget", parseInt(e.target.value) || 0)}
                                className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 focus:border-violet-500 focus:outline-none w-24 text-slate-100"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={f.sprint}
                                onChange={(e) => updateS11Feature(idx, "sprint", e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 focus:border-violet-500 focus:outline-none w-24 text-slate-100"
                              />
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => removeS11Feature(idx)}
                                className="text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={addS11Feature}
                    className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-100 rounded font-semibold transition"
                  >
                    + Add Product Feature
                  </button>
                </div>
              )}

              {/* General placeholder */}
              {selectedStepId !== "S1" && selectedStepId !== "S3" && selectedStepId !== "S8" && selectedStepId !== "S11" && (
                <p className="text-xs text-slate-200 italic">
                  *Structured fields model loads dynamically when TAM spreadsheets, selection matrices, or roadmaps are applicable.*
                </p>
              )}
            </section>

            {/* 4. RAW INPUT EDITOR */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">Raw Submission Notes</h3>
                <span className="text-[10px] text-slate-100 font-mono">Press Save Step to refresh analysis</span>
              </div>
              <textarea
                value={rawSubmission}
                onChange={(e) => setRawSubmission(e.target.value)}
                placeholder="Draft your raw insights, interview notes, sizing assumptions, or customer comments here..."
                rows={6}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 focus:border-violet-500 focus:outline-none text-sm text-slate-200 leading-relaxed shadow-inner"
              />
            </section>

            {/* 5. CRITIC FEEDBACK SECTION */}
            {(activeStep.critic_alerts.length > 0 || rawSubmission.includes("[!! CRITIC ALERT]")) && (
              <section className="bg-rose-950/15 border border-rose-900/50 p-6 rounded-lg space-y-3">
                <h3 className="text-rose-400 text-sm font-bold flex items-center gap-2">
                  <span>🚨</span> Critic Evaluation Alert Queue
                </h3>
                <div className="space-y-2">
                  {activeStep.critic_alerts.map((alert, idx) => (
                    <div key={idx} className="p-3 bg-rose-950/40 rounded border border-rose-900/50 text-xs text-rose-300 font-mono">
                      {alert}
                    </div>
                  ))}
                  {rawSubmission.includes("[!! CRITIC ALERT]") && (
                    <div className="p-3 bg-rose-950/40 rounded border border-rose-900/50 text-xs text-rose-300 font-mono">
                      [!! CRITIC ALERT: Unverified Synthetic Metric] Claimed numeric metric lacks cited validation interview source.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. SYNTHESIZED PLAN DISPLAY */}
            {activeStep.synthesized_output && (() => {
              const phases = parsePlanToPhases(activeStep.synthesized_output);
              
              const toggleTask = (taskKey: string) => {
                setCheckedTasks(prev => ({ ...prev, [taskKey]: !prev[taskKey] }));
              };

              if (phases.length > 0) {
                return (
                  <section className="bg-slate-900/40 border border-slate-850 p-6 rounded-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold tracking-wider uppercase text-slate-200 font-mono">
                          🎯 Interactive Validation Playbook
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-sans">
                          Step-by-step roadmap parsed from your synthesized plan. Complete validation tasks below.
                        </p>
                      </div>
                      <span className="text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300 px-2 py-0.5 rounded font-mono font-semibold">
                        Checklist Mode
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {phases.map((phase, pIdx) => (
                        <div key={pIdx} className="bg-slate-950/80 border border-slate-850 rounded-xl overflow-hidden flex flex-col shadow-sm">
                          {/* Phase Header */}
                          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-850 p-4">
                            <h4 className="text-sm font-bold text-slate-100 font-mono tracking-tight leading-snug">
                              {phase.title}
                            </h4>
                          </div>

                          <div className="p-4 flex-1 flex flex-col space-y-4">
                            {/* Objective banner */}
                            {phase.objective && (
                              <div className="bg-violet-950/20 border border-violet-900/40 p-3 rounded-lg text-xs text-violet-300 leading-relaxed font-sans">
                                <strong className="font-semibold block text-[10px] text-violet-400 uppercase tracking-wider font-mono mb-0.5">Objective:</strong>
                                {phase.objective}
                              </div>
                            )}

                            {/* Checklist steps */}
                            <div className="space-y-3 flex-1">
                              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold block">Action Steps</span>
                              {phase.steps.map((step, sIdx) => {
                                const taskKey = `${selectedStepId}-p${pIdx}-s${sIdx}`;
                                const isChecked = !!checkedTasks[taskKey];
                                return (
                                  <label
                                    key={sIdx}
                                    onClick={() => toggleTask(taskKey)}
                                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition select-none ${
                                      isChecked
                                        ? "bg-emerald-950/15 border-emerald-900/40 text-slate-200"
                                        : "bg-slate-900/40 border-slate-850 hover:bg-slate-850/50 hover:border-slate-800 text-slate-100"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="mt-0.5 accent-emerald-500 rounded cursor-pointer"
                                    />
                                    <div className="space-y-0.5 leading-normal">
                                      <span className={`font-bold block text-slate-100 ${isChecked ? "line-through text-slate-450" : ""}`}>
                                        {step.label}
                                      </span>
                                      <p className={`text-slate-300 ${isChecked ? "text-slate-500" : ""}`}>
                                        {step.detail}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              // Fallback to standard view if parse returned no phases (rendered with larger text for high legibility)
              return (
                <section className="bg-slate-900/20 border border-slate-800 p-6 rounded-lg space-y-3">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">
                    Synthesized Matrix Plan (Batch Run 3)
                  </h3>
                  <div 
                    className="prose prose-invert max-w-none text-sm text-slate-200 font-sans leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(activeStep.synthesized_output) }}
                  />
                </section>
              );
            })()}
          </div>
        )}
      </main>
    </div>

    {/* Footer */}
    <footer className="w-full border-t border-slate-900 bg-slate-950/85 py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">© 2026 Foundero</span>
          <span className="text-slate-800">|</span>
          <a href="https://foundero.app/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 transition font-mono">
            foundero.app
          </a>
        </div>
        <div className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-slate-350 transition">Privacy Policy</a>
          <a href="#terms" className="hover:text-slate-350 transition">Terms of Service</a>
          <a href="#support" className="hover:text-slate-350 transition">Contact Support</a>
          <a href="#docs" className="hover:text-slate-350 transition">Documentation</a>
        </div>
      </div>
    </footer>
  </div>
);
}

// 📄 Muted Lightweight Markdown parser for premium HTML layouts
function parseMarkdownToHtml(md: string): string {
  if (!md) return "";
  
  // Escape HTML tags to prevent custom XSS
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Format Headers: ####, ###, ##, #
  html = html.replace(/^#### (.*?)$/gm, '<h4 class="text-xs font-bold text-violet-400 mt-4 mb-1 font-mono uppercase tracking-wider">$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold text-violet-300 mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-slate-250 mt-6 mb-2.5">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-lg font-bold text-slate-100 mt-8 mb-3">$1</h1>');

  // Format Bold text: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>');

  // Format Bullets: * or -
  html = html.replace(/^\s*[\*\-]\s+(.*?)$/gm, '<li class="ml-4 list-disc text-slate-200 mb-1 leading-relaxed">$1</li>');

  // Wrap list tags in ul container
  html = html.replace(/(<li.*?>[\s\S]*?<\/li>)/g, '<ul class="my-2 space-y-1">$1</ul>');
  html = html.replace(/<\/ul>\s*<ul.*?>/g, '');

  // Wrap loose paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<li')) {
      return p;
    }
    return `<p class="mb-3 text-slate-300 leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

interface ActionStep {
  label: string;
  detail: string;
}

interface ActionPhase {
  title: string;
  objective: string;
  steps: ActionStep[];
}

function parsePlanToPhases(text: string): ActionPhase[] {
  if (!text) return [];

  const phases: ActionPhase[] = [];
  // Split sections by #### (each milestone card starts with ####)
  const sections = text.split(/####\s+/);

  sections.forEach((sec, idx) => {
    if (idx === 0) return; // leading intro text

    const lines = sec.split("\n");
    const title = lines[0].replace(/\*\*/g, "").trim();
    let objective = "";
    const steps: ActionStep[] = [];

    lines.slice(1).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Extract Objective banner
      if (trimmed.toLowerCase().includes("objective:")) {
        objective = trimmed
          .replace(/^[\*\-\s]*\*\*Objective:\*\*\s*/i, "")
          .replace(/^[\*\-\s]*Objective:\s*/i, "")
          .trim();
      } else if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        // Extract bullet action steps
        const match = trimmed.match(/^[\*\-\s]*\*\*(.*?)\*\*\s*(.*)/);
        if (match) {
          const label = match[1].replace(/[:\-]$/, "").trim();
          const detail = match[2].trim();
          if (label.toLowerCase() !== "action steps" && label.toLowerCase() !== "objective") {
            steps.push({ label, detail });
          }
        } else {
          // General unlabelled bullet point
          const textOnly = trimmed.replace(/^[\*\-\s]+/, "").trim();
          if (textOnly && textOnly.toLowerCase() !== "action steps") {
            steps.push({ label: "Task", detail: textOnly });
          }
        }
      }
    });

    if (title && steps.length > 0) {
      phases.push({ title, objective, steps });
    }
  });

  return phases;
}

const STEP_GUIDES: Record<string, { purpose: string; focus: string }> = {
  S1: {
    purpose: "Brainstorm and evaluate potential market segments for your venture. The critical goal is selecting a single 'beachhead' market (your entry point). Concentrating all your initial energy and resources on a narrow, well-defined beachhead lets you win a dominant share, validate your business models, and establish reference customer networks before scaling.",
    focus: "Avoid targeting multiple segments simultaneously. Choose one specific customer type, evaluate if they are well-funded with a compelling reason to buy, and score your options."
  },
  S2: {
    purpose: "Define the specific End-User Profile and build a detailed target Persona. A Persona is a representative character model of a real customer in your beachhead market. Documenting their actual role, demographics, purchasing habits, and daily pain points ensures you design the product around real human needs rather than assumptions.",
    focus: "Be extremely specific. Give your persona a name, a detailed role description, and list their top 3 frustrating daily pain points."
  },
  S3: {
    purpose: "Identify and contact your first 10 reference customers who match your Persona description. Reaching out directly to early adopters validates your target profile, tests their buying interest, and calculates the Total Addressable Market (TAM) based on bottom-up contract pricing models.",
    focus: "Talk to real people. Use inputs for Demographic Size, Conversion Rates, and Unit Prices to estimate the annual TAM capitalization for your segment."
  },
  S4: {
    purpose: "Map out the Full Life Cycle Use Case from the customer's perspective. Detail exactly how they discover your product, evaluate options, purchase, receive, install, use, pay, and re-order. Identifying all transaction points exposes adoption friction early.",
    focus: "Document the sequence of interactions, noting potential barriers (like long IT procurement or user training curves)."
  },
  S5: {
    purpose: "Establish a High-Level Product Specification. Compile a visual representation (sketch, storyboard, or architecture block diagrams) of your product. Defining clear specifications aligns your engineering team on features and controls project scope.",
    focus: "Keep it simple and visual. Detail the core platform specifications without over-engineering complex edge cases."
  },
  S6: {
    purpose: "Formulate a Quantified Value Proposition. Calculate the concrete, measurable benefits your customer receives (e.g. time saved, revenue increased, operational cost reduced) when using your product compared to their status quo.",
    focus: "Quantify the value in monetary or time savings. Make a clear financial comparison against their current alternative."
  },
  S7: {
    purpose: "Map out the Customer Acquisition Process and Decision-Making Unit (DMU). Define who champions, uses, decodes, and pays for the product, and understand the customer buying timeline.",
    focus: "Identify the key influencers and purchasing rules that could delay your sales cycle."
  },
  S8: {
    purpose: "Design the Business Model and Pricing Framework. Choose a pricing structure (e.g., subscription, usage-based, transactional) and model the Customer Lifetime Value (LTV) relative to gross margins and churn rates.",
    focus: "Balance pricing against customer budgets. Monitor predicted LTV to ensure unit economics stay highly profitable."
  },
  S9: {
    purpose: "Identify your Key Leap-of-Faith Assumptions. List the core hypotheses that must be true for your venture to succeed but have not yet been proven (e.g., 'Boutiques will pay $450', 'Opticians can operate the device without training').",
    focus: "Isolate the top 3-5 high-impact, high-uncertainty assumptions that could break your business."
  },
  S10: {
    purpose: "Design and run rapid, low-cost tests to validate your Key Assumptions. Design quick experiments (interviews, simple landing page signups, pre-orders) to gather data before spending resources on manufacturing or full coding.",
    focus: "Define clear pass/fail thresholds for each experiment (e.g., 'At least 7 out of 10 opticians agree to run the test')."
  },
  S11: {
    purpose: "Define the Minimum Viable Business Product (MVBP). Specify the minimum combination of features that delivers actual value, triggers a commercial transaction (they pay for it), and starts the customer feedback loop.",
    focus: "List feature priorities, estimate budgets, and timeline sprints to launch a functional value proposal."
  },
  S12: {
    purpose: "Prepare Adjacent Next Markets and Pitch Readiness. Define your expansion markets once you secure the beachhead and assemble a data-backed venture pitch deck using validated metrics.",
    focus: "Formulate a sequential market entry strategy and review step verification completion checklist."
  }
};
