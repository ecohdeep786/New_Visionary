/**
 * StudentContextForm — consolidates country, board, state, medium, and class
 * into a single screen.
 * Follows Google's pattern: "ask everything needed for the core setup in one go."
 */
import { useState, useEffect } from "react";
import ChoiceGrid from "@/components/onboarding/ChoiceGrid";
import {
  BOARDS,
  INDIAN_STATES,
  LANGUAGES,
  CLASSES,
  generateSubjects,
} from "@/components/onboarding/stepConfigs";

export default function StudentContextForm({ data, updateData }) {
  const [showState, setShowState] = useState(data.board === "State");

  const handleBoardSelect = (board) => {
    setShowState(board === "State");
    if (board !== "State") {
      updateData("state", null);
    }
  };

  // Auto-generate subjects whenever board + grade_level are both chosen
  useEffect(() => {
    if (data.board && data.grade_level && !data.subjects) {
      const subjects = generateSubjects(data.board, data.grade_level);
      updateData("subjects", subjects);
      if (!data.subject_confidence) {
        updateData("subject_confidence", {});
      }
    }
  }, [data.board, data.grade_level, data.subjects, data.subject_confidence, updateData]);

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
          This affects your entire learning experience — explanations, practice, and AGI conversations.
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
          This auto-configures your subjects, textbooks, and academic calendar.
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
    </>
  );
}
