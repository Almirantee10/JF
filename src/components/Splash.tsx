"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/** Tela de carregamento breve enquanto os dados locais são lidos. */
export function Splash() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ".sp-logo",
        { scale: 0.8, opacity: 0, rotate: -4 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: "back.out(1.6)" },
      );
      gsap.to(".sp-ring", { rotate: 360, duration: 1.6, ease: "none", repeat: -1 });
    },
    { scope: root },
  );
  return (
    <div
      ref={root}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--jf-green-900)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ position: "relative", width: 132, height: 132, display: "grid", placeItems: "center" }}>
        <svg className="sp-ring" width="132" height="132" viewBox="0 0 132 132" style={{ position: "absolute" }}>
          <circle cx="66" cy="66" r="62" fill="none" stroke="rgba(139,209,79,.25)" strokeWidth="2" />
          <path d="M66 4 A62 62 0 0 1 128 66" fill="none" stroke="var(--jf-green-300)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sp-logo" src="/logo.jpg" alt="Agropecuária JF" width={96} height={96} style={{ borderRadius: 20, background: "#fff", objectFit: "cover" }} />
      </div>
    </div>
  );
}
