import { useEffect, useState } from "react";
import "./App.css";
import { db, auth } from "./firebase";

import Login from "./components/Login.jsx";
import Sidebar from "./components/Sidebar";
import ClientModal from "./components/ClientModal";
import ActionModal from "./components/ActionModal";


import { onAuthStateChanged } from "firebase/auth";



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





function toISO(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?.toDate) return value.toDate().toISOString();
  return String(value);
}

/** ✅ Login DOIT être en dehors de App() */



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
  const [showSplash, setShowSplash] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");
  const [showActionModal, setShowActionModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

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

  if (showSplash || authLoading) {
    return (
      <div className="splashScreen">
        <div className="splashContent">
          <h1 className="splashTitle">Divina-Pro</h1>
          <div className="splashLoader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
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

  function toggleMachine(machine) {
  setForm((prev) => {
    const exists = prev.machines.includes(machine);

    return {
      ...prev,
      machines: exists
        ? prev.machines.filter((m) => m !== machine)
        : [...prev.machines, machine],
    };
  });
}


  function formatDate(ts) {
  if (!ts) return "-";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(ts) {
  if (!ts) return "-";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  setShowClientModal(false);
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

  setShowClientModal(true);
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

  const DELETE_PIN = "2111"; // change ton code ici

async function clearAll() {

  const pin = prompt("Entrez le code PIN à 4 chiffres pour supprimer tous les clients");

  if (!pin) return;

  if (!/^\d{4}$/.test(pin)) {
    alert("Le PIN doit contenir 4 chiffres.");
    return;
  }

  if (pin !== DELETE_PIN) {
    alert("Code PIN incorrect.");
    return;
  }

  if (!confirm("Supprimer TOUS les clients sur Firestore ?")) return;

  const batch = writeBatch(db);
  clients.forEach((c) => batch.delete(doc(db, "clients", c.id)));
  await batch.commit();

  alert("Tous les clients ont été supprimés.");
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

const displayedClients = [...filteredClients].sort((a, b) => {
  if (!a.createdAt) return 1;
  if (!b.createdAt) return -1;

  const diff = a.createdAt.seconds - b.createdAt.seconds;
  return sortOrder === "asc" ? diff : -diff;
});

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
   <Sidebar activePage={activePage} setActivePage={setActivePage} />

    <main className="mainContent">
      {activePage === "clients" && (
        <div className="container">
          <div className="topbar">
  <div>
    <h1>Clients</h1>
    <div className="sub">Gestion des clients Divina-Pro</div>
  </div>

  <div className="topActions">
    <button
      type="button"
      onClick={() => {
        setEditingId(null);
        setForm(emptyForm());
        setShowClientModal(true);
      }}
    >
      + Ajouter un client
    </button>
  </div>
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
  
  <>
    <div className="desktopTable">
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th
  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
  style={{ cursor: "pointer" }}
>
  Date encodage {sortOrder === "asc" ? "↑" : "↓"}
</th>
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
            {displayedClients.map((c) => (
              <tr key={c.id}>
                <td>{formatDateTime(c.createdAt)}</td>
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
                <td>
                  <span className={`statusBadge status-${(c.statut || "").toLowerCase()}`}>
                    {c.statut || "-"}
                  </span>
                </td>
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
    </div>


    <div className="mobileCards">
      <div
  className="mobileSortTitle"
  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
>
  Date encodage {sortOrder === "asc" ? "↑" : "↓"}
</div>
  {displayedClients.map((c) => (

    
        <div className="clientCardMobile" key={c.id}>
          <div className="clientCardTop">
            <div>
              <h3>{c.institut || "Sans nom"}</h3>
              <p>{c.contact || "-"}</p>
            </div>

            <span className={`statusBadge status-${(c.statut || "").toLowerCase()}`}>
              {c.statut || "-"}
            </span>
          </div>

          <div className="clientCardGrid">
            <div className="clientInfoItem">
              <span>Email</span>
              <strong>{c.email || "-"}</strong>
            </div>

            <div className="clientInfoItem">
              <span>Téléphone</span>
              <strong>{c.telephone || "-"}</strong>
            </div>

            <div className="clientInfoItem">
              <span>Ville</span>
              <strong>
                {c.ville || "-"}
                {c.pays ? ` (${c.pays})` : ""}
              </strong>
            </div>

            <div className="clientInfoItem">
              <span>Machine</span>
              <strong>{c.machines?.join(", ") || "-"}</strong>
            </div>

            <div className="clientInfoItem">
              <span>Date install</span>
              <strong>{c.date_installation || "-"}</strong>
            </div>
          </div>

          <div className="clientCardActions">
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
        </div>
      ))}
    </div>
  </>
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
  <div className="topbar">
    <h2>Actions en cours</h2>

    <button
      type="button"
      onClick={() => setShowActionModal(true)}
    >
      + Ajouter une action
    </button>
  </div>
</div>

    <div className="card">
      <h2>Liste des actions ({actions.length})</h2>

      {actions.length === 0 ? (
        <p className="empty">Aucune action en cours.</p>
      ) : (
       <>
  <div className="desktopTable">
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
  </div>

  <div className="actionsMobileCards">
    {actions.map((a) => (
      <div className="actionCardMobile" key={a.id}>
        <div className="actionCardTop">
          <strong>{a.clientNom}</strong>
          <span className="statusBadge">
            {a.statutClient || "-"}
          </span>
        </div>

        <div className="actionCardGrid">
          <div className="clientInfoItem">
            <span>Responsable</span>
            <strong>{a.responsable || "-"}</strong>
          </div>

          <div className="clientInfoItem">
            <span>Action</span>
            <strong>{a.action || "-"}</strong>
          </div>
        </div>

        <div className="clientCardActions">
          <button
            type="button"
            className="ghost"
            onClick={() => setSelectedClient(getClientById(a.clientId))}
          >
            Voir le client
          </button>

          <button
            type="button"
            className="danger"
            onClick={() => removeAction(a.id)}
          >
            Supprimer
          </button>
        </div>
      </div>
    ))}
  </div>
</>
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

        {activePage === "catalogue" && (
  <div className="cataloguePage">
    <div className="catalogueHeader">
      <div>
        <h2>Catalogue Divina-Pro</h2>
        <p>Consultez et téléchargez le dernier catalogue disponible.</p>
      </div>
    </div>

    <div className="catalogueCard">
      <div className="catalogueIcon">
        <span>PDF</span>
      </div>

      <div className="catalogueContent">
        <h3>Catalogue Divina-Pro 2026.pdf</h3>
        <p>Version officielle du catalogue commercial Divina-Pro.</p>

        <div className="catalogueActions">
          <a
            href="/catalogue-divina-pro.pdf"
            target="_blank"
            rel="noreferrer"
            className="catalogueBtn secondary"
          >
            Ouvrir
          </a>

          <a
            href="/catalogue-divina-pro.pdf"
            download
            className="catalogueBtn primary"
          >
            Télécharger
          </a>
        </div>
      </div>
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


<ClientModal
  show={showClientModal}
  onClose={() => setShowClientModal(false)}
  editingId={editingId}
  form={form}
  onChange={onChange}
  onSubmit={addClient}
  machineOptions={MACHINE_OPTIONS}
  statusOptions={STATUS_OPTIONS}
  toggleMachine={toggleMachine}
  emptyForm={emptyForm}
  setForm={setForm}
  setEditingId={setEditingId}
/>

<ActionModal
  show={showActionModal}
  onClose={() => setShowActionModal(false)}
  actionForm={actionForm}
  onChangeAction={onChangeAction}
  onSubmit={addAction}
  clients={clients}
  responsables={RESPONSABLES}
  statusOptions={STATUS_OPTIONS}
/>

  </div>
);
}