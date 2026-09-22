import { Link } from "react-router-dom";
export default function Support() {
  return <div className="mx-auto max-w-[850px] space-y-6 p-5 sm:p-8"><header><h1 className="text-2xl font-medium">Help with your workspace</h1><p className="mt-2 text-sm text-[#5f6368]">A few simple starting points.</p></header>{[
    ["How do I start learning?","Add a learning area from Profile, then add a topic in Learn. Explore the interactive Geometry lab, save questions in Ask, or start a project notebook in Build.","/dashboard/learn","Open Learn"],
    ["How do connections work?","Students join classes using a teacher’s code. Other connections require acceptance. Parents see study activity only after a separate family connection is accepted.","/dashboard/connections","Manage connections"],
    ["Can I learn in my own language?","Save a preferred learning language in Settings. It is included in the AI request context. The current interface is English; model-based responses and translation are not connected yet.","/dashboard/settings","Language settings"],
    ["Where is my data stored?","This preview uses this browser’s local storage. Clearing browser data may remove your workspace. It is not a production security boundary: use demonstration records, not sensitive student data.","/dashboard/profile","View profile"],
    ["Why can’t I upgrade or get an AI response?","Cloud authentication, the AI model, usage metering, payments, and ads are pending integrations. The preview never charges you or pretends to generate an AI answer.","/dashboard/subscription","Plans & usage"]
  ].map(([title,description,to,label]) => <section key={title} className="rounded-2xl border border-[#dadce0] p-6"><h2 className="text-base font-medium">{title}</h2><p className="mt-3 text-sm leading-7 text-[#5f6368]">{description}</p><Link to={to} className="mt-4 inline-block text-sm text-[#4285F4]">{label}</Link></section>)}</div>;
}
