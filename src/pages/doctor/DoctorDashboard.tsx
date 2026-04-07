import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, Clock, Upload } from "lucide-react";
import { toast } from "sonner";

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Registration form state
  const [registrationId, setRegistrationId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctor = async () => {
    if (!user) return;
    setDoctorLoading(true);
    const { data: doc } = await supabase.from("doctors").select("*").eq("user_id", user.id).maybeSingle();
    setDoctor(doc);
    if (doc) {
      const { data: aptRows } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doc.id)
        .order("appointment_date", { ascending: true });

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
    }
    setDoctorLoading(false);
  };

  useEffect(() => { fetchDoctor(); }, [user]);

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    let certificateUrl: string | null = null;
    if (certificateFile) {
      const fileExt = certificateFile.name.split(".").pop();
      const filePath = `${user.id}/certificate.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, certificateFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(filePath);
        certificateUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("doctors").insert({
      user_id: user.id,
      registration_id: registrationId,
      hospital_name: hospitalName,
      specialization,
      years_of_experience: parseInt(yearsOfExperience) || 0,
      certificate_url: certificateUrl,
      status: "pending_approval",
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit details: " + error.message);
      return;
    }
    toast.success("Doctor details submitted! Awaiting admin approval.");
    fetchDoctor();
  };

  if (doctorLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  // No doctor record — show registration form
  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Complete Your Doctor Profile</h1>
            <p className="text-muted-foreground">Please submit your details for admin approval.</p>
          </div>
          <Card className="shadow-elevated">
            <CardContent className="p-6">
              <form onSubmit={handleSubmitDetails} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regId">Doctor Registration ID</Label>
                  <Input id="regId" placeholder="e.g. MED-2024-1234" value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital">Hospital / Clinic Name</Label>
                  <Input id="hospital" placeholder="City Medical Center" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spec">Specialization</Label>
                    <Input id="spec" placeholder="Psychiatry" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp">Years of Experience</Label>
                    <Input id="exp" type="number" min="0" placeholder="5" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert">Certificate / License</Label>
                  <div className="flex items-center gap-3">
                    <label htmlFor="cert" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary">
                      <Upload className="h-4 w-4" />
                      {certificateFile ? certificateFile.name : "Upload certificate"}
                    </label>
                    <input id="cert" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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