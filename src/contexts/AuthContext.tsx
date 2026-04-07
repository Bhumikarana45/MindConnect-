import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "patient" | "doctor" | "admin";

const ROLE_PRIORITY: AppRole[] = ["admin", "doctor", "patient"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  doctorStatus: string | null;
  signUp: (email: string, password: string, fullName: string, role: AppRole, doctorData?: DoctorSignupData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resendOtp: (email: string) => Promise<{ error: string | null }>;
}

export interface DoctorSignupData {
  registrationId: string;
  hospitalName: string;
  specialization: string;
  yearsOfExperience: number;
  certificateFile?: File;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string): Promise<AppRole | null> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch user role:", error);
      return null;
    }

    const roles = (data ?? []).map((entry) => entry.role as AppRole);
    return ROLE_PRIORITY.find((candidate) => roles.includes(candidate)) ?? null;
  };

  const fetchDoctorStatus = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("doctors")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch doctor status:", error);
      return null;
    }

    return data?.status || null;
  };

  const ensureProfile = async (userId: string, email: string, fullName: string, selectedRole: AppRole) => {
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileLookupError) {
      console.error("Failed to check profile:", profileLookupError);
    }

    if (!existingProfile) {
      const { error: profileInsertError } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName || "",
        email: email || "",
      });

      if (profileInsertError) {
        console.error("Failed to create profile:", profileInsertError);
      }
    }

    const { data: existingRole, error: roleLookupError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", selectedRole)
      .maybeSingle();

    if (roleLookupError) {
      console.error("Failed to check role:", roleLookupError);
    }

    if (!existingRole) {
      const { error: roleInsertError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: selectedRole,
      });

      if (roleInsertError) {
        console.error("Failed to create role:", roleInsertError);
      }
    }
  };

  const handleSession = async (nextSession: Session | null) => {
    setLoading(true);
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    try {
      if (!nextSession?.user) {
        setRole(null);
        setDoctorStatus(null);
        return;
      }

      const meta = nextSession.user.user_metadata;

      await ensureProfile(
        nextSession.user.id,
        nextSession.user.email || "",
        meta?.full_name || "",
        (meta?.role as AppRole) || "patient"
      );

      const userRole = await fetchRole(nextSession.user.id);
      setRole(userRole);

      if (userRole === "doctor") {
        const status = await fetchDoctorStatus(nextSession.user.id);
        setDoctorStatus(status);
      } else {
        setDoctorStatus(null);
      }
    } catch (error) {
      console.error("Failed to sync auth session:", error);
      setRole(null);
      setDoctorStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        void handleSession(nextSession);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole, doctorData?: DoctorSignupData) => {
    // Check if email already has a different role
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .single();
    
    if (existingProfile) {
      return { error: "An account with this email already exists." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };

    if (data.user && selectedRole === "doctor" && doctorData) {
      let certificateUrl: string | null = null;
      if (doctorData.certificateFile) {
        const fileExt = doctorData.certificateFile.name.split(".").pop();
        const filePath = `${data.user.id}/certificate.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(filePath, doctorData.certificateFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(filePath);
          certificateUrl = urlData.publicUrl;
        }
      }

      const { error: doctorInsertError } = await supabase.from("doctors").insert({
        user_id: data.user.id,
        registration_id: doctorData.registrationId,
        hospital_name: doctorData.hospitalName,
        specialization: doctorData.specialization,
        years_of_experience: doctorData.yearsOfExperience,
        certificate_url: certificateUrl,
        status: "pending_approval",
      });

      if (doctorInsertError) {
        console.error("Failed to insert doctor record:", doctorInsertError);
        return { error: "Account created but failed to save doctor details. Please contact support." };
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setRole(null);
    setDoctorStatus(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    window.location.href = "/login";
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) return { error: error.message };
    return { error: null };
  };

  const resendOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, doctorStatus, signUp, signIn, signOut, verifyOtp, resendOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
