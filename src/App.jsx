import { useState } from "react";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PublicApp from "./PublicApp";

export default function App() {
  const [user, setUser] = useState(null);
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return user ? (
      <AdminDashboard user={user} onLogout={() => setUser(null)} />
    ) : (
      <AdminLogin onLogin={(u) => setUser(u)} />
    );
  }

  return <PublicApp />;
}

