/**
 * StudentContextForm — consolidates country, board, state, medium, and class
 * into a single screen.
 * Follows Google's pattern: "ask everything needed for the core setup in one go."
 */
import { useState } from "react";
import ChoiceGrid from "@/components/onboarding/ChoiceGrid";
import {
  BOARDS,
  INDIAN_STATES,
  LANGUAGES,
  CLASSES,
} from "@/components/onboarding/stepConfigs";

export default function StudentContextForm({ data, updateData }) {
  const [showState, setShowState] = useState(data.board === "State");

  const handleBoardSelect = (board) => {
    updateData("board", board);
    setShowState(board === "State");
    if (board !== "State") {
      updateData("state", null);
    }
  };

  return (
    <>
      {/* Board */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[#121317] mb-2">
          Which board are you studying under?
        </p>
        <ChoiceGrid
          options={BOARDS}
          value={data.board}
          onChange={handleBoardSelect}
          columns={2}
          singleSelect
        />
      </div>

      {/* State — conditional */}
      {showState && (
        <div className="mb-8">
          <p className="text-sm font-medium text-[#121317] mb-2">
            Which state are you in?
          </p>
          <ChoiceGrid
            options={INDIAN_STATES}
            value={data.state}
            onChange={(val) => updateData("state", val)}
            columns={3}
            singleSelect
            dense
          />
        </div>
      )}

      {/* Medium */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[#121317] mb-2">
          What language does your school use to teach?
        </p>
        <p className="text-xs text-[#5f6368] mb-2">
          This sets your preferred teaching language. Available sample material follows it; connected teaching support comes later.
        </p>
        <ChoiceGrid
          options={LANGUAGES}
          value={data.medium}
          onChange={(val) => updateData("medium", val)}
          columns={4}
          singleSelect
          dense
        />
      </div>

      {/* Class */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[#121317] mb-2">
          Which class are you studying in?
        </p>
        <p className="text-xs text-[#5f6368] mb-2">
          Board and class help locate a future official syllabus. If it is unavailable, your learning outline stays provisional.
        </p>
        <ChoiceGrid
          options={CLASSES}
          value={data.grade_level}
          onChange={(val) => updateData("grade_level", val)}
          columns={4}
          singleSelect
          dense
        />
      </div>
      <label className="mb-8 block text-sm font-medium text-[#121317]">One subject to begin with (optional)
        <input className="mt-2 w-full rounded-xl border border-[#dadce0] bg-white p-3 font-normal" maxLength={100} value={data.subjects?.[0]||''} onChange={event=>updateData('subjects',event.target.value.trim()?[event.target.value,...(data.subjects||[]).slice(1)]:[])} placeholder="For example, Mathematics"/>
        <span className="mt-2 block text-xs font-normal text-[#5f6368]">You can skip this and choose a subject in Learn. This is your label, not a verified curriculum match.</span>
      </label>
    </>
  );
}
