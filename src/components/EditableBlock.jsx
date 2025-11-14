// src/components/EditableBlock.jsx
import { useEditor } from "../context/EditorContext.jsx";

export default function EditableBlock({ blockId, children }) {
  const editor = useEditor();

  // ❗ Když nejsme v editoru (není EditorProvider),
  // vrátíme jen obsah bez ⚙️ a bez hooků
  if (!editor) {
    return <>{children}</>;
  }

  const { setActiveBlock } = editor;

  return (
    <div className="relative group">
      {/* Ikona ⚙️ – jen v editoru a při hoveru */}
      <button
        onClick={() => setActiveBlock(blockId)}
        className="
          absolute top-2 right-2 z-20 hidden group-hover:flex
          items-center justify-center
          h-8 w-8 rounded-lg
          bg-black/60 border border-white/10 backdrop-blur
          text-white text-sm shadow-md
          hover:bg-violet-600/80 hover:border-violet-400
          transition
        "
        title="Upravit sekci"
      >
        ⚙️
      </button>

      {children}
    </div>
  );
}

