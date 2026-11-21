import {
  GraduationCap, BookOpen, Baby, School, Building2,
  FlaskConical, Network, Target, Brain, Microscope, Briefcase,
} from "lucide-react";

export const CATEGORIES = [
  { slug: "student", label: "Student", tagline: "Learn, practice, and build from what you understand.", icon: GraduationCap, color: "#0066cc", path: "/student" },
  { slug: "teacher", label: "Teacher", tagline: "Explore learning for teaching and classwork.", icon: BookOpen, color: "#34c759", path: "/teacher" },
  { slug: "parent", label: "Parent / Guardian", tagline: "Understand the learner journey and its boundaries.", icon: Baby, color: "#e30000", path: "/parent" },
  { slug: "professional", label: "Professional", tagline: "Connect learning to work and projects.", icon: Building2, color: "#9334E9", path: "/professional" },
  { slug: "organization", label: "Organization", tagline: "Explore learning paths for teams and institutions.", icon: Network, color: "#0066cc", path: "/organization" },

];

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}


/**
 * { slug: "school", label: "School", tagline: "Transform your school's learning", icon: School, color: "#0066cc", path: "/school" },
  { slug: "college", label: "College", tagline: "Modernize your college's education", icon: Building2, color: "#9334E9", path: "/college" },
  { slug: "coaching", label: "Coaching Institute", tagline: "Exam preparation, reimagined", icon: FlaskConical, color: "#ff9500", path: "/coaching" },
 * { slug: "competitive-exams", label: "Competitive Exams", tagline: "Crack any competitive exam", icon: Target, color: "#e30000", path: "/competitive-exams" },
  { slug: "ai-learning", label: "AI Learning", tagline: "Learn with AI, not against it", icon: Brain, color: "#9334E9", path: "/ai-learning" },
  { slug: "research", label: "Research", tagline: "Accelerate your research", icon: Microscope, color: "#34c759", path: "/research" },
  { slug: "career", label: "Career", tagline: "From learning to earning", icon: Briefcase, color: "#0066cc", path: "/career" },
 */
