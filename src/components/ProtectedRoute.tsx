import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"patient" | "doctor" | "admin">;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading, doctorStatus, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={role ? `/${role}` : "/dashboard"} replace />;
  }

  // Block pending/rejected doctors from accessing doctor routes
  if (role === "doctor" && allowedRoles?.includes("doctor") && doctorStatus && doctorStatus !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md shadow-elevated">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertTriangle className={`h-12 w-12 ${doctorStatus === "rejected" ? "text-destructive" : "text-warning"}`} />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              {doctorStatus === "rejected" ? "Application Rejected" : "Pending Approval"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {doctorStatus === "rejected"
                ? "Your doctor application was not approved. Please contact support."
                : "Your account is under review. You'll be able to access the dashboard once an admin approves your profile."}
            </p>
            <Button variant="outline" className="mt-6" onClick={signOut}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
