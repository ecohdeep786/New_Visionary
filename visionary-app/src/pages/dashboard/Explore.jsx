import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, BookmarkPlus } from "lucide-react";
import { appClient } from "@/api/appClient";
import { localDate } from "@/lib/learningMetrics";

export default function Explore() {
  const [side, setSide] = useState(3);
  const [rotation, setRotation] = useState(35);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const started = useRef(Date.now());
  const size = 60 + side * 12;
  async function save() {
    if (busy || saved) return;
    setBusy(true);
    try {
      const subjects = await appClient.entities.Subject.list();
      if (!subjects.some(s => s.name === "Geometry")) await appClient.entities.Subject.create({ name: "Geometry", overall_mastery: 0 });
      const topics = await appClient.entities.Topic.filter({ subject: "Geometry", name: "Understanding cube volume" });
      if (!topics.length) await appClient.entities.Topic.create({ subject: "Geometry", name: "Understanding cube volume", status: "in-progress", mastery: 0, last_studied: localDate(), lab: "cube-volume" });
      const minutes = Math.floor((Date.now() - started.current) / 60000);
      if (minutes > 0) await appClient.entities.StudyLog.create({ date: localDate(), topic: "Understanding cube volume", subject: "Geometry", duration_minutes: minutes, activity_type: "exploration" });
      setSaved(true); setNotice("Added to Geometry in Learn. Exploration does not count as assessed mastery.");
    } catch (err) { setNotice(err.message || "Could not save this exploration."); }
    finally { setBusy(false); }
  }
  const faces = ["translateZ", "back", "left", "right", "top", "bottom"];
  const transforms = [`translateZ(${size/2}px)`,`rotateY(180deg) translateZ(${size/2}px)`,`rotateY(-90deg) translateZ(${size/2}px)`,`rotateY(90deg) translateZ(${size/2}px)`,`rotateX(90deg) translateZ(${size/2}px)`,`rotateX(-90deg) translateZ(${size/2}px)`];
  return <div className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-8"><Link to="/dashboard/learn" className="inline-flex items-center gap-2 text-sm text-[#5f6368]"><ArrowLeft className="h-4 w-4" />Back to Learn</Link><header><p className="text-xs font-medium uppercase tracking-wider text-[#1967d2]">Interactive lab · Geometry</p><h1 className="mt-2 text-2xl font-medium">Small change. Another dimension.</h1><p className="mt-2 text-sm leading-6 text-[#5f6368]">If you double a cube’s side, does its volume double too? Move the slider and discover why.</p></header>
    <div className="grid overflow-hidden rounded-2xl border border-[#dadce0] lg:grid-cols-[1.3fr_1fr]"><div className="flex min-h-[330px] items-center justify-center overflow-hidden bg-[#f3f7fe] p-10" style={{ perspective: "800px" }} role="img" aria-label={`A cube with side ${side} units and volume ${side ** 3} cubic units, rotated ${rotation} degrees.`}>
      <div aria-hidden="true" style={{ width:size,height:size,transformStyle:"preserve-3d",transform:`rotateX(-22deg) rotateY(${rotation}deg)`,transition:"transform 100ms ease" }}>{faces.map((f,i) => <div key={f} style={{position:"absolute",width:size,height:size,transform:transforms[i],border:"1px solid #1967d2",background:i%2 ? "rgba(109,158,230,.65)" : "rgba(176,204,247,.78)",backfaceVisibility:"hidden",display:"grid",placeItems:"center",color:"#174ea6",fontSize:24}}>{side}</div>)}</div>
    </div><div className="space-y-6 p-6 sm:p-8"><label className="block text-sm font-medium">Side length <span className="float-right text-[#1967d2]">{side} units</span><input type="range" min="1" max="8" step="1" value={side} onChange={e => setSide(Number(e.target.value))} className="mt-4 w-full accent-[#1967d2]" /></label><label className="block text-sm font-medium">Rotate the cube <span className="float-right text-[#5f6368]">{rotation}°</span><input type="range" min="0" max="360" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="mt-4 w-full accent-[#1967d2]" /></label><div className="rounded-xl bg-[#f8fafd] p-5" aria-live="polite"><p className="text-xs text-[#5f6368]">Volume = side × side × side</p><p className="mt-2 text-xl font-medium">{side} × {side} × {side} = {side ** 3}</p><p className="mt-1 text-xs text-[#5f6368]">cubic units</p></div><p className="text-sm leading-6 text-[#5f6368]">A cube grows in three directions. Doubling the side makes the volume 2 × 2 × 2 = 8 times larger.</p><button onClick={() => { setSide(3); setRotation(35); }} className="inline-flex items-center gap-2 text-sm text-[#1967d2]"><RotateCcw className="h-4 w-4" />Reset view</button></div></div>
    <div className="flex flex-wrap items-center gap-3"><button disabled={busy || saved} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-5 py-2.5 text-sm text-white disabled:opacity-50"><BookmarkPlus className="h-4 w-4" />{busy ? "Saving…" : saved ? "Added to Learn" : "Add to my learning"}</button><Link to="/dashboard/ask?subject=Geometry&topic=Understanding%20cube%20volume" className="rounded-full border border-[#dadce0] px-5 py-2.5 text-sm text-[#1967d2]">Ask about this idea</Link><Link to="/dashboard/build?subject=Geometry&topic=Understanding%20cube%20volume" className="rounded-full border border-[#dadce0] px-5 py-2.5 text-sm text-[#1967d2]">Build with this idea</Link></div>{notice && <p role="status" className="text-sm leading-6 text-[#5f6368]">{notice}</p>}
  </div>;
}
