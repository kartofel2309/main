const STORAGE_KEY = "siteProgress";

let ownedTracks = [];
let tokenCount = 0;
let tasks = [];

const tokenCountEl = document.getElementById("token-count");
const tasksList = document.getElementById("tasks");
const createTokenBtn = document.getElementById("create-token");

// Сохранение прогресса в localStorage
function saveProgress() {
  const data = { tokenCount, tasks, ownedTracks };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Загрузка прогресса из localStorage
function loadProgress() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    tokenCount = Number(data.tokenCount) || 0;
    tasks = Array.isArray(data.tasks) ? data.tasks : [];
    ownedTracks = Array.isArray(data.ownedTracks) ? data.ownedTracks : [];
  } catch (e) {
    console.warn("Не удалось прочитать сохранённый прогресс", e);
  }
}

function updateTokenCount() {
  if (tokenCountEl) tokenCountEl.textContent = tokenCount;
}

function createToken() {
  tokenCount++;
  updateTokenCount();
  saveProgress();
}

function createTask() {
  tasks.push({ name: `Задание ${tasks.length + 1}`, completed: false });
  updateTasks();
  saveProgress();
}

function startTask(index) {
  const task = tasks[index];
  if (!task || task.completed) return;
  task.completed = true;
  tokenCount++;
  updateTokenCount();
  updateTasks();
  saveProgress();
}

function updateTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = task.completed ? `${task.name} (выполнено)` : task.name;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      startTask(index);
    });
    li.appendChild(a);
    tasksList.appendChild(li);
  });
}

if (createTokenBtn) {
  createTokenBtn.addEventListener("click", createToken);
}

// Пробел начисляет токен, только если фокус не на кнопке и не в поле ввода
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    createToken();
  }
});

// Восстанавливаем прогресс при загрузке страницы
loadProgress();
updateTokenCount();
updateTasks();

// Один общий плеер на всю страницу
const trackPlayer = new Audio();
let currentTrackButton = null;
const TRACK_PRICE = 20;

// Списание токенов за трек. Возвращает true, если трек доступен для прослушивания
function buyTrack(fileName) {
  if (ownedTracks.includes(fileName)) return true;

  if (tokenCount < TRACK_PRICE) {
    alert(`Недостаточно токенов. Нужно ${TRACK_PRICE}, у вас ${tokenCount}.`);
    return false;
  }

  tokenCount -= TRACK_PRICE;
  ownedTracks.push(fileName);
  updateTokenCount();
  saveProgress();
  return true;
}

function playTrack(fileName, button) {
  // Повторное нажатие на играющий трек ставит его на паузу
  if (currentTrackButton === button && !trackPlayer.paused) {
    trackPlayer.pause();
    setBuyButtonState(button, false);
    currentTrackButton = null;
    return;
  }

  // Если трек не куплен, пытаемся списать токены
  if (!buyTrack(fileName)) return;

  // Сбрасываем предыдущую кнопку
  if (currentTrackButton) {
    setBuyButtonState(currentTrackButton, false);
  }

  trackPlayer.src = fileName;
  trackPlayer.currentTime = 0;
  trackPlayer.play().catch((err) => {
    console.warn("Не удалось воспроизвести трек", err);
  });

  setBuyButtonState(button, true);
  currentTrackButton = button;
}

function setBuyButtonState(button, isPlaying) {
  const owned = ownedTracks.includes(button.dataset.track);

  if (isPlaying) {
    button.textContent = "Остановить";
  } else {
    button.textContent = owned ? "Слушать" : `Купить за ${TRACK_PRICE} токенов`;
  }
  button.classList.toggle("playing", isPlaying);
}

trackPlayer.addEventListener("ended", () => {
  if (currentTrackButton) {
    setBuyButtonState(currentTrackButton, false);
    currentTrackButton = null;
  }
});

document.querySelectorAll(".buy-track").forEach((button) => {
  setBuyButtonState(button, false); // показываем правильный текст с учётом сохранённых покупок
  button.addEventListener("click", () => {
    playTrack(button.dataset.track, button);
  });
});
