import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle, MapPin, Clock, Award } from "lucide-react";

const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const fetchDoctors = async () => {
    const { data: doctorRows, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch doctors:", error);
      setDoctors([]);
      return;
    }

    // Fetch profiles separately since there's no FK relationship
    const userIds = (doctorRows || []).map((d) => d.user_id);
    let profileMap: Record<string, { full_name: string; email: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      (profiles || []).forEach((p) => {
        profileMap[p.user_id] = { full_name: p.full_name, email: p.email };
      });
    }

    const merged = (doctorRows || []).map((doc) => ({
      ...doc,
      profiles: profileMap[doc.user_id] || null,
    }));

    setDoctors(merged);
  };

  useEffect(() => { fetchDoctors(); }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected" | "pending_approval") => {
    await supabase.from("doctors").update({ status }).eq("id", id);
    toast.success(`Doctor ${status === "approved" ? "approved" : "rejected"}`);
    fetchDoctors();
    setSelectedDoctor(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending_approval: "bg-warning/10 text-warning",
      approved: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive",
    };
    return map[status] || "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Doctor Approvals</h1>
          <p className="text-muted-foreground">Review and approve doctor registrations.</p>
        </div>

        {doctors.length === 0 ? (
          <Card className="shadow-card"><CardContent className="py-16 text-center text-muted-foreground">No doctor registrations.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {doctors.map((doc) => (
              <Card key={doc.id} className="shadow-card">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {doc.profiles?.full_name?.charAt(0) || "D"}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{doc.profiles?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{doc.profiles?.email}</p>
                      <p className="text-sm text-primary">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusBadge(doc.status)}>
                      {doc.status.replace("_", " ")}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDoctor(doc)}>View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Doctor Details</DialogTitle>
            </DialogHeader>
            {selectedDoctor && (
              <div className="space-y-4 pt-2">
                <div className="space-y-3">
                  <p className="font-medium text-foreground">{selectedDoctor.profiles?.full_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="h-4 w-4" /> Reg ID: {selectedDoctor.registration_id}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {selectedDoctor.hospital_name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {selectedDoctor.years_of_experience} years experience</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Specialization: {selectedDoctor.specialization}</div>
                  {selectedDoctor.certificate_url && (
                    <a href={selectedDoctor.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <FileText className="h-4 w-4" /> View Certificate
                    </a>
                  )}
                </div>
                {selectedDoctor.status === "pending_approval" && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1 gap-2" onClick={() => updateStatus(selectedDoctor.id, "approved")}>
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-2" onClick={() => updateStatus(selectedDoctor.id, "rejected")}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDoctors;
