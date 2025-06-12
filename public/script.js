const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const completedCounter = document.getElementById("completed-counter");
const uncompletedCounter = document.getElementById("uncompleted-counter");

// Cargar tareas al iniciar
fetch("/api/tasks")
    .then(res => res.json())
    .then(tasks => {
        tasks.forEach(task => {
            addTaskToDOM(task.task, task.completed);
        });
        updateCounters();
    });

// Añadir tarea
document.getElementById("input-button").addEventListener("click", () => {
    const task = inputBox.value.trim();
    if (!task) return;

    fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task })
    }).then(() => {
        addTaskToDOM(task, false);
        inputBox.value = "";
        updateCounters();
    });
});

function addTaskToDOM(task, completed) {
    const li = document.createElement("li");
    li.innerHTML = `
        <label>
            <input type="checkbox" ${completed ? "checked" : ""}>
            <span>${task}</span>
        </label>
        <span class="delete-btn">❌</span>
    `;
    listContainer.appendChild(li);

    const checkbox = li.querySelector("input");
    checkbox.addEventListener("click", () => {
        li.classList.toggle("completed", checkbox.checked);
        updateCounters();
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("¿Eliminar esta tarea?")) {
            li.remove();
            updateCounters();
        }
    });

    if (completed) li.classList.add("completed");
}

function updateCounters() {
    const completed = document.querySelectorAll(".completed").length;
    const uncompleted = document.querySelectorAll("li:not(.completed)").length;
    completedCounter.textContent = completed;
    uncompletedCounter.textContent = uncompleted;
}