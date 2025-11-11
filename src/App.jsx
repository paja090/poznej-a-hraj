import { useState } from "react";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PublicApp from "./PublicApp"; // nová komponenta s tvým veřejným webem

function App() {
  const [user, setUser] = useState(null);
  const isAdmin = window.location.pathname.startsWith("/admin");

  // Pokud jdeme na /admin → zobrazí se přihlášení nebo dashboard
  if (isAdmin) {
    return user ? (
      <AdminDashboard user={user} onLogout={() => setUser(null)} />
    ) : (
      <AdminLogin onLogin={(u) => setUser(u)} />
    );
  }

  // Jinak běžná veřejná stránka
  return <PublicApp />;
}

export default App;

