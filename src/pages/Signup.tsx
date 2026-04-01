import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, DoctorSignupData } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Eye, EyeOff, Upload } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const Signup: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"patient" | "doctor">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Doctor fields
  const [registrationId, setRegistrationId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);

    let doctorData: DoctorSignupData | undefined;
    if (tab === "doctor") {
      doctorData = {
        registrationId,
        hospitalName,
        specialization,
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        certificateFile: certificateFile || undefined,
      };
    }

    const { error } = await signUp(email, password, fullName, tab, doctorData);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Account created! Please check your email to verify.");
      navigate("/verify-email", { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg shadow-elevated animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-calm">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">Create your account</CardTitle>
            <CardDescription>Join MindConnect and start your wellness journey</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "patient" | "doctor")}>
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="patient">I'm a Patient</TabsTrigger>
                <TabsTrigger value="doctor">I'm a Doctor</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input id="signupEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <div className="relative">
                    <Input id="signupPassword" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <TabsContent value="doctor" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regId">Doctor Registration ID</Label>
                    <Input id="regId" placeholder="e.g. MED-2024-1234" value={registrationId} onChange={(e) => setRegistrationId(e.target.value)} required={tab === "doctor"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital / Clinic Name</Label>
                    <Input id="hospital" placeholder="City Medical Center" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required={tab === "doctor"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spec">Specialization</Label>
                      <Input id="spec" placeholder="Psychiatry" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required={tab === "doctor"} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exp">Years of Experience</Label>
                      <Input id="exp" type="number" min="0" placeholder="5" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} required={tab === "doctor"} />
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
                </TabsContent>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : tab === "doctor" ? "Apply as Doctor" : "Create Account"}
                </Button>
              </form>
            </Tabs>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
