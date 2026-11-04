"use client";

import { notFound, useParams } from "next/navigation";
import { PAGES } from "@/lib/core";
import { PageView } from "@/components/pages/PageView";
import { useApp } from "@/store/AppStore";

export default function Page() {
  const { page } = useParams<{ page: string }>();
  if (!PAGES.some((p: string[]) => p[0] === page)) notFound();
  const { me } = useApp();
  if (page === "usuarios" && me && me.perfil !== "Administrador")
    return <div style={{ padding: 24, color: "var(--text-muted)" }}>Apenas administradores gerenciam acessos.</div>;
  return <PageView key={page} page={page} />;
}
