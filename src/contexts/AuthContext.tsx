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
  certificateUrl?: string;
}

type PendingDoctorMetadata = Omit<DoctorSignupData, "certificateFile">;

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

  const getPendingDoctorData = (currentUser: User): PendingDoctorMetadata | null => {
    const pendingDoctorData = currentUser.user_metadata?.doctor_details as Partial<PendingDoctorMetadata> | undefined;

    if (!pendingDoctorData?.registrationId || !pendingDoctorData.hospitalName || !pendingDoctorData.specialization) {
      return null;
    }

    return {
      registrationId: pendingDoctorData.registrationId,
      hospitalName: pendingDoctorData.hospitalName,
      specialization: pendingDoctorData.specialization,
      yearsOfExperience: Number(pendingDoctorData.yearsOfExperience) || 0,
      certificateUrl: pendingDoctorData.certificateUrl,
    };
  };

  const syncDoctorRecord = async (currentUser: User): Promise<string | null> => {
    const existingStatus = await fetchDoctorStatus(currentUser.id);
    if (existingStatus) return existingStatus;

    const pendingDoctorData = getPendingDoctorData(currentUser);
    if (!pendingDoctorData) return null;

    const { error: doctorInsertError } = await supabase.from("doctors").insert({
      user_id: currentUser.id,
      registration_id: pendingDoctorData.registrationId,
      hospital_name: pendingDoctorData.hospitalName,
      specialization: pendingDoctorData.specialization,
      years_of_experience: pendingDoctorData.yearsOfExperience,
      certificate_url: pendingDoctorData.certificateUrl ?? null,
      status: "pending_approval",
    });

    if (doctorInsertError) {
      if (doctorInsertError.code === "23505") {
        return await fetchDoctorStatus(currentUser.id);
      }

      console.error("Failed to create doctor record from saved signup details:", doctorInsertError);
      return null;
    }

    return "pending_approval";
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
        const status = await syncDoctorRecord(nextSession.user);
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
  .maybeSingle(); // ✅ not .single()

    
    if (existingProfile) {
      return { error: "An account with this email already exists." };
    }

    let certificateUrl: string | undefined;
    if (selectedRole === "doctor" && doctorData?.certificateFile) {
      const file = doctorData.certificateFile;
      const ext = file.name.split(".").pop() || "pdf";
      const path = `pending/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("certificate")
.upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        return { error: `Certificate upload failed: ${uploadError.message}` };
      }
const { data: pub } = supabase.storage.from("certificate").getPublicUrl(path);
      certificateUrl = pub.publicUrl;
    }

    const pendingDoctorData = selectedRole === "doctor" && doctorData ? {
      registrationId: doctorData.registrationId,
      hospitalName: doctorData.hospitalName,
      specialization: doctorData.specialization,
      yearsOfExperience: doctorData.yearsOfExperience,
      certificateUrl,
    } : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
          ...(pendingDoctorData ? { doctor_details: pendingDoctorData } : {}),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };

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
  } finally {
    window.location.href = "/login";
  }
};

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) return { error: error.message };

    if (data.session) {
      await handleSession(data.session);
    }

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
