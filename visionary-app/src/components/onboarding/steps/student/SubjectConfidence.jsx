import StarRating from "@/components/onboarding/StarRating";

export default function SubjectConfidence({ data, updateData }) {
  const subjects = data.subjects || [];
  const confidence = data.subject_confidence || {};

  const setRating = (subject, rating) => {
    updateData("subject_confidence", { ...confidence, [subject]: rating });
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {subjects.map((subject) => (
        <div
          key={subject}
          className="flex items-center justify-between py-3 border-b border-[#e8eaed] last:border-0"
        >
          <span className="text-sm font-medium text-[#202124]">{subject}</span>
          <StarRating
            value={confidence[subject] || 0}
            onChange={(r) => setRating(subject, r)}
          />
        </div>
      ))}
    </div>
  );
}