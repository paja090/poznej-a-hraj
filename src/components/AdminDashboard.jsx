import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function AdminDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Admin panel – Poznej & Hraj</h1>
        <div className="flex items-center gap-4">
          <img
            src={user.photoURL}
            alt="Admin avatar"
            className="w-8 h-8 rounded-full"
          />
          <button
            onClick={() => { signOut(auth); onLogout(); }}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      <nav className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <a href="#events" className="admin-tile">📅 Akce</a>
        <a href="#polls" className="admin-tile">🗳 Ankety</a>
        <a href="#reviews" className="admin-tile">💬 Recenze</a>
        <a href="#team" className="admin-tile">👥 Tým</a>
        <a href="#gallery" className="admin-tile">🖼 Galerie</a>
        <a href="#reservations" className="admin-tile">📩 Rezervace</a>
      </nav>
    </div>
  );
}
