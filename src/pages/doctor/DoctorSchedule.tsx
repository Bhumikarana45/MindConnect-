import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, Video } from "lucide-react";

const DoctorSchedule: React.FC = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id, phone_number, meeting_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDoctorId(data.id);
        // Strip +91 prefix when loading so input only shows the number
        const rawPhone = data.phone_number || "";
        setPhone(rawPhone.startsWith("+91") ? rawPhone.slice(3) : rawPhone);
        setMeetingUrl(data.meeting_url || "");
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!doctorId) return;

    // Validate phone — must be 10 digits
    const digits = phone.replace(/\D/g, "");
    if (phone && digits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSaving(true);
    const fullPhone = phone ? `+91${digits}` : null;
    const { error } = await supabase
      .from("doctors")
      .update({ phone_number: fullPhone, meeting_url: meetingUrl.trim() || null })
      .eq("id", doctorId);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Contact details updated");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Schedule & Contact</h1>
          <p className="text-muted-foreground">Configure how patients reach you for sessions.</p>
        </div>
        <Card className="shadow-card max-w-xl">
          <CardHeader>
            <CardTitle className="font-display text-lg">Session Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +91
                </span>
                <Input
                  className="rounded-l-none"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter your 10-digit mobile number. +91 will be added automatically.</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> Video Meeting URL</Label>
              <Input
                placeholder="https://meet.google.com/xyz-abcd-efg"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Google Meet, Zoom, or any video conferencing link.</p>
            </div>
            <Button onClick={handleSave} disabled={saving || !doctorId} className="w-full">
              {saving ? "Saving..." : "Save Contact Details"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorSchedule;
