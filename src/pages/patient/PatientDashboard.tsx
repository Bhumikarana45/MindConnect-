import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, BookOpen, Activity, Calendar } from "lucide-react";

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ moods: 0, journals: 0, phq9: 0, appointments: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [m, j, p, a] = await Promise.all([
        supabase.from("mood_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("phq9_results").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("patient_id", user.id),
      ]);
      setStats({
        moods: m.count || 0,
        journals: j.count || 0,
        phq9: p.count || 0,
        appointments: a.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const cards = [
    { icon: Heart, label: "Mood Entries", value: stats.moods, color: "text-destructive", bg: "bg-destructive/10" },
    { icon: BookOpen, label: "Journal Entries", value: stats.journals, color: "text-info", bg: "bg-info/10" },
    { icon: Activity, label: "PHQ-9 Tests", value: stats.phq9, color: "text-primary", bg: "bg-primary/10" },
    { icon: Calendar, label: "Appointments", value: stats.appointments, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back 👋</h1>
          <p className="text-muted-foreground">Here's an overview of your wellness journey.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
