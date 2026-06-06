"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingLanding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startupName, setStartupName] = useState("");
  const [productIdea, setProductIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeStartup, setActiveStartup] = useState<string | null>(null);

  // Check if a venture workspace has already been initialized
  useEffect(() => {
    fetch("/api/workspace/state")
      .then((res) => res.json())
      .then((data) => {
        const hasDrafts = Object.values(data.steps || {}).some(
          (s: any) => s.status !== "Not Started"
        );
        if (data.startup_name && (data.startup_name !== "JetSetGo" || hasDrafts)) {
          setActiveStartup(data.startup_name);
        }
      })
      .catch((err) => console.error("Error checking workspace state:", err));
  }, []);

  const loadingSteps = [
    "Spinning up Core Framework Navigator...",
    "Injecting startup acceleration pillars...",
    "Running BATCH_RUN_1: Checking initial idea for confirmation bias...",
    "Running BATCH_RUN_2: Drafting beachhead evaluation matrix...",
    "Running BATCH_RUN_2: Structuring TAM & LTV spreadsheets...",
    "Running BATCH_RUN_3: Generating execution roadmap sprints...",
    "Syncing step markdown files to local repository...",
    "Finalizing workspace deployment..."
  ];

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupName || !productIdea) {
      alert("Please provide a Startup Name and Product Idea to begin.");
      return;
    }

    setLoading(true);
    setCurrentStep(0);

    // Simulate animated loading steps for a rich entrepreneurship accelerator experience
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 600);

    try {
      const res = await fetch("/api/workspace/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_name: startupName,
          product_idea: productIdea,
          name: name || "Founder",
          email: email || "founder@startup.edu"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to initialize state.");
      }

      // Briefly wait at the final step before redirecting
      setTimeout(() => {
        clearInterval(interval);
        router.push("/workspace");
      }, 4800);

    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      alert("An error occurred during initialization. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 h-screen w-full items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent mx-auto"></div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-violet-300 animate-pulse">Initializing Venture Profile</h2>
            <p className="text-xs text-slate-100 font-mono">Reducing agency intensity...</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-left h-48 overflow-y-auto space-y-2 shadow-inner">
            {loadingSteps.slice(0, currentStep + 1).map((stepText, idx) => (
              <div key={idx} className="text-xs font-mono flex items-start gap-2 text-slate-100">
                <span className="text-emerald-400">✓</span>
                <span className={idx === currentStep ? "text-violet-300 font-bold" : "text-slate-200"}>
                  {stepText}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-center items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 min-h-screen">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Hand: Explanatory Branding */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-violet-950/60 border border-violet-850 text-xs font-semibold font-mono text-violet-300">
            🚀 Core Venture Framework Accelerator
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Bootstrap Your Idea to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              Product-Market Fit
            </span>
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed">
            The Core Framework Navigator compresses raw product ideas into a guided, 12-step structured workspace. Enter your concept, bypass manual spreadsheets, and start validating assumptions instantly.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-100">
            <span className="flex items-center gap-1">🟢 S1 Matrix</span>
            <span className="flex items-center gap-1">📊 S3 Spreadsheets</span>
            <span className="flex items-center gap-1">⚙️ S11 Roadmap Sprints</span>
          </div>
        </div>

        {/* Right Hand: Initialization Form */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl shadow-xl backdrop-blur-md space-y-6">
          {activeStartup && (
            <div className="p-4 rounded-xl border border-violet-850 bg-violet-950/20 text-center space-y-3">
              <p className="text-xs text-slate-200 font-mono">⚡ Active venture workspace detected:</p>
              <h3 className="text-sm font-bold text-violet-300">🚀 {activeStartup}</h3>
              <button
                type="button"
                onClick={() => router.push("/workspace")}
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold rounded-lg transition active:scale-98"
              >
                Resume Active Venture Workspace →
              </button>
              <div className="text-[10px] text-slate-400">
                Or initialize a new startup concept below (overwrites existing files):
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold">Launch Onboarding Session</h2>
            <p className="text-xs text-slate-200 mt-1 font-mono">Initialize your local workspace payload</p>
          </div>

          <form onSubmit={handleInitialize} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-violet-500 focus:outline-none text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="sarah@venture.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-violet-500 focus:outline-none text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono mb-1">Venture / Startup Name</label>
              <input
                type="text"
                placeholder="e.g. SonicSight"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-violet-500 focus:outline-none text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-100 uppercase tracking-wider font-mono mb-1">Startup / Product Idea</label>
              <textarea
                placeholder="e.g. ultrasonic eyeglasses cleaning box targeting boutique optometrist retail displays..."
                value={productIdea}
                onChange={(e) => setProductIdea(e.target.value)}
                required
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs focus:border-violet-500 focus:outline-none text-slate-100 leading-relaxed shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold tracking-wide uppercase rounded-xl transition transform active:scale-98 shadow shadow-violet-900/40"
            >
              Launch Framework Accelerator →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
