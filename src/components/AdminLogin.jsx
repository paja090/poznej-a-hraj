import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err) {
      console.error(err);
      setError("Přihlášení se nezdařilo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md"
      >
        {loading ? "Přihlašuji..." : "Přihlásit se pomocí Google"}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
}
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err) {
      console.error(err);
      setError("Přihlášení se nezdařilo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin přihlášení</h1>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md"
      >
        {loading ? "Přihlašuji..." : "Přihlásit se pomocí Google"}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
}
