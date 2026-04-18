import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../utils/axiosClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Global.css";


const DURATION_OPTIONS = [
  { label: "Hela dagen", value: null, allDay: true },
  { label: "15 min", value: 15, allDay: false },
  { label: "30 min", value: 30, allDay: false },
  { label: "1 timme", value: 60, allDay: false },
  { label: "2 timmar", value: 120, allDay: false },
  { label: "3 timmar", value: 180, allDay: false },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); 

function formatDuration(minutes) {
  if (!minutes) return "Hela dagen";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showDayView, setShowDayView] = useState(false);

  const [priority, setPriority] = useState("medel");
  const [category, setCategory] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [durationOption, setDurationOption] = useState(DURATION_OPTIONS[0]);

  const [editTodoId, setEditTodoId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("medel");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editStartTime, setEditStartTime] = useState("08:00");
  const [editDurationOption, setEditDurationOption] = useState(DURATION_OPTIONS[0]);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const [todoRes, profileRes] = await Promise.all([
        axiosClient.get("/todos"),
        axiosClient.get("/profile"),
      ]);
      setTodos(todoRes.data);
      setUsername(profileRes.data.username);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  useEffect(() => {
    const filtered = todos.filter((todo) => {
      const d = new Date(todo.created_at);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
    });
    filtered.sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      return (timeToMinutes(a.start_time) || 0) - (timeToMinutes(b.start_time) || 0);
    });
    setFilteredTodos(filtered);
  }, [selectedDate, todos]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingTodos = todos
    .filter((todo) => {
      const d = new Date(todo.created_at);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        if (todo.all_day) return true;
        const startMins = timeToMinutes(todo.start_time);
        const nowMins = now.getHours() * 60 + now.getMinutes();
        return startMins >= nowMins;
      }
      return d > now;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      if (dateA - dateB !== 0) return dateA - dateB;
      return (timeToMinutes(a.start_time) || 0) - (timeToMinutes(b.start_time) || 0);
    })
    .slice(0, 8);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    const isAllDay = durationOption.allDay;
    try {
      await axiosClient.post("/todos", {
        text: newTodo,
        created_at: selectedDate.toISOString(),
        priority,
        category: category || null,
        start_time: isAllDay ? null : startTime,
        duration_minutes: isAllDay ? null : durationOption.value,
        all_day: isAllDay,
      });
      setNewTodo("");
      setPriority("medel");
      setCategory("");
      setStartTime("08:00");
      setDurationOption(DURATION_OPTIONS[0]);
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axiosClient.delete(`/todos/${id}`);
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    const isAllDay = editDurationOption.allDay;
    try {
      await axiosClient.put(`/todos/${id}`, {
        text: editText,
        priority: editPriority,
        category: editCategory || null,
        created_at: editDate.toISOString(),
        start_time: isAllDay ? null : editStartTime,
        duration_minutes: isAllDay ? null : editDurationOption.value,
        all_day: isAllDay,
      });
      setEditTodoId(null);
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (todo) => {
    setEditTodoId(todo.id);
    setEditText(todo.text);
    setEditPriority(todo.priority || "medel");
    setEditCategory(todo.category || "");
    setEditDate(new Date(todo.created_at));
    setEditStartTime(todo.start_time ? todo.start_time.slice(0, 5) : "08:00");
    const matched = DURATION_OPTIONS.find(
      o => o.value === todo.duration_minutes && o.allDay === !!todo.all_day
    ) || (todo.all_day ? DURATION_OPTIONS[0] : DURATION_OPTIONS[3]);
    setEditDurationOption(matched);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("sv-SE", {
    month: "short", day: "numeric",
  });

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const hasTodo = todos.some((todo) => {
        const d = new Date(todo.created_at);
        return d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate();
      });
      return hasTodo ? "calendar-todo-day" : null;
    }
    return null;
  };

  const selectedDateLabel = selectedDate.toLocaleDateString("sv-SE", {
    weekday: "long", day: "numeric", month: "long",
  });

  const timedTodos = filteredTodos.filter(t => !t.all_day && t.start_time);
  const allDayTodos = filteredTodos.filter(t => t.all_day);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Hej, {username}</h2>
        <span className="clock">
          {time.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar: Calendar + Upcoming */}
        <div className="dashboard-sidebar">
          <div className="calendar-container">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={tileClassName}
            />
          </div>

          <div className="upcoming-section">
            <p className="section-label">Kommande</p>
            {upcomingTodos.length === 0 ? (
              <p className="empty-state" style={{ padding: "16px 0", fontSize: "0.8125rem" }}>
                Inga kommande aktiviteter
              </p>
            ) : (
              <ul className="upcoming-list">
                {upcomingTodos.map(todo => (
                  <li key={todo.id} className="upcoming-item">
                    <div className={`upcoming-dot dot-${todo.priority || "medel"}`} />
                    <div className="upcoming-content">
                      <span className="upcoming-text">{todo.text}</span>
                      <span className="upcoming-meta">
                        {formatDate(todo.created_at)}
                        {!todo.all_day && todo.start_time && ` · ${todo.start_time.slice(0, 5)}`}
                        {!todo.all_day && todo.duration_minutes && ` · ${formatDuration(todo.duration_minutes)}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main: Todo list */}
        <div className="todo-section">
          <div className="todo-section-header-row">
            <p className="todo-section-header">
              {selectedDateLabel}
              {filteredTodos.length > 0 && ` · ${filteredTodos.length}`}
            </p>
            {timedTodos.length > 0 && (
              <button className="day-view-btn" onClick={() => setShowDayView(true)}>
                Dagsvy
              </button>
            )}
          </div>

          {/* Add form */}
          <div className="todo-form">
            <input
              type="text"
              placeholder="Ny aktivitet..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
              className="todo-main-input"
            />
            <div className="todo-form-row">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="todo-select">
                <option value="låg">Låg</option>
                <option value="medel">Medel</option>
                <option value="hög">Hög</option>
              </select>
              <input
                type="text"
                placeholder="Kategori"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="todo-category-input"
              />
              <select
                value={durationOption.label}
                onChange={(e) => setDurationOption(DURATION_OPTIONS.find(o => o.label === e.target.value))}
                className="todo-select"
              >
                {DURATION_OPTIONS.map(o => <option key={o.label}>{o.label}</option>)}
              </select>
              {!durationOption.allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="todo-time-input"
                />
              )}
              <button onClick={handleAddTodo} className="todo-add-btn">Lägg till</button>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="loading-state">Laddar...</div>
          ) : filteredTodos.length > 0 ? (
            <ul className="todo-list">
              {filteredTodos.map((todo) => (
                <li key={todo.id} className="todo-item">
                  {editTodoId === todo.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(todo.id);
                          if (e.key === "Escape") setEditTodoId(null);
                        }}
                        autoFocus
                        className="edit-main-input"
                      />
                      <div className="edit-form-row">
                        <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="todo-select">
                          <option value="låg">Låg</option>
                          <option value="medel">Medel</option>
                          <option value="hög">Hög</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Kategori"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="todo-category-input"
                        />
                        <select
                          value={editDurationOption.label}
                          onChange={(e) => setEditDurationOption(DURATION_OPTIONS.find(o => o.label === e.target.value))}
                          className="todo-select"
                        >
                          {DURATION_OPTIONS.map(o => <option key={o.label}>{o.label}</option>)}
                        </select>
                        {!editDurationOption.allDay && (
                          <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="todo-time-input" />
                        )}
                        <input
                          type="date"
                          value={editDate.toISOString().split("T")[0]}
                          onChange={(e) => setEditDate(new Date(e.target.value))}
                          className="todo-time-input"
                        />
                      </div>
                      <div className="edit-actions">
                        <button onClick={() => handleSaveEdit(todo.id)} className="todo-add-btn" style={{ padding: "8px 16px", fontSize: "0.8125rem" }}>Spara</button>
                        <button onClick={() => setEditTodoId(null)} className="btn-ghost">Avbryt</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="todo-item-content">
                        <span className="todo-text">{todo.text}</span>
                        <div className="todo-meta">
                          {!todo.all_day && todo.start_time && (
                            <span className="todo-time-badge">
                              {todo.start_time.slice(0, 5)}
                              {todo.duration_minutes && ` · ${formatDuration(todo.duration_minutes)}`}
                            </span>
                          )}
                          {todo.all_day && <span className="todo-allday-badge">Hela dagen</span>}
                          <span className={`priority-${todo.priority || "medel"}`}>{todo.priority}</span>
                          {todo.category && <span className="category-label">{todo.category}</span>}
                        </div>
                      </div>
                      <div className="todo-actions">
                        <button className="edit-btn" onClick={() => startEdit(todo)}>✎</button>
                        <button className="delete-btn" onClick={() => handleDeleteTodo(todo.id)}>✕</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Inga aktiviteter för {selectedDateLabel}.</p>
          )}
        </div>
      </div>

      {/* Day view modal */}
      {showDayView && (
        <div className="modal-overlay" onClick={() => setShowDayView(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDateLabel}</h3>
              <button className="modal-close" onClick={() => setShowDayView(false)}>✕</button>
            </div>

            {allDayTodos.length > 0 && (
              <div className="dayview-allday">
                <span className="dayview-allday-label">Hela dagen</span>
                <div className="dayview-allday-items">
                  {allDayTodos.map(todo => (
                    <span key={todo.id} className="dayview-allday-chip">{todo.text}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="dayview-timeline">
              {HOURS.map(hour => {
                const hourMins = hour * 60;
                const todosInHour = timedTodos.filter(todo => {
                  const start = timeToMinutes(todo.start_time);
                  return start >= hourMins && start < hourMins + 60;
                });

                return (
                  <div key={hour} className="dayview-hour">
                    <span className="dayview-hour-label">{String(hour).padStart(2, "0")}:00</span>
                    <div className="dayview-hour-content">
                      {isToday && hour === time.getHours() && (
                        <div
                          className="dayview-now-line"
                          style={{ top: `${(time.getMinutes() / 60) * 100}%` }}
                        />
                      )}
                      {todosInHour.map(todo => {
                        const startMins = timeToMinutes(todo.start_time);
                        const offsetPercent = ((startMins - hourMins) / 60) * 100;
                        const heightPercent = todo.duration_minutes
                          ? Math.max((todo.duration_minutes / 60) * 100, 20)
                          : 20;
                        return (
                          <div
                            key={todo.id}
                            className={`dayview-event pev-${todo.priority || "medel"}`}
                            style={{ top: `${offsetPercent}%`, height: `${heightPercent}%` }}
                          >
                            <span className="dayview-event-title">{todo.text}</span>
                            <span className="dayview-event-time">
                              {todo.start_time.slice(0, 5)}
                              {todo.duration_minutes && ` · ${formatDuration(todo.duration_minutes)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
