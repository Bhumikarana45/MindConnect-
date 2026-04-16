import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Award, Clock, Star } from "lucide-react";

const DoctorDirectory: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data: doctorRows } = await supabase
        .from("doctors")
        .select("*")
        .eq("status", "approved");

      const userIds = (doctorRows || []).map((d) => d.user_id);
      const doctorIds = (doctorRows || []).map((d) => d.id);
      let profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      let ratingsMap: Record<string, { avg: number; count: number }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
      }

      if (doctorIds.length > 0) {
        const { data: ratings } = await supabase
          .from("doctor_ratings")
          .select("doctor_id, rating")
          .in("doctor_id", doctorIds);

        (ratings || []).forEach((r) => {
          if (!ratingsMap[r.doctor_id]) {
            ratingsMap[r.doctor_id] = { avg: 0, count: 0 };
          }
          ratingsMap[r.doctor_id].count += 1;
          ratingsMap[r.doctor_id].avg += r.rating;
        });

        Object.keys(ratingsMap).forEach((id) => {
          ratingsMap[id].avg = ratingsMap[id].avg / ratingsMap[id].count;
        });
      }

      setDoctors((doctorRows || []).map((doc) => ({
        ...doc,
        profiles: profileMap[doc.user_id] || null,
        ratings: ratingsMap[doc.id] || null,
      })));
    };
    fetchDoctors();
  }, []);

  const handleBook = async () => {
    if (!user || !selectedDoctor || !bookingDate) return;
    setBooking(true);
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: selectedDoctor.id,
      appointment_date: new Date(bookingDate).toISOString(),
      status: "pending",
    });
    setBooking(false);
    if (error) { toast.error("Failed to book appointment"); return; }
    toast.success("Appointment requested!");
    setSelectedDoctor(null);
    setBookingDate("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Find a Doctor</h1>
          <p className="text-muted-foreground">Browse verified mental health professionals.</p>
        </div>

        {doctors.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No approved doctors available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc) => (
              <Card key={doc.id} className="shadow-card transition-all hover:shadow-elevated">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {doc.profiles?.full_name?.charAt(0) || "D"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground">Dr. {doc.profiles?.full_name || "Unknown"}</h3>
                      <p className="text-sm text-primary">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {doc.hospital_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {doc.years_of_experience} years experience
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-3.5 w-3.5" /> Reg: {doc.registration_id}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {doc.ratings ? (
                        <span className="font-medium text-foreground">
                          {doc.ratings.avg.toFixed(1)} <span className="text-muted-foreground font-normal">({doc.ratings.count} {doc.ratings.count === 1 ? "review" : "reviews"})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No reviews yet</span>
                      )}
                    </div>
                  </div>
                  <Button className="mt-4 w-full" onClick={() => setSelectedDoctor(doc)}>Book Appointment</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Book Appointment with Dr. {selectedDoctor?.profiles?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Preferred Date & Time</Label>
                <Input type="datetime-local" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
              </div>
              <Button onClick={handleBook} disabled={!bookingDate || booking} className="w-full">
                {booking ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDirectory;