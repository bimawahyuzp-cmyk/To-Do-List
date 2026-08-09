(function () {
  'use strict';

  /* Storage Keys */
  const STORAGE_TASKS   = 'opsboard.tasks';
  const STORAGE_PROFILE = 'opsboard.profile';

  /* State */
  let tasks = loadTasks();
  let profile = loadProfile();
  let selectedLevel = 'medium';

  /* Element */
  const el = {
    clock: document.getElementById('clockTime'),
    dateLine: document.getElementById('dateLine'),

    profileView: document.getElementById('profileView'),
    profileName: document.getElementById('profileName'),
    profileRole: document.getElementById('profileRole'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    profileEditForm: document.getElementById('profileEditForm'),
    inputName: document.getElementById('inputName'),
    inputRole: document.getElementById('inputRole'),

    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    dueDate: document.getElementById('dueDate'),
    priorityPills: document.querySelectorAll('.priority-pill'),

    todoList: document.getElementById('todoList'),
    doneList: document.getElementById('doneList'),
    todoEmpty: document.getElementById('todoEmpty'),
    doneEmpty: document.getElementById('doneEmpty'),
    todoCount: document.getElementById('todoCount'),
    doneCount: document.getElementById('doneCount'),

    deleteAllBtn: document.getElementById('deleteAllBtn'),
    confirmModal: document.getElementById('confirmModal'),
    confirmDeleteAll: document.getElementById('confirmDeleteAll'),
    cancelDeleteAll: document.getElementById('cancelDeleteAll'),
  };

  /* Penyimpanan */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_TASKS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Gagal memuat tasks:', e);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Gagal menyimpan tasks:', e);
    }
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE);
      return raw ? JSON.parse(raw) : { name: 'Nama Kamu', role: 'Jabatan Kamu' };
    } catch (e) {
      return { name: 'Nama Kamu', role: 'Jabatan Kamu' };
    }
  }

  function saveProfile() {
    try {
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Gagal menyimpan profil:', e);
    }
  }

  /* Waktu */
  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis',"Jumat",'Sabtu'];
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    el.clock.textContent = `${hh}:${mm}:${ss}`;

    el.dateLine.textContent =
      `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  function todayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /* Profile */
  function renderProfile() {
    el.profileName.textContent = profile.name || 'Nama Kamu';
    el.profileRole.textContent = profile.role || 'Jabatan Kamu';
  }

  el.editProfileBtn.addEventListener('click', () => {
    el.inputName.value = profile.name || '';
    el.inputRole.value = profile.role || '';
    el.profileView.classList.add('hidden');
    el.profileEditForm.classList.remove('hidden');
    el.inputName.focus();
  });

  el.profileEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.inputName.value.trim();
    const role = el.inputRole.value.trim();
    profile = {
      name: name || 'Nama Kamu',
      role: role || 'Jabatan Kamu',
    };
    saveProfile();
    renderProfile();
    el.profileEditForm.classList.add('hidden');
    el.profileView.classList.remove('hidden');
  });

  /* Priority */
  el.priorityPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      selectedLevel = pill.dataset.level;
      el.priorityPills.forEach((p) =>
        p.setAttribute('aria-pressed', p === pill ? 'true' : 'false')
      );
    });
  });

  /* Task */
  function addTask(text, level, dueDate) {
    const task = {
      id: 'id' + Date.now() + Math.random().toString(16).slice(2),
      text,
      level,
      dueDate: dueDate || '',
      createdAt: todayISO(),
      done: false,
      doneAt: null,
    };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = !task.done;
    task.doneAt = task.done ? todayISO() : null;
    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function deleteAllTasks() {
    tasks = [];
    saveTasks();
    renderTasks();
  }

  /* Render */
  const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' };

  function isOverdue(task) {
    if (task.done || !task.dueDate) return false;
    return task.dueDate < todayISO();
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function createTaskEl(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.level = task.level;
    li.dataset.id = task.id;

    const overdue = isOverdue(task);

    li.innerHTML = `
      <input type="checkbox" class="task-check" ${task.done ? 'checked' : ''} aria-label="Tandai selesai">
      <div class="task-body">
        <p class="task-text"></p>
        <div class="task-meta">
          <span class="task-tag">${levelLabel[task.level]}</span>
          ${task.dueDate ? `<span class="task-date">Deadline ${formatDate(task.dueDate)}</span>` : ''}
          ${overdue ? `<span class="task-overdue">Overdue</span>` : ''}
          ${task.done ? `<span class="task-date">Selesai ${formatDate(task.doneAt)}</span>` : ''}
        </div>
      </div>
      <button class="task-delete" aria-label="Hapus tugas">&times;</button>
    `;

    li.querySelector('.task-text').textContent = task.text;

    li.querySelector('.task-check').addEventListener('change', () => toggleTask(task.id));
    li.querySelector('.task-delete').addEventListener('click', () => deleteTask(task.id));

    return li;
  }

  function renderTasks() {
    const todo = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);

    el.todoList.innerHTML = '';
    el.doneList.innerHTML = '';

    todo.forEach((t) => el.todoList.appendChild(createTaskEl(t)));
    done.forEach((t) => el.doneList.appendChild(createTaskEl(t)));

    el.todoCount.textContent = todo.length;
    el.doneCount.textContent = done.length;

    el.todoEmpty.classList.toggle('hidden', todo.length > 0);
    el.doneEmpty.classList.toggle('hidden', done.length > 0);
  }

  /* Form Submit */
  el.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = el.taskInput.value.trim();
    if (!text) return;

    addTask(text, selectedLevel, el.dueDate.value);

    el.taskInput.value = '';
    el.dueDate.value = '';
    el.taskInput.focus();
  });

  /* Delete All */
  el.deleteAllBtn.addEventListener('click', () => {
    if (tasks.length === 0) return;
    el.confirmModal.classList.remove('hidden');
  });

  el.cancelDeleteAll.addEventListener('click', () => {
    el.confirmModal.classList.add('hidden');
  });

  el.confirmModal.addEventListener('click', (e) => {
    if (e.target === el.confirmModal) el.confirmModal.classList.add('hidden');
  });

  el.confirmDeleteAll.addEventListener('click', () => {
    deleteAllTasks();
    el.confirmModal.classList.add('hidden');
  });

  /* Init */
  function init() {
    renderProfile();
    renderTasks();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(renderTasks, 60000);
  }

  init();
})();
