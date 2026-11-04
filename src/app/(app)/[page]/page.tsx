"use client";

import { notFound, useParams } from "next/navigation";
import { PAGES } from "@/lib/core";
import { PageView } from "@/components/pages/PageView";

export default function Page() {
  const { page } = useParams<{ page: string }>();
  if (!PAGES.some((p: string[]) => p[0] === page)) notFound();
  return <PageView key={page} page={page} />;
}
