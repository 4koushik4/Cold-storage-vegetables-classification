import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ChevronRight, CloudUpload, Leaf, Loader2, RotateCcw, ScanLine, ShieldCheck, Sparkles, Upload, Video, X, Zap } from "lucide-react";
import { getVegetableConfig } from "@/config/vegetables";

type Result = { detected: boolean; error?: boolean; vegetable?: string | null; confidence?: number; message?: string };
type Mode = "camera" | "photo";

const steps = ["Capture", "Analyze", "Identify"];

export default function Index() {
  const [mode, setMode] = useState<Mode>("camera");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setStream(nextStream);
    } catch {
      setCameraError("Camera access is unavailable. You can switch to Photo Capture instead.");
    }
  }, []);

  useEffect(() => {
    if (mode === "camera" && !preview && !stream) void startCamera();
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [mode, preview, startCamera, stream]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const chooseFile = (chosen: File | null) => {
    if (!chosen || !chosen.type.startsWith("image/")) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
    setResult(null);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const captured = new File([blob], "coldveg-capture.jpg", { type: "image/jpeg" });
      chooseFile(captured);
      stream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    }, "image/jpeg", 0.92);
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCameraError(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/v1/detect", { method: "POST", body });
      const data = (await response.json()) as Result;
      if (!response.ok) throw new Error(data.message || "Unable to analyze image");
      setResult(data);
    } catch (error) {
      setResult({ detected: false, error: true, message: error instanceof Error ? error.message : "Unable to analyze image" });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    reset();
    setMode(next);
  };

  const config = result?.detected && result.vegetable ? getVegetableConfig(result.vegetable) : null;
  const confidence = Math.round((result?.confidence ?? 0) * 1000) / 10;

  return (
    <main className="min-h-screen overflow-hidden bg-[#061311] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(40,214,150,0.14),transparent_34%),radial-gradient(circle_at_0%_45%,rgba(14,118,101,0.12),transparent_28%)]" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#b9f35b] text-[#092119] shadow-[0_0_24px_rgba(185,243,91,0.25)]"><Leaf size={21} strokeWidth={2.5} /></div><div><div className="font-display text-lg font-bold tracking-[0.18em]">COLDVEG <span className="text-[#b9f35b]">AI</span></div><div className="hidden text-[10px] uppercase tracking-[0.24em] text-white/45 sm:block">Cold-storage intelligence</div></div></div>
        <div className="flex items-center gap-2 rounded-full border border-[#b9f35b]/20 bg-[#b9f35b]/[0.07] px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-[#b9f35b]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#b9f35b]" /> AI MODEL ONLINE</div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-14 pt-7 sm:px-8 lg:px-12 lg:pt-14">
        <div className="mb-10 max-w-2xl"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#64dcb4]"><Sparkles size={14} /> Computer vision for fresh inventory</div><h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">See what’s fresh.<br /><span className="text-[#b9f35b]">Store it smarter.</span></h1><p className="mt-5 max-w-lg text-sm leading-6 text-white/55 sm:text-base">Instantly identify cold-storage vegetables with a private, purpose-built vision model.</p></div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-3">
            <div className="flex items-center justify-between px-3 pb-3 pt-2"><div className="flex gap-1 rounded-xl bg-black/20 p-1"><button onClick={() => switchMode("camera")} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${mode === "camera" ? "bg-[#b9f35b] text-[#092119]" : "text-white/45 hover:text-white"}`}><Camera size={14} /> LIVE CAMERA</button><button onClick={() => switchMode("photo")} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${mode === "photo" ? "bg-[#b9f35b] text-[#092119]" : "text-white/45 hover:text-white"}`}><Upload size={14} /> PHOTO CAPTURE</button></div><span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 sm:block">Model / vegetable-classification-t6t4d/1</span></div>
            <div className="scanner-frame relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-[21px] bg-[#0b211c] sm:min-h-[475px]">
              {preview ? <img src={preview} alt="Selected vegetable preview" className="absolute inset-0 h-full w-full object-cover" /> : mode === "camera" && stream ? <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" /> : <div className="relative z-10 flex max-w-xs flex-col items-center text-center text-white/45">{cameraError ? <><X className="mb-4 rounded-full bg-red-400/10 p-3 text-red-300" size={52} /><p className="text-sm leading-6">{cameraError}</p></> : <><div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#b9f35b]/20 bg-[#b9f35b]/10 text-[#b9f35b]"><CloudUpload size={27} /></div><p className="text-sm">{mode === "photo" ? "Drop an image here or browse your device" : "Preparing your camera…"}</p></>}</div>}
              <div className="scan-corners pointer-events-none absolute inset-8 z-20" />{(stream || preview) && <div className="scan-line pointer-events-none absolute inset-x-7 z-20" />}
              {mode === "photo" && !preview && <button onClick={() => inputRef.current?.click()} onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0] ?? null); }} className={`absolute inset-6 z-30 rounded-2xl border border-dashed transition ${dragging ? "border-[#b9f35b] bg-[#b9f35b]/10" : "border-white/15 hover:border-[#b9f35b]/50"}`}><span className="sr-only">Upload image</span></button>}
              {stream && !preview && <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"><button onClick={capture} className="grid h-16 w-16 place-items-center rounded-full border-4 border-white/80 bg-[#b9f35b] text-[#092119] shadow-[0_0_0_8px_rgba(185,243,91,0.14)] transition hover:scale-105"><ScanLine size={24} /></button></div>}
              {preview && <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2"><button onClick={reset} className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-3 text-xs font-bold backdrop-blur-md"><RotateCcw size={14} /> RETAKE</button><button onClick={analyze} disabled={loading} className="flex items-center gap-2 rounded-full bg-[#b9f35b] px-5 py-3 text-xs font-bold text-[#092119] shadow-lg disabled:opacity-60">{loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} {loading ? "ANALYZING" : mode === "camera" ? "CAPTURE & ANALYZE" : "ANALYZE IMAGE"}</button></div>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} /><canvas ref={canvasRef} className="hidden" />
            <div className="flex items-center justify-between px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30"><span className="flex items-center gap-2"><ShieldCheck size={13} className="text-[#64dcb4]" /> Only approved vegetables accepted</span><span>Threshold 70%</span></div>
          </div>

          <aside className="flex flex-col gap-4">
            {result ? <ResultCard result={result} config={config} confidence={confidence} onReset={reset} /> : <div className="flex flex-1 flex-col justify-between rounded-[24px] border border-white/10 bg-white/[0.035] p-6"><div><div className="mb-7 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">How it works</span><div className="rounded-lg bg-[#b9f35b]/10 p-2 text-[#b9f35b]"><Zap size={16} /></div></div>{steps.map((step, index) => <div key={step} className="flex gap-4 pb-7 last:pb-0"><div className="relative flex flex-col items-center"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#b9f35b]/30 bg-[#b9f35b]/10 text-xs font-bold text-[#b9f35b]">0{index + 1}</div>{index < steps.length - 1 && <div className="absolute top-9 h-9 w-px bg-white/10" />}</div><div><h3 className="text-sm font-bold">{step}</h3><p className="mt-1 text-xs leading-5 text-white/40">{index === 0 ? "Point at a crop or upload a clear photo." : index === 1 ? "Our vision model checks the image securely." : "Only supported cold-storage classes pass."}</p></div></div>)}</div><div className="mt-8 rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64dcb4]">Private by design</p><p className="mt-2 text-xs leading-5 text-white/40">Images are analyzed on demand. No continuous camera streaming.</p></div></div>}
          </aside>
        </div>
      </section>
      <footer className="relative mx-auto flex max-w-7xl items-center justify-between border-t border-white/8 px-5 py-5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 sm:px-8 lg:px-12"><span>ColdVeg intelligence platform</span><span className="flex items-center gap-2"><Video size={13} /> Secure inference</span></footer>
    </main>
  );
}

function ResultCard({ result, config, confidence, onReset }: { result: Result; config: ReturnType<typeof getVegetableConfig>; confidence: number; onReset: () => void }) {
  if (result.error) return <div className="flex h-full flex-col justify-center rounded-[24px] border border-amber-300/15 bg-amber-300/[0.04] p-7"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><X size={27} /></div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Analysis unavailable</p><h2 className="mt-3 font-display text-2xl font-bold">Couldn’t analyze this image.</h2><p className="mt-3 text-sm leading-6 text-white/45">{result.message || "The detection service is temporarily unavailable. Please try again."}</p><button onClick={onReset} className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold transition hover:bg-white/10">TRY AGAIN <RotateCcw size={14} /></button></div>;
  if (!result.detected || !config) return <div className="flex h-full flex-col justify-center rounded-[24px] border border-red-300/15 bg-red-300/[0.04] p-7"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-red-300/10 text-red-300"><X size={27} /></div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">Invalid input</p><h2 className="mt-3 font-display text-2xl font-bold">No supported vegetable detected.</h2><p className="mt-3 text-sm leading-6 text-white/45">This image does not contain a supported cold-storage vegetable.</p><button onClick={onReset} className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold transition hover:bg-white/10">TRY AGAIN <RotateCcw size={14} /></button></div>;
  return <div className="rounded-[24px] border border-[#b9f35b]/25 bg-gradient-to-br from-[#b9f35b]/[0.13] to-transparent p-6 shadow-[0_0_45px_rgba(185,243,91,0.06)]"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b9f35b]">Vegetable detected</p><div className="rounded-full bg-[#b9f35b] p-1 text-[#092119]"><Check size={14} strokeWidth={3} /></div></div><div className="mt-7 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-black/20 text-[#b9f35b]"><Leaf size={31} /></div><div><h2 className="font-display text-3xl font-bold">{config.name}</h2><p className="mt-1 text-xs text-white/40">Approved cold-storage crop</p></div></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-white/35">AI confidence</p><p className="mt-2 text-2xl font-bold text-[#b9f35b]">{confidence}%</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#b9f35b]" style={{ width: `${confidence}%` }} /></div></div><div className="rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Cold storage</p><p className="mt-2 flex items-center gap-1 text-lg font-bold text-[#64dcb4]"><Check size={17} /> YES</p></div></div><div className="mt-3 rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Recommended storage</p><p className="mt-2 font-display text-2xl font-bold">{config.recommendedStorage}</p></div><button onClick={onReset} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b9f35b] px-4 py-3 text-xs font-bold text-[#092119] transition hover:bg-[#d1ff82]">SCAN AGAIN <ChevronRight size={15} /></button></div>;
}
