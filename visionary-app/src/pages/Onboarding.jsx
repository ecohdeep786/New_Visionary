import { useState, useMemo, useEffect } from "react";
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
} from "@/components/onboarding/stepConfigs";

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const draftKey=`visionary_onboarding_${user?.id}`;
  const [saved] = useState(()=>{try{return JSON.parse(localStorage.getItem(draftKey)||'null');}catch{return null;}});
  const [phase, setPhase] = useState(saved?.phase || "identity");
  const [data, setData] = useState(saved?.data || {});
  const [currentStepId, setCurrentStepId] = useState(saved?.currentStepId || null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  useEffect(()=>{if(phase==='agi-intro')return;try{localStorage.setItem(draftKey,JSON.stringify({phase,data,currentStepId}));}catch{setSubmissionError('Your setup draft could not be saved on this device. Keep this page open and try again.');}},[draftKey,phase,data,currentStepId]);

  const updateData = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const steps = useMemo(() => {
    if (phase !== "flow") return [];
    if (data.identity === "student") {
      return [NAME_STEP, STAGE_STEP, ...getStudentStageSteps(data.education_stage)];
    }
    if (data.identity === "professional") return [NAME_STEP,...getStudentStageSteps('professional')];
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
    setData((prev) => ({ ...prev, identity, ...(identity==='professional'?{education_stage:'professional'}:{}) }));
    setPhase("flow");
    setCurrentStepId(null);
  };

  const handleContinue = () => {
    const idx = visibleSteps.findIndex((s) => s.id === currentStep?.id);
    const next = visibleSteps[idx + 1];
    if (next) {
      setCurrentStepId(next.id);
    } else {
      setPhase("review");
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
      if(!data.age_band)throw new Error('Choose your age range.');
      if(data.identity!=='student'&&data.age_band!=='adult')throw new Error('This role requires an adult account in the preview. Choose the learner role instead.');
      await initializeLearningWorkspace(base44, user, {...data,identity:data.identity==='professional'?'student':data.identity});
      await updateUser({
        ...data,
        onboarding_complete: true,
        full_name: data.full_name || user?.full_name || user?.email?.split("@")[0],
      });
      setPhase("agi-intro");
      localStorage.removeItem(draftKey);
    } catch (error) {
      setSubmissionError(error.message || "We couldn’t finish setting up your workspace. Please try again.");
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

  if(phase==='review')return <OnboardingLayout title="Review your workspace" subtitle="You can change these preferences later. Use fictional information in this preview." illustration="shield" onBack={()=>setPhase('flow')} onContinue={handleComplete} canContinue={!!data.age_band} isSubmitting={submitting} continueLabel="Create my workspace">
    <dl className="space-y-4 text-sm">{[['Role',data.identity],['Name',data.full_name||user?.full_name],['Learning language',data.preferred_language||data.learning_language||'English']].map(([label,value])=><div key={label}><dt className="text-[#5f6368]">{label}</dt><dd className="mt-1 font-medium">{value||'Not provided'}</dd></div>)}</dl>
    <label className="mt-6 block text-sm">Age range<select className="mt-2 w-full rounded-xl border p-3" value={data.age_band||''} onChange={e=>updateData('age_band',e.target.value)}><option value="">Choose an age range</option><option value="minor">Under 18</option><option value="adult">18 or older</option></select></label>
    <p className="mt-3 text-xs leading-6 text-[#5f6368]">Self-reported, not verified. Guardian consent and identity verification require future services. Private learning is never automatically shared.</p>
    <label className="mt-5 block text-sm">Your curriculum or goal (optional)<textarea className="mt-2 w-full rounded-xl border p-3" rows={3} value={data.curriculum_notes||''} onChange={e=>updateData('curriculum_notes',e.target.value)} placeholder="Add a board, syllabus, language, skill or goal in your own words."/></label>
    {submissionError&&<p role="alert" className="mt-4 text-sm text-[#b3261e]">{submissionError}</p>}
  </OnboardingLayout>;

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
      illustration={currentStep.illustration}
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
