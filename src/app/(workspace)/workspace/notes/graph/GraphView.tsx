"use client";

import dynamic from "next/dynamic";

const NoteGraph = dynamic(() => import("@/components/notes/NoteGraph"), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GraphView({ data, focusId }: { data: { nodes: any[]; edges: any[] }; focusId?: string }) {
  return <NoteGraph data={data} focusId={focusId} />;
}
