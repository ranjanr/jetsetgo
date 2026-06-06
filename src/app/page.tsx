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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {/* Main content area */}
      <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-8">
          {/* Left Hand: Explanatory Branding & Actions */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-violet-950/60 border border-violet-850 text-xs font-semibold font-mono text-violet-300">
              🚀 Foundero Startup Accelerator
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Bootstrap Your Idea to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                  Product-Market Fit
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-250 leading-relaxed">
                Foundero compresses raw product ideas into a guided, 12-step structured workspace. Enter your concept, bypass manual spreadsheets, and start validating assumptions instantly.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-100 font-semibold">
              <span className="flex items-center gap-1">🟢 S1 Matrix</span>
              <span className="flex items-center gap-1">📊 S3 Spreadsheets</span>
              <span className="flex items-center gap-1">⚙️ S11 Roadmap Sprints</span>
            </div>

            {/* Dynamic CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {activeStartup ? (
                <>
                  <button
                    onClick={() => router.push("/workspace")}
                    className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold tracking-wide uppercase rounded-xl transition transform active:scale-98 shadow shadow-violet-900/40 cursor-pointer flex items-center justify-center gap-2 text-center text-white"
                  >
                    Resume Workspace ({activeStartup}) →
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold tracking-wide uppercase rounded-xl transition transform active:scale-98 cursor-pointer text-center"
                  >
                    Start New Venture
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold tracking-wide uppercase rounded-xl transition transform active:scale-98 shadow shadow-violet-900/40 cursor-pointer text-center text-white"
                >
                  Launch Foundero Accelerator →
                </button>
              )}
            </div>
          </div>

          {/* Right Hand: Premium Live Preview Mockup Card */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-6">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-mono text-slate-500 ml-2">foundero_preview_workspace</span>
                </div>
                <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                  Live Demo
                </span>
              </div>

              {/* Progress and Step Status Indicators */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono block">Step Progress Metrics</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded flex items-center justify-between">
                    <span className="text-slate-350">S1 Beachhead</span>
                    <span className="text-emerald-400 font-bold">Verified 🟢</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded flex items-center justify-between">
                    <span className="text-slate-350">S3 TAM Size</span>
                    <span className="text-emerald-400 font-bold">Verified 🟢</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded flex items-center justify-between">
                    <span className="text-slate-350">S8 Economics</span>
                    <span className="text-amber-400 font-bold">Draft 🟡</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded flex items-center justify-between">
                    <span className="text-slate-350">S11 MVBP Sprints</span>
                    <span className="text-amber-400 font-bold">Draft 🟡</span>
                  </div>
                </div>
              </div>

              {/* Interactive Checklist Mockup */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono block">Assumption Checklist</span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-slate-100">
                    <span className="text-emerald-400">✓</span>
                    <p className="leading-tight">Run S1 Matrix check to score target markets</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-slate-100">
                    <span className="text-emerald-400">✓</span>
                    <p className="leading-tight">Interview 10 core customers to validate profile persona</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded bg-slate-950 border border-slate-850 text-slate-200">
                    <span className="text-violet-400 font-bold">•</span>
                    <p className="leading-tight text-slate-200">Draft bottom-up pricing models to evaluate TAM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg cursor-pointer p-1"
              title="Close Modal"
            >
              ✕
            </button>

            <div>
              <h2 className="text-2xl font-bold">Launch Onboarding Session</h2>
              <p className="text-xs text-slate-200 mt-1 font-mono">Initialize your local workspace payload</p>
            </div>

            <form onSubmit={handleInitialize} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-150 uppercase tracking-wider font-mono mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-violet-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-150 uppercase tracking-wider font-mono mb-1">Email Address</label>
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
                <label className="block text-[10px] text-slate-150 uppercase tracking-wider font-mono mb-1">Venture / Startup Name</label>
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
                <label className="block text-[10px] text-slate-150 uppercase tracking-wider font-mono mb-1">Startup / Product Idea</label>
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
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold tracking-wide uppercase rounded-xl transition transform active:scale-98 shadow shadow-violet-900/40 cursor-pointer text-white"
              >
                Launch Framework Accelerator →
              </button>
            </form>
          </div>
        </div>
      )}

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
