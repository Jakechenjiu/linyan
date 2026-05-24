"use client";

import dynamic from "next/dynamic";

const NoteGraph = dynamic(() => import("@/components/notes/NoteGraph"), { ssr: false });

export default function GraphView({ data, focusId }: { data: { nodes: any[]; edges: any[] }; focusId?: string }) {
  return <NoteGraph data={data} focusId={focusId} />;
}
