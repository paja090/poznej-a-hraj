// src/components/EditorShell.jsx
import PublicApp from "../PublicApp.jsx";
import { EditorProvider } from "../context/EditorContext.jsx";
import { useEditor } from "../context/EditorContext.jsx";

import EditorHero from "./editors/EditorHero.jsx";
import EditorAbout from "./editors/EditorAbout.jsx";
import EditorFooter from "./editors/EditorFooter.jsx";

export default function EditorShell({ user, onLogout }) {
  return (
    <EditorProvider>
      <EditorShellContent user={user} onLogout={onLogout} />
    </EditorProvider>
  );
}

function EditorShellContent({ user, onLogout }) {
  const { activeBlock } = useEditor();

  const editors = {
    hero: { title: "Hero sekce", component: <EditorHero /> },
    about: { title: "O projektu", component: <EditorAbout /> },
    footer: { title: "Patička", component: <EditorFooter /> },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Horní lišta */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-400 to-emerald-400 grid place-items-center text-sm font-bold shadow-lg">
            PH
          </div>
          <div>
            <p className="text-sm font-semibold">Poznej & Hraj – Editor obsahu</p>
            <p className="text-xs text-slate-400">
              Režim inline úprav · klikni na ⚙️ u sekce pro editaci
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Admin"}
                  className="w-8 h-8 rounded-full border border-slate-600"
                />
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-white text-xs md:text-sm">
                  {user.displayName || "Admin"}
                </span>
                <span className="text-[10px] md:text-xs text-slate-400">
                  {user.email}
                </span>
              </div>
            </div>
          )}

          <a
            href="#/admin"
            className="hidden md:inline-flex text-xs px-3 py-1 rounded-full border border-slate-700 text-slate-300 hover:border-violet-500 hover:text-white transition"
          >
            ⬅ Zpět na dashboard
          </a>

          <button
            onClick={onLogout}
            className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 shadow-md"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      {/* Dvoupanelový layout */}
      <main className="flex flex-1 min-h-0">

        {/* Levý panel: živý náhled */}
        <section className="flex-1 min-w-0 border-r border-slate-800 bg-[#05060a] overflow-y-auto">
          <PublicApp isEditor={true} />
        </section>

        {/* Pravý panel – editor */}
        <aside className="w-full max-w-md bg-slate-950/95 border-l border-slate-800 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800">
            <p className="text-sm font-semibold">
              {activeBlock ? editors[activeBlock].title : "Vyber sekci"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeBlock
                ? "Uprav hodnoty a změny se automaticky uloží."
                : "Klikni vlevo na ikonu ⚙️ u libovolné sekce."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300">
            {activeBlock ? editors[activeBlock].component : null}
          </div>
        </aside>

      </main>
    </div>
  );
}

