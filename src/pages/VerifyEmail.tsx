import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const email = (location.state as { email?: string })?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 6) { toast.error("Please enter the full 6-digit code"); return; }
    setLoading(true);
    const { error } = await verifyOtp(email, otp);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Email verified! Welcome to MindConnect.");
      navigate("/");
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await resendOtp(email);
    setResending(false);
    if (error) toast.error(error);
    else toast.success("Verification code resent!");
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center shadow-elevated animate-fade-in">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Verify your email</CardTitle>
            <CardDescription>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full" onClick={handleVerify} disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
            <button className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50" onClick={handleResend} disabled={resending}>
              {resending ? "Resending..." : "Didn't get the code? Resend"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
