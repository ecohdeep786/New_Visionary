import CurriculumSummary from "@/components/onboarding/steps/student/CurriculumSummary";
import SubjectConfidence from "@/components/onboarding/steps/student/SubjectConfidence";
import StudyRoutine from "@/components/onboarding/steps/student/StudyRoutine";
import OrgInfo from "@/components/onboarding/steps/org/OrgInfo";

/* ── Constants ── */

export const BOARDS = [
  { id: "CBSE", label: "CBSE", desc: "Central Board of Secondary Education" },
  { id: "CISCE", label: "CISCE", desc: "ICSE / ISC" },
  { id: "IB", label: "IB", desc: "International Baccalaureate" },
  { id: "Cambridge", label: "Cambridge", desc: "Cambridge International" },
  { id: "State", label: "State Board", desc: "Select your state" },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
].map((s) => ({ id: s, label: s }));

export const LANGUAGES = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu",
  "Kannada", "Malayalam", "Marathi", "Gujarati", "Punjabi",
  "Urdu", "Odia", "Assamese", "Others",
].map((l) => ({ id: l, label: l }));

export const CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
].map((c) => ({ id: c, label: c }));

export const LEARNING_GOALS = [
  { id: "score_90", label: "Score above 90%" },
  { id: "topper", label: "Become topper" },
  { id: "strengthen_weak", label: "Strengthen weak subjects" },
  { id: "board_prep", label: "Board exam preparation" },
  { id: "jee", label: "JEE" },
  { id: "neet", label: "NEET" },
  { id: "cuet", label: "CUET" },
  { id: "olympiad", label: "Olympiad" },
  { id: "programming", label: "Programming" },
  { id: "ai", label: "AI" },
  { id: "public_speaking", label: "Public speaking" },
  { id: "communication", label: "Communication" },
  { id: "study_habit", label: "Build study habit" },
  { id: "time_management", label: "Time management" },
];

export const REFERENCE_BOOKS = [
  "RD Sharma", "RS Aggarwal", "HC Verma", "Arihant",
  "Oswaal", "MTG", "S. Chand", "Others",
].map((b) => ({ id: b, label: b }));

export const COMPETITIVE_EXAMS = [
  { id: "none", label: "Not preparing", desc: "Skip this step" },
  { id: "JEE Main", label: "JEE Main", desc: "Engineering entrance" },
  { id: "JEE Advanced", label: "JEE Advanced", desc: "IIT entrance" },
  { id: "NEET", label: "NEET", desc: "Medical entrance" },
  { id: "CUET", label: "CUET", desc: "University entrance" },
  { id: "Olympiad", label: "Olympiad", desc: "Science/Maths olympiad" },
  { id: "Other", label: "Other", desc: "Specify later" },
];

export const NOTIFICATION_PREFS = [
  { id: "homework", label: "Homework" },
  { id: "exams", label: "Exams" },
  { id: "assignments", label: "Assignments" },
  { id: "school_notices", label: "School notices" },
  { id: "daily_reminder", label: "Daily study reminder" },
  { id: "revision", label: "Revision reminder" },
  { id: "weak_topics", label: "Weak topic practice" },
  { id: "scholarships", label: "Scholarships" },
  { id: "olympiads", label: "Olympiads" },
  { id: "career_events", label: "Career events" },
  { id: "account", label: "Account activity" },
  { id: "invitations", label: "Organization invitations" },
  { id: "updates", label: "Product updates" },
];

export const ORG_TYPES = [
  { id: "school", label: "School", desc: "Government / Private / International" },
  { id: "college", label: "College", desc: "Engineering / Medical / Arts / Commerce" },
  { id: "university", label: "University", desc: "Central / State / Deemed / Private" },
  { id: "coaching", label: "Coaching Institute", desc: "JEE / NEET / UPSC / Banking" },
  { id: "training", label: "Training Institute", desc: "Programming / AI / Design" },
];

export const TEACHER_CATEGORIES = [
  { id: "school", label: "School Teacher", desc: "Class 1 to Class 12" },
  { id: "higher_ed", label: "Higher Education Faculty", desc: "College lecturers, professors" },
  { id: "university", label: "University Faculty", desc: "UG, PG, doctoral teaching" },
  { id: "coaching", label: "Coaching Faculty", desc: "Competitive exam preparation" },
  { id: "independent", label: "Independent Teacher", desc: "Private tutors, online educators" },
];

