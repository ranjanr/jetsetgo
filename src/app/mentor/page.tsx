"use client";

import { useEffect, useState } from "react";

interface Step {
  id: string;
  title: string;
  status: "Not Started" | "Draft" | "Verified";
  requires_resync: boolean;
  raw_submission: string;
  critic_alerts: string[];
}

interface WorkspaceState {
  startup_name: string;
  last_updated: string;
  steps: Record<string, Step>;
  alerts: { stepId: string; type: string; message: string }[];
}

interface MockTeam {
  name: string;
  concept: string;
  steps: Record<string, "Not Started" | "Draft" | "Verified">;
  alertsCount: number;
  syncIssues: number;
}

export default function MentorDashboard() {
  const [liveState, setLiveState] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the live team state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/workspace/state");
        const data = await res.json();
        if (!data.startup_name) {
          window.location.href = "/";
          return;
        }
        setLiveState(data);
      } catch (error) {
        console.error("Failed to fetch state:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, []);

  // Compute live issues for the triage feed
  const getLiveIssues = () => {
    if (!liveState) return [];
    const issues: { stepId: string; title: string; type: "critic" | "sync" | "warning"; message: string }[] = [];

    // Collect S3/S8 custom metric alerts or text-based mock critic alerts
    Object.values(liveState.steps).forEach((step) => {
      // JSON critic alerts
      step.critic_alerts.forEach((alert) => {
        issues.push({
          stepId: step.id,
          title: step.title,
          type: "critic",
          message: alert,
        });
      });
      // Raw string alert triggers (S3 TAM, S8 LTV, S1)
      if (step.raw_submission.includes("[!! CRITIC ALERT]")) {
        issues.push({
          stepId: step.id,
          title: step.title,
          type: "critic",
          message: "[!! CRITIC ALERT: Unverified Synthetic Metric] Claimed statistics or sizing without interview citation.",
        });
      }
      // Out of sync flagging
      if (step.requires_resync) {
        issues.push({
          stepId: step.id,
          title: step.title,
          type: "sync",
          message: "Step requires downstream alignment resynchronization (S1 parent modified).",
        });
      }
    });

    // Soft dependencies
    liveState.alerts.forEach((alert) => {
      issues.push({
        stepId: alert.stepId,
        title: liveState.steps[alert.stepId]?.title || "Step",
        type: "warning",
        message: alert.message,
      });
    });

    return issues;
  };

  // Mocked cohort data representing adjacent cohort teams
  const mockTeams: MockTeam[] = [
    {
      name: "MedFlow AI",
      concept: "Automating clinical clinic intake charts for orthopedic clinics.",
      steps: {
        S1: "Verified",
        S2: "Verified",
        S3: "Draft",
        S4: "Draft",
        S5: "Not Started",
        S6: "Not Started",
        S7: "Not Started",
        S8: "Not Started",
        S9: "Not Started",
        S10: "Not Started",
        S11: "Not Started",
        S12: "Not Started",
      },
      alertsCount: 1,
      syncIssues: 0,
    },
    {
      name: "SolShare",
      concept: "Peer-to-peer micro-grid solar panel distribution matrices.",
      steps: {
        S1: "Draft",
        S2: "Not Started",
        S3: "Not Started",
        S4: "Not Started",
        S5: "Not Started",
        S6: "Not Started",
        S7: "Not Started",
        S8: "Not Started",
        S9: "Not Started",
        S10: "Not Started",
        S11: "Not Started",
        S12: "Not Started",
      },
      alertsCount: 2,
      syncIssues: 1,
    },
    {
      name: "EduForge",
      concept: "Dynamic customized lesson planner templates for grade 3-6 teachers.",
      steps: {
        S1: "Verified",
        S2: "Verified",
        S3: "Verified",
        S4: "Verified",
        S5: "Verified",
        S6: "Verified",
        S7: "Draft",
        S8: "Draft",
        S9: "Not Started",
        S10: "Not Started",
        S11: "Not Started",
        S12: "Not Started",
      },
      alertsCount: 0,
      syncIssues: 0,
    },
  ];

  if (loading || !liveState) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="font-mono text-sm tracking-widest text-slate-200">LOADING COHORT CONTEXT...</p>
        </div>
      </div>
    );
  }

  const liveIssues = getLiveIssues();
  const totalWarnings = liveIssues.length + mockTeams.reduce((a, b) => a + b.alertsCount + b.syncIssues, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
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

      {/* Main Mentor Body */}
      <main className="flex-grow flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Mentor Content Header */}
        <div className="border-b border-slate-850 bg-slate-900/40 p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  Cohort Admin View
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-slate-100">Mentor Portal & Control Center</h1>
              <p className="text-xs text-slate-200 font-sans mt-0.5">Monitoring cohort milestones, unit-economics checks, and logical validation alerts.</p>
            </div>

            {/* Global Statistics */}
            <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="text-center px-4 border-r border-slate-850">
                <span className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono">Teams</span>
                <span className="text-lg font-bold font-mono text-slate-200">4</span>
              </div>
              <div className="text-center px-4 border-r border-slate-850">
                <span className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono">Alerts Queue</span>
                <span className="text-lg font-bold font-mono text-rose-400">{totalWarnings}</span>
              </div>
              <div className="text-center px-4">
                <span className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono">Cohort Health</span>
                <span className="text-lg font-bold font-mono text-emerald-400">82%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          {/* Left 2 Cols: Cohort Progress Matrices */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-base font-bold text-slate-100 font-mono uppercase tracking-wider">Cohort Progress Registry</h2>
            
            {/* Live Team: JetSetGo */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-lg space-y-4 backdrop-blur-sm shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-violet-300">{liveState.startup_name} (Active Session Workspace)</h3>
                  <p className="text-xs text-slate-200">Custom business-to-business charter travel optimizer & scheduler.</p>
                </div>
                <span className="text-xs bg-violet-950 text-violet-400 px-2 py-1 rounded font-semibold font-mono border border-violet-800/50">
                  Live State
                </span>
              </div>

              {/* Steps block */}
              <div className="grid grid-cols-6 gap-2">
                {Object.values(liveState.steps).map((step) => {
                  let badgeClass = "bg-slate-950 text-slate-100 border-slate-800";
                  if (step.status === "Verified") badgeClass = "bg-emerald-950/40 text-emerald-400 border-emerald-900/50 font-bold";
                  else if (step.status === "Draft") badgeClass = "bg-amber-950/40 text-amber-400 border-amber-900/50";
                  if (step.requires_resync) badgeClass = "bg-rose-950/40 text-rose-400 border-rose-900/50 animate-pulse";

                  return (
                    <div key={step.id} className={`p-2 rounded border text-center text-[10px] font-mono ${badgeClass}`}>
                      <span className="block font-bold">{step.id}</span>
                      <span className="block truncate mt-0.5 text-[8px] text-slate-200">{step.status}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-right">
                <a href="/" className="text-xs text-violet-400 hover:underline">
                  Navigate to Workspace Workspace →
                </a>
              </div>
            </div>

            {/* Mock Cohort Teams */}
            {mockTeams.map((team) => (
              <div key={team.name} className="bg-slate-900/20 border border-slate-850 p-6 rounded-lg space-y-4 shadow-sm">
                <div>
                  <h3 className="text-md font-bold text-slate-200">{team.name}</h3>
                  <p className="text-xs text-slate-200">{team.concept}</p>
                </div>

                {/* Steps block */}
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(team.steps).map((stepId) => {
                    const status = team.steps[stepId];
                    let badgeClass = "bg-slate-950 text-slate-100 border-slate-800";
                    if (status === "Verified") badgeClass = "bg-emerald-950/20 text-emerald-400 border-emerald-900/30 font-bold";
                    else if (status === "Draft") badgeClass = "bg-amber-950/20 text-amber-400 border-amber-900/30";

                    return (
                      <div key={stepId} className={`p-2 rounded border text-center text-[10px] font-mono ${badgeClass}`}>
                        <span className="block font-bold">{stepId}</span>
                        <span className="block truncate mt-0.5 text-[8px] text-slate-100">{status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right 1 Col: Live Warnings & Alerts Feed */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-100 font-mono uppercase tracking-wider">Alerts & Resync Triage Feed</h2>
            
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-lg space-y-4">
              <p className="text-xs text-slate-200 leading-relaxed">
                Below are active confirmation bias markers, logical leaps, or unit-economic discrepancies recorded in the team workspace.
              </p>

              {liveIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-100 text-xs italic border border-dashed border-slate-800 rounded">
                  No active Critic alerts or sync failures detected.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {liveIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded border text-xs space-y-2 ${
                        issue.type === "critic"
                          ? "bg-rose-950/20 border-rose-900/50 text-rose-300"
                          : issue.type === "sync"
                          ? "bg-rose-950/10 border-rose-900/30 text-rose-400"
                          : "bg-amber-950/15 border-amber-900/40 text-amber-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold bg-slate-950 px-2 py-0.5 rounded text-[10px]">
                          {issue.stepId}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold">
                          {issue.type === "critic" ? "!! Critic Alert" : issue.type === "sync" ? "Sync Issue" : "Warning"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{issue.title}</p>
                        <p className="text-slate-200 mt-1 leading-relaxed">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/85 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
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
