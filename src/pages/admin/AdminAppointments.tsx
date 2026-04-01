import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctors(profiles!doctors_user_id_fkey(full_name)), profiles!appointments_patient_id_fkey(full_name)")
        .order("appointment_date", { ascending: false });
      setAppointments(data || []);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">All Appointments</h1>
          <p className="text-muted-foreground">Monitor all platform appointments.</p>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Doctor</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{apt.profiles?.full_name || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">Dr. {apt.doctors?.profiles?.full_name || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(apt.appointment_date).toLocaleDateString()}
                          <Clock className="ml-2 h-3 w-3" />
                          {new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">{apt.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No appointments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAppointments;
