// Auth context — manages Supabase session + profile fetch with retries.
// Owned by: Claude Code. Do not refactor without coordinating.

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  sudoku_rating: number | null;
  sudoku_games_played: number | null;
  sudoku_puzzles_solved: number | null;
  sudoku_current_streak: number | null;
  sudoku_best_streak: number | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfileWithRetry(userId: string, attempts = 3): Promise<Profile | null> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, username, display_name, avatar_url, xp, level, sudoku_rating, sudoku_games_played, sudoku_puzzles_solved, sudoku_current_streak, sudoku_best_streak"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (data) return data as Profile;
    if (error && error.code !== "PGRST116") {
      // Real error, not "no rows" — surface it.
      // eslint-disable-next-line no-console
      console.error("fetchProfile error:", error);
      return null;
    }
    // No rows yet — trigger may still be creating profile. Backoff.
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await fetchProfileWithRetry(user.id);
    setProfile(p);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const p = await fetchProfileWithRetry(data.session.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        const p = await fetchProfileWithRetry(nextSession.user.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
