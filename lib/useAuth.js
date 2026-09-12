"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function useAuth({ redirectIfLoggedOut = true } = {}) {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = sem sessão
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null && redirectIfLoggedOut) router.replace("/login");
  }, [session, redirectIfLoggedOut, router]);

  return { session, loading: session === undefined, userId: session?.user?.id };
}
