import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data: doc } = await supabase.from("doctors").select("id").eq("user_id", user.id).single();
    if (!doc) return;
    const { data: aptRows } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doc.id)
      .order("appointment_date", { ascending: false });

    const patientIds = (aptRows || []).map((a) => a.patient_id).filter(Boolean);
    let profileMap: Record<string, { full_name: string; email: string }> = {};
    if (patientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", patientIds);
      (profiles || []).forEach((p) => {
        profileMap[p.user_id] = { full_name: p.full_name, email: p.email };
      });
    }

    setAppointments((aptRows || []).map((apt) => ({
      ...apt,
      profiles: profileMap[apt.patient_id] || null,
    })));
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const updateStatus = async (id: string, status: "pending" | "confirmed" | "cancelled" | "completed") => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast.success(`Appointment ${status}`);
    fetchAppointments();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage your patient appointments.</p>
        </div>

        {appointments.length === 0 ? (
          <Card className="shadow-card"><CardContent className="py-16 text-center text-muted-foreground">No appointments yet.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <Card key={apt.id} className="shadow-card">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display font-semibold text-foreground">{apt.profiles?.full_name || "Patient"}</p>
                    <p className="text-sm text-muted-foreground">{apt.profiles?.email}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(apt.appointment_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={
                      apt.status === "pending" ? "bg-warning/10 text-warning" :
                      apt.status === "confirmed" ? "bg-success/10 text-success" :
                      apt.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"
                    }>{apt.status}</Badge>
                    {apt.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(apt.id, "confirmed")}>Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "cancelled")}>Decline</Button>
                      </div>
                    )}
                    {apt.status === "confirmed" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "completed")}>Mark Complete</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
