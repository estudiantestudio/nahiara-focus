const $ = (selector, root = document) => root.querySelector(selector);

const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector)
];

const DB = "focus-cero-v1";

const defaultSubjects = [
  "Matemática NS",
  "Economía NS",
  "Lenguaje",
  "Inglés",
  "Teatro",
  "TOK",
  "Educación Ciudadana",
  "Física",
  "Deporte",
  "PAES M1",
  "PAES M2",
  "PAES Competencia Lectora",
  "PAES Historia",
  "PAES Ciencias",
  "CAS",
  "Negocio personal",
  "Inglés C1",
  "SAT"
];

const defaultHabits = [
  "Dormí ocho horas",
  "Hice repaso escolar",
  "Estudié una materia profunda",
  "Hice PAES",
  "Dejé el celular lejos",
  "Preparé el día siguiente",
  "Tomé suficiente agua"
];

const defaultSchedule = {
  1: [
    ["17:00", "17:40", "Comida y descanso"],
    ["17:45", "18:10", "Repaso escolar"],
    ["18:20", "19:00", "Lenguaje o tarea ligera"],
    ["20:00", "20:50", "Matemática NS"],
    ["21:30", "22:00", "Cerrar el día"]
  ],

  2: [
    ["15:30", "16:10", "Comida y descanso"],
    ["16:20", "17:10", "Física"],
    ["17:25", "18:10", "PAES Historia"],
    ["18:25", "19:10", "PAES Matemática"]
  ],

  3: [
    ["15:30", "16:00", "Repaso escolar"],
    ["16:10", "17:00", "Economía NS"],
    ["17:15", "18:00", "Inglés"],
    ["18:15", "19:05", "Física"]
  ],

  4: [
    ["15:30", "16:00", "Repaso escolar"],
    ["16:10", "17:00", "Matemática NS"],
    ["17:15", "18:00", "PAES Lenguaje"],
    ["18:15", "19:05", "Física o Matemática"]
  ],

  5: [
    ["15:30", "16:00", "Repaso escolar"],
    ["16:10", "17:00", "Economía o trabajo urgente"],
    ["17:15", "18:00", "TOK, Teatro, Ciudadanía o CAS"],
    ["18:15", "18:45", "Corrección semanal"]
  ],

  6: [
    ["10:00", "12:30", "Simulacro PAES"],
    ["15:00", "16:00", "Corrección"],
    ["16:20", "17:10", "Física o Matemática"],
    ["17:30", "18:10", "Economía, CAS o negocio"]
  ],

  0: [
    ["11:00", "11:40", "Repaso de errores"],
    ["12:00", "12:45", "Inglés"],
    ["16:00", "16:45", "CAS o negocio"],
    ["19:00", "19:30", "Planificación semanal"]
  ]
};

let state = load();

let view = "today";

let timer = {
  seconds: 0,
  total: 0,
  running: false,
  interval: null,
  subject: "Física",
  goal: "Sesión de concentración"
};

function createId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function load() {
  try {
    const saved = localStorage.getItem(DB);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("No se pudieron cargar los datos:", error);
  }

  return {
    name: "Nahiara",
    mode: "Vacaciones",
    energy: "Media",
    sleep: "22:30",
    wake: "06:30",

    subjects: defaultSubjects.map((name, index) => ({
      id: createId(),
      name,
      goal: index < 9 ? 180 : 90,
      minutes: 0,
      mastery: 0
    })),

    tasks: [],
    errors: [],
    evaluations: [],
    sessions: [],
    habits: {},
    schedule: defaultSchedule,

    settings: {
      largeText: false
    }
  };
}

function save() {
  try {
    localStorage.setItem(DB, JSON.stringify(state));
  } catch (error) {
    console.error("No se pudieron guardar los datos:", error);
    toast("No se pudieron guardar los datos");
  }
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function esc(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (character) => {
      const characters = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      };

      return characters[character];
    }
  );
}

function daysUntil(dateString) {
  if (!dateString) {
    return 9999;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(dueDate.getTime())) {
    return 9999;
  }

  return Math.ceil(
    (dueDate - today) / 86400000
  );
}

function priorityScore(task) {
  let points =
    {
      Alta: 5,
      Media: 2,
      Baja: 0
    }[task.priority] || 0;

  const days = daysUntil(task.due);

  if (days < 0) {
    points += 6;
  } else if (days === 0) {
    points += 10;
  } else if (days === 1) {
    points += 8;
  } else if (days <= 3) {
    points += 7;
  }

  if (
    task.difficulty === "Difícil" ||
    task.difficulty === "Muy difícil"
  ) {
    points += 4;
  }

  if (Number(task.duration) <= 30) {
    points += 1;
  }

  return points;
}

function todayTasks() {
  return state.tasks
    .filter((task) => task.status !== "Completada")
    .sort(
      (taskA, taskB) =>
        priorityScore(taskB) -
        priorityScore(taskA)
    );
}

