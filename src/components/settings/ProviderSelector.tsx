"use client";

import { useState } from "react";

interface Provider {
  value: string;
  label: string;
  desc: string;
  region: string;
}

export default function ProviderSelector({
  providers,
  defaultValue,
  name,
}: {
  providers: Provider[];
  defaultValue: string;
  name: string;
}) {
  const [selected, setSelected] = useState(defaultValue);

  const domestic = providers.filter((p) => p.region === "国内");
  const overseas = providers.filter((p) => p.region === "海外");

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2">国内厂商</p>
      <div className="grid grid-cols-5 gap-2 mb-3">
        {domestic.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setSelected(p.value)}
            className={`p-2.5 rounded-xl text-center cursor-pointer transition-all border ${
              selected === p.value
                ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
                : "border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)]"
            }`}
          >
            <input type="hidden" name={name} value={selected} />
            <div className="text-xs font-medium">{p.label}</div>
            <div className="text-[9px] text-muted-foreground">{p.desc}</div>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">海外厂商</p>
      <div className="grid grid-cols-3 gap-2">
        {overseas.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setSelected(p.value)}
            className={`p-2.5 rounded-xl text-center cursor-pointer transition-all border ${
              selected === p.value
                ? "border-[var(--cyan)] bg-[var(--cyan-soft)]"
                : "border-card-border hover:border-[var(--cyan)] hover:bg-[var(--accent)]"
            }`}
          >
            <div className="text-xs font-medium">{p.label}</div>
            <div className="text-[9px] text-muted-foreground">{p.desc}</div>
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}
