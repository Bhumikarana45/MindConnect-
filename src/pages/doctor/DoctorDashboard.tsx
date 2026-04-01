import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock } from "lucide-react";

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: doc } = await supabase.from("doctors").select("*").eq("user_id", user.id).single();
      setDoctor(doc);
      if (doc) {
        const { data: apts } = await supabase
          .from("appointments")
          .select("*, profiles!appointments_patient_id_fkey(full_name, email)")
          .eq("doctor_id", doc.id)
          .order("appointment_date", { ascending: true });
        setAppointments(apts || []);
      }
    };
    fetch();
  }, [user]);

  if (doctor?.status === "pending_approval") {
    return (
      <DashboardLayout>
        <Card className="mx-auto max-w-md shadow-elevated">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-warning" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">Pending Approval</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is under review. You'll be notified once an admin approves your profile.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (doctor?.status === "rejected") {
    return (
      <DashboardLayout>
        <Card className="mx-auto max-w-md shadow-elevated">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">Application Rejected</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Unfortunately, your application was not approved. Please contact support for more information.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Manage your appointments and schedule.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-warning">{appointments.filter(a => a.status === "pending").length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-success">{appointments.filter(a => a.status === "confirmed").length}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Upcoming Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No appointments scheduled.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">{apt.profiles?.full_name || "Patient"}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(apt.appointment_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      apt.status === "pending" ? "bg-warning/10 text-warning" :
                      apt.status === "confirmed" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }>{apt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
