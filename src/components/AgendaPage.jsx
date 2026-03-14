import { useEffect, useMemo, useState } from "react";
import "../AgendaPage.css";

const teamMembers = [
  { id: 1, name: "Célia", color: "blue" },
  { id: 2, name: "Gabriel", color: "pink" },
  { id: 3, name: "Sophie", color: "teal" },
  { id: 4, name: "Antonio", color: "green" },
  { id: 5, name: "Marc", color: "purple" },
  { id: 6, name: "Autre", color: "magenta" },
];

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 15;
const HOUR_HEIGHT = 64;
const DEFAULT_DATE = new Date("2026-03-23");



function pad(n) {
  return String(n).padStart(2, "0");
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${pad(h)}:${pad(m)}`;
}


function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function snapMinutes(minutes) {
  return Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

function formatClientLabel(client) {
  if (!client) return "";
  return client.institut || client.contact || client.email || "Client";
}

function buildSlots() {
  const slots = [];
  for (let mins = START_HOUR * 60; mins < END_HOUR * 60; mins += SLOT_MINUTES) {
    slots.push(mins);
  }
  return slots;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 dimanche
  const diff = day === 0 ? -6 : 1 - day; // lundi = début
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatLongDate(date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function formatDayHeader(date) {
  const txt = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function getStartOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getMiniCalendarCells(date) {
  const startMonth = getStartOfMonth(date);
  const daysInMonth = getDaysInMonth(date);

  const jsDay = startMonth.getDay(); // 0 dimanche
  const startOffset = jsDay === 0 ? 6 : jsDay - 1; // lundi = 0

  const totalCells = 42; // 6 lignes x 7 colonnes
  const cells = [];

  for (let i = 0; i < totalCells; i += 1) {
    const dayNumber = i - startOffset + 1;
    const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;

    if (!isCurrentMonth) {
      cells.push({
        key: `empty-${i}`,
        label: "",
        date: null,
        isCurrentMonth: false,
      });
      continue;
    }

    const cellDate = new Date(date.getFullYear(), date.getMonth(), dayNumber);
    cellDate.setHours(0, 0, 0, 0);

    cells.push({
      key: formatDateKey(cellDate),
      label: dayNumber,
      date: cellDate,
      isCurrentMonth: true,
    });
  }

  return cells;
}


function emptyModalForm(prefill = {}) {
  return {
    staff: prefill.staff || "",
    title: prefill.title || "",
    clientId: prefill.clientId || "",
    clientName: prefill.clientName || "",
    date: prefill.date || formatDateKey(DEFAULT_DATE),
    start: prefill.start || "09:00",
    end: prefill.end || "09:15",
    notes: prefill.notes || "",
  };
}

function getBlockStyle(start, end) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

function ActionModal({
  open,
  form,
  clients,
  editingAction,
  onClose,
  onChange,
  onSave,
  onDelete,
  recurrenceOpen,
  setRecurrenceOpen,
  recurrence,
  setRecurrence,
}) {
  if (!open) return null;

  return (
    <>
      <div className="agendaModalOverlay" onClick={onClose}>
        <div className="agendaModalCard" onClick={(e) => e.stopPropagation()}>
          <div className="agendaModalHeader">
            <h2>{editingAction ? "Modifier l’action" : "Nouvelle action"}</h2>
            <button type="button" className="ghostBtn" onClick={onClose}>
              Fermer
            </button>
          </div>

          <div className="agendaModalBody">
            <div className="agendaFormGrid">
              <div className="agendaField full">
                <label>Nom de l’action</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => onChange("title", e.target.value)}
                  placeholder="Ex : Appeler client / Démo / Formation / SAV"
                />
              </div>

              <div className="agendaField">
                <label>Responsable</label>
                <select
                  value={form.staff}
                  onChange={(e) => onChange("staff", e.target.value)}
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agendaField">
                <label>Client (facultatif)</label>
                <select
                  value={form.clientId}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selected = clients.find((c) => c.id === value);
                    onChange("clientId", value);
                    onChange("clientName", selected ? formatClientLabel(selected) : "");
                  }}
                >
                  <option value="">Aucun client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatClientLabel(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="agendaField">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => onChange("date", e.target.value)}
                />
              </div>

              <div className="agendaField">
                <label>Récurrence</label>
                <button
                  type="button"
                  className="ghostBtn"
                  onClick={() => setRecurrenceOpen(true)}
                >
                  Configurer
                </button>
              </div>

              <div className="agendaField">
                <label>Heure début</label>
                <input
                  type="time"
                  step="900"
                  value={form.start}
                  onChange={(e) => onChange("start", e.target.value)}
                />
              </div>

              <div className="agendaField">
                <label>Heure fin</label>
                <input
                  type="time"
                  step="900"
                  value={form.end}
                  onChange={(e) => onChange("end", e.target.value)}
                />
              </div>

              <div className="agendaField full">
                <label>Notes</label>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(e) => onChange("notes", e.target.value)}
                  placeholder="Notes complémentaires"
                />
              </div>
            </div>
          </div>

          <div className="agendaModalFooter">
            {editingAction && (
              <button
  type="button"
  className="dangerBtn"
  onClick={() => onDelete(editingAction)}
>
  Supprimer
</button>

            )}

            <button type="button" className="primaryBtn" onClick={onSave}>
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {recurrenceOpen && (
  <div
    className="agendaModalOverlay"
    onClick={() => setRecurrenceOpen(false)}
  >
    <div
      className="agendaModalCard recurrenceCard"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="agendaModalHeader">
        <h2>Répétition</h2>
        <button
          type="button"
          className="ghostBtn"
          onClick={() => setRecurrenceOpen(false)}
        >
          Fermer
        </button>
      </div>

      <div className="agendaModalBody recurrenceBody">
        <div className="recurrenceRow">
  <label>Répéter tous les</label>

  <div className="recurrenceInline recurrenceMainLine">
    <input
      type="number"
      min="1"
      value={recurrence.interval}
      onChange={(e) =>
        setRecurrence((prev) => ({
          ...prev,
          interval: Math.max(1, Number(e.target.value) || 1),
        }))
      }
    />

    <select
      value={recurrence.unit}
      onChange={(e) =>
        setRecurrence((prev) => ({
          ...prev,
          unit: e.target.value,
        }))
      }
    >
      <option value="days">Jour(s)</option>
      <option value="weeks">Semaine(s)</option>
      <option value="months">Mois</option>
    </select>
  </div>
</div>

        {recurrence.unit === "weeks" && (
  <div className="recurrenceRow">
    <label>Jours</label>

    <div className="weekDaysPicker">
      {[
        { label: "L", value: 1 },
        { label: "Ma", value: 2 },
        { label: "Me", value: 3 },
        { label: "J", value: 4 },
        { label: "V", value: 5 },
        { label: "S", value: 6 },
        { label: "D", value: 7 },
      ].map((day) => {
        const active = recurrence.weekDays.includes(day.value);

        return (
          <button
            key={day.value}
            type="button"
            className={`weekDayBtn ${active ? "active" : ""}`}
            onClick={() => {
              setRecurrence((prev) => {
                const exists = prev.weekDays.includes(day.value);
                const nextDays = exists
                  ? prev.weekDays.filter((d) => d !== day.value)
                  : [...prev.weekDays, day.value].sort((a, b) => a - b);

                return {
                  ...prev,
                  weekDays: nextDays.length ? nextDays : [1],
                };
              });
            }}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  </div>
)}

        <div className="recurrenceRow">
  <label>Fin</label>

  <div className="recurrenceEndStack">
    <div className="endOptionRow">
      <label className="endOption">
        <input
          type="radio"
          name="endType"
          checked={recurrence.endType === "never"}
          onChange={() =>
            setRecurrence((prev) => ({
              ...prev,
              endType: "never",
            }))
          }
        />
        <span>Jamais</span>
      </label>
    </div>

    <div className="endOptionRow">
      <label className="endOption">
        <input
          type="radio"
          name="endType"
          checked={recurrence.endType === "after"}
          onChange={() =>
            setRecurrence((prev) => ({
              ...prev,
              endType: "after",
              count: prev.count || 10,
            }))
          }
        />
        <span>Après</span>
      </label>

      <input
        type="number"
        min="1"
        value={recurrence.count}
        disabled={recurrence.endType !== "after"}
        onChange={(e) =>
          setRecurrence((prev) => ({
            ...prev,
            count: Math.max(1, Number(e.target.value) || 1),
          }))
        }
      />

      <span>occurrence(s)</span>
    </div>

    <div className="endOptionRow">
      <label className="endOption">
        <input
          type="radio"
          name="endType"
          checked={recurrence.endType === "onDate"}
          onChange={() =>
            setRecurrence((prev) => ({
              ...prev,
              endType: "onDate",
              endDate: prev.endDate || form.date,
            }))
          }
        />
        <span>Le</span>
      </label>

      <input
        type="date"
        value={recurrence.endDate}
        disabled={recurrence.endType !== "onDate"}
        min={form.date}
        onChange={(e) =>
          setRecurrence((prev) => ({
            ...prev,
            endDate: e.target.value,
          }))
        }
      />

      <span></span>
    </div>
  </div>
</div>
      </div>

      <div className="agendaModalFooter">
        <button
          type="button"
          className="ghostBtn"
          onClick={() => setRecurrenceOpen(false)}
        >
          Annuler
        </button>
<button
  type="button"
  className="ghostBtn"
  onClick={() => {
    setRecurrence(getDefaultRecurrence(form.date));
    setRecurrenceOpen(false);
  }}
>
  Sans récurrence
</button>
        <button
  type="button"
  className="primaryBtn"
  onClick={() => {
    if (recurrence.endType === "after" && (!recurrence.count || recurrence.count < 1)) {
      alert("Indique un nombre d’occurrences valide.");
      return;
    }

    if (recurrence.endType === "onDate" && !recurrence.endDate) {
      alert("Choisis une date de fin.");
      return;
    }

    if (recurrence.unit === "weeks" && (!recurrence.weekDays || recurrence.weekDays.length === 0)) {
      alert("Choisis au moins un jour.");
      return;
    }

    setRecurrence((prev) => ({
      ...prev,
      enabled: true,
    }));
    setRecurrenceOpen(false);
  }}
>
  Valider
</button>
      </div>
    </div>
  </div>
)}

    </>
  );
}



function getEventColorClass(staff) {
  switch ((staff || "").toLowerCase()) {
    case "célia":
    case "celia":
      return "event-celia";
    case "gabriel":
      return "event-gabriel";
    case "sophie":
      return "event-sophie";
    case "antonio":
      return "event-antonio";
    case "marc":
      return "event-marc";
    default:
      return "event-autre";
  }
}

function AgendaEvent({ item, onClick, onDragStart, isDragging }) {
  const colorClass = getEventColorClass(item.staff);

  return (
    <button
      type="button"
      className={`agendaEvent ${colorClass} ${isDragging ? "dragging" : ""}`}
      style={getBlockStyle(item.start, item.end)}
      onClick={() => {
        if (!isDragging) onClick(item);
      }}
      onMouseDown={(e) => {
  if (!onDragStart) return;
  e.stopPropagation();
  e.preventDefault();
  onDragStart(item, e);
}}
    >
      <strong>
        {item.start} - {item.end}
      </strong>
      <span>{item.title || "Sans titre"}</span>
      {item.clientName ? <small>{item.clientName}</small> : null}
    </button>
  );
}

function AgendaColumn({
  member,
  slots,
  appointments,
  filterByMember = true,
  selection,
  dragging,
  onSlotMouseDown,
  onSlotEnter,
  onMouseUpSelection,
  onEventClick,
  draggedEvent,
  dragPreview,
  onEventDragMove,
  onEventDrop,
  onEventDragStart,
}) {
  const memberAppointments = filterByMember
    ? appointments.filter((a) => a.staff === member.name)
    : appointments;

  return (
    <div
      className="agendaColumn"
      onMouseUp={() => {
  if (draggedEvent && onEventDrop) {
    onEventDrop();
  } else {
    onMouseUpSelection();
  }
}}
      onMouseLeave={() => {
        if (!draggedEvent) onMouseUpSelection();
      }}
    >
      <div className="agendaColumnHeader">
        <span className={`memberDot ${member.color}`}></span>
        <strong>{member.name}</strong>
      </div>

      <div
        className="agendaColumnBody"
        style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
        onMouseMove={(e) => {
  if (draggedEvent && onEventDragMove) {
    onEventDragMove(member.name, e);
  }
}}
      >
        {slots.map((minutes) => {
          const time = minutesToTime(minutes);
          const isSelected =
            selection &&
            selection.staff === member.name &&
            minutes >= selection.startMinutes &&
            minutes < selection.endMinutes;

          return (
            <div
              key={`${member.name}-${time}`}
              className={`agendaQuarter ${isSelected ? "selected" : ""}`}
              onMouseDown={() => {
                if (!draggedEvent) onSlotMouseDown(member.name, minutes);
              }}
              onMouseEnter={() => {
                if (!draggedEvent) onSlotEnter(member.name, minutes);
              }}
            />
          );
        })}

        {memberAppointments.map((item) => (
          <AgendaEvent
            key={item.id}
            item={item}
            onClick={onEventClick}
            onDragStart={onEventDragStart}
            isDragging={draggedEvent?.id === item.id}
          />
        ))}

        {dragging && selection && selection.staff === member.name ? (
  <div
    className="agendaSelectionPreview"
    style={{
      top: `${((selection.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT}px`,
      height: `${((selection.endMinutes - selection.startMinutes) / 60) * HOUR_HEIGHT}px`,
    }}
  >
    <div className="agendaSelectionLabel">
      {minutesToTime(selection.startMinutes)} à {minutesToTime(selection.endMinutes)}
    </div>
  </div>
) : null}

        {dragPreview && dragPreview.staff === member.name ? (
  <div
    className="agendaDragPreview"
    style={{
      top: `${((dragPreview.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT}px`,
      height: `${((dragPreview.endMinutes - dragPreview.startMinutes) / 60) * HOUR_HEIGHT}px`,
    }}
  >
    <span className="agendaSelectionLabel">
      {minutesToTime(dragPreview.startMinutes)} à {minutesToTime(dragPreview.endMinutes)}
    </span>
  </div>
) : null}
      </div>
    </div>
  );
}

export default function AgendaPage({ clients = [] }) {
    const [currentDate, setCurrentDate] = useState(DEFAULT_DATE);
    const [viewMode, setViewMode] = useState("day");
    const [selectedMemberIds, setSelectedMemberIds] = useState(teamMembers.map((m) => m.id));
    const [weekMemberId, setWeekMemberId] = useState(teamMembers[0].id);
    const [daySelectionBackup, setDaySelectionBackup] = useState(teamMembers.map((m) => m.id));
    const [recurrenceOpen, setRecurrenceOpen] = useState(false);


    const [deleteChoiceOpen, setDeleteChoiceOpen] = useState(false);
const [actionToDelete, setActionToDelete] = useState(null);

    const [recurrence, setRecurrence] = useState(getDefaultRecurrence());



  const selectedMembers = useMemo(() => {
  return teamMembers.filter((m) => selectedMemberIds.includes(m.id));
}, [selectedMemberIds]);

const selectedWeekMember = useMemo(() => {
  return teamMembers.find((m) => m.id === weekMemberId) || teamMembers[0];
}, [weekMemberId]);

const miniCalendarTitle = useMemo(() => {
  return currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}, [currentDate]);

const miniCalendarCells = useMemo(() => {
  return getMiniCalendarCells(currentDate);
}, [currentDate]);

const currentDateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);


  const slots = useMemo(() => buildSlots(), []);

  const hourLabels = useMemo(() => {
    const labels = [];
    for (let h = START_HOUR; h <= END_HOUR; h += 1) {
      labels.push(`${pad(h)}:00`);
    }
    return labels;
  }, []);

  const [appointments, setAppointments] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [modalForm, setModalForm] = useState(emptyModalForm());
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [dragCursor, setDragCursor] = useState({ x: 0, y: 0 });
  const [editChoiceOpen, setEditChoiceOpen] = useState(false);
  const [pendingEditAction, setPendingEditAction] = useState(null);
  const [editMode, setEditMode] = useState("single"); // single | series


const visibleDays = useMemo(() => {
  if (viewMode === "day") {
    return [currentDate];
  }

  const start = getStartOfWeek(currentDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}, [currentDate, viewMode]);

const boardTitle = useMemo(() => {
  if (viewMode === "day") {
    return formatLongDate(currentDate);
  }

  const first = visibleDays[0];
  const last = visibleDays[visibleDays.length - 1];

  return `${first.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} → ${last.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}, [currentDate, viewMode, visibleDays]);

const visibleAppointments = useMemo(() => {
  if (viewMode === "day") {
    const currentKey = formatDateKey(currentDate);
    return appointments.filter(
      (a) =>
        a.date === currentKey &&
        selectedMemberIds.includes(
          teamMembers.find((m) => m.name === a.staff)?.id
        )
    );
  }

  const weekKeys = visibleDays.map((d) => formatDateKey(d));
  return appointments.filter(
    (a) =>
      weekKeys.includes(a.date) &&
      a.staff === selectedWeekMember.name
  );
}, [appointments, currentDate, viewMode, visibleDays, selectedMemberIds, selectedWeekMember]);


function requestDeleteAction(action) {
  if (!action) return;

  if (action.recurrenceGroupId) {
    setActionToDelete(action);
    setDeleteChoiceOpen(true);
    return;
  }

  deleteSingleAction(action.id);
}

function getDefaultRecurrence(baseDate = null) {
  const fallbackDate = baseDate ? parseDateKey(baseDate) : DEFAULT_DATE;

  return {
    enabled: false,
    interval: 1,
    unit: "weeks",
    weekDays: [getIsoDay(fallbackDate)],
    endType: "never",
    count: 10,
    endDate: "",
  };
}


function deleteSingleAction(actionId) {
  setAppointments((prev) => prev.filter((item) => item.id !== actionId));
  closeModal();
}

function deleteRecurringGroup(groupId) {
  setAppointments((prev) =>
    prev.filter((item) => item.recurrenceGroupId !== groupId)
  );
  setDeleteChoiceOpen(false);
  setActionToDelete(null);
  closeModal();
}

function deleteOnlyThisOccurrence(actionId) {
  setAppointments((prev) => prev.filter((item) => item.id !== actionId));
  setDeleteChoiceOpen(false);
  setActionToDelete(null);
  closeModal();
}


function handleToggleMember(memberId) {
  if (viewMode === "week") {
    setWeekMemberId(memberId);
    setSelectedMemberIds([memberId]);
    return;
  }

  setSelectedMemberIds((prev) => {
    const exists = prev.includes(memberId);

    if (exists) {
      if (prev.length === 1) return prev;
      return prev.filter((id) => id !== memberId);
    }

    return [...prev, memberId];
  });
}

function goPrevMonth() {
  setCurrentDate((prev) => addMonths(prev, -1));
}

function goNextMonth() {
  setCurrentDate((prev) => addMonths(prev, 1));
}

function handleMiniCalendarSelect(date) {
  if (!date) return;
  setCurrentDate(date);
  setViewMode("day");
}



function handleEventDragStart(item, e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const offsetY = e.clientY - rect.top;
  const offsetMinutes = Math.round((offsetY / HOUR_HEIGHT) * 60);
  const duration = timeToMinutes(item.end) - timeToMinutes(item.start);

  setDraggedEvent({
    id: item.id,
    original: item,
    duration,
    offsetMinutes,
  });

  setDragCursor({ x: e.clientX, y: e.clientY });

  setDragPreview({
    id: item.id,
    staff: item.staff,
    startMinutes: timeToMinutes(item.start),
    endMinutes: timeToMinutes(item.end),
  });
}

function goToday() {
  setCurrentDate(new Date());
}

function goPrev() {
  setCurrentDate((prev) => addDays(prev, viewMode === "day" ? -1 : -7));
}

function goNext() {
  setCurrentDate((prev) => addDays(prev, viewMode === "day" ? 1 : 7));
}


function handleEventDragMove(staff, e) {
  if (!draggedEvent) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;

  const minutesFromTop = (y / HOUR_HEIGHT) * 60;
  let startMinutes =
    START_HOUR * 60 + snapMinutes(minutesFromTop - draggedEvent.offsetMinutes);

  const maxStart = END_HOUR * 60 - draggedEvent.duration;
  if (startMinutes < START_HOUR * 60) startMinutes = START_HOUR * 60;
  if (startMinutes > maxStart) startMinutes = maxStart;

  setDragCursor({ x: e.clientX, y: e.clientY });

  setDragPreview({
    id: draggedEvent.id,
    staff,
    startMinutes,
    endMinutes: startMinutes + draggedEvent.duration,
  });
}

function handleEventDrop() {
  if (!draggedEvent || !dragPreview) return;

  setAppointments((prev) =>
    prev.map((item) =>
      item.id === draggedEvent.id
        ? {
            ...item,
            staff: dragPreview.staff,
            start: minutesToTime(dragPreview.startMinutes),
            end: minutesToTime(dragPreview.endMinutes),
          }
        : item
    )
  );

  setDraggedEvent(null);
  setDragPreview(null);
}

function cancelEventDrag() {
  setDraggedEvent(null);
  setDragPreview(null);
}

function handleEventDragEnter(staff, minutes) {
  if (!draggedEvent) return;

  const snapped = snapMinutes(minutes);
  const startMinutes = snapped;
  const endMinutes = snapped + draggedEvent.duration;

  setDragPreview({
    id: draggedEvent.id,
    staff,
    startMinutes,
    endMinutes,
  });
}


  function handleFormChange(field, value) {
    setModalForm((prev) => ({ ...prev, [field]: value }));
  }
function openCreateModalFromSelection(sel) {
  setEditingAction(null);
  setRecurrence(getDefaultRecurrence(sel.date));
  setRecurrenceOpen(false);

  const activeWeekMember =
    viewMode === "week"
      ? teamMembers.find((m) => m.id === weekMemberId) || null
      : null;

  setModalForm(
    emptyModalForm({
      staff: activeWeekMember ? activeWeekMember.name : sel.staff,
      date: sel.date,
      start: minutesToTime(sel.startMinutes),
      end: minutesToTime(sel.endMinutes),
    })
  );

  setModalOpen(true);
}


  function handleSlotMouseDown(staff, minutes) {
    const snapped = snapMinutes(minutes);
    setDragging(true);
    setSelection({
      staff,
      date: formatDateKey(currentDate),
      anchorMinutes: snapped,
      startMinutes: snapped,
      endMinutes: snapped + SLOT_MINUTES,
    });
  }

  function handleSlotEnter(staff, minutes) {
    if (!dragging) return;
    setSelection((prev) => {
      if (!prev || prev.staff !== staff) return prev;

      const snapped = snapMinutes(minutes);
      const start = Math.min(prev.anchorMinutes, snapped);
      const end = Math.max(prev.anchorMinutes, snapped) + SLOT_MINUTES;

      return {
        ...prev,
        startMinutes: start,
        endMinutes: end,
      };
    });
  }

  function handleMouseUpSelection() {
    if (!dragging || !selection) return;
    setDragging(false);
    openCreateModalFromSelection(selection);
  }

function closeModal() {
  setModalOpen(false);
  setEditingAction(null);
  setSelection(null);
  setRecurrenceOpen(false);
  setRecurrence(getDefaultRecurrence());
  setEditMode("single");
  setPendingEditAction(null);
}

function parseDateKey(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysToDate(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonthsToDate(date, amount) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}

function getIsoDay(date) {
  const jsDay = date.getDay(); // 0 dimanche
  return jsDay === 0 ? 7 : jsDay;
}

function buildRecurringDates(startDateStr, recurrence) {
  const startDate = parseDateKey(startDateStr);

  if (!recurrence.enabled) {
    return [startDateStr];
  }
  if (recurrence.interval < 1) {
  return [startDateStr];
}

if (recurrence.endType === "after" && (!recurrence.count || recurrence.count < 1)) {
  return [startDateStr];
}

if (recurrence.endType === "onDate" && !recurrence.endDate) {
  return [startDateStr];
}

  const dates = [];
  const maxSafety = 300;
  let cursor = new Date(startDate);

  if (recurrence.unit === "days") {
    while (dates.length < maxSafety) {
      if (recurrence.endType === "after" && dates.length >= recurrence.count) break;
      if (
        recurrence.endType === "onDate" &&
        recurrence.endDate &&
        toDateKey(cursor) > recurrence.endDate
      ) break;

      dates.push(toDateKey(cursor));
      cursor = addDaysToDate(cursor, recurrence.interval);
    }
  }

  if (recurrence.unit === "weeks") {
   const selectedDays = (
  recurrence.weekDays && recurrence.weekDays.length
    ? [...recurrence.weekDays]
    : [getIsoDay(startDate)]
).sort((a, b) => a - b);
    let weekCursor = new Date(startDate);

    while (dates.length < maxSafety) {
      for (const day of selectedDays) {
        const base = new Date(weekCursor);
        const diff = day - getIsoDay(base);
        const candidate = addDaysToDate(base, diff);

        if (candidate < startDate) continue;

        const candidateKey = toDateKey(candidate);

        if (recurrence.endType === "after" && dates.length >= recurrence.count) break;
        if (
          recurrence.endType === "onDate" &&
          recurrence.endDate &&
          candidateKey > recurrence.endDate
        ) break;

        dates.push(candidateKey);
      }

      if (recurrence.endType === "after" && dates.length >= recurrence.count) break;

      weekCursor = addDaysToDate(weekCursor, recurrence.interval * 7);

      if (
        recurrence.endType === "onDate" &&
        recurrence.endDate &&
        toDateKey(weekCursor) > recurrence.endDate
      ) break;
    }
  }

  if (recurrence.unit === "months") {
    while (dates.length < maxSafety) {
      if (recurrence.endType === "after" && dates.length >= recurrence.count) break;
      if (
        recurrence.endType === "onDate" &&
        recurrence.endDate &&
        toDateKey(cursor) > recurrence.endDate
      ) break;

      dates.push(toDateKey(cursor));
      cursor = addMonthsToDate(cursor, recurrence.interval);
    }
  }

  return dates;
}



  function saveAction() {

    const createdMember = teamMembers.find((m) => m.name === modalForm.staff);

if (createdMember) {
  if (viewMode === "day") {
    setSelectedMemberIds((prev) =>
      prev.includes(createdMember.id) ? prev : [...prev, createdMember.id]
    );
  } else {
    setWeekMemberId(createdMember.id);
    setSelectedMemberIds([createdMember.id]);
  }
}
  if (!modalForm.title.trim()) {
    alert("Indique un nom d’action.");
    return;
  }

  if (!modalForm.staff) {
    alert("Choisis un responsable.");
    return;
  }

  if (!modalForm.start || !modalForm.end) {
    alert("Choisis une heure de début et de fin.");
    return;
  }

  if (timeToMinutes(modalForm.end) <= timeToMinutes(modalForm.start)) {
    alert("L’heure de fin doit être après l’heure de début.");
    return;
  }

if (editingAction) {
  const isSingleOccurrenceEdit =
    editingAction.recurrenceGroupId && editMode === "single";

  // Cas 1 : je modifie UNE action simple et je la transforme en récurrence
  if (!editingAction.recurrenceGroupId && recurrence.enabled) {
    const nextDates = buildRecurringDates(modalForm.date, recurrence);
    const isRecurring = nextDates.length > 1;
    const nextGroupId = isRecurring ? crypto.randomUUID() : null;

    const rebuiltItems = nextDates.map((date, index) => ({
      id: index === 0 ? editingAction.id : crypto.randomUUID(),
      recurrenceGroupId: nextGroupId,
      recurrenceRule: isRecurring
        ? {
            interval: recurrence.interval,
            unit: recurrence.unit,
            weekDays: recurrence.weekDays || [],
            endType: recurrence.endType,
            count: recurrence.count,
            endDate: recurrence.endDate || "",
          }
        : null,
      recurrenceOriginalDate: isRecurring ? modalForm.date : null,
      staff: modalForm.staff,
      title: modalForm.title.trim(),
      clientId: modalForm.clientId || "",
      clientName: modalForm.clientName || "",
      date,
      start: modalForm.start,
      end: modalForm.end,
      notes: modalForm.notes || "",
    }));

    setAppointments((prev) => [
      ...prev.filter((item) => item.id !== editingAction.id),
      ...rebuiltItems,
    ]);

    closeModal();
    return;
  }

  const payload = {
    ...editingAction,
    staff: modalForm.staff,
    title: modalForm.title.trim(),
    clientId: modalForm.clientId || "",
    clientName: modalForm.clientName || "",
    date: modalForm.date,
    start: modalForm.start,
    end: modalForm.end,
    notes: modalForm.notes || "",
    recurrenceGroupId: isSingleOccurrenceEdit ? null : editingAction.recurrenceGroupId,
    recurrenceRule: isSingleOccurrenceEdit
      ? null
      : recurrence.enabled
        ? {
            interval: recurrence.interval,
            unit: recurrence.unit,
            weekDays: recurrence.weekDays || [],
            endType: recurrence.endType,
            count: recurrence.count,
            endDate: recurrence.endDate || "",
          }
        : null,
    recurrenceOriginalDate: isSingleOccurrenceEdit ? null : editingAction.recurrenceOriginalDate,
  };

  // Cas 2 : je modifie toute une série existante
  if (editingAction.recurrenceGroupId && editMode === "series") {
    const nextDates = recurrence.enabled
      ? buildRecurringDates(modalForm.date, recurrence)
      : [modalForm.date];

    const nextGroupId =
      recurrence.enabled && nextDates.length > 1
        ? editingAction.recurrenceGroupId
        : null;

    const rebuiltItems = nextDates.map((date, index) => ({
      id: index === 0 ? editingAction.id : crypto.randomUUID(),
      recurrenceGroupId: nextGroupId,
      recurrenceRule:
        recurrence.enabled && nextDates.length > 1
          ? {
              interval: recurrence.interval,
              unit: recurrence.unit,
              weekDays: recurrence.weekDays || [],
              endType: recurrence.endType,
              count: recurrence.count,
              endDate: recurrence.endDate || "",
            }
          : null,
      recurrenceOriginalDate:
        recurrence.enabled && nextDates.length > 1 ? modalForm.date : null,
      staff: modalForm.staff,
      title: modalForm.title.trim(),
      clientId: modalForm.clientId || "",
      clientName: modalForm.clientName || "",
      date,
      start: modalForm.start,
      end: modalForm.end,
      notes: modalForm.notes || "",
    }));

    setAppointments((prev) => [
      ...prev.filter(
        (item) => item.recurrenceGroupId !== editingAction.recurrenceGroupId
      ),
      ...rebuiltItems,
    ]);

    closeModal();
    return;
  }

  // Cas 3 : modification simple normale
  setAppointments((prev) =>
    prev.map((item) => (item.id === editingAction.id ? payload : item))
  );

  closeModal();
  return;
}

  const dates = buildRecurringDates(modalForm.date, recurrence);
const isRecurring = recurrence.enabled && dates.length > 1;
const recurrenceGroupId = isRecurring ? crypto.randomUUID() : null;

const items = dates.map((date, index) => ({
  id: crypto.randomUUID(),
  recurrenceGroupId,
  recurrenceRule: isRecurring
    ? {
        interval: recurrence.interval,
        unit: recurrence.unit,
        weekDays: recurrence.weekDays || [],
        endType: recurrence.endType,
        count: recurrence.count,
        endDate: recurrence.endDate || "",
      }
    : null,
  recurrenceOriginalDate: isRecurring && index === 0 ? date : modalForm.date,
  staff: modalForm.staff,
  title: modalForm.title.trim(),
  clientId: modalForm.clientId || "",
  clientName: modalForm.clientName || "",
  date,
  start: modalForm.start,
  end: modalForm.end,
  notes: modalForm.notes || "",
}));

setAppointments((prev) => [...prev, ...items]);
closeModal();

}

function openEditModal(item, mode = "single") {
  setEditMode(mode);
  setEditingAction(item);

  setModalForm(
    emptyModalForm({
      staff: item.staff,
      title: item.title,
      clientId: item.clientId,
      clientName: item.clientName,
      date: item.date,
      start: item.start,
      end: item.end,
      notes: item.notes,
    })
  );

  if (item.recurrenceRule) {
    setRecurrence({
      enabled: true,
      interval: item.recurrenceRule.interval || 1,
      unit: item.recurrenceRule.unit || "weeks",
      weekDays:
        item.recurrenceRule.weekDays && item.recurrenceRule.weekDays.length
          ? item.recurrenceRule.weekDays
          : [getIsoDay(parseDateKey(item.date))],
      endType: item.recurrenceRule.endType || "never",
      count: item.recurrenceRule.count || 10,
      endDate: item.recurrenceRule.endDate || "",
    });
  } else {
    setRecurrence(getDefaultRecurrence(item.date));
  }

  setRecurrenceOpen(false);
  setModalOpen(true);
}
function handleEventClick(item) {
  if (item.recurrenceGroupId) {
    setPendingEditAction(item);
    setEditChoiceOpen(true);
    return;
  }

  openEditModal(item, "single");
}
function requestDeleteAction(action) {
  if (!action) return;

  if (action.recurrenceGroupId) {
    setActionToDelete(action);
    setDeleteChoiceOpen(true);
    return;
  }

  deleteSingleAction(action.id);
}

  useEffect(() => {
  function handleWindowMouseUp() {
    if (draggedEvent) {
      handleEventDrop();
    }
  }

  function handleWindowMouseMove(e) {
    if (!draggedEvent) return;
    setDragCursor({ x: e.clientX, y: e.clientY });
  }

  window.addEventListener("mouseup", handleWindowMouseUp);
  window.addEventListener("mousemove", handleWindowMouseMove);

  return () => {
    window.removeEventListener("mouseup", handleWindowMouseUp);
    window.removeEventListener("mousemove", handleWindowMouseMove);
  };
}, [draggedEvent, dragPreview]);

  return (
    <div className="agendaPage">
      <aside className="agendaSidebar">
        <div className="sidebarMonthCard">
  <div className="sidebarMonthHeader">
    <button type="button" onClick={goPrevMonth}>
      {"<"}
    </button>
    <h3>
      {miniCalendarTitle.charAt(0).toUpperCase() + miniCalendarTitle.slice(1)}
    </h3>
    <button type="button" onClick={goNextMonth}>
      {">"}
    </button>
  </div>

  <div className="weekDays">
    <span>L</span>
    <span>M</span>
    <span>M</span>
    <span>J</span>
    <span>V</span>
    <span>S</span>
    <span>D</span>
  </div>

  <div className="monthGrid">
    {miniCalendarCells.map((cell) => {
      const isActive = cell.date && formatDateKey(cell.date) === currentDateKey;

      return (
        <button
          key={cell.key}
          type="button"
          className={`dayCell ${isActive ? "active" : ""} ${!cell.isCurrentMonth ? "muted" : ""}`}
          onClick={() => handleMiniCalendarSelect(cell.date)}
          disabled={!cell.date}
        >
          {cell.label}
        </button>
      );
    })}
  </div>
</div>


        <div className="teamPanel">
          <h4>Équipe</h4>
          {teamMembers.map((member) => {
  const checked =
    viewMode === "week"
      ? weekMemberId === member.id
      : selectedMemberIds.includes(member.id);

  return (
    <label key={member.id} className="teamCheck">
      <input
        type={viewMode === "week" ? "radio" : "checkbox"}
        name={viewMode === "week" ? "weekMember" : undefined}
        checked={checked}
        onChange={() => handleToggleMember(member.id)}
      />
      <span>{member.name}</span>
    </label>
  );
})}

        </div>

        <div className="sidebarButtons">
          <button className="secondaryBtn" type="button">Horaires de présence</button>
          <button className="primaryBtn" type="button">Pointage</button>
        </div>
      </aside>

      <main className="agendaMain">
        <div className="agendaToolbar">
         <div className="toolbarLeft">
  <button className="ghostBtn" type="button" onClick={goToday}>
    Aujourd&apos;hui
  </button>
  <button className="iconBtn" type="button" onClick={goPrev}>
    ‹
  </button>
  <button className="iconBtn" type="button" onClick={goNext}>
    ›
  </button>
</div>


                  <div className="toolbarRight">
<button
  className={`tabBtn ${viewMode === "day" ? "active" : ""}`}
  type="button"
  onClick={() => {
    setViewMode("day");
    setSelectedMemberIds(
      daySelectionBackup && daySelectionBackup.length
        ? daySelectionBackup
        : teamMembers.map((m) => m.id)
    );
  }}
>
  Vue jour
</button>



<button
  className={`tabBtn ${viewMode === "week" ? "active" : ""}`}
  type="button"
  onClick={() => {
    const currentSelection = selectedMemberIds.length
      ? selectedMemberIds
      : [teamMembers[0].id];

    setDaySelectionBackup(currentSelection);

    const firstSelected = currentSelection[0];
    setWeekMemberId(firstSelected);
    setSelectedMemberIds([firstSelected]);
    setViewMode("week");
  }}
>
  Vue semaine
</button>



                      <span className="currentTime">
                          {new Date().toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                          })}
                      </span>
                  </div>

              </div>

        <div className="agendaBoard">
          <div className="timeColumn">
            <div className="timeHeader">{boardTitle}</div>

            <div className="timeBody">
              {hourLabels.map((hour, index) => (
                <div
                  key={hour}
                  className="timeSlot"
                  style={{ height: index === hourLabels.length - 1 ? 0 : `${HOUR_HEIGHT}px` }}
                >
                  {index === hourLabels.length - 1 ? "" : hour}
                </div>
              ))}
            </div>
          </div>

        <div className="columnsWrap">
  {viewMode === "day" ? (
    selectedMembers.map((member) => (
      <AgendaColumn
        key={member.id}
        member={member}
        slots={slots}
        appointments={visibleAppointments}
        filterByMember={true}
        selection={selection}
        dragging={dragging}
        onSlotMouseDown={handleSlotMouseDown}
        onSlotEnter={handleSlotEnter}
        onMouseUpSelection={handleMouseUpSelection}
        onEventClick={handleEventClick}
        draggedEvent={draggedEvent}
        dragPreview={dragPreview}
        onEventDragMove={handleEventDragMove}
        onEventDrop={handleEventDrop}
        onEventDragStart={handleEventDragStart}
      />
    ))
  ) : (
    visibleDays.map((day, index) => {
      const fakeMember = {
        id: index + 1,
        name: formatDayHeader(day),
        color: "blue",
      };

      const dayKey = formatDateKey(day);

      return (
        <AgendaColumn
          key={dayKey}
          member={fakeMember}
          slots={slots}
          appointments={visibleAppointments.filter((a) => a.date === dayKey)}
          filterByMember={false}
          selection={
            selection && selection.date === dayKey
              ? { ...selection, staff: fakeMember.name }
              : null
          }
          dragging={dragging}
          onSlotMouseDown={(_, minutes) => {
            const snapped = snapMinutes(minutes);
            setDragging(true);
            setSelection({
              staff: fakeMember.name,
              date: dayKey,
              anchorMinutes: snapped,
              startMinutes: snapped,
              endMinutes: snapped + SLOT_MINUTES,
            });
          }}
          onSlotEnter={(_, minutes) => {
            if (!dragging) return;
            setSelection((prev) => {
              if (!prev || prev.staff !== fakeMember.name || prev.date !== dayKey) return prev;

              const snapped = snapMinutes(minutes);
              const start = Math.min(prev.anchorMinutes, snapped);
              const end = Math.max(prev.anchorMinutes, snapped) + SLOT_MINUTES;

              return {
                ...prev,
                startMinutes: start,
                endMinutes: end,
              };
            });
          }}
          onMouseUpSelection={handleMouseUpSelection}
          onEventClick={handleEventClick}
          draggedEvent={draggedEvent}
          dragPreview={dragPreview}
          onEventDragMove={null}
onEventDrop={null}
onEventDragStart={null}
        />
      );
    })
  )}
</div>

        </div>
      </main>


{draggedEvent && dragPreview ? (
  <div
    className="agendaDragGhost"
    style={{
      left: `${dragCursor.x + 14}px`,
      top: `${dragCursor.y + 14}px`,
    }}
  >
    <strong>
      {minutesToTime(dragPreview.startMinutes)} - {minutesToTime(dragPreview.endMinutes)}
    </strong>
    <span>{draggedEvent.original.title || "Sans titre"}</span>
    {draggedEvent.original.clientName ? (
      <small>{draggedEvent.original.clientName}</small>
    ) : null}
  </div>
) : null}

      <ActionModal
  open={modalOpen}
  form={modalForm}
  clients={clients}
  editingAction={editingAction}
  onClose={closeModal}
  onChange={handleFormChange}
  onSave={saveAction}
  onDelete={requestDeleteAction}
  recurrenceOpen={recurrenceOpen}
  setRecurrenceOpen={setRecurrenceOpen}
  recurrence={recurrence}
  setRecurrence={setRecurrence}
/>


{deleteChoiceOpen && actionToDelete && (
  <div
    className="agendaModalOverlay"
    onClick={() => {
      setDeleteChoiceOpen(false);
      setActionToDelete(null);
    }}
  >
    <div
      className="agendaModalCard deleteChoiceCard"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="agendaModalHeader">
        <h2>Supprimer l’action</h2>
        <button
          type="button"
          className="ghostBtn"
          onClick={() => {
            setDeleteChoiceOpen(false);
            setActionToDelete(null);
          }}
        >
          Fermer
        </button>
      </div>

      <div className="agendaModalBody deleteChoiceBody">
        <p>
          Cette action fait partie d’une récurrence. Que veux-tu supprimer ?
        </p>

        <div className="deleteChoiceActions">
          <button
            type="button"
            className="ghostBtn"
            onClick={() => deleteOnlyThisOccurrence(actionToDelete.id)}
          >
            Seulement cette action
          </button>

          <button
            type="button"
            className="dangerBtn"
            onClick={() => deleteRecurringGroup(actionToDelete.recurrenceGroupId)}
          >
            Toute la récurrence
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{editChoiceOpen && pendingEditAction && (
  <div
    className="agendaModalOverlay"
    onClick={() => {
      setEditChoiceOpen(false);
      setPendingEditAction(null);
    }}
  >
    <div
      className="agendaModalCard deleteChoiceCard"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="agendaModalHeader">
        <h2>Modifier l’action</h2>
        <button
          type="button"
          className="ghostBtn"
          onClick={() => {
            setEditChoiceOpen(false);
            setPendingEditAction(null);
          }}
        >
          Fermer
        </button>
      </div>

      <div className="agendaModalBody deleteChoiceBody">
        <p>Cette action fait partie d’une récurrence. Que veux-tu modifier ?</p>

        <div className="deleteChoiceActions">
          <button
            type="button"
            className="ghostBtn"
            onClick={() => {
              setEditChoiceOpen(false);
              openEditModal(pendingEditAction, "single");
              setPendingEditAction(null);
            }}
          >
            Seulement cette action
          </button>

          <button
            type="button"
            className="primaryBtn"
            onClick={() => {
              setEditChoiceOpen(false);
              openEditModal(pendingEditAction, "series");
              setPendingEditAction(null);
            }}
          >
            Toute la récurrence
          </button>
        </div>
      </div>
    </div>
  </div>
)}


    </div>
  );
}