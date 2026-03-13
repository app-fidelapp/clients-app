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
    machine: "",
    statut: "Prospect",
    date_installation: "",
    notes: "",
  };
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
  const [form, setForm] = useState(emptyForm());
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  async function addClient(e) {
    e.preventDefault();
    if (!isValid) return;

    await addDoc(collection(db, "clients"), {
      ...form,
      createdAt: serverTimestamp(),
    });

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
      machine: client.machine || "",
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
    <div className="container">
      <div className="topbar">
        <div>
          <h1>Divina-Pro — Clients</h1>
          <div className="sub">Connecté : {user.email}</div>
        </div>

        <div className="topActions">
          <button className="ghost" onClick={exportCSV} disabled={clients.length === 0}>
            Export CSV
          </button>
          <button className="danger" onClick={clearAll} disabled={clients.length === 0}>
            Tout supprimer
          </button>
          <button className="ghost" onClick={() => signOut(auth)}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ... le reste de ton UI (form + table) inchangé ... */}
      {/* Pour gagner du temps, garde exactement ton JSX actuel ici */}
      {/* IMPORTANT : ne change rien au reste, juste garde ce return et colle ton contenu */}



      <div className="card">
        <h2>{editingId ? "Modifier un client" : "Encoder un client"}</h2>

        <form onSubmit={editingId ? saveEdit : addClient} className="form">
          <div className="row">
            <div className="field">
              <label>Nom de l’institut *</label>
              <input
                name="institut"
                value={form.institut}
                onChange={onChange}
                placeholder="Beauty by Loula"
                autoComplete="organization"
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

            <div className="field">
              <label>Contact *</label>
              <input
                name="contact"
                value={form.contact}
                onChange={onChange}
                placeholder="Prénom Nom"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Email *</label>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="contact@institut.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label>Téléphone</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={onChange}
                placeholder="+32 ..."
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Ville</label>
              <input name="ville" value={form.ville} onChange={onChange} placeholder="Liège" />
            </div>

            <div className="field">
              <label>Pays</label>
              <input name="pays" value={form.pays} onChange={onChange} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Machine</label>
              <select name="machine" value={form.machine ?? ""} onChange={onChange}>
                <option value="">—</option>
                {MACHINE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Statut</label>
              <select name="statut" value={form.statut ?? "Prospect"} onChange={onChange}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                placeholder="Ex: demandé devis leasing 48 mois, rappel vendredi..."
                rows={3}
              />
            </div>
          </div>

          <div className="actions">
            <button type="submit" disabled={!isValid}>
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

            {!isValid && <span className="hint">Institut, contact et email sont obligatoires.</span>}
          </div>
        </form>
      </div>

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
          <p className="empty">{clients.length === 0 ? "Aucun client pour le moment." : "Aucun résultat."}</p>
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
                    <td>{c.telephone}</td>
                    <td>
                      {c.ville}
                      {c.pays ? ` (${c.pays})` : ""}
                    </td>
                    <td>{c.machine || "-"}</td>
                    <td>{c.date_installation || "-"}</td>
                    <td>{c.statut || "-"}</td>
                    <td className="actionsCol">
                      <div className="rowActions">
                        <button className="ghost" onClick={() => startEdit(c)}>
                          Modifier
                        </button>
                        <button className="danger" onClick={() => removeClient(c.id)}>
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

        {/* NOTE: tu n’as plus de sauvegarde locale ici, tout est Firestore */}
        <p className="footnote">Synchronisé avec Firestore ✅</p>
      </div>
    </div>
  );
}