import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const LOCAL_ADMIN_KEY = "billiards.admin.local.v1";

export type AdminSession = {
  isAdmin: boolean;
  email: string | null;
  session: Session | null;
};

export async function getAdminSession(): Promise<AdminSession> {
  if (!isSupabaseConfigured || !supabase) {
    return { isAdmin: localStorage.getItem(LOCAL_ADMIN_KEY) === "true", email: null, session: null };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return { isAdmin: false, email: null, session: null };

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("email")
    .eq("user_id", data.session.user.id)
    .maybeSingle();

  return {
    isAdmin: Boolean(profile),
    email: profile?.email ?? data.session.user.email ?? null,
    session: data.session,
  };
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  if (!isSupabaseConfigured || !supabase) {
    localStorage.setItem(LOCAL_ADMIN_KEY, "true");
    return { isAdmin: true, email: email || null, session: null };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const session = await getAdminSession();
  if (!session.isAdmin) {
    await supabase.auth.signOut();
    throw new Error("not_invited");
  }
  return session;
}

export async function logoutAdmin() {
  localStorage.removeItem(LOCAL_ADMIN_KEY);
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}
