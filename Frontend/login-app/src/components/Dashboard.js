import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../utils/axiosClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Global.css";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [editTodoId, setEditTodoId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("medel");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState(new Date());

  const [priority, setPriority] = useState("medel");
  const [category, setCategory] = useState("");

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
      console.error("Fel vid hämtning:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    const filtered = todos.filter((todo) => {
      const todoDate = new Date(todo.created_at);
      return (
        todoDate.getFullYear() === selectedDate.getFullYear() &&
        todoDate.getMonth() === selectedDate.getMonth() &&
        todoDate.getDate() === selectedDate.getDate()
      );
    });
    setFilteredTodos(filtered);
  }, [selectedDate, todos]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}, []);

useEffect(() => {
  const showNotification = (todo) => {
    if (Notification.permission === "granted") {
      new Notification("Todo påminnelse", {
        body: `"${todo.text}" är snart aktuell!`,
        tag: todo.id, 
      });
    }
  };

  const checkReminders = () => {
    const now = new Date();
    todos.forEach(todo => {
      if (!todo.reminderSent && todo.created_at) {
        const todoDate = new Date(todo.created_at);
        const diff = Math.abs(todoDate - now);
        if (diff < 5 * 60 * 1000) {
          showNotification(todo);
          todo.reminderSent = true; 
        }
      }
    });
  };

  const interval = setInterval(checkReminders, 60 * 1000);
  return () => clearInterval(interval);
}, [todos]);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await axiosClient.post("/todos", {
        text: newTodo,
        created_at: selectedDate.toISOString(),
        priority,
        category: category || null,
      });
      setNewTodo("");
      setPriority("medel");
      setCategory("");
      fetchTodos();
    } catch (err) {
      console.error("Kunde inte lägga till todo:", err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axiosClient.delete(`/todos/${id}`);
      fetchTodos();
    } catch (err) {
      console.error("Kunde inte ta bort todo:", err);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      await axiosClient.put(`/todos/${id}`, {
        text: editText,
        priority: editPriority,
        category: editCategory || null,
        created_at: editDate.toISOString(),
      });
      setEditTodoId(null);
      setEditText("");
      setEditPriority("medel");
      setEditCategory("");
      fetchTodos();
    } catch (err) {
      console.error("Kunde inte uppdatera todo:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const hasTodo = todos.some((todo) => {
        const todoDate = new Date(todo.created_at);
        return (
          todoDate.getFullYear() === date.getFullYear() &&
          todoDate.getMonth() === date.getMonth() &&
          todoDate.getDate() === date.getDate()
        );
      });
      return hasTodo ? "calendar-todo-day" : null;
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <h2>Att göra idag, {username}!</h2>

      <div className="clock">
        {time.toLocaleTimeString("sv-SE")} - {time.toLocaleDateString("sv-SE")}
      </div>

      <div className="dashboard-main">
        <div className="calendar-container">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileClassName={tileClassName}
          />
        </div>

        <div className="todo-section">
          <div className="todo-input">
            <input
              type="text"
              aria-label="Ny anteckning"
              placeholder="Ny anteckning..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTodo();
              }}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              aria-label="Prioritet"
            >
              <option value="låg">Låg</option>
              <option value="medel">Medel</option>
              <option value="hög">Hög</option>
            </select>
            <input
              type="text"
              placeholder="Kategori (valfritt)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Kategori"
            />
            <button onClick={handleAddTodo}>Lägg till</button>
          </div>

          {loading ? (
            <p>Laddar anteckningar...</p>
          ) : filteredTodos.length > 0 ? (
            <ul className="todo-list">
              {filteredTodos.map((todo) => (
                <li key={todo.id} className="todo-item">
                  {editTodoId === todo.id ? (
                    <>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(todo.id);
                          if (e.key === "Escape") {
                            setEditTodoId(null);
                            setEditText("");
                            setEditPriority("medel");
                            setEditCategory("");
                            setEditDate(new Date());
                          }
                        }}
                        autoFocus
                      />
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        aria-label="Prioritet för redigering"
                      >
                        <option value="låg">Låg</option>
                        <option value="medel">Medel</option>
                        <option value="hög">Hög</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Kategori (valfritt)"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        aria-label="Kategori för redigering"
                      />
                      <input
                        type="date"
                        value={editDate.toISOString().split("T")[0]}
                        onChange={(e) => setEditDate(new Date(e.target.value))}
                        aria-label="Datum för redigering"
                      />
                      <button onClick={() => handleSaveEdit(todo.id)}>Spara</button>
                      <button
                        onClick={() => {
                          setEditTodoId(null);
                          setEditText("");
                          setEditPriority("medel");
                          setEditCategory("");
                          setEditDate(new Date());
                        }}
                      >
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <>
                      <span>
                        {todo.text}{" "}
                        <span className={`priority-${todo.priority || "medel"}`}>
                          [{todo.priority}]
                        </span>
                        {todo.category && (
                          <span className="category-label"> - {todo.category}</span>
                        )}
                      </span>
                      <small> ({formatDate(todo.created_at)})</small>
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditTodoId(todo.id);
                          setEditText(todo.text);
                          setEditPriority(todo.priority || "medel");
                          setEditCategory(todo.category || "");
                          setEditDate(new Date(todo.created_at));
                        }}
                        title="Redigera"
                        aria-label={`Redigera anteckning: ${todo.text}`}
                      >
                        ✎
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteTodo(todo.id)}
                        title="Ta bort"
                        aria-label={`Ta bort anteckning: ${todo.text}`}
                      >
                        ✖
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Inga anteckningar för detta datum</p>
          )}
        </div>
      </div>
    </div>
  );
}