export const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "History", "Geography", "English", "Computer Science", "Economics",
  "Commerce", "Accountancy", "Business Studies", "Others",
].map((s) => ({ id: s, label: s }));

export const EXPERIENCE_LEVELS = [
  { id: "lt_1", label: "Less than 1 year" },
  { id: "1_3", label: "1–3 years" },
  { id: "4_7", label: "4–7 years" },
  { id: "8_15", label: "8–15 years" },
  { id: "15_plus", label: "15+ years" },
];

export const TEACHER_ROLES = [
  { id: "class_teacher", label: "Class Teacher" },
  { id: "subject_teacher", label: "Subject Teacher" },
  { id: "coordinator", label: "Academic Coordinator" },
  { id: "hod", label: "Head of Department" },
  { id: "admin", label: "School Administrator" },
  { id: "principal", label: "Principal" },
];

export const TEACHING_GOALS = [
  { id: "manage_classes", label: "Manage classes" },
  { id: "support_students", label: "Support students" },
  { id: "lesson_plans", label: "Create better lesson plans" },
  { id: "engagement", label: "Improve classroom engagement" },
  { id: "track_progress", label: "Track academic progress" },
  { id: "prepare_exams", label: "Prepare examinations" },
  { id: "organize_resources", label: "Organize teaching resources" },
];

export const HIGHER_ED_INSTITUTIONS = [
  { id: "college", label: "College", desc: "Affiliated college" },
  { id: "university", label: "University", desc: "Degree-granting university" },
  { id: "autonomous", label: "Autonomous College", desc: "Self-governing institution" },
  { id: "diploma", label: "Diploma / Polytechnic", desc: "Technical diploma" },
];

export const DEGREE_PROGRAMS = [
  { id: "B.Tech", label: "B.Tech" },
  { id: "BCA", label: "BCA" },
  { id: "B.Sc", label: "B.Sc" },
  { id: "BA", label: "BA" },
  { id: "B.Com", label: "B.Com" },
  { id: "MBA", label: "MBA" },
  { id: "MCA", label: "MCA" },
  { id: "Other", label: "Other" },
];

export const CAREER_GOALS = [
  { id: "job", label: "Job" },
  { id: "higher_studies", label: "Higher studies" },
  { id: "entrepreneurship", label: "Entrepreneurship" },
  { id: "research", label: "Research" },
];

export const COMPETITIVE_TARGETS = [
  { id: "JEE Main", label: "JEE Main", desc: "Engineering" },
  { id: "JEE Advanced", label: "JEE Advanced", desc: "IIT" },
  { id: "NEET", label: "NEET", desc: "Medical" },
  { id: "UPSC", label: "UPSC", desc: "Civil Services" },
  { id: "CAT", label: "CAT", desc: "Management" },
  { id: "CLAT", label: "CLAT", desc: "Law" },
  { id: "GATE", label: "GATE", desc: "Engineering PG" },
  { id: "SSC", label: "SSC", desc: "Government jobs" },
  { id: "Banking", label: "Banking", desc: "Bank exams" },
  { id: "Railway", label: "Railway", desc: "Railway exams" },
];

export const PREP_STAGES = [
  { id: "beginner", label: "Beginner", desc: "Just started preparing" },
  { id: "intermediate", label: "Intermediate", desc: "Some preparation done" },
  { id: "advanced", label: "Advanced", desc: "Final stage preparation" },
];

export const ATTEMPT_YEARS = [
  { id: "2026", label: "2026" },
  { id: "2027", label: "2027" },
  { id: "2028", label: "2028" },
].map((y) => ({ id: y.id, label: y.label }));

export const DAILY_HOURS = [
  { id: "lt_2", label: "Under 2 hours" },
  { id: "2_4", label: "2–4 hours" },
  { id: "4_6", label: "4–6 hours" },
  { id: "6_plus", label: "6+ hours" },
];

/* ── Helper ── */

