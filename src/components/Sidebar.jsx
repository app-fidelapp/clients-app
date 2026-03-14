


import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo-divina.png" alt="Divina-Pro" className="brandLogo" />
        <div className="brandText">
          <strong>Divina-Pro</strong>
          <span>Client</span>
        </div>
      </div>

      <nav className="menu">
        <button
          type="button"
          className={`menuItem ${activePage === "clients" ? "active" : ""}`}
          onClick={() => setActivePage("clients")}
        >
          Clients
        </button>

        <button
          type="button"
          className={`menuItem ${activePage === "actions" ? "active" : ""}`}
          onClick={() => setActivePage("actions")}
        >
          Actions en cours
        </button>

        <button
          type="button"
          className={`menuItem ${activePage === "suivi" ? "active" : ""}`}
          onClick={() => setActivePage("suivi")}
        >
          Suivi clients
        </button>

        <button
          type="button"
          className={`menuItem ${activePage === "catalogue" ? "active" : ""}`}
          onClick={() => setActivePage("catalogue")}
        >
          Catalogue
        </button>
      </nav>

      <div className="sidebarBottom">
        <button type="button" className="ghost" onClick={() => signOut(auth)}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}