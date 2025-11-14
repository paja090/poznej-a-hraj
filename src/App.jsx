// src/App.jsx
import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

import PublicApp from "./PublicApp.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import EditorShell from "./components/EditorShell.jsx"; // 🔹 nový import

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <Router>
      <Routes>
        {/* Veřejná stránka */}
        <Route path="/" element={<PublicApp />} />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            user ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <AdminLogin onLogin={setUser} />
            )
          }
        />

        {/* Editor obsahu – inline CMS */}
        <Route
          path="/editor"
          element={
            user ? (
              <EditorShell user={user} onLogout={handleLogout} />
            ) : (
              <AdminLogin onLogin={setUser} />
            )
          }
        />
      </Routes>
    </Router>
  );
}




