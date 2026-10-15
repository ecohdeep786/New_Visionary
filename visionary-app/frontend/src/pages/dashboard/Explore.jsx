import { useWorkspace } from '@/hooks/useWorkspace';
import { legacyLearningCopy } from '@/lib/legacyLearningCopy';
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, RotateCcw, BookmarkPlus } from "lucide-react";
import { appClient } from "@/api/appClient";
import { localDate } from "@/lib/learningMetrics";
import CubeLearningEntry from '@/components/dashboard/CubeLearningEntry';
export default function Explore() {
  const [params] = useSearchParams();const {ctx}=useWorkspace();
  return params.get('legacy') === '1' ? <LegacyExplore key={ctx?.personId+':'+ctx?.workspaceId}/> : <CubeLearningEntry />;
}
function LegacyExplore() {
  const {
    data: workspaceData
  } = useWorkspace();
  const locale = workspaceData?.preferences.interfaceLocale || 'en';
  const copy = legacyLearningCopy(locale);
  const [side, setSide] = useState(3);
  const [rotation, setRotation] = useState(35);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const started = useRef(Date.now());const live=useRef(true);useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  const size = 60 + side * 12;
  async function save() {
    if (busy || saved) return;
    setBusy(true);
    try {
      const subjects = await appClient.entities.Subject.list();
      if(!live.current)return;
      if (!subjects.some(s => s.name === "Geometry")) await appClient.entities.Subject.create({
        name: "Geometry",
        overall_mastery: 0
      });
      if(!live.current)return;
      const topics = await appClient.entities.Topic.filter({
        subject: "Geometry",
        name: "Understanding cube volume"
      });
      if(!live.current)return;
      if (!topics.length) await appClient.entities.Topic.create({
        subject: "Geometry",
        name: "Understanding cube volume",
        status: "in-progress",
        mastery: 0,
        last_studied: localDate(),
        lab: "cube-volume"
      });
      if(!live.current)return;
      const minutes = Math.floor((Date.now() - started.current) / 60000);
      if (minutes > 0) await appClient.entities.StudyLog.create({
        date: localDate(),
        topic: "Understanding cube volume",
        subject: "Geometry",
        duration_minutes: minutes,
        activity_type: "exploration"
      });
      if(!live.current)return;setSaved(true);
      setNotice("Added to your previous Geometry topics in Learn. Exploration does not count as assessed mastery.");
    } catch (err) {
      if(live.current)setNotice(err.message || "Could not save this exploration.");
    } finally {
      if(live.current)setBusy(false);
    }
  }
  const faces = ["translateZ", "back", "left", "right", "top", "bottom"];
  const transforms = [`translateZ(${size / 2}px)`, `rotateY(180deg) translateZ(${size / 2}px)`, `rotateY(-90deg) translateZ(${size / 2}px)`, `rotateY(90deg) translateZ(${size / 2}px)`, `rotateX(90deg) translateZ(${size / 2}px)`, `rotateX(-90deg) translateZ(${size / 2}px)`];
  return <div className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-8" lang={locale}><Link to="/dashboard/learn?legacy=1&subject=Geometry" className="inline-flex items-center gap-2 text-sm text-[#5f6368]"><ArrowLeft className="h-4 w-4" />{copy("Back to previous topics")}</Link><header><p className="text-xs font-medium uppercase tracking-wider text-[#0b57d2]">{copy("Previous interactive lab \xB7 Geometry")}</p><h1 className="mt-2 text-2xl font-medium">{copy("Small change. Another dimension.")}</h1><p className="mt-2 text-sm leading-6 text-[#5f6368]">{copy("If you double a cube\u2019s side, does its volume double too? Move the slider and discover why.")}</p></header>
    <div className="grid overflow-hidden rounded-2xl border border-[#dadce0] lg:grid-cols-[1.3fr_1fr]"><div className="flex min-h-[330px] items-center justify-center overflow-hidden bg-[#ffffff] p-10" style={{
        perspective: "800px"
      }} role="img" aria-label={copy('A cube with side {side} units and volume {volume} cubic units, rotated {rotation} degrees.',{side,volume:side**3,rotation})}>
      <div aria-hidden="true" style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          transform: `rotateX(-22deg) rotateY(${rotation}deg)`,
          transition: "transform 100ms ease"
        }}>{faces.map((f, i) => <div key={f} style={{
            position: "absolute",
            width: size,
            height: size,
            transform: transforms[i],
            border: "1px solid #0b57d2",
            background: i % 2 ? "rgba(109,158,230,.65)" : "rgba(176,204,247,.78)",
            backfaceVisibility: "hidden",
            display: "grid",
            placeItems: "center",
            color: "#3367d6",
            fontSize: 24
          }}>{side}</div>)}</div>
    </div><div className="space-y-6 p-6 sm:p-8"><label className="block text-sm font-medium">{copy("Side length")} <span className="float-right text-[#0b57d2]">{copy("{side} units",{side})}</span><input type="range" min="1" max="8" step="1" value={side} onChange={e => setSide(Number(e.target.value))} className="mt-4 w-full accent-[#0b57d2]" /></label><label className="block text-sm font-medium">{copy("Rotate the cube")} <span className="float-right text-[#5f6368]">{rotation}°</span><input type="range" min="0" max="360" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="mt-4 w-full accent-[#0b57d2]" /></label><div className="rounded-xl bg-[#ffffff] p-5" aria-live="polite"><p className="text-xs text-[#5f6368]">{copy("Volume = side \xD7 side \xD7 side")}</p><p className="mt-2 text-xl font-medium">{side} × {side} × {side} = {side ** 3}</p><p className="mt-1 text-xs text-[#5f6368]">{copy("cubic units")}</p></div><p className="text-sm leading-6 text-[#5f6368]">{copy("A cube grows in three directions. Doubling the side makes the volume 2 \xD7 2 \xD7 2 = 8 times larger.")}</p><button onClick={() => {
          setSide(3);
          setRotation(35);
        }} className="inline-flex items-center gap-2 text-sm text-[#0b57d2]"><RotateCcw className="h-4 w-4" />{copy("Reset view")}</button></div></div>
    <div className="flex flex-wrap items-center gap-3"><button disabled={busy || saved} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-[#0b57d2] px-5 py-2.5 text-sm text-white disabled:opacity-50"><BookmarkPlus className="h-4 w-4" />{busy ? copy("Saving\u2026") : saved ? copy("Added to Learn") : copy("Add to my learning")}</button><Link to="/dashboard/ask?subject=Geometry&topic=Understanding%20cube%20volume" className="rounded-full border border-[#dadce0] px-5 py-2.5 text-sm text-[#0b57d2]">{copy("Ask about this idea")}</Link><Link to="/dashboard/build?subject=Geometry&topic=Understanding%20cube%20volume" className="rounded-full border border-[#dadce0] px-5 py-2.5 text-sm text-[#0b57d2]">{copy("Build with this idea")}</Link></div>{notice && <p role="status" className="text-sm leading-6 text-[#5f6368]">{copy(notice)}</p>}
  </div>;
}
