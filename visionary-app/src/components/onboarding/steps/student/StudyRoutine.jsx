import ChipMultiSelect from "@/components/onboarding/ChipMultiSelect";

const TIME_OPTIONS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

const DAY_OPTIONS = [
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "daily", label: "Daily" },
];

const DURATION_OPTIONS = [
  { id: "lt_30", label: "Under 30 min" },
  { id: "30_60", label: "30–60 min" },
  { id: "1_2", label: "1–2 hrs" },
  { id: "2_plus", label: "2+ hrs" },
];

export default function StudyRoutine({ data, updateData }) {
  const routine = data.study_routine || {};
  const setField = (field, value) =>
    updateData("study_routine", { ...routine, [field]: value });

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <p className="text-sm font-medium text-[#202124] mb-3">
          When do you prefer to study?
        </p>
        <ChipMultiSelect
          options={TIME_OPTIONS}
          selected={routine.time ? [routine.time] : []}
          onChange={(v) => setField("time", v[0])}
          maxSelection={1}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-[#202124] mb-3">
          Which days do you study?
        </p>
        <ChipMultiSelect
          options={DAY_OPTIONS}
          selected={routine.days ? [routine.days] : []}
          onChange={(v) => setField("days", v[0])}
          maxSelection={1}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-[#202124] mb-3">
          How much time can you spend daily?
        </p>
        <ChipMultiSelect
          options={DURATION_OPTIONS}
          selected={routine.duration ? [routine.duration] : []}
          onChange={(v) => setField("duration", v[0])}
          maxSelection={1}
        />
      </div>
    </div>
  );
}