import React from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Navbar from "@/components/Navbar";

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center shadow-elevated animate-fade-in">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a verification link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account. Once verified, you can{" "}
              <a href="/login" className="font-medium text-primary hover:underline">
                sign in
              </a>{" "}
              to MindConnect.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