export function generateSubjects(board, gradeLevel) {
  const isHighSec = ["Class 11", "Class 12"].includes(gradeLevel);
  const isSecondary = ["Class 9", "Class 10"].includes(gradeLevel);
  const isMiddle = ["Class 6", "Class 7", "Class 8"].includes(gradeLevel);

  if (isHighSec) {
    return ["Physics", "Chemistry", "Mathematics", "English", "Computer Science"];
  }
  if (isSecondary || isMiddle) {
    return ["Mathematics", "Science", "Social Science", "English", "Hindi"];
  }
  return ["Mathematics", "English", "Hindi", "Environmental Studies", "General Knowledge"];
}

/* ── Step Definitions ── */

export const NAME_STEP = {
  id: "name",
  title: "What should we call you?",
  subtitle: "We'll use this to personalize your experience.",
  type: "input",
  field: "full_name",
  placeholder: "Your first name",
};

export const STAGE_STEP = {
  id: "stage",
  title: "What are you currently studying?",
  subtitle: "This helps us configure the right learning environment for you.",
  type: "choice",
  field: "education_stage",
  options: [
    { id: "school", label: "School Education", desc: "Class 1 to Class 12" },
    { id: "higher_ed", label: "Higher Education", desc: "College / University / Diploma" },
    { id: "competitive", label: "Competitive Examination", desc: "JEE / NEET / UPSC / CAT" },
  ],
};

export const SCHOOL_FLOW_STEPS = [
  {
    id: "country",
    title: "Where are you located?",
    subtitle: "India is pre-selected for you.",
    type: "choice",
    field: "country",
    options: [{ id: "India", label: "India", desc: "Pre-selected" }],
  },
  {
    id: "board",
    title: "Which board are you studying under?",
    type: "choice",
    field: "board",
    options: BOARDS,
  },
  {
    id: "state",
    title: "Which state are you in?",
    subtitle: "We'll auto-assign your state board.",
    type: "choice",
    field: "state",
    condition: (d) => d.board === "State",
    options: INDIAN_STATES,
    columns: 3,
  },
  {
    id: "medium",
    title: "What language does your school use to teach?",
    subtitle: "This affects your entire learning experience — explanations, practice, and AGI conversations.",
    type: "choice",
    field: "medium",
    options: LANGUAGES,
    columns: 3,
  },
  {
    id: "grade_level",
    title: "Which class are you studying in?",
    subtitle: "This auto-configures your subjects, textbooks, and academic calendar.",
    type: "choice",
    field: "grade_level",
    options: CLASSES,
    columns: 3,
  },
  {
    id: "curriculum",
    title: "Your curriculum is ready",
    subtitle: "We've auto-configured your subjects based on your selections.",
    component: CurriculumSummary,
    continueLabel: "Looks good",
  },
  {
    id: "confidence",
    title: "How confident are you in each subject?",
    subtitle: "This helps us personalize your learning from day one.",
    component: SubjectConfidence,
    canContinue: (data) => {
      const subjects = data.subjects || [];
      const confidence = data.subject_confidence || {};
      return subjects.length > 0 && subjects.every((s) => confidence[s] > 0);
    },
  },
  {
    id: "goals",
    title: "What are your learning goals?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "learning_goals",
    options: LEARNING_GOALS,
  },
  {
    id: "routine",
    title: "Tell us about your study routine",
    component: StudyRoutine,
    canContinue: (data) => {
      const r = data.study_routine;
      return r && r.time && r.days && r.duration;
    },
  },
  {
    id: "books",
    title: "Do you use reference books?",
    subtitle: "Optional — skip if you don't use any. We'll add these to your AGI's knowledge.",
    type: "multiselect",
    field: "reference_books",
    options: REFERENCE_BOOKS,
    optional: true,
  },
  {
    id: "org_connect",
    title: "Connect your school or coaching?",
    subtitle: "Optional — you can always connect later from settings.",
    type: "choice",
    field: "org_connect",
    options: [
      { id: "skip", label: "Skip for now", desc: "Full personal learning available immediately" },
      { id: "connect", label: "Connect now", desc: "Search by name or enter organization code" },
    ],
  },
  {
    id: "competitive_addon",
    title: "Are you also preparing for competitive exams?",
    subtitle: "We'll create a second learning environment alongside your school curriculum.",
    type: "choice",
    field: "competitive_exam",
    condition: (d) =>
      ["Class 9", "Class 10", "Class 11", "Class 12"].includes(d.grade_level),
    options: COMPETITIVE_EXAMS,
  },
  {
    id: "notifications",
    title: "What should we notify you about?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "notifications",
    options: NOTIFICATION_PREFS,
  },
];

