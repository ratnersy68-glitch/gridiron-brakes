import { redirect } from "next/navigation";
import { LayoutDashboard, ClipboardList, Award, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";
import { Topnav } from "@/components/layout/topnav";

const navItems: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/student/grades", label: "Grades", icon: Award },
  { href: "/student/join", label: "Join a Class", icon: KeyRound }
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, email, role").eq("id", user.id).single();
  if (profile?.role !== "student") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} brandLabel="Gridiron Grading" />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topnav items={navItems} brandLabel="Gridiron Grading" title="Student Portal" userName={profile.full_name} userEmail={profile.email} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
