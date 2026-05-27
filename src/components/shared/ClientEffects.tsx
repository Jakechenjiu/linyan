"use client";

import dynamic from "next/dynamic";

const ImmersiveScene = dynamic(() => import("@/components/shared/ImmersiveScene"), {
  ssr: false,
});

const CursorGlow = dynamic(() => import("@/components/shared/CursorGlow"), {
  ssr: false,
});

export default function ClientEffects() {
  return (
    <>
      <ImmersiveScene />
      <CursorGlow />
    </>
  );
}
