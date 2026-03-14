

export default function ActionModal({
  show,
  onClose,
  onSubmit,
  actionForm,
  onChangeAction,
  responsables,
  clients,
  statusOptions,
}) {
  if (!show) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>Ajouter une action</h2>

          <button type="button" className="ghost" onClick={onClose}>
            Fermer
          </button>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <div className="row">
            <div className="field">
              <label>Responsable</label>
              <select
                name="responsable"
                value={actionForm.responsable}
                onChange={onChangeAction}
              >
                {responsables.map((r) => (
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
                {statusOptions.map((s) => (
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
    </div>
  );
}