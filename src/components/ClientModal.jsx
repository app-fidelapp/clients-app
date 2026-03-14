


export default function ClientModal({
  show,
  onClose,
  editingId,
  form,
  onChange,
  onSubmit,
  machineOptions,
  statusOptions,
  toggleMachine,
  emptyForm,
  setForm,
  setEditingId,
}) {
  if (!show) return null;

  return (
    <div
      className="modalOverlay"
      onClick={() => {
        onClose();
        setEditingId(null);
        setForm(emptyForm());
      }}
    >
      <div
        className="modalCard clientModal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2>{editingId ? "Modifier un client" : "Ajouter un client"}</h2>

          <button
            type="button"
            className="ghost"
            onClick={() => {
              onClose();
              setEditingId(null);
              setForm(emptyForm());
            }}
          >
            Fermer
          </button>
        </div>

        <form className="form" onSubmit={onSubmit}>
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
              <select name="statut" value={form.statut} onChange={onChange}>
                {statusOptions.map((s) => (
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
                {machineOptions.map((machine) => (
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

          <div className="actions clientModalActions">
            <button type="submit">
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() => {
                onClose();
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}