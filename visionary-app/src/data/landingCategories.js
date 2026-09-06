import {
  GraduationCap, BookOpen, Baby, School, Building2,
  FlaskConical, Network, Target, Brain, Microscope, Briefcase,
} from "lucide-react";

export const CATEGORIES = [
  { slug: "student", label: "Student", tagline: "Master every subject and exam", icon: GraduationCap, color: "#4285F4", path: "/student" },
  { slug: "teacher", label: "Teacher", tagline: "Teach smarter, not harder", icon: BookOpen, color: "#34A853", path: "/teacher" },
  { slug: "parent", label: "Parent", tagline: "Stay connected to your child's learning", icon: Baby, color: "#EA4335", path: "/parent" },
  { slug: "professional", label: "Professional", tagline: "Modernize your college's education", icon: Building2, color: "#9334E9", path: "/professional" },
  { slug: "organization", label: "Organization", tagline: "Build your academic ecosystem", icon: Network, color: "#1a73e8", path: "/organization" },
  
];

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}


/**
 * { slug: "school", label: "School", tagline: "Transform your school's learning", icon: School, color: "#4285F4", path: "/school" },
  { slug: "college", label: "College", tagline: "Modernize your college's education", icon: Building2, color: "#9334E9", path: "/college" },
  { slug: "coaching", label: "Coaching Institute", tagline: "Exam preparation, reimagined", icon: FlaskConical, color: "#FBBC04", path: "/coaching" },
 * { slug: "competitive-exams", label: "Competitive Exams", tagline: "Crack any competitive exam", icon: Target, color: "#EA4335", path: "/competitive-exams" },
  { slug: "ai-learning", label: "AI Learning", tagline: "Learn with AI, not against it", icon: Brain, color: "#9334E9", path: "/ai-learning" },
  { slug: "research", label: "Research", tagline: "Accelerate your research", icon: Microscope, color: "#34A853", path: "/research" },
  { slug: "career", label: "Career", tagline: "From learning to earning", icon: Briefcase, color: "#1a73e8", path: "/career" },
 */