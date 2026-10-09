/**
 * StudentContextForm — consolidates country, board, state, medium, and class
 * into a single screen.
 * Follows Google's pattern: "ask everything needed for the core setup in one go."
 */
import { useState } from "react";
import SubjectContextInput from '@/components/onboarding/SubjectContextInput';
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
      <SubjectContextInput data={data} updateData={updateData} />
    </>
  );
}
