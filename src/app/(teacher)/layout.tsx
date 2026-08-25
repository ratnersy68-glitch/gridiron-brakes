import { redirect } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardList, Table2, Users, BarChart3, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { TeacherTopnav } from "@/components/layout/teacher-topnav";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/gradebook", label: "Gradebook", icon: Table2 },
  { href: "/students", label: "Students", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, email, role").eq("id", user.id).single();

  if (profile?.role !== "teacher") redirect("/student/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} brandLabel="Gridiron Grading" />
      <div className="flex min-h-screen flex-1 flex-col">
        <TeacherTopnav items={navItems} userName={profile.full_name} userEmail={profile.email} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
