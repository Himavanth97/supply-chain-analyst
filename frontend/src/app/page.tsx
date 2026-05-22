"use client";

import { useState, useRef, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ExecutionAttempt {
  attempt: number;
  success: boolean;
  code: string;
  stdout: string;
  stderr: string;
  generated_charts: string[];
}

export default function Dashboard() {
  // Input states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [query, setQuery] = useState(
    "Clean and analyze this supply chain dataset, resolve any data formatting/unit anomalies, estimate holding costs or reorder levels, and output a premium dashboard visualization."
  );
  
  // UI feedback states
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  
  // Output states
  const [code, setCode] = useState<string>("");
  const [generatedCharts, setGeneratedCharts] = useState<string[]>([]);
  const [report, setReport] = useState<string>("");
  const [attempts, setAttempts] = useState<ExecutionAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Check health and config on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        setApiConfigured(data.gemini_api_configured);
      })
      .catch(() => {
        setApiConfigured(false);
      });
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Uploader Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "png", "jpg", "jpeg", "webp"].includes(ext)) {
      setError("Unsupported file format. Please upload CSV or an Image (PNG/JPG).");
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    
    if (ext !== "csv") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Preset queries
  const loadPreset = (preset: string) => {
    setQuery(preset);
  };

  // Trigger main analysis agent
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setCode("");
    setReport("");
    setGeneratedCharts([]);
    setAttempts([]);
    setLogs([]);

    addLog("🚀 Initializing Multimodal Supply Chain Analyst Agentic Engine...");
    
    // Step-by-step mock logs streaming to make the terminal look incredibly premium and alive
    setTimeout(() => addLog("📁 Processing uploaded data formats and payload metadata..."), 800);
    setTimeout(() => {
      if (file) {
        addLog(`📂 Uploaded target: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      } else {
        addLog("📂 No file uploaded. Falling back to backend/data/messy_inventory.csv");
      }
    }, 1500);
    
    setTimeout(() => addLog("🧠 Activating Gemini Multimodal Vision & Reasoning Controller..."), 2500);
    setTimeout(() => addLog("🔍 Analyzing database schema, anomalies, and target optimization goals..."), 3500);
    setTimeout(() => addLog("💻 Initiating sandboxed Python pandas/matplotlib code generation..."), 4500);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("query", query);

    try {
      // We start the real backend call after some descriptive starter logs
      await new Promise((r) => setTimeout(r, 5500));
      addLog("⚡ Executing initial script iteration inside secure subprocess sandbox...");

      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Server analysis error.");
      }

      const data = await response.json();

      if (data.success) {
        // Log all attempts including self-corrections
        if (data.execution_attempts && data.execution_attempts.length > 0) {
          data.execution_attempts.forEach((att: any) => {
            if (att.success) {
              addLog(`🟢 Attempt ${att.attempt} succeeded! Sandboxed compiler exited with returncode 0.`);
            } else {
              addLog(`🔴 Attempt ${att.attempt} failed with exit code ${att.returncode}.`);
              if (att.stderr) addLog(`⚠️ Stderr: ${att.stderr.substring(0, 150)}...`);
              addLog("🔄 AI Coordinator detected compile/runtime error. Triggering self-correction loop...");
            }
          });
        }
        
        addLog("📊 Extraction completed. Aggregating output stdout logs and statistics...");
        addLog("📈 Rendering visualization charts inside workspace directory...");
        addLog("✨ Synthesis phase initiated. Compiling high-fidelity executive report...");
        addLog("✅ Supply Chain Analysis Pipeline successfully finished!");

        setCode(data.code || "");
        setReport(data.report || "");
        setGeneratedCharts(data.generated_charts || []);
        setAttempts(data.execution_attempts || []);
      } else {
        // Failure within agent logic
        throw new Error(data.error || "Agent failed to compile and execute valid python scripts.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during execution.");
      addLog(`❌ Fatal Pipeline Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <svg className="w-5 h-5 text-slate-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Supply Chain Analyst <span className="text-[10px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">Agentic AI</span>
              </h1>
              <p className="text-xs text-slate-400">Sandboxed Python Execution & Data Cleanups</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            {apiConfigured === null ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
              </span>
            ) : apiConfigured ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Gemini Disconnected (Check .env)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand Input Console */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase font-mono border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span>Ingestion Panel</span>
              <span className="text-[10px] text-slate-500 lowercase font-normal">Step 1 & 2</span>
            </h2>

            {/* Drag and drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">Drag & Drop Inventory CSV or Dashboard Screenshot</p>
                    <p className="text-[10px] text-slate-500 mt-1">Accepts .csv, .png, .jpg up to 10MB</p>
                  </div>
                  <button type="button" className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1 rounded transition">
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Upload Preview"
                      className="max-h-28 object-contain rounded border border-slate-800 bg-slate-950"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-emerald-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="text-xs">
                    <p className="font-medium text-white truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 transition underline underline-offset-4"
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>

            {/* Instruction input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 font-mono">Analysis Instructions</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-slate-700 resize-none font-sans"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider font-mono">Preset Pipelines</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset("Recommend reorders for any item with In_Stock_Quantity < Reorder_Level. Clean Unit_Cost_USD and calculate estimated reorder costs. Generate a bar chart showing stock vs reorder level.")}
                  className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 px-2.5 py-1.5 rounded transition font-mono"
                >
                  📦 Reorder Audit
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset("Clean categorical duplicates (e.g. casing discrepancies in categories), replace missing unit costs with mean or defaults, standardize currency, and build a pie chart showing total item value distribution by category.")}
                  className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 px-2.5 py-1.5 rounded transition font-mono"
                >
                  🧹 Casing & Anomalies
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset("Compute holding costs by assuming 15% yearly rate on In_Stock_Quantity * Unit_Cost_USD. Highlight items with lead time > 10 days and plot a correlation between lead time and unit costs.")}
                  className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 px-2.5 py-1.5 rounded transition font-mono"
                >
                  💰 Carrying Cost Matrix
                </button>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={runAnalysis}
              disabled={loading || apiConfigured === false}
              className={`w-full h-11 rounded-lg font-medium text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750"
                  : apiConfigured === false
                  ? "bg-rose-950/20 text-rose-500 cursor-not-allowed border border-rose-900/30"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:opacity-90 font-bold active:scale-95 shadow-lg shadow-emerald-500/10"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Engine...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 15.3a6 6 0 01-7.8 0m9.9-3a6 6 0 01-12 0m12 0H3" />
                  </svg>
                  Execute Agent Engine
                </>
              )}
            </button>
          </div>

          {/* Running Sandbox Terminal Console */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Execution Inspector Terminal
              </span>
              <span className="text-[10px] text-slate-600 font-mono">sandbox@python</span>
            </div>
            
            <div className="bg-black/85 rounded-lg border border-slate-900 p-4 h-48 overflow-y-auto font-mono text-[11px] leading-5 text-slate-300 flex flex-col gap-1 select-text">
              {logs.length === 0 ? (
                <span className="text-slate-600 italic">Terminal idle. Waiting for engine execution...</span>
              ) : (
                logs.map((log, idx) => {
                  let colorClass = "text-slate-400";
                  if (log.includes("🟢") || log.includes("✅")) colorClass = "text-emerald-400 font-medium";
                  if (log.includes("🔴") || log.includes("❌")) colorClass = "text-rose-400 font-medium";
                  if (log.includes("🚀") || log.includes("⚡")) colorClass = "text-cyan-400";
                  if (log.includes("⚠️")) colorClass = "text-amber-400";
                  return (
                    <div key={idx} className={colorClass}>
                      {log}
                    </div>
                  );
                })
              )}
              {loading && (
                <div className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <span>█</span>
                  <span className="text-[10px]">Processing compiled instructions...</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </section>

        {/* Right Hand Output Panels */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Main Visual/Report Output Tab */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-6 text-slate-200">
              <h3 className="text-rose-400 font-semibold text-sm font-mono flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Engine Execution Error
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-mono whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {!report && !loading && !error && (
            <div className="bg-slate-900/30 border border-slate-800/60 border-dashed rounded-xl p-16 text-center flex flex-col items-center justify-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300">Awaiting Agent Initialization</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
                  Upload an inventory sheet or snapshot, choose an optimization script preset, and execute the agent to view execution reports.
                </p>
              </div>
            </div>
          )}

          {/* Analysis Outputs Display */}
          {(report || code || generatedCharts.length > 0) && (
            <div className="flex flex-col gap-8">
              
              {/* Visual Panel */}
              {generatedCharts.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-4">
                  <h3 className="text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase border-b border-slate-800 pb-3">
                    📈 Generated Dashboards & Plots
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    {generatedCharts.map((chartName, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2 overflow-hidden">
                        <img
                          src={`${BACKEND_URL}/api/charts/${chartName}`}
                          alt={`Supply Chain Chart ${idx + 1}`}
                          className="w-full aspect-video object-contain bg-slate-950/80 rounded"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                          <span>{chartName}</span>
                          <a
                            href={`${BACKEND_URL}/api/charts/${chartName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition"
                          >
                            Open Fullscreen
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Insights Markdown Report */}
              {report && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-4">
                  <h3 className="text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase border-b border-slate-800 pb-3 flex items-center justify-between">
                    <span>📑 Strategic Forensics Summary</span>
                    <span className="text-[10px] text-slate-500 font-normal font-mono">synthesized by gemini</span>
                  </h3>
                  
                  {/* Clean Markdown styled report body */}
                  <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans flex flex-col gap-4 mt-2">
                    {report.split("\n").map((line, index) => {
                      // Custom markdown parser for rendering in high fidelity without extra package conflicts
                      if (line.startsWith("# ")) {
                        return <h1 key={index} className="text-xl font-bold text-white tracking-tight mt-4 border-b border-slate-800 pb-2">{line.replace("# ", "")}</h1>;
                      }
                      if (line.startsWith("## ")) {
                        return <h2 key={index} className="text-base font-bold text-white tracking-tight mt-4 border-b border-slate-800/40 pb-1">{line.replace("## ", "")}</h2>;
                      }
                      if (line.startsWith("### ")) {
                        return <h3 key={index} className="text-sm font-bold text-white tracking-tight mt-3">{line.replace("### ", "")}</h3>;
                      }
                      if (line.startsWith("#### ")) {
                        return <h4 key={index} className="text-xs font-bold text-slate-200 mt-2 font-mono uppercase">{line.replace("#### ", "")}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        const content = line.substring(2);
                        // Highlight bold parts
                        const parts = content.split("**");
                        return (
                          <li key={index} className="ml-4 list-disc pl-1 mt-1">
                            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-medium">{part}</strong> : part)}
                          </li>
                        );
                      }
                      if (line.trim() === "") return <div key={index} className="h-2" />;
                      
                      const parts = line.split("**");
                      return (
                        <p key={index}>
                          {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-medium">{part}</strong> : part)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Generated Sandbox Code */}
              {code && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-4">
                  <h3 className="text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase border-b border-slate-800 pb-3 flex items-center justify-between">
                    <span>💻 Generated Code Execution Block</span>
                    <span className="text-[10px] text-slate-500 font-mono">auto-corrected python</span>
                  </h3>
                  
                  <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-[11px] leading-5 text-emerald-300 overflow-x-auto max-h-96 select-all">
                    <pre>{code}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-16 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 Supply Chain AI Forensics & Code Sandbox. Built with Next.js & Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}
