import { Home, BookOpen, MessageCircleQuestion, PencilRuler, Boxes, Crown, GraduationCap, BarChart3, Users, HeartHandshake, LibraryBig } from "lucide-react";
const item = (key, label, icon) => ({ key, label, icon, to: "/dashboard/" + key });
const shared = [item("ask", "Ask", MessageCircleQuestion), item("subscription", "Plans", Crown)];
export function navigationFor(role) {
  switch (role) {
    case "teacher": return [item("home", "Classes", GraduationCap), item("insights", "Insights", BarChart3), ...shared];
    case "parent": return [item("home", "Home", Home), item("child", "My child", HeartHandshake), ...shared];
    case "organization": return [item("home", "Overview", Home), item("people", "People", Users), item("curriculum", "Curriculum", LibraryBig), item("analytics", "Analytics", BarChart3), ...shared];
    default: return [item("home", "Home", Home), item("classes", "Classes", GraduationCap), item("learn", "Learn", BookOpen), shared[0], item("practice", "Practice", PencilRuler), item("build", "Build", Boxes), shared[1]];
  }
}
export function canAccessDashboardPath(role, path) {
  const section = path.split("/")[2] || "home";
  if (["profile", "settings"].includes(section)) return true;
  if (section === "class") return ["student", "teacher"].includes(role);
  return navigationFor(role).some(item => item.key === section);
}
