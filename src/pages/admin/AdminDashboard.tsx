import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, Calendar, CheckCircle } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, pendingDoctors: 0, appointments: 0, approvedDoctors: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [profiles, pending, approved, apts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: profiles.count || 0,
        pendingDoctors: pending.count || 0,
        approvedDoctors: approved.count || 0,
        appointments: apts.count || 0,
      });
    };
    fetch();
  }, []);

  const cards = [
    { icon: Users, label: "Total Users", value: stats.users, color: "text-primary", bg: "bg-primary/10" },
    { icon: Shield, label: "Pending Doctors", value: stats.pendingDoctors, color: "text-warning", bg: "bg-warning/10" },
    { icon: CheckCircle, label: "Approved Doctors", value: stats.approvedDoctors, color: "text-success", bg: "bg-success/10" },
    { icon: Calendar, label: "Appointments", value: stats.appointments, color: "text-info", bg: "bg-info/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the MindConnect platform.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
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

export default AdminDashboard;
