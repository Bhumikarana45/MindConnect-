import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brain, LogOut, Home, Heart, BookOpen, Activity, Users, Calendar, Shield, ClipboardList, Sparkles, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { role, signOut, user } = useAuth();
  const location = useLocation();

  const patientLinks = [
    { to: "/patient", icon: Home, label: "Overview" },
    { to: "/patient/mood", icon: Heart, label: "Mood Tracker" },
    { to: "/patient/journal", icon: BookOpen, label: "Journal" },
    { to: "/patient/phq9", icon: Activity, label: "PHQ-9 Test" },
    { to: "/patient/insights", icon: Sparkles, label: "AI Insights" },
    { to: "/patient/doctors", icon: Users, label: "Find Doctors" },
    { to: "/patient/appointments", icon: Calendar, label: "Appointments" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  const doctorLinks = [
    { to: "/doctor", icon: Home, label: "Overview" },
    { to: "/doctor/appointments", icon: Calendar, label: "Appointments" },
    { to: "/doctor/schedule", icon: ClipboardList, label: "Schedule" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  const adminLinks = [
    { to: "/admin", icon: Home, label: "Overview" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/doctors", icon: Shield, label: "Doctor Approvals" },
    { to: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  const links = role === "admin" ? adminLinks : role === "doctor" ? doctorLinks : patientLinks;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-calm">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">MindConnect</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                <div className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </div>
              </Link>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <div className="mb-3 text-xs text-muted-foreground">{user?.email}</div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">MindConnect</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {links.map((link) => (
            <Link key={link.to} to={link.to}>
              <div className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}>
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </div>
            </Link>
          ))}
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
