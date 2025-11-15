// src/components/AdminBudget.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export default function AdminBudget({ darkMode, events }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newIncome, setNewIncome] = useState({
    label: "",
    amount: "",
    category: "",
  });

  const [newExpense, setNewExpense] = useState({
    label: "",
    amount: "",
    category: "",
  });

  // meta pro všechny akce (přehled)
  const [metaMap, setMetaMap] = useState({});

  const cardClasses = darkMode
    ? "rounded-2xl border border-slate-700/60 p-5 shadow-md bg-slate-800 text-white"
    : "rounded-2xl border border-slate-200 p-5 shadow-md bg-white text-slate-900";

  const subCardClasses = darkMode
    ? "rounded-xl border border-slate-700/60 p-4 bg-slate-900/40"
    : "rounded-xl border border-slate-200 p-4 bg-slate-50";

  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  const selectedEvent =
    events.find((ev) => ev.id === selectedEventId) || null;

  // === Přehled meta pro všechny akce ===
  useEffect(() => {
    if (!events || !events.length) {
      setMetaMap({});
      return;
    }

    const unsubs = events.map((ev) => {
      const metaRef = doc(db, "events", ev.id, "budget_meta");
      return onSnapshot(metaRef, (snap) => {
        setMetaMap((prev) => ({
          ...prev,
          [ev.id]: snap.exists() ? snap.data() : undefined,
        }));
      });
    });

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [events]);

  const globalSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    Object.values(metaMap).forEach((meta) => {
      if (!meta) return;
      totalIncome += Number(meta.totalIncome || 0);
      totalExpenses += Number(meta.totalExpenses || 0);
    });
    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
    };
  }, [metaMap]);

  // === Načítání příjmů + výdajů pro vybranou akci ===
  useEffect(() => {
    setIncomes([]);
    setExpenses([]);
    if (!selectedEventId) return;

    setLoading(true);
    const incomeCol = collection(
      db,
      "events",
      selectedEventId,
      "budget_income"
    );
    const expensesCol = collection(
      db,
      "events",
      selectedEventId,
      "budget_expenses"
    );

    const unsubIn = onSnapshot(incomeCol, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const da = a.createdAt?.seconds || 0;
          const dbb = b.createdAt?.seconds || 0;
          return dbb - da;
        });
      setIncomes(data);
    });

    const unsubOut = onSnapshot(expensesCol, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const da = a.createdAt?.seconds || 0;
          const dbb = b.createdAt?.seconds || 0;
          return dbb - da;
        });
      setExpenses(data);
      setLoading(false);
    });

    return () => {
      unsubIn();
      unsubOut();
    };
  }, [selectedEventId]);

  // === Součty pro vybranou akci ===
  const { totalIncome, totalExpenses, netResult } = useMemo(() => {
    const inc = incomes.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0
    );
    const exp = expenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
    return {
      totalIncome: inc,
      totalExpenses: exp,
      netResult: inc - exp,
    };
  }, [incomes, expenses]);

  // === Zápis meta do Firestore (vybraná akce) ===
  useEffect(() => {
    if (!selectedEventId) return;

    const metaRef = doc(db, "events", selectedEventId, "budget_meta");
    setDoc(
      metaRef,
      {
        totalIncome,
        totalExpenses,
        netResult,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      console.error("Chyba při ukládání budget_meta:", err);
    });
  }, [selectedEventId, totalIncome, totalExpenses, netResult]);

  // === Handlery – přidání příjmu/výdaje ===
  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (!newIncome.label.trim()) return;
    const amount = Number(newIncome.amount);
    if (Number.isNaN(amount)) return;

    const incomeCol = collection(
      db,
      "events",
      selectedEventId,
      "budget_income"
    );
    await addDoc(incomeCol, {
      label: newIncome.label.trim(),
      amount,
      category: newIncome.category.trim() || "Ostatní",
      createdAt: serverTimestamp(),
      type: "income",
    });

    setNewIncome({ label: "", amount: "", category: "" });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (!newExpense.label.trim()) return;
    const amount = Number(newExpense.amount);
    if (Number.isNaN(amount)) return;

    const expensesCol = collection(
      db,
      "events",
      selectedEventId,
      "budget_expenses"
    );
    await addDoc(expensesCol, {
      label: newExpense.label.trim(),
      amount,
      category: newExpense.category.trim() || "Ostatní",
      createdAt: serverTimestamp(),
      type: "expense",
    });

    setNewExpense({ label: "", amount: "", category: "" });
  };

  const deleteIncome = async (item) => {
    if (!selectedEventId) return;
    if (!window.confirm(`Smazat příjem "${item.label}"?`)) return;
    await deleteDoc(
      doc(db, "events", selectedEventId, "budget_income", item.id)
    );
  };

  const deleteExpense = async (item) => {
    if (!selectedEventId) return;
    if (!window.confirm(`Smazat výdaj "${item.label}"?`)) return;
    await deleteDoc(
      doc(db, "events", selectedEventId, "budget_expenses", item.id)
    );
  };

  // === Export CSV ===
  const handleExportCSV = () => {
    if (!selectedEvent || (!incomes.length && !expenses.length)) return;

    const header = [
      "Typ",
      "Položka",
      "Částka",
      "Kategorie",
      "Datum",
    ];

    const formatDate = (ts) => {
      if (ts?.toDate) {
        return ts.toDate().toLocaleString("cs-CZ");
      }
      return "";
    };

    const rows = [
      ...incomes.map((i) => [
        "Příjem",
        i.label || "",
        Number(i.amount || 0),
        i.category || "",
        formatDate(i.createdAt),
      ]),
      ...expenses.map((e) => [
        "Výdaj",
        e.label || "",
        Number(e.amount || 0),
        e.category || "",
        formatDate(e.createdAt),
      ]),
    ];

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((val) =>
            `"${String(val ?? "")
              .replace(/"/g, '""')
              .replace(/\n/g, " ")}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = selectedEvent.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `rozpocet-${safeTitle || selectedEventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatMoney = (n) =>
    `${Number(n || 0).toLocaleString("cs-CZ")} Kč`;

  return (
    <section className={cardClasses}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">💰 Rozpočet akcí</h2>
          <p className={`text-xs ${textMuted}`}>
            Sleduj příjmy, výdaje a výsledky jednotlivých akcí.
          </p>
        </div>

        <div className={`rounded-xl px-4 py-3 text-xs ${subCardClasses}`}>
          <p className="font-semibold mb-1">Souhrn všech akcí</p>
          <div className="flex flex-wrap gap-3">
            <div>
              <p className={textMuted}>Příjmy celkem</p>
              <p className="font-semibold text-emerald-300">
                {formatMoney(globalSummary.totalIncome)}
              </p>
            </div>
            <div>
              <p className={textMuted}>Výdaje celkem</p>
              <p className="font-semibold text-rose-300">
                {formatMoney(globalSummary.totalExpenses)}
              </p>
            </div>
            <div>
              <p className={textMuted}>Výsledek</p>
              <p
                className={`font-semibold ${
                  globalSummary.net >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {formatMoney(globalSummary.net)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Přehled akcí + výsledků */}
      <div className="mb-5 overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/40 text-xs">
        <table className="min-w-full">
          <thead className="bg-slate-900/80">
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-300">
              <th className="px-3 py-2">Akce</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Příjmy</th>
              <th className="px-3 py-2">Výdaje</th>
              <th className="px-3 py-2">Výsledek</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-3 text-[11px] text-slate-400"
                >
                  Zatím nejsou žádné akce.
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const meta = metaMap[ev.id];
                return (
                  <tr
                    key={ev.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/60 cursor-pointer"
                    onClick={() => setSelectedEventId(ev.id)}
                  >
                    <td className="px-3 py-2">
                      <span className="font-semibold">{ev.title}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {ev.date || ""}
                    </td>
                    <td className="px-3 py-2 text-emerald-300">
                      {meta ? formatMoney(meta.totalIncome) : "—"}
                    </td>
                    <td className="px-3 py-2 text-rose-300">
                      {meta ? formatMoney(meta.totalExpenses) : "—"}
                    </td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        meta && meta.netResult >= 0
                          ? "text-emerald-300"
                          : meta
                          ? "text-rose-300"
                          : "text-slate-400"
                      }`}
                    >
                      {meta ? formatMoney(meta.netResult) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Výběr akce */}
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <label className="flex flex-col gap-1 text-xs md:flex-row md:items-center">
          <span className={textMuted}>Vyber akci:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-1 md:mt-0 md:ml-2 rounded-md bg-slate-900/60 px-3 py-2 text-xs outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
          >
            <option value="">— vyber akci pro rozpočet —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.date || "bez data"})
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleExportCSV}
          disabled={!selectedEvent || (!incomes.length && !expenses.length)}
          className="mt-2 md:mt-0 rounded-md bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⬇️ Export rozpočtu do CSV
        </button>
      </div>

      {!selectedEventId ? (
        <p className={`text-sm ${textMuted}`}>
          Vyber nahoře akci, u které chceš sledovat příjmy a výdaje.
        </p>
      ) : (
        <>
          {/* Souhrn vybrané akce */}
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className={subCardClasses}>
              <p className={textMuted}>Příjmy</p>
              <p className="mt-1 text-xl font-bold text-emerald-300">
                {formatMoney(totalIncome)}
              </p>
            </div>
            <div className={subCardClasses}>
              <p className={textMuted}>Výdaje</p>
              <p className="mt-1 text-xl font-bold text-rose-300">
                {formatMoney(totalExpenses)}
              </p>
            </div>
            <div className={subCardClasses}>
              <p className={textMuted}>Výsledek akce</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  netResult >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatMoney(netResult)}
              </p>
            </div>
          </div>

          {loading && (
            <p className={`text-xs mb-3 ${textMuted}`}>
              Načítám položky rozpočtu…
            </p>
          )}

          {/* Příjmy + výdaje */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Příjmy */}
            <div className={subCardClasses}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Příjmy</h3>
              </div>

              {incomes.length === 0 ? (
                <p className={`text-xs ${textMuted}`}>
                  Zatím žádné příjmy – přidej první položku.
                </p>
              ) : (
                <div className="mb-3 max-h-64 overflow-y-auto rounded-lg border border-slate-700/60">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wide text-slate-300">
                      <tr className="text-left">
                        <th className="px-3 py-2">Položka</th>
                        <th className="px-3 py-2">Kategorie</th>
                        <th className="px-3 py-2 text-right">Částka</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.map((i) => (
                        <tr
                          key={i.id}
                          className="border-t border-slate-800/80 hover:bg-slate-900/60"
                        >
                          <td className="px-3 py-2">{i.label}</td>
                          <td className="px-3 py-2 text-slate-400">
                            {i.category || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-300">
                            {formatMoney(i.amount)}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              onClick={() => deleteIncome(i)}
                              className="rounded-md bg-red-600 px-2 py-1 text-[11px] hover:bg-red-700"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <form
                onSubmit={handleAddIncome}
                className="mt-3 grid gap-2 text-xs md:grid-cols-[2fr,1fr,1fr,auto]"
              >
                <input
                  type="text"
                  placeholder="Název příjmu (např. Vstupné)"
                  value={newIncome.label}
                  onChange={(e) =>
                    setNewIncome((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  className="rounded-md bg-slate-900/60 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                  required
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Částka"
                  value={newIncome.amount}
                  onChange={(e) =>
                    setNewIncome((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="rounded-md bg-slate-900/60 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Kategorie (např. vstupné)"
                  value={newIncome.category}
                  onChange={(e) =>
                    setNewIncome((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="rounded-md bg-slate-900/60 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold hover:bg-emerald-700"
                >
                  ➕ Přidat
                </button>
              </form>
            </div>

            {/* Výdaje */}
            <div className={subCardClasses}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Výdaje</h3>
              </div>

              {expenses.length === 0 ? (
                <p className={`text-xs ${textMuted}`}>
                  Zatím žádné výdaje – přidej první položku.
                </p>
              ) : (
                <div className="mb-3 max-h-64 overflow-y-auto rounded-lg border border-slate-700/60">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wide text-slate-300">
                      <tr className="text-left">
                        <th className="px-3 py-2">Položka</th>
                        <th className="px-3 py-2">Kategorie</th>
                        <th className="px-3 py-2 text-right">Částka</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr
                          key={e.id}
                          className="border-t border-slate-800/80 hover:bg-slate-900/60"
                        >
                          <td className="px-3 py-2">{e.label}</td>
                          <td className="px-3 py-2 text-slate-400">
                            {e.category || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-rose-300">
                            {formatMoney(e.amount)}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              onClick={() => deleteExpense(e)}
                              className="rounded-md bg-red-600 px-2 py-1 text-[11px] hover:bg-red-700"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <form
                onSubmit={handleAddExpense}
                className="mt-3 grid gap-2 text-xs md:grid-cols-[2fr,1fr,1fr,auto]"
              >
                <input
                  type="text"
                  placeholder="Název výdaje (např. nájem, moderátor)"
                  value={newExpense.label}
                  onChange={(e) =>
                    setNewExpense((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  className="rounded-md bg-slate-900/60 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                  required
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Částka"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="rounded-md bg-slate-900/60 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Kategorie (např. technika)"
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="rounded-md bg-slate-900/60 px-3 py-2 outline-none ring-1 ring-slate-600/60 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold hover:bg-rose-700"
                >
                  ➕ Přidat
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
