import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-info/10 text-info border-info/20",
};

const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*, doctors(*, profiles!doctors_user_id_fkey(full_name))")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false });
    setAppointments(data || []);
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const handleCancel = async (id: string) => {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    toast.success("Appointment cancelled");
    fetchAppointments();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Appointments</h1>
          <p className="text-muted-foreground">View and manage your scheduled sessions.</p>
        </div>

        {appointments.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-16 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-display text-lg font-semibold">No appointments</h3>
              <p className="mt-1 text-sm text-muted-foreground">Book a session with a doctor to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <Card key={apt.id} className="shadow-card">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {apt.doctors?.profiles?.full_name?.charAt(0) || "D"}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        Dr. {apt.doctors?.profiles?.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{apt.doctors?.specialization}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.appointment_date), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColors[apt.status] || ""}>
                      {apt.status}
                    </Badge>
                    {apt.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(apt.id)}>Cancel</Button>
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

export default PatientAppointments;
