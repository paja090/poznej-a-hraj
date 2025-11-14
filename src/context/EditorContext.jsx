// src/context/EditorContext.jsx
import { createContext, useContext, useState } from "react";

const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  const [activeBlock, setActiveBlock] = useState(null);    // např. "hero"
  const [blockData, setBlockData] = useState(null);        // data načtená z Firestore

  return (
    <EditorContext.Provider
      value={{
        activeBlock,
        setActiveBlock,
        blockData,
        setBlockData,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}
