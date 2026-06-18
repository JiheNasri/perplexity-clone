
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/app/services/Supabase";

export function useLibraryHistory() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("Library")
        .select("*")
        .eq("userEmail", user?.primaryEmailAddress?.emailAddress)
        .order("id", { ascending: false })
        .limit(15); // sidebar doesn't need all records

      if (!error) setHistory(data ?? []);
      setLoading(false);
    }

    fetch();
  }, [user]);

  return { history, loading };
}