function toast(message) {
  const toastElement = $("#toast");

  if (!toastElement) {
    return;
  }

  toastElement.textContent = message;
  toastElement.classList.add("show");

  window.setTimeout(() => {
    toastElement.classList.remove("show");
  }, 2200);
}

function header(
  title,
  eyebrow = "Focus C.E.R.O."
) {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1 class="title">${title}</h1>
      </div>

      <button
        class="icon-btn"
        onclick="openMenu()"
        aria-label="Abrir menú"
      >
        ☰
      </button>
    </header>
  `;
}

function nav() {
  const items = [
    ["today", "⌂", "Hoy"],
    ["plan", "▦", "Plan"],
    ["tasks", "✓", "Tareas"],
    ["study", "◷", "Estudiar"],
    ["progress", "↗", "Progreso"]
  ];

  return `
    <nav class="bottom-nav">
      ${items
        .map(
          ([itemView, icon, label]) => `
            <button
              class="nav-btn ${
                view === itemView
                  ? "active"
                  : ""
              }"
              onclick="go('${itemView}')"
            >
              <span>${icon}</span>
              ${label}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function taskCard(task) {
  const completed =
    task.status === "Completada";

  const priorityClass = String(
    task.priority || "Media"
  ).toLowerCase();

  return `
    <article class="card task">
      <button
        class="check ${
          completed ? "done" : ""
        }"
        onclick="toggleTask('${task.id}')"
        aria-label="Completar tarea"
      >
        ${completed ? "✓" : ""}
      </button>

      <div>
        <h3>${esc(task.title)}</h3>

        <p>
          ${esc(task.subject)}
          · ${esc(task.duration)} min
          · vence ${esc(task.due || "sin fecha")}
        </p>

        <div class="badges">
          <span class="badge ${priorityClass}">
            ${esc(task.priority)}
          </span>

          <span class="badge">
            ${esc(task.type)}
          </span>

          <span class="badge">
            Puntos ${priorityScore(task)}
          </span>
        </div>
      </div>

      <div class="task-actions">
        <button
          class="mini"
          onclick="startTask('${task.id}')"
          aria-label="Iniciar tarea"
        >
          ▶
        </button>

        <button
          class="mini"
          onclick="editTask('${task.id}')"
          aria-label="Editar tarea"
        >
          ✎
        </button>
      </div>
    </article>
  `;
}

function render() {
  document.documentElement.style.fontSize =
    state.settings.largeText
      ? "18px"
      : "16px";

  const app = $("#app");

  if (!app) {
    return;
  }

  app.className = "app-shell";

  const views = {
    today: renderToday,
    plan: renderPlan,
    tasks: renderTasks,
    study: renderStudy,
    progress: renderProgress
  };

  const renderCurrentView =
    views[view] || renderToday;

  app.innerHTML =
    renderCurrentView() + nav();
}

function renderToday() {
  const now = new Date();

  const date = now.toLocaleDateString(
    "es-CL",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  );

  const tasks = todayTasks();

  const completedTasks =
    state.tasks.filter(
      (task) =>
        task.status === "Completada"
    ).length;

  const totalTasks = state.tasks.length;

  const percentage = totalTasks
    ? Math.round(
        (completedTasks / totalTasks) * 100
      )
    : 0;

  const nextTask = tasks[0];

  return `
    ${header("Hoy", date)}

    <section class="hero">
      <h2>
        Hola, ${esc(state.name)} 👋
      </h2>

      <p>
        ${
          nextTask
            ? `Tu prioridad es <b>${esc(
                nextTask.title
              )}</b>.`
            : "Tu día está limpio. Agrega tu prioridad principal."
        }
      </p>

      <div class="progress">
        <span
          style="width: ${percentage}%"
        ></span>
      </div>

      <small>
        ${completedTasks} de ${totalTasks}
        tareas completadas
        · ${percentage}%
      </small>
    </section>

    <div class="stats">
      <div class="stat">
        <strong>${tasks.length}</strong>
        <span>Pendientes</span>
      </div>

      <div class="stat">
        <strong>${state.energy}</strong>
        <span>Energía</span>
      </div>

      <div class="stat">
        <strong>${state.sleep}</strong>
        <span>Dormir</span>
      </div>
    </div>

    <div class="grid2">
      <button
        class="quick"
        onclick="quickPlan('late')"
      >
        🚨
        <b>Estoy atrasada</b>
        <span>Ordenar lo urgente</span>
      </button>

      <button
        class="quick"
        onclick="quickPlan('short')"
      >
        ⏱️
        <b>No tengo tiempo</b>
        <span>Plan mínimo de 40 min</span>
      </button>

      <button
        class="quick"
        onclick="quickPlan('tired')"
      >
        🌙
        <b>Estoy cansada</b>
        <span>Reducir la carga</span>
      </button>

      <button
        class="quick"
        onclick="openEnergy()"
      >
        ⚡
        <b>Energía: ${state.energy}</b>
        <span>Ajustar el día</span>
      </button>
    </div>

    <div class="section-head">
      <h2>Prioridades</h2>

      <button
        class="link-btn"
        onclick="openTask()"
      >
        + Agregar
      </button>
    </div>

    ${
      tasks.length
        ? tasks
            .slice(0, 6)
            .map(taskCard)
            .join("")
        : `
          <div class="card empty">
            No tienes tareas pendientes.
            Agrega una para comenzar.
          </div>
        `
    }

    <button
      class="fab"
      onclick="openTask()"
      aria-label="Agregar tarea"
    >
      +
    </button>
  `;
}

function renderPlan() {
  const currentDay = new Date().getDay();

  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
  ];

  return `
    ${header(
      "Plan semanal",
      "Rutina editable"
    )}

    <div class="week-tabs">
      ${dayNames
        .map(
          (dayName, index) => `
            <button
              class="day-tab ${
                index === currentDay
                  ? "active"
                  : ""
              }"
              onclick="showDay(${index}, this)"
            >
              ${dayName.slice(0, 3)}
            </button>
          `
        )
        .join("")}
    </div>

    <div id="dayPlan">
      ${dayPlan(currentDay)}
    </div>

    <div class="section-head">
      <h2>Materias</h2>
    </div>

    <div class="subject-grid">
      ${state.subjects
        .map((subject) => {
          const percentage = Math.min(
            100,
            subject.goal
              ? (subject.minutes /
                  subject.goal) *
                  100
              : 0
          );

          return `
            <article class="subject-card">
              <span>📘</span>

              <h3>
                ${esc(subject.name)}
              </h3>

              <p>
                ${subject.minutes}/
                ${subject.goal} min
                esta semana
              </p>

              <div class="meter">
                <span
                  style="width: ${percentage}%"
                ></span>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function dayPlan(day) {
  const list =
    state.schedule[day] || [];

  return `
    <div class="section-head">
      <h2>Bloques del día</h2>
    </div>

    ${
      list.length
        ? list
            .map(
              (block, index) => `
                <article class="card task">
                  <div class="check">
                    ${index + 1}
                  </div>

                  <div>
                    <h3>
                      ${esc(block[2])}
                    </h3>

                    <p>
                      ${block[0]}–${block[1]}
                    </p>
                  </div>

                  <button
                    class="mini"
                    onclick="startNamed('${esc(
                      block[2]
                    )}')"
                  >
                    ▶
                  </button>
                </article>
              `
            )
            .join("")
        : `
          <div class="card empty">
            No hay bloques para este día.
          </div>
        `
    }
  `;
}

function showDay(day, element) {
  $$(".day-tab").forEach(
    (button) => {
      button.classList.remove("active");
    }
  );

  element.classList.add("active");

  const dayPlanElement = $("#dayPlan");

  if (dayPlanElement) {
    dayPlanElement.innerHTML =
      dayPlan(day);
  }
}

function renderTasks() {
  const tasks = [...state.tasks].sort(
    (taskA, taskB) =>
      priorityScore(taskB) -
      priorityScore(taskA)
  );

  return `
    ${header(
      "Tareas",
      "Ordenadas por prioridad"
    )}

    <div class="section-head">
      <h2>
        ${tasks.length} registradas
      </h2>

      <button
        class="link-btn"
        onclick="openTask()"
      >
        + Nueva
      </button>
    </div>

    ${
      tasks.length
        ? tasks.map(taskCard).join("")
        : `
          <div class="card empty">
            Aún no hay tareas.
          </div>
        `
    }

    <button
      class="fab"
      onclick="openTask()"
    >
      +
    </button>
  `;
}

function renderStudy() {
  const ceroSteps = [
    [
      "C",
      "Comprender",
      "Explica el concepto, las variables y tus dudas."
    ],
    [
      "E",
      "Extraer",
      "Registra la fórmula, símbolos, unidades y condiciones."
    ],
    [
      "R",
      "Resolver",
      "Realiza ejercicios fáciles, medios y difíciles."
    ],
    [
      "O",
      "Observar",
      "Registra el error, la causa, la corrección y el próximo repaso."
    ]
  ];

  return `
    ${header(
      "Estudiar",
      "Concentración y método C.E.R.O."
    )}

    <section class="hero">
      <h2>
        Una sesión clara vale más
        que una hora distraída.
      </h2>

      <p>
        Elige duración, materia y
        objetivo. La sesión se guardará
        automáticamente.
      </p>
    </section>

    <div class="grid2">
      ${[25, 40, 50, 60]
        .map(
          (minutes) => `
            <button
              class="quick"
              onclick="openTimer(${minutes})"
            >
              ⏳
              <b>${minutes} minutos</b>
              <span>Sesión enfocada</span>
            </button>
          `
        )
        .join("")}
    </div>

    <div class="section-head">
      <h2>Método C.E.R.O.</h2>
    </div>

    ${ceroSteps
      .map(
        ([letter, title, description]) => `
          <article class="card cerostep">
            <h3>
              ${letter} — ${title}
            </h3>

            <p>${description}</p>
          </article>
        `
      )
      .join("")}

    <button
      class="primary"
      style="width: 100%"
      onclick="openCero()"
    >
      Iniciar sesión C.E.R.O.
    </button>
  `;
}

function renderProgress() {
  const week = last7();

  const totalMinutes =
    state.sessions.reduce(
      (total, session) =>
        total +
        Number(session.duration || 0),
      0
    );

  const completedTasks =
    state.tasks.filter(
      (task) =>
        task.status === "Completada"
    ).length;

  const habitsPercentage = habitPct();

  return `
    ${header(
      "Progreso",
      "Datos útiles, sin presión"
    )}

    <div class="stats">
      <div class="stat">
        <strong>
          ${
            Math.round(
              (totalMinutes / 60) * 10
            ) / 10
          } h
        </strong>

        <span>Estudiadas</span>
      </div>

      <div class="stat">
        <strong>
          ${completedTasks}
        </strong>

        <span>Tareas listas</span>
      </div>

      <div class="stat">
        <strong>
          ${habitsPercentage}%
        </strong>

        <span>Hábitos hoy</span>
      </div>
    </div>

    <article class="card">
      <h2>
        Minutos últimos 7 días
      </h2>

      <div class="chart">
        ${week
          .map((day) => {
            const height = Math.max(
              8,
              Math.min(
                100,
                (day.minutes / 120) * 100
              )
            );

            return `
              <div
                class="bar"
                style="height: ${height}%"
                title="${day.minutes} minutos"
              >
                <label>
                  ${day.label}
                </label>
              </div>
            `;
          })
          .join("")}
      </div>
    </article>

    <div class="section-head">
      <h2>Hábitos de hoy</h2>
    </div>

    ${defaultHabits
      .map(
        (habit) => `
          <article class="card habit-row">
            <div>
              <b>${habit}</b>
            </div>

            <button
              class="switch ${
                state.habits[
                  dateKey()
                ]?.[habit]
                  ? "on"
                  : ""
              }"
              onclick="toggleHabit(
                '${esc(habit)}',
                this
              )"
            >
              <span></span>
            </button>
          </article>
        `
      )
      .join("")}

    <button
      class="secondary"
      style="
        width: 100%;
        margin-top: 8px;
      "
      onclick="exportData()"
    >
      Exportar copia de seguridad
    </button>
  `;
}

function last7() {
  return Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date();

      date.setDate(
        date.getDate() - 6 + index
      );

      const key = dateKey(date);

      const minutes =
        state.sessions
          .filter(
            (session) =>
              session.date === key
          )
          .reduce(
            (total, session) =>
              total +
              Number(
                session.duration || 0
              ),
            0
          );

      return {
        label: date
          .toLocaleDateString(
            "es-CL",
            {
              weekday: "short"
            }
          )
          .slice(0, 2),

        minutes
      };
    }
  );
}

function habitPct() {
  const todayHabits =
    state.habits[dateKey()] || {};

  const completed =
    Object.values(todayHabits)
      .filter(Boolean)
      .length;

  return (
    Math.round(
      (completed /
        defaultHabits.length) *
        100
    ) || 0
  );
}

function modal(title, body) {
  closeModal();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        class="modal-backdrop"
        onclick="closeModal(event)"
      >
        <section class="modal">
          <div class="modal-head">
            <h2>${title}</h2>

            <button
              class="icon-btn"
              onclick="closeModal()"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          ${body}
        </section>
      </div>
    `
  );
}

function closeModal(event) {
  if (
    event &&
    event.target !== event.currentTarget
  ) {
    return;
  }

  const backdrop =
    $(".modal-backdrop");

  if (backdrop) {
    backdrop.remove();
  }
}

function openTask(id = "") {
  const task = id
    ? state.tasks.find(
        (item) => item.id === id
      )
    : null;

  modal(
    task
      ? "Editar tarea"
      : "Nueva tarea",

    `
      <form
        class="form"
        onsubmit="saveTask(
          event,
          '${id || ""}'
        )"
      >
        <div class="field">
          <label>Título</label>

          <input
            name="title"
            required
            value="${esc(
              task?.title || ""
            )}"
            placeholder="Ej.: Guía de Física"
          >
        </div>

        <div class="field">
          <label>Materia</label>

          <select name="subject">
            ${state.subjects
              .map(
                (subject) => `
                  <option
                    ${
                      task?.subject ===
                      subject.name
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(subject.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="grid2">
          <div class="field">
            <label>
              Fecha de entrega
            </label>

            <input
              type="date"
              name="due"
              value="${
                task?.due ||
                dateKey()
              }"
            >
          </div>

          <div class="field">
            <label>
              Duración estimada
            </label>

            <input
              type="number"
              min="5"
              name="duration"
              value="${
                task?.duration || 40
              }"
            >
          </div>
        </div>

        <div class="grid2">
          <div class="field">
            <label>Prioridad</label>

            <select name="priority">
              ${[
                "Alta",
                "Media",
                "Baja"
              ]
                .map(
                  (priority) => `
                    <option
                      ${
                        task?.priority ===
                        priority
                          ? "selected"
                          : ""
                      }
                    >
                      ${priority}
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>

          <div class="field">
            <label>Dificultad</label>

            <select name="difficulty">
              ${[
                "Fácil",
                "Media",
                "Difícil",
                "Muy difícil"
              ]
                .map(
                  (difficulty) => `
                    <option
                      ${
                        task?.difficulty ===
                        difficulty
                          ? "selected"
                          : ""
                      }
                    >
                      ${difficulty}
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label>Tipo</label>

          <select name="type">
            ${[
              "Colegio",
              "PAES",
              "IB",
              "CAS",
              "Negocio",
              "Ejercicio",
              "Personal",
              "Repaso",
              "Simulacro",
              "Proyecto"
            ]
              .map(
                (type) => `
                  <option
                    ${
                      task?.type === type
                        ? "selected"
                        : ""
                    }
                  >
                    ${type}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="field">
          <label>Descripción</label>

          <textarea
            name="description"
          >${esc(
            task?.description || ""
          )}</textarea>
        </div>

        <button
          class="primary"
          type="submit"
        >
          Guardar tarea
        </button>

        ${
          task
            ? `
              <button
                class="danger"
                type="button"
                onclick="deleteTask(
                  '${task.id}'
                )"
              >
                Eliminar tarea
              </button>
            `
            : ""
        }
      </form>
    `
  );
}

function saveTask(event, id) {
  event.preventDefault();

  const formData =
    Object.fromEntries(
      new FormData(event.target)
    );

  if (id) {
    const task =
      state.tasks.find(
        (item) => item.id === id
      );

    if (task) {
      Object.assign(task, formData);
    }
  } else {
    state.tasks.push({
      id: createId(),
      ...formData,
      status: "Pendiente",
      created: dateKey()
    });
  }

  save();
  closeModal();
  render();
  toast("Tarea guardada ✓");
}

function editTask(id) {
  openTask(id);
}

function deleteTask(id) {
  state.tasks =
    state.tasks.filter(
      (task) => task.id !== id
    );

  save();
  closeModal();
  render();
  toast("Tarea eliminada");
}

function toggleTask(id) {
  const task =
    state.tasks.find(
      (item) => item.id === id
    );

  if (!task) {
    return;
  }

  task.status =
    task.status === "Completada"
      ? "Pendiente"
      : "Completada";

  save();
  render();

  toast(
    task.status === "Completada"
      ? "Bien hecho. Tarea completada 🎯"
      : "Tarea reabierta"
  );
}

function startTask(id) {
  const task =
    state.tasks.find(
      (item) => item.id === id
    );

  if (!task) {
    return;
  }

  timer.subject = task.subject;
  timer.goal = task.title;

  openTimer(
    Number(task.duration) || 40
  );
}

function startNamed(name) {
  timer.goal = name;
  openTimer(40);
}

function openTimer(minutes = 40) {
  clearInterval(timer.interval);

  timer.total = minutes * 60;
  timer.seconds = timer.total;
  timer.running = false;

  modal(
    "Temporizador",
    `
      <div class="timer">
        <div class="field">
          <label>Materia</label>

          <select id="timerSubject">
            ${state.subjects
              .map(
                (subject) => `
                  <option
                    ${
                      subject.name ===
                      timer.subject
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(subject.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="field">
          <label>Objetivo</label>

          <input
            id="timerGoal"
            value="${esc(timer.goal)}"
          >
        </div>

        <div
          class="timer-ring"
          id="timerRing"
        >
          <div
            class="timer-ring-inner"
          >
            <div
              class="timer-display"
              id="timerDisplay"
            >
              ${fmt(timer.seconds)}
            </div>
          </div>
        </div>

        <div class="grid2">
          <button
            class="primary"
            onclick="toggleTimer()"
            id="timerBtn"
          >
            Iniciar
          </button>

          <button
            class="secondary"
            onclick="finishTimer()"
          >
            Finalizar
          </button>
        </div>
      </div>
    `
  );
}

function fmt(seconds) {
  const safeSeconds = Math.max(
    0,
    seconds
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function toggleTimer() {
  timer.running = !timer.running;

  const button = $("#timerBtn");

  if (button) {
    button.textContent =
      timer.running
        ? "Pausar"
        : "Continuar";
  }

  if (timer.running) {
    clearInterval(timer.interval);

    timer.interval = setInterval(
      () => {
        timer.seconds -= 1;

        const percentage =
          (1 -
            timer.seconds /
              timer.total) *
          100;

        const display =
          $("#timerDisplay");

        const ring = $("#timerRing");

        if (display) {
          display.textContent = fmt(
            timer.seconds
          );
        }

        if (ring) {
          ring.style.setProperty(
            "--p",
            `${Math.max(
              0,
              Math.min(
                100,
                percentage
              )
            )}%`
          );
        }

        if (timer.seconds <= 0) {
          finishTimer();
        }
      },
      1000
    );
  } else {
    clearInterval(timer.interval);
  }
}

function finishTimer() {
  clearInterval(timer.interval);

  timer.running = false;

  const usedMinutes = Math.max(
    1,
    Math.round(
      (timer.total - timer.seconds) /
        60
    )
  );

  const subject =
    $("#timerSubject")?.value ||
    timer.subject;

  const goal =
    $("#timerGoal")?.value ||
    timer.goal;

  state.sessions.push({
    id: createId(),
    date: dateKey(),
    subject,
    goal,
    duration: usedMinutes,
    concentration: 3
  });

  const subjectItem =
    state.subjects.find(
      (item) =>
        item.name === subject
    );

  if (subjectItem) {
    subjectItem.minutes +=
      usedMinutes;
  }

  save();
  closeModal();
  render();

  toast(
    `Sesión guardada: ${usedMinutes} min`
  );
}

function openCero() {
  modal(
    "Sesión C.E.R.O.",
    `
      <form
        class="form"
        onsubmit="saveCero(event)"
      >
        <div class="field">
          <label>Materia</label>

          <select name="subject">
            ${state.subjects
              .map(
                (subject) => `
                  <option>
                    ${esc(subject.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="field">
          <label>
            C — ¿Qué comprendiste?
          </label>

          <textarea
            name="comprehend"
            required
            placeholder="Explica el concepto con tus propias palabras."
          ></textarea>
        </div>

        <div class="field">
          <label>
            E — Fórmula, unidades
            o ideas clave
          </label>

          <textarea
            name="extract"
            placeholder="Escribe fórmulas, variables, unidades y condiciones."
          ></textarea>
        </div>

        <div class="field">
          <label>
            R — Ejercicios realizados
            y resultado
          </label>

          <textarea
            name="resolve"
            placeholder="Anota cuántos ejercicios hiciste y cuántos resultaron correctos."
          ></textarea>
        </div>

        <div class="field">
          <label>
            O — Error encontrado
            y corrección
          </label>

          <textarea
            name="observe"
            placeholder="Explica el error, su causa y cómo evitarlo."
          ></textarea>
        </div>

        <div class="grid2">
          <div class="field">
            <label>
              Duración
            </label>

            <input
              type="number"
              name="duration"
              value="40"
              min="5"
            >
          </div>

          <div class="field">
            <label>
              Concentración 1–5
            </label>

            <input
              type="number"
              name="concentration"
              value="3"
              min="1"
              max="5"
            >
          </div>
        </div>

        <button class="primary">
          Guardar sesión
        </button>
      </form>
    `
  );
}

function saveCero(event) {
  event.preventDefault();

  const formData =
    Object.fromEntries(
      new FormData(event.target)
    );

  const duration =
    Number(formData.duration) || 0;

  const concentration =
    Number(formData.concentration) ||
    3;

  state.sessions.push({
    id: createId(),
    date: dateKey(),
    ...formData,
    duration,
    concentration
  });

  const subject =
    state.subjects.find(
      (item) =>
        item.name ===
        formData.subject
    );

  if (subject) {
    subject.minutes += duration;
  }

  if (
    formData.observe &&
    formData.observe.trim()
  ) {
    state.errors.push({
      id: createId(),
      date: dateKey(),
      subject: formData.subject,
      explanation:
        formData.observe,
      status: "Pendiente",
      repeat: addDays(1)
    });
  }

  save();
  closeModal();
  render();

  toast(
    "Sesión C.E.R.O. guardada"
  );
}

function addDays(numberOfDays) {
  const date = new Date();

  date.setDate(
    date.getDate() + numberOfDays
  );

  return dateKey(date);
}

function openEnergy() {
  const energyOptions = [
    {
      name: "Alta",
      icon: "⚡",
      text:
        "Física, Matemática o simulacro"
    },
    {
      name: "Media",
      icon: "🔋",
      text:
        "Ejercicios y materias intermedias"
    },
    {
      name: "Baja",
      icon: "🌙",
      text:
        "Repaso ligero y organización"
    }
  ];

  modal(
    "Nivel de energía",
    `
      <div class="grid2">
        ${energyOptions
          .map(
            (option) => `
              <button
                class="quick"
                onclick="setEnergy(
                  '${option.name}'
                )"
              >
                ${option.icon}

                <b>${option.name}</b>

                <span>
                  ${option.text}
                </span>
              </button>
            `
          )
          .join("")}
      </div>
    `
  );
}

function setEnergy(energy) {
  state.energy = energy;

  save();
  closeModal();
  render();

  toast(
    `Energía ${energy.toLowerCase()} seleccionada`
  );
}

function quickPlan(type) {
  const tasks = todayTasks();

  if (type === "late") {
    tasks.forEach((task) => {
      if (
        daysUntil(task.due) <= 1
      ) {
        task.priority = "Alta";
      }
    });

    save();
    render();

    toast(
      "Urgentes arriba. Protege tu sueño."
    );

    return;
  }

  if (type === "short") {
    modal(
      "Plan mínimo de 40 minutos",
      `
        <article class="card">
          <b>20 min</b>
          — ${esc(
            tasks[0]?.title ||
              "Prioridad principal"
          )}
        </article>

        <article class="card">
          <b>10 min</b>
          — Repaso rápido
        </article>

        <article class="card">
          <b>10 min</b>
          — Corregir un error
        </article>

        <button
          class="primary"
          style="width: 100%"
          onclick="startNamed(
            'Plan mínimo'
          )"
        >
          Comenzar
        </button>
      `
    );

    return;
  }

  if (type === "tired") {
    state.energy = "Baja";

    save();
    render();

    toast(
      "Hoy: una prioridad y un repaso ligero."
    );
  }
}

function toggleHabit(
  habit,
  element
) {
  if (!state.habits[dateKey()]) {
    state.habits[dateKey()] = {};
  }

  state.habits[dateKey()][habit] =
    !state.habits[dateKey()][habit];

  save();

  element.classList.toggle("on");

  render();
}

function openMenu() {
  modal(
    "Más opciones",
    `
      <div class="form">
        <button
          class="secondary"
          onclick="openErrors()"
        >
          Registro de errores
          (${state.errors.length})
        </button>

        <button
          class="secondary"
          onclick="openEvaluations()"
        >
          Evaluaciones
          (${state.evaluations.length})
        </button>

        <button
          class="secondary"
          onclick="openSettings()"
        >
          Configuración
        </button>

        <button
          class="secondary"
          onclick="exportData()"
        >
          Exportar datos
        </button>

        <label
          class="secondary"
          style="
            display: grid;
            place-items: center;
          "
        >
          Importar datos

          <input
            type="file"
            accept="application/json"
            hidden
            onchange="importData(event)"
          >
        </label>
      </div>
    `
  );
}

function openErrors() {
  modal(
    "Registro de errores",
    `
      <button
        class="primary"
        style="
          width: 100%;
          margin-bottom: 12px;
        "
        onclick="addError()"
      >
        + Registrar error
      </button>

      ${
        state.errors.length
          ? state.errors
              .map(
                (error) => `
                  <article class="card">
                    <h3>
                      ${esc(error.subject)}
                    </h3>

                    <p>
                      ${esc(
                        error.explanation
                      )}
                    </p>

                    <small>
                      Repetir:
                      ${
                        error.repeat ||
                        "sin fecha"
                      }
                      ·
                      ${
                        error.status ||
                        "Pendiente"
                      }
                    </small>
                  </article>
                `
              )
              .join("")
          : `
            <div class="empty">
              No hay errores registrados.
            </div>
          `
      }
    `
  );
}

function addError() {
  modal(
    "Nuevo error",
    `
      <form
        class="form"
        onsubmit="saveError(event)"
      >
        <div class="field">
          <label>Materia</label>

          <select name="subject">
            ${state.subjects
              .map(
                (subject) => `
                  <option>
                    ${esc(subject.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="field">
          <label>
            ¿Qué error cometiste?
          </label>

          <textarea
            name="explanation"
            required
          ></textarea>
        </div>

        <div class="field">
          <label>Tipo</label>

          <select name="type">
            ${[
              "Conceptual",
              "Fórmula",
              "Unidad",
              "Álgebra",
              "Lectura",
              "Gráfico",
              "Tiempo",
              "Distracción",
              "Memoria",
              "Interpretación"
            ]
              .map(
                (type) => `
                  <option>${type}</option>
                `
              )
              .join("")}
          </select>
        </div>

        <button class="primary">
          Guardar
        </button>
      </form>
    `
  );
}

function saveError(event) {
  event.preventDefault();

  const formData =
    Object.fromEntries(
      new FormData(event.target)
    );

  state.errors.push({
    id: createId(),
    date: dateKey(),
    ...formData,
    repeat: addDays(1),
    status: "Pendiente"
  });

  save();
  closeModal();
  render();

  toast(
    "Error guardado para repetir mañana"
  );
}

function openEvaluations() {
  modal(
    "Evaluaciones",
    `
      <button
        class="primary"
        style="
          width: 100%;
          margin-bottom: 12px;
        "
        onclick="addEvaluation()"
      >
        + Nueva evaluación
      </button>

      ${
        state.evaluations.length
          ? state.evaluations
              .map(
                (evaluation) => `
                  <article class="card">
                    <h3>
                      ${esc(
                        evaluation.title
                      )}
                    </h3>

                    <p>
                      ${esc(
                        evaluation.subject
                      )}
                      ·
                      ${countdown(
                        evaluation.date
                      )}
                    </p>

                    <div class="meter">
                      <span
                        style="
                          width:
                          ${
                            evaluation.preparation ||
                            0
                          }%;
                        "
                      ></span>
                    </div>
                  </article>
                `
              )
              .join("")
          : `
            <div class="empty">
              No hay evaluaciones.
            </div>
          `
      }
    `
  );
}

function countdown(date) {
  const days = daysUntil(date);

  if (days < 0) {
    return "Atrasada";
  }

  if (days === 0) {
    return "Hoy";
  }

  if (days === 1) {
    return "Mañana";
  }

  return `Faltan ${days} días`;
}

function addEvaluation() {
  modal(
    "Nueva evaluación",
    `
      <form
        class="form"
        onsubmit="saveEvaluation(event)"
      >
        <div class="field">
          <label>Nombre</label>

          <input
            name="title"
            required
          >
        </div>

        <div class="field">
          <label>Materia</label>

          <select name="subject">
            ${state.subjects
              .map(
                (subject) => `
                  <option>
                    ${esc(subject.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>

        <div class="field">
          <label>Fecha</label>

          <input
            type="date"
            name="date"
            value="${addDays(7)}"
          >
        </div>

        <div class="field">
          <label>
            Preparación
          </label>

          <select name="preparation">
            <option value="0">
              0% — No iniciado
            </option>

            <option value="25">
              25% — Teoría vista
            </option>

            <option value="50">
              50% — Ejercicios básicos
            </option>

            <option value="75">
              75% — Ejercicios difíciles
            </option>

            <option value="100">
              100% — Simulacro y corrección
            </option>
          </select>
        </div>

        <button class="primary">
          Guardar
        </button>
      </form>
    `
  );
}

function saveEvaluation(event) {
  event.preventDefault();

  const formData =
    Object.fromEntries(
      new FormData(event.target)
    );

  state.evaluations.push({
    id: createId(),
    ...formData,
    preparation:
      Number(
        formData.preparation
      ) || 0
  });

  save();
  closeModal();
  render();

  toast("Evaluación guardada");
}

function openSettings() {
  modal(
    "Configuración",
    `
      <form
        class="form"
        onsubmit="saveSettings(event)"
      >
        <div class="field">
          <label>Nombre</label>

          <input
            name="name"
            value="${esc(state.name)}"
          >
        </div>

        <div class="grid2">
          <div class="field">
            <label>Dormir</label>

            <input
              type="time"
              name="sleep"
              value="${state.sleep}"
            >
          </div>

          <div class="field">
            <label>Despertar</label>

            <input
              type="time"
              name="wake"
              value="${state.wake}"
            >
          </div>
        </div>

        <div class="field">
          <label>Modo</label>

          <select name="mode">
            <option
              ${
                state.mode ===
                "Colegio"
                  ? "selected"
                  : ""
              }
            >
              Colegio
            </option>

            <option
              ${
                state.mode ===
                "Vacaciones"
                  ? "selected"
                  : ""
              }
            >
              Vacaciones
            </option>
          </select>
        </div>

        <div class="field">
          <label>
            <input
              type="checkbox"
              name="largeText"
              ${
                state.settings.largeText
                  ? "checked"
                  : ""
              }
            >

            Usar letra más grande
          </label>
        </div>

        <button class="primary">
          Guardar
        </button>

        <button
          class="danger"
          type="button"
          onclick="resetData()"
        >
          Borrar todos los datos
        </button>
      </form>
    `
  );
}

function saveSettings(event) {
  event.preventDefault();

  const formData =
    Object.fromEntries(
      new FormData(event.target)
    );

  state.name =
    formData.name || "Nahiara";

  state.sleep =
    formData.sleep || "22:30";

  state.wake =
    formData.wake || "06:30";

  state.mode =
    formData.mode || "Colegio";

  state.settings.largeText =
    Boolean(formData.largeText);

  save();
  closeModal();
  render();

  toast(
    "Configuración guardada"
  );
}

function exportData() {
  const content = JSON.stringify(
    state,
    null,
    2
  );

  const blob = new Blob(
    [content],
    {
      type: "application/json"
    }
  );

  const link =
    document.createElement("a");

  const url =
    URL.createObjectURL(blob);

  link.href = url;

  link.download =
    `focus-cero-${dateKey()}.json`;

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  toast("Copia exportada");
}

function importData(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    try {
      const importedState =
        JSON.parse(reader.result);

      if (
        !importedState ||
        typeof importedState !==
          "object"
      ) {
        throw new Error(
          "Formato incorrecto"
        );
      }

      state = importedState;

      save();
      closeModal();
      render();

      toast("Datos importados");
    } catch (error) {
      console.error(error);

      toast(
        "El archivo no es válido"
      );
    }
  };

  reader.readAsText(file);
}

function resetData() {
  const confirmed = confirm(
    "¿Borrar todos los datos de Focus C.E.R.O.?"
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(DB);

  state = load();

  closeModal();
  render();

  toast("Datos reiniciados");
}

function go(newView) {
  view = newView;

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

window.go = go;

Object.assign(window, {
  openMenu,
  openTask,
  saveTask,
  editTask,
  deleteTask,
  toggleTask,
  startTask,
  startNamed,
  openTimer,
  toggleTimer,
  finishTimer,
  openCero,
  saveCero,
  openEnergy,
  setEnergy,
  quickPlan,
  toggleHabit,
  closeModal,
  showDay,
  openErrors,
  addError,
  saveError,
  openEvaluations,
  addEvaluation,
  saveEvaluation,
  openSettings,
  saveSettings,
  exportData,
  importData,
  resetData
});

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register(
          "./service-worker.js"
        )
        .catch((error) => {
          console.error(
            "Error al registrar el service worker:",
            error
          );
        });
    }
  );
}

render();
