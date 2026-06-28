"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "./services/Supabase";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "./context/UserDetailContext";

function Provider({ children }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState();

  useEffect(() => {
    if (user) CreateNewUser();
  }, [user]);

  const CreateNewUser = async () => {
    if (!user?.id) return;                                    // ✅ guard on Clerk ID

    const { data: users, error } = await supabase
      .from("Users")
      .select("*")
      .eq("id", user.id);                                    // ✅ lookup by Clerk ID, not email

    if (error) {
      console.error("Users fetch error:", error);
      return;
    }

    if (!users?.length) {
      const { data, error: insertError } = await supabase
        .from("Users")
        .insert([{
          id: user.id,                                       // ✅ store Clerk ID as PK
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
        }])
        .select();

      if (insertError) {
        console.error("Users insert error:", insertError);
        return;
      }

      setUserDetail(data?.[0]);
      return;
    }

    setUserDetail(users[0]);
  };

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <div className="w-full">{children}</div>
    </UserDetailContext.Provider>
  );
}

export default Provider;