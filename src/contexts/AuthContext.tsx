import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "patient" | "doctor" | "admin";

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
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return (data?.role as AppRole) || null;
  };

  const fetchDoctorStatus = async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from("doctors")
      .select("status")
      .eq("user_id", userId)
      .single();
    return data?.status || null;
  };

  const ensureProfile = async (userId: string, email: string, fullName: string, selectedRole: AppRole) => {
    // Check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (!existing) {
      await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName || "",
        email: email || "",
      });
    }

    // Check if role exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (!existingRole) {
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: selectedRole,
      });
    }
  };

  const handleSession = async (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      const meta = session.user.user_metadata;
      // Ensure profile exists as fallback
      await ensureProfile(
        session.user.id,
        session.user.email || "",
        meta?.full_name || "",
        (meta?.role as AppRole) || "patient"
      );
      const userRole = await fetchRole(session.user.id);
      setRole(userRole);
      if (userRole === "doctor") {
        const status = await fetchDoctorStatus(session.user.id);
        setDoctorStatus(status);
      } else {
        setDoctorStatus(null);
      }
    } else {
      setRole(null);
      setDoctorStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleSession(session);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session);
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

      await supabase.from("doctors").insert({
        user_id: data.user.id,
        registration_id: doctorData.registrationId,
        hospital_name: doctorData.hospitalName,
        specialization: doctorData.specialization,
        years_of_experience: doctorData.yearsOfExperience,
        certificate_url: certificateUrl,
        status: "pending_approval",
      });
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setDoctorStatus(null);
    window.location.replace("/login");
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
