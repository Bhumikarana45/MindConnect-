import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

const DoctorSchedule: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">Manage your availability and schedule.</p>
        </div>
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-lg font-semibold">Schedule Management</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your confirmed appointments will appear here. Manage your availability through the Appointments tab.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorSchedule;
