// src/App.jsx
import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

import PublicApp from "./PublicApp.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AdminLogin from "./components/AdminLogin.jsx"; // ✅ změna

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicApp />} />
        <Route
          path="/admin"
          element={
            user ? (
              <AdminDashboard user={user} onLogout={() => signOut(auth)} />
            ) : (
              <AdminLogin onLogin={setUser} /> // ✅ změna
            )
          }
        />
      </Routes>
    </Router>
  );
}