export const HIGHER_ED_FLOW_STEPS = [
  {
    id: "institution_type",
    title: "What type of institution are you in?",
    type: "choice",
    field: "institution_type",
    options: HIGHER_ED_INSTITUTIONS,
  },
  {
    id: "degree",
    title: "What degree are you pursuing?",
    type: "choice",
    field: "degree_program",
    options: DEGREE_PROGRAMS,
  },
  {
    id: "department",
    title: "Which department are you in?",
    type: "choice",
    field: "department",
    options: [
      { id: "Computer Science", label: "Computer Science" },
      { id: "Mechanical", label: "Mechanical" },
      { id: "Electrical", label: "Electrical" },
      { id: "Civil", label: "Civil" },
      { id: "Commerce", label: "Commerce" },
      { id: "Mathematics", label: "Mathematics" },
      { id: "Physics", label: "Physics" },
      { id: "English", label: "English" },
      { id: "Other", label: "Other" },
    ],
  },
  {
    id: "semester",
    title: "Which semester are you in?",
    type: "choice",
    field: "semester",
    options: ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"].map((s) => ({ id: s, label: s })),
  },
  {
    id: "career_goal",
    title: "What's your career goal?",
    type: "choice",
    field: "career_goal",
    options: CAREER_GOALS,
  },
  {
    id: "goals",
    title: "What are your learning goals?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "learning_goals",
    options: LEARNING_GOALS,
  },
  {
    id: "notifications",
    title: "What should we notify you about?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "notifications",
    options: NOTIFICATION_PREFS,
  },
];

export const COMPETITIVE_FLOW_STEPS = [
  {
    id: "target_exam",
    title: "Which exam are you preparing for?",
    type: "choice",
    field: "target_exam",
    options: COMPETITIVE_TARGETS,
  },
  {
    id: "attempt_year",
    title: "When are you attempting the exam?",
    type: "choice",
    field: "attempt_year",
    options: ATTEMPT_YEARS,
  },
  {
    id: "prep_stage",
    title: "What's your current preparation level?",
    type: "choice",
    field: "prep_stage",
    options: PREP_STAGES,
  },
  {
    id: "daily_hours",
    title: "How many hours can you study per day?",
    subtitle: "This is critical for generating your preparation roadmap.",
    type: "choice",
    field: "daily_hours",
    options: DAILY_HOURS,
  },
  {
    id: "goals",
    title: "What are your learning goals?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "learning_goals",
    options: LEARNING_GOALS,
  },
  {
    id: "coaching",
    title: "Are you enrolled in coaching?",
    type: "choice",
    field: "coaching_enrolled",
    options: [
      { id: "no", label: "No", desc: "Self-study" },
      { id: "yes", label: "Yes", desc: "Connect your coaching institute" },
    ],
  },
  {
    id: "notifications",
    title: "What should we notify you about?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "notifications",
    options: NOTIFICATION_PREFS,
  },
];

export function getStudentStageSteps(stage) {
  if (stage === "higher_ed") return HIGHER_ED_FLOW_STEPS;
  if (stage === "competitive") return COMPETITIVE_FLOW_STEPS;
  return SCHOOL_FLOW_STEPS;
}

export const TEACHER_FLOW_STEPS = [
  {
    id: "teacher_category",
    title: "What kind of teacher are you?",
    type: "choice",
    field: "teacher_category",
    options: TEACHER_CATEGORIES,
  },
  {
    id: "board",
    title: "Which board do you teach under?",
    type: "choice",
    field: "board",
    options: BOARDS,
  },
  {
    id: "state",
    title: "Which state are you in?",
    type: "choice",
    field: "state",
    condition: (d) => d.board === "State",
    options: INDIAN_STATES,
    columns: 3,
  },
  {
    id: "medium",
    title: "Which language do you use to teach?",
    type: "choice",
    field: "medium",
    options: LANGUAGES,
    columns: 3,
  },
  {
    id: "teacher_classes",
    title: "Which classes do you teach?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "teacher_classes",
    options: CLASSES,
    required: true,
  },
  {
    id: "teacher_subjects",
    title: "Which subjects do you teach?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "teacher_subjects",
    options: SUBJECTS,
    required: true,
  },
  {
    id: "experience",
    title: "How much teaching experience do you have?",
    type: "choice",
    field: "experience",
    options: EXPERIENCE_LEVELS,
  },
  {
    id: "role",
    title: "What's your current role?",
    type: "choice",
    field: "teacher_role",
    options: TEACHER_ROLES,
  },
  {
    id: "goals",
    title: "What do you want to achieve with Visionary?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "teaching_goals",
    options: TEACHING_GOALS,
  },
];

