// context/LibraryContext.jsx
"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/app/services/Supabase";

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const { user, isLoaded } = useUser(); // ✅ add isLoaded
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("Library")
      .select("*")
      .eq("userEmail", user?.primaryEmailAddress?.emailAddress)
      .order("id", { ascending: false })
      .limit(15);

    if (!error) setHistory(data ?? []);
    setLoading(false);
  }, [user]);

  // ✅ Wait for Clerk to finish loading before fetching
  useEffect(() => {
    if (!isLoaded) return;
    refresh();
  }, [refresh, isLoaded]);

  return (
    <LibraryContext.Provider value={{ history, loading, refresh }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibraryHistory() {
  const context = useContext(LibraryContext);
  if (!context) return { history: [], loading: false, refresh: () => {} };
  return context;
}