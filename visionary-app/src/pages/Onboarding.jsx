import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { initializeLearningWorkspace } from "@/lib/learningProfile";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import ChoiceGrid from "@/components/onboarding/ChoiceGrid";
import ChipMultiSelect from "@/components/onboarding/ChipMultiSelect";
import { InputField } from "@/components/auth/AuthUI";
import IdentitySelection from "@/components/onboarding/steps/IdentitySelection";
import AGIIntro from "@/components/onboarding/steps/AGIIntro";
import {
  NAME_STEP,
  STAGE_STEP,
  TEACHER_FLOW_STEPS,
  PARENT_FLOW_STEPS,
  ORG_FLOW_STEPS,
  getStudentStageSteps,
  generateSubjects,
} from "@/components/onboarding/stepConfigs";

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const [phase, setPhase] = useState("identity");
  const [data, setData] = useState({});
  const [currentStepId, setCurrentStepId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const updateData = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const steps = useMemo(() => {
    if (phase !== "flow") return [];
    if (data.identity === "student") {
      return [NAME_STEP, STAGE_STEP, ...getStudentStageSteps(data.education_stage)];
    }
    if (data.identity === "teacher") return [NAME_STEP, ...TEACHER_FLOW_STEPS];
    if (data.identity === "parent") return PARENT_FLOW_STEPS;
    if (data.identity === "organization") return ORG_FLOW_STEPS;
    return [];
  }, [phase, data.identity, data.education_stage]);

  const visibleSteps = useMemo(
    () => steps.filter((s) => !s.condition || s.condition(data)),
    [steps, data]
  );

  const currentStep =
    visibleSteps.find((s) => s.id === currentStepId) || visibleSteps[0];

  const canContinue = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.optional) return true;
    if (currentStep.canContinue) return currentStep.canContinue(data);
    if (currentStep.component) return true;
    if (currentStep.type === "choice") return !!data[currentStep.field];
    if (currentStep.type === "input")
      return !!(data[currentStep.field] && data[currentStep.field].trim());
    if (currentStep.type === "multiselect")
      return (
        !currentStep.required ||
        (data[currentStep.field] && data[currentStep.field].length > 0)
      );
    return true;
  }, [currentStep, data]);

  const handleIdentitySelect = (identity) => {
    setSubmissionError("");
    setData((prev) => ({ ...prev, identity }));
    setPhase("flow");
    setCurrentStepId(null);
  };

  const handleContinue = () => {
    if (currentStep?.id === "grade_level") {
      const subjects = generateSubjects(data.board, data.grade_level);
      setData((prev) => ({ ...prev, subjects, subject_confidence: {} }));
    }

    const idx = visibleSteps.findIndex((s) => s.id === currentStep?.id);
    const next = visibleSteps[idx + 1];
    if (next) {
      setCurrentStepId(next.id);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    const idx = visibleSteps.findIndex((s) => s.id === currentStep?.id);
    const prev = visibleSteps[idx - 1];
    if (prev) {
      setCurrentStepId(prev.id);
    } else {
      setPhase("identity");
      setCurrentStepId(null);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setSubmissionError("");
    try {
      const updatedUser = await updateUser({
        ...data,
        onboarding_complete: true,
        full_name: data.full_name || user?.full_name || user?.email?.split("@")[0],
      });
      await initializeLearningWorkspace(base44, updatedUser, data);
      setPhase("agi-intro");
    } catch {
      setSubmissionError("We couldn’t finish setting up your workspace. Please try again.");
      setSubmitting(false);
    }
  };

  const handleAGIComplete = () => {
    window.location.href = "/dashboard/home";
  };

  /* ── Render ── */

  if (phase === "identity") {
    return <IdentitySelection onContinue={handleIdentitySelect} />;
  }

  if (phase === "agi-intro") {
    return (
      <AGIIntro
        data={data}
        userName={data.full_name || user?.full_name || user?.email?.split("@")[0]}
        onComplete={handleAGIComplete}
      />
    );
  }

  if (!currentStep) return null;

  const stepIndex = visibleSteps.findIndex((s) => s.id === currentStep.id);

  const renderContent = () => {
    if (currentStep.component) {
      const StepComponent = currentStep.component;
      return <StepComponent data={data} updateData={updateData} />;
    }
    if (currentStep.type === "choice") {
      return (
        <ChoiceGrid
          options={currentStep.options}
          value={data[currentStep.field]}
          onChange={(v) => updateData(currentStep.field, v)}
          columns={currentStep.columns}
        />
      );
    }
    if (currentStep.type === "multiselect") {
      return (
        <ChipMultiSelect
          options={currentStep.options}
          selected={data[currentStep.field] || []}
          onChange={(v) => updateData(currentStep.field, v)}
          maxSelection={currentStep.maxSelection}
        />
      );
    }
    if (currentStep.type === "input") {
      return (
        <InputField
          label={currentStep.placeholder || currentStep.title}
          value={data[currentStep.field] || ""}
          onChange={(e) => updateData(currentStep.field, e.target.value)}
          autoFocus
        />
      );
    }
    return null;
  };

  return (
    <OnboardingLayout
      step={stepIndex + 1}
      totalSteps={visibleSteps.length}
      title={currentStep.title}
      subtitle={currentStep.subtitle}
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
      isSubmitting={submitting}
      continueLabel={currentStep.continueLabel}
    >
      {submissionError && <p className="mb-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#b3261e]" role="alert">{submissionError}</p>}
      {renderContent()}
    </OnboardingLayout>
  );
}
