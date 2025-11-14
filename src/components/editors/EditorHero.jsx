// src/components/editors/EditorHero.jsx
import { useEffect, useState } from "react";
import { getContent, updateContent } from "../../services/contentService";
import { useEditor } from "../../context/EditorContext";

export default function EditorHero() {
  const { setBlockData } = useEditor();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  // === Načíst data při otevření editoru ===
  useEffect(() => {
    async function load() {
      const content = await getContent("hero");
      setData(content);
      setBlockData(content); // uloží pro případné preview
    }
    load();
  }, []);

  // === Debounced auto-save ===
  useEffect(() => {
    if (!data) return;

    const timeout = setTimeout(async () => {
      setSaving(true);
      await updateContent("hero", data);
      setSaving(false);
    }, 600); // 0.6s delay

    return () => clearTimeout(timeout);
  }, [data]);

  if (!data) return <p>Načítám…</p>;

  const handleChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">

      {/* HLAVNÍ NADPIS */}
      <label className="block">
        <span className="text-xs text-slate-400">Hlavní nadpis</span>
        <input
          type="text"
          value={data.headline}
          onChange={(e) => handleChange("headline", e.target.value)}
          className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-600"
        />
      </label>

      {/* PODNADPIS */}
      <label className="block">
        <span className="text-xs text-slate-400">Podnadpis</span>
        <textarea
          rows="3"
          value={data.subheadline}
          onChange={(e) => handleChange("subheadline", e.target.value)}
          className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-600"
        />
      </label>

      {/* CTA */}
      <label className="block">
        <span className="text-xs text-slate-400">CTA Text</span>
        <input
          type="text"
          value={data.ctaText}
          onChange={(e) => handleChange("ctaText", e.target.value)}
          className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-600"
        />
      </label>

      {/* VIDEO URL */}
      <label className="block">
        <span className="text-xs text-slate-400">Video URL (YouTube embed)</span>
        <input
          type="text"
          value={data.videoUrl}
          onChange={(e) => handleChange("videoUrl", e.target.value)}
          className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-600"
        />
      </label>

      {/* TAGY */}
      <label className="block">
        <span className="text-xs text-slate-400">Tagy (odděl čárkou)</span>
        <input
          type="text"
          value={data.tags?.join(", ") || ""}
          onChange={(e) =>
            handleChange(
              "tags",
              e.target.value.split(",").map((t) => t.trim())
            )
          }
          className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-600"
        />
      </label>

      <p className="text-xs text-slate-500 mt-4">
        {saving ? "Ukládám změny…" : "Uloženo ✔️"}
      </p>
    </div>
  );
}
