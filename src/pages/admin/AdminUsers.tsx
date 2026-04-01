import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*, user_roles(role)");
      setUsers(data || []);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">All Users</h1>
          <p className="text-muted-foreground">View and manage platform users.</p>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Role</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="p-4 font-medium text-foreground">{u.full_name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {u.user_roles?.[0]?.role || "unknown"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
