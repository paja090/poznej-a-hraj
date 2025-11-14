// src/components/EditorShell.jsx
import PublicApp from "../PublicApp.jsx";
import { EditorProvider } from "../context/EditorContext.jsx";

export default function EditorShell({ user, onLogout }) {
  return (
    <EditorProvider>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Horní lišta editoru */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-400 to-emerald-400 grid place-items-center text-sm font-bold shadow-lg">
            PH
          </div>
          <div>
            <p className="text-sm font-semibold">Poznej &amp; Hraj – Editor obsahu</p>
            <p className="text-xs text-slate-400">
              Režim inline úprav &middot; klikni na ⚙️ u sekce pro editaci
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
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
            </>
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

      {/* Hlavní dvoupanelový layout */}
      <main className="flex flex-1 min-h-0">
        {/* Levý panel – živý náhled stránky */}
        <section className="flex-1 min-w-0 border-r border-slate-800 bg-[#05060a] overflow-y-auto">
          {/* Tady později zapneme editor mód (⚙️), teď je to čistý náhled */}
          <PublicApp />
        </section>

        {/* Pravý panel – editor vybrané sekce */}
        <aside className="w-full max-w-md bg-slate-950/95 border-l border-slate-800 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800">
            <p className="text-sm font-semibold">Panel úprav</p>
            <p className="text-xs text-slate-400 mt-1">
              V další fázi sem přidáme formuláře pro úpravu jednotlivých bloků (hero,
              akce, recenze, footer…).
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300 space-y-4">
            <p>
              V dalším kroku:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
              <li>zavedeme <strong>EditableBlock</strong> komponentu s ikonou ⚙️</li>
              <li>přidáme <strong>EditorContext</strong> pro aktivní blok</li>
              <li>vytvoříme první editor – např. <code>EditorHero.jsx</code></li>
              <li>rozjedeme autouložení do Firestore + historii změn</li>
            </ul>

            <p className="mt-4 text-xs text-slate-500">
              Teď si jen ověř, že adresa <code>#/editor</code> funguje a vidíš dvoupanelový
              layout (náhled vlevo, editor panel vpravo).
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
        </div>
    </EditorProvider>
  );
}
