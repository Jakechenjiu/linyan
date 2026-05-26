"use client";

import dynamic from "next/dynamic";

const SpaceBackground = dynamic(() => import("@/components/shared/SpaceBackground"), {
  ssr: false,
});

const CursorGlow = dynamic(() => import("@/components/shared/CursorGlow"), {
  ssr: false,
});

export default function ClientEffects() {
  return (
    <>
      <SpaceBackground />
      <CursorGlow />
    </>
  );
}
