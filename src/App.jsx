import { useEffect, useState } from "react";
import "./App.css";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

const MACHINE_OPTIONS = [
  "Laser-Pro",
  "Cryo-Pro",
  "Hydra-7",
  "Micro-Skin Analyzer",
  "RF / Cavitation",
];

const STATUS_OPTIONS = ["Prospect", "Client", "Formation", "SAV", "Perdu"];

function emptyForm() {
  return {
    institut: "",
    contact: "",
    email: "",
    telephone: "",
    ville: "",
    pays: "Belgique",
    machines: [],
    statut: "Prospect",
    date_installation: "",
    notes: "",
  };
}



function handleMachineChange(e) {
  const values = Array.from(e.target.selectedOptions, (option) => option.value);

  setForm((prev) => ({
    ...prev,
    machines: values,
  }));
}

function toISO(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?.toDate) return value.toDate().toISOString();
  return String(value);
}

/** ✅ Login DOIT être en dehors de App() */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // option: afficher le vrai message dans la console
      console.error(err);
      setError("Identifiants invalides (ou Email/Password pas activé).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <h1 style={{ marginBottom: 6 }}>Divina-Pro</h1>
        <div className="sub" style={{ marginBottom: 16 }}>Connexion requise</div>

        <form onSubmit={onSubmit} className="form">
          <div className="row">
            <div className="field" style={{ minWidth: "100%" }}>
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="row">
            <div className="field" style={{ minWidth: "100%" }}>
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="hint" style={{ color: "#b00020" }}>
              {error}
            </p>
          )}

          <div className="actions">
            <button type="submit" disabled={loading || !email || !password}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {


  const [activePage, setActivePage] = useState("clients");
  const RESPONSABLES = ["Marc", "Gabriel", "Antonio"];
  const STATUS_OPTIONS = [
  "Prospect",
  "Lead",
  "Devis envoyé",
  "Démo prévue",
  "Client",
  "SAV",
  "Perdu",
];

  const [actions, setActions] = useState([]);
  const [actionForm, setActionForm] = useState({
    responsable: "Gabriel",
    clientId: "",
    action: "",
    statutClient: "Prospect",
  });

  const [selectedClient, setSelectedClient] = useState(null);

  const [form, setForm] = useState(emptyForm());
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  function toggleMachine(machine) {
  setForm((prev) => ({
    ...prev,
    machines: prev.machines.includes(machine)
      ? prev.machines.filter((m) => m !== machine)
      : [...prev.machines, machine],
  }));
}

  // ✅ Auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // ✅ Firestore listener seulement si connecté
  useEffect(() => {
    if (!user) {
      setClients([]);
      return;
    }

    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setClients(data);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
  if (!user) {
    setActions([]);
    return;
  }

  const q = query(collection(db, "actions"), orderBy("createdAt", "desc"));

  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setActions(data);
  });

  return () => unsub();
}, [user]);

  // ✅ Guard global (c’est ICI, pas dans Login)
  if (authLoading) {
    return (
      <div className="container">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isValid =
  form.institut.trim() !== "" &&
  form.contact.trim() !== "" &&
  form.email.trim() !== "";

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onChangeAction(e) {
    const { name, value } = e.target;
    setActionForm((prev) => ({ ...prev, [name]: value }));
  }

  async function addAction(e) {
  e.preventDefault();

  if (!actionForm.clientId || !actionForm.action.trim()) return;

  const client = clients.find((c) => c.id === actionForm.clientId);

  await addDoc(collection(db, "actions"), {
    responsable: actionForm.responsable,
    clientId: actionForm.clientId,
    clientNom: client?.institut || client?.contact || "Client inconnu",
    action: actionForm.action,
    statutClient: actionForm.statutClient,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  setActionForm({
    responsable: "Gabriel",
    clientId: "",
    action: "",
    statutClient: "Prospect",
  });
}

function getClientById(id) {
  return clients.find((c) => c.id === id);
}

async function removeAction(id) {
  if (!confirm("Supprimer cette action ?")) return;
  await deleteDoc(doc(db, "actions", id));
}
 async function addClient(e) {
  e.preventDefault();
  if (!isValid) return;

  const payload = {
    ...form,
    updatedAt: serverTimestamp(),
  };

  if (editingId) {
    await updateDoc(doc(db, "clients", editingId), payload);
    setEditingId(null);
  } else {
    await addDoc(collection(db, "clients"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  }

  setForm(emptyForm());
}

  function startEdit(client) {
    setEditingId(client.id);
    setForm({
      institut: client.institut || "",
      contact: client.contact || "",
      email: client.email || "",
      telephone: client.telephone || "",
      ville: client.ville || "",
      pays: client.pays || "Belgique",
      machines: Array.isArray(client.machines)
    ? client.machines
    : client.machine
    ? [client.machine]
    : [],
      statut: client.statut || "Prospect",
      date_installation: client.date_installation || "",
      notes: client.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!isValid || !editingId) return;

    await updateDoc(doc(db, "clients", editingId), {
      ...form,
      updatedAt: serverTimestamp(),
    });

    setEditingId(null);
    setForm(emptyForm());
  }

  async function removeClient(id) {
    if (!confirm("Supprimer ce client ?")) return;
    await deleteDoc(doc(db, "clients", id));
  }

  async function clearAll() {
    if (!confirm("Supprimer TOUS les clients sur Firestore ?")) return;

    const batch = writeBatch(db);
    clients.forEach((c) => batch.delete(doc(db, "clients", c.id)));
    await batch.commit();
  }

  const qSearch = search.trim().toLowerCase();
const filteredClients = !qSearch
  ? clients
  : clients.filter((c) =>
      [
        c.institut,
        c.contact,
        c.email,
        c.telephone,
        c.ville,
        c.pays,
        c.machine,
        c.statut,
        c.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(qSearch)
    );

  function exportCSV() {
    const headers = [
      "Institut",
      "Contact",
      "Email",
      "Téléphone",
      "Ville",
      "Pays",
      "Machine",
      "Date installation",
      "Statut",
      "Notes",
      "Créé le",
      "Mis à jour le",
    ];

    const rows = clients.map((c) => [
      c.institut,
      c.contact,
      c.email,
      c.telephone,
      c.ville,
      c.pays,
      c.machine,
      c.date_installation,
      c.statut,
      c.notes,
      toISO(c.createdAt),
      toISO(c.updatedAt),
    ]);

    const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `divina_clients_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
  <div className="appShell">
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
      </nav>

      <div className="sidebarBottom">
        <button type="button" className="ghost" onClick={() => signOut(auth)}>
          Déconnexion
        </button>
      </div>
    </aside>

    <main className="mainContent">
      {activePage === "clients" && (
        <div className="container">
          <div className="topbar">
            <div>
              <h1>Clients</h1>
              <div className="sub">Gestion des clients Divina-Pro</div>
            </div>
          </div>

          {/* CARD FORMULAIRE */}
          <div className="card">
            <h2>{editingId ? "Modifier un client" : "Ajouter un client"}</h2>

            <form className="form" onSubmit={editingId ? saveEdit : addClient}>
              <div className="row">
                <div className="field">
                  <label>Institut *</label>
                  <input
                    name="institut"
                    value={form.institut}
                    onChange={onChange}
                    placeholder="Beauty by Loula"
                  />
                </div>

                <div className="field">
                  <label>Date d'installation</label>
                  <input
                    type="date"
                    name="date_installation"
                    value={form.date_installation}
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Contact *</label>
                  <input
                    name="contact"
                    value={form.contact}
                    onChange={onChange}
                    placeholder="Prénom Nom"
                  />
                </div>

                <div className="field">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="contact@institut.com"
                  />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Téléphone</label>
                  <input
                    name="telephone"
                    value={form.telephone}
                    onChange={onChange}
                    placeholder="+32 ..."
                  />
                </div>

                <div className="field">
                  <label>Ville</label>
                  <input
                    name="ville"
                    value={form.ville}
                    onChange={onChange}
                    placeholder="Liège"
                  />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Pays</label>
                  <input
                    name="pays"
                    value={form.pays}
                    onChange={onChange}
                    placeholder="Belgique"
                  />
                </div>

                <div className="field">
                  <label>Statut</label>
                  <select
                    name="statut"
                    value={form.statut}
                    onChange={onChange}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field full">
                  <label>Machines</label>
                  <div className="checkboxGroup">
                    {MACHINE_OPTIONS.map((machine) => (
                      <label key={machine} className="checkboxItem">
                        <input
                          type="checkbox"
                          checked={form.machines.includes(machine)}
                          onChange={() => toggleMachine(machine)}
                        />
                        <span>{machine}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="field full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    rows="4"
                    placeholder="Ex: demandé devis leasing 48 mois, rappel vendredi..."
                  />
                </div>
              </div>

              <div className="actions">
                <button type="submit">
                  {editingId ? "Enregistrer" : "Ajouter"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm());
                    }}
                  >
                    Annuler
                  </button>
                )}

                <span className="hint">
                  Institut, contact et email sont obligatoires.
                </span>
              </div>
            </form>
          </div>

          {/* CARD TABLEAU */}
          <div className="card">
            <div className="tableHeader">
              <h2>Tableau clients ({filteredClients.length})</h2>
              <input
                className="search"
                placeholder="Rechercher (institut, email, machine, statut...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredClients.length === 0 ? (
              <p className="empty">Aucun client trouvé.</p>
            ) : (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Institut</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Ville</th>
                      <th>Machine</th>
                      <th>Date install</th>
                      <th>Statut</th>
                      <th className="actionsCol">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((c) => (
                      <tr key={c.id}>
                        <td>{c.institut}</td>
                        <td>{c.contact}</td>
                        <td>{c.email}</td>
                        <td>{c.telephone || "-"}</td>
                        <td>
                          {c.ville || ""}
                          {c.pays ? ` (${c.pays})` : ""}
                        </td>
                        <td>{c.machines?.join(", ") || "-"}</td>
                        <td>{c.date_installation || "-"}</td>
                        <td>{c.statut || "-"}</td>
                        <td className="actionsCol">
                          <div className="rowActions">
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => startEdit(c)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => removeClient(c.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {clients.length > 0 && (
              <p className="footnote">
                <button type="button" className="danger" onClick={clearAll}>
                  Supprimer tous les clients
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {activePage === "actions" && (
  <div className="container">
    <div className="card">
      <h1>Actions en cours</h1>
      <p className="sub">
        Suivi commercial des relances, infos envoyées, démos, devis et SAV.
      </p>
    </div>

    <div className="card">
      <h2>Ajouter une action</h2>

      <form className="form" onSubmit={addAction}>
        <div className="row">
          <div className="field">
            <label>Responsable</label>
            <select
              name="responsable"
              value={actionForm.responsable}
              onChange={onChangeAction}
            >
              {RESPONSABLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Client</label>
            <select
              name="clientId"
              value={actionForm.clientId}
              onChange={onChangeAction}
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.institut} - {c.contact}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Action</label>
            <input
              name="action"
              value={actionForm.action}
              onChange={onChangeAction}
              placeholder="Ex: envoyer infos Laser"
            />
          </div>

          <div className="field">
            <label>Statut client</label>
            <select
              name="statutClient"
              value={actionForm.statutClient}
              onChange={onChangeAction}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions">
          <button type="submit">Ajouter l'action</button>
        </div>
      </form>
    </div>

    <div className="card">
      <h2>Liste des actions ({actions.length})</h2>

      {actions.length === 0 ? (
        <p className="empty">Aucune action en cours.</p>
      ) : (
        <div className="tableWrap">
  <table>
    <thead>
      <tr>
        <th>Responsable</th>
        <th>Client</th>
        <th>Action</th>
        <th>Statut client</th>
        <th className="actionsCol">Actions</th>
      </tr>
    </thead>
    <tbody>
      {actions.map((a) => (
        <tr key={a.id}>
          <td>{a.responsable}</td>
          <td>
            <button
              type="button"
              className="linkButton"
              onClick={() => setSelectedClient(getClientById(a.clientId))}
            >
              {a.clientNom}
            </button>
          </td>
          <td>{a.action}</td>
          <td>{a.statutClient}</td>
          <td className="actionsCol">
            <div className="rowActions">
              <button
                type="button"
                className="danger"
                onClick={() => removeAction(a.id)}
              >
                Supprimer
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
      )}
    </div>
  </div>
)}

      {activePage === "suivi" && (
        <div className="container">
          <div className="card">
            <h1>Suivi clients</h1>
            <p className="sub">
              Relances, prochaines actions, devis envoyés, démos prévues, SAV.
            </p>
          </div>
        </div>
      )}
    </main>
    {selectedClient && (
  <div className="modalOverlay" onClick={() => setSelectedClient(null)}>
    <div className="modalCard" onClick={(e) => e.stopPropagation()}>
      <div className="modalHeader">
        <h2>Fiche client</h2>
        <button
          type="button"
          className="ghost"
          onClick={() => setSelectedClient(null)}
        >
          Fermer
        </button>
      </div>

      <div className="modalBody">
        <p><strong>Institut :</strong> {selectedClient.institut || "-"}</p>
        <p><strong>Contact :</strong> {selectedClient.contact || "-"}</p>
        <p><strong>Email :</strong> {selectedClient.email || "-"}</p>
        <p><strong>Téléphone :</strong> {selectedClient.telephone || "-"}</p>
        <p><strong>Ville :</strong> {selectedClient.ville || "-"}</p>
        <p><strong>Pays :</strong> {selectedClient.pays || "-"}</p>
        <p><strong>Machines :</strong> {selectedClient.machines?.join(", ") || "-"}</p>
        <p><strong>Statut :</strong> {selectedClient.statut || "-"}</p>
        <p><strong>Date installation :</strong> {selectedClient.date_installation || "-"}</p>
        <p><strong>Notes :</strong> {selectedClient.notes || "-"}</p>
      </div>
    </div>
  </div>
)}
  </div>
);
}