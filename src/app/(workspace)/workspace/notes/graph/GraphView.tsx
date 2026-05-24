"use client";

import dynamic from "next/dynamic";

const NoteGraph = dynamic(() => import("@/components/notes/NoteGraph"), { ssr: false });

export default function GraphView({ data }: { data: { nodes: any[]; edges: any[] } }) {
  return <NoteGraph data={data} />;
}
