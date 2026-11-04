"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/store/AppStore";
import { Splash } from "@/components/Splash";

export default function Home() {
  const { me } = useApp();
  const router = useRouter();
  useEffect(() => {
    router.replace(me ? "/dashboard" : "/login");
  }, [me]);
  return <Splash />;
}