export const PARENT_RELATIONS = [
  { id: "mother", label: "Mother" },
  { id: "father", label: "Father" },
  { id: "guardian", label: "Guardian" },
];

export const PARENT_TRACK_GOALS = [
  { id: "daily_progress", label: "Daily study progress" },
  { id: "exam_prep", label: "Exam preparation" },
  { id: "weak_topics", label: "Weak topic alerts" },
  { id: "screen_time", label: "Healthy study time" },
  { id: "milestones", label: "Milestone celebrations" },
  { id: "study_habits", label: "Building study habits" },
];

export const PARENT_FLOW_STEPS = [
  {
    id: "name",
    title: "What should we call you?",
    subtitle: "We'll use this to personalize your parent experience.",
    type: "input",
    field: "full_name",
    placeholder: "Your first name",
  },
  {
    id: "parent_relation",
    title: "What's your relation to the child?",
    type: "choice",
    field: "parent_relation",
    options: PARENT_RELATIONS,
  },
  {
    id: "child_name",
    title: "What's your child's name?",
    subtitle: "We'll greet your child by name in their dashboard.",
    type: "input",
    field: "child_name",
    placeholder: "Child's first name",
  },
  {
    id: "child_stage",
    title: "What is your child currently studying?",
    subtitle: "This helps us show the right curriculum and milestones.",
    type: "choice",
    field: "child_stage",
    options: [
      { id: "school", label: "School", desc: "Class 1 to Class 12" },
      { id: "higher_ed", label: "Higher Education", desc: "College / University" },
      { id: "competitive", label: "Competitive Exam", desc: "JEE / NEET / UPSC" },
    ],
  },
  {
    id: "board",
    title: "Which board does your child study under?",
    type: "choice",
    field: "board",
    condition: (d) => d.child_stage === "school",
    options: BOARDS,
  },
  {
    id: "grade_level",
    title: "Which class is your child in?",
    type: "choice",
    field: "grade_level",
    condition: (d) => d.child_stage === "school",
    options: CLASSES,
    columns: 3,
  },
  {
    id: "medium",
    title: "What language does your child learn in?",
    subtitle: "We'll show progress reports in this language.",
    type: "choice",
    field: "medium",
    options: LANGUAGES,
    columns: 3,
  },
  {
    id: "track_goals",
    title: "What would you like to track?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "parent_track_goals",
    options: PARENT_TRACK_GOALS,
  },
];

export const ORG_FLOW_STEPS = [
  {
    id: "org_type",
    title: "What type of organization are you?",
    type: "choice",
    field: "org_type",
    options: ORG_TYPES,
  },
  {
    id: "org_info",
    title: "Tell us about your institution",
    subtitle: "This creates your institution's public profile.",
    component: OrgInfo,
    canContinue: (data) =>
      data.org_name && data.org_email && data.org_address && data.org_city && data.org_pin,
  },
  {
    id: "org_board",
    title: "Which board does your institution follow?",
    type: "choice",
    field: "org_board",
    options: BOARDS,
  },
  {
    id: "org_medium",
    title: "What languages do you teach in?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "org_medium",
    options: LANGUAGES,
  },
  {
    id: "org_classes",
    title: "Which classes do you offer?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "org_classes",
    options: CLASSES,
    condition: (d) => d.org_type === "school",
  },
  {
    id: "org_programs",
    title: "Which degree programs do you offer?",
    subtitle: "Select all that apply.",
    type: "multiselect",
    field: "org_programs",
    options: DEGREE_PROGRAMS,
    condition: (d) => ["college", "university"].includes(d.org_type),
  },
];