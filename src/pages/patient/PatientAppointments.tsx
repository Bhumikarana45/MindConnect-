import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Clock, Star, Phone, MessageCircle, Video, PlayCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-info/10 text-info border-info/20",
};

const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [ratedAppointments, setRatedAppointments] = useState<Set<string>>(new Set());
  const [ratingDialog, setRatingDialog] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data: aptRows } = await supabase
      .from("appointments")
      .select("*, doctors(*)")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false });

    const userIds = (aptRows || []).map((a) => a.doctors?.user_id).filter(Boolean);
    let profileMap: Record<string, { full_name: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      (profiles || []).forEach((p) => {
        profileMap[p.user_id] = { full_name: p.full_name };
      });
    }

    // Fetch existing ratings for this user's appointments
    const { data: existingRatings } = await supabase
      .from("doctor_ratings")
      .select("appointment_id")
      .eq("patient_id", user.id);

    setRatedAppointments(new Set((existingRatings || []).map((r) => r.appointment_id)));

    setAppointments((aptRows || []).map((apt) => ({
      ...apt,
      doctors: apt.doctors ? {
        ...apt.doctors,
        profiles: profileMap[apt.doctors.user_id] || null,
      } : null,
    })));
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const handleCancel = async (id: string) => {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    toast.success("Appointment cancelled");
    fetchAppointments();
  };

  const openRatingDialog = (apt: any) => {
    setRatingDialog(apt);
    setRating(0);
    setHoverRating(0);
    setReview("");
  };

  const handleSubmitRating = async () => {
    if (!user || !ratingDialog || rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (review.length > 500) {
      toast.error("Review must be under 500 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("doctor_ratings").insert({
      doctor_id: ratingDialog.doctor_id,
      patient_id: user.id,
      appointment_id: ratingDialog.id,
      rating,
      review: review.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit rating. You may have already rated this appointment.");
      return;
    }
    toast.success("Thank you for your review!");
    setRatingDialog(null);
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
                    {apt.status === "completed" && !ratedAppointments.has(apt.id) && (
                      <Button size="sm" variant="outline" onClick={() => openRatingDialog(apt)} className="gap-1.5">
                        <Star className="h-3.5 w-3.5" /> Rate
                      </Button>
                    )}
                    {apt.status === "completed" && ratedAppointments.has(apt.id) && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                        <Star className="h-3 w-3 fill-current" /> Rated
                      </Badge>
                    )}
                  </div>
                </CardContent>
                {(apt.status === "confirmed" || apt.status === "pending") && (
                  <div className="flex flex-wrap gap-2 border-t border-border/60 px-6 py-3 bg-muted/30">
                    {(() => {
                      const aptTime = new Date(apt.appointment_date).getTime();
                      const canStart = Date.now() >= aptTime - 5 * 60 * 1000; // 5 min early
                      const phone = apt.doctors?.phone_number;
                      const meet = apt.doctors?.meeting_url;
                      const phoneDigits = phone ? phone.replace(/[^\d+]/g, "") : "";
                      const waNumber = phoneDigits.replace(/^\+/, "");
                      return (
                        <>
                          <Button
                            size="sm"
                            disabled={!canStart || !meet}
                            onClick={() => meet && window.open(meet, "_blank")}
                            className="gap-1.5"
                            title={!canStart ? "Available at appointment time" : !meet ? "Doctor hasn't set a meeting URL" : ""}
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> Start Session
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!phone}
                            onClick={() => phone && (window.location.href = `tel:${phoneDigits}`)}
                            className="gap-1.5"
                          >
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!waNumber}
                            onClick={() => waNumber && window.open(`https://wa.me/${waNumber}`, "_blank")}
                            className="gap-1.5"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!meet}
                            onClick={() => meet && window.open(meet, "_blank")}
                            className="gap-1.5"
                          >
                            <Video className="h-3.5 w-3.5" /> Join Video
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Rating Dialog */}
        <Dialog open={!!ratingDialog} onOpenChange={() => setRatingDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                Rate Dr. {ratingDialog?.doctors?.profiles?.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="rounded p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Review (optional)</Label>
                <Textarea
                  placeholder="Share your experience with this doctor..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">{review.length}/500</p>
              </div>
              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submitting}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PatientAppointments;