'use strict';

const STORAGE_KEY = 'estudiantes';
const THEME_KEY = 'campus-theme';
const form = document.getElementById('form');
const list = document.getElementById('lista');
const emptyState = document.getElementById('vacio');
const emptyTitle = document.getElementById('emptyTitle');
const emptyCopy = document.getElementById('emptyCopy');
const counter = document.getElementById('contador');
const toast = document.getElementById('toast');
const titleForm = document.getElementById('titleForm');
const saveButton = document.getElementById('save');
const cancelButton = document.getElementById('cancel');
const searchInput = document.getElementById('search');
const themeToggle = document.getElementById('themeToggle');
let editingId = null;
let toastTimer;

const readStudents = () => {
    try {
        const students = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(students) ? students : [];
    } catch {
        return [];
    }
};

const saveStudents = (students) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        return true;
    } catch {
        showToast('No se pudieron guardar los cambios en este dispositivo.');
        return false;
    }
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const rules = {
    matricula(value) {
        if (!/^\d{8}$/.test(value)) return 'La matrícula debe tener exactamente 8 dígitos.';
        const duplicate = readStudents().some((student) => student.matricula === value && student.matricula !== editingId);
        return duplicate ? 'Ya existe un estudiante con esta matrícula.' : '';
    },
    nombre(value) {
        if (value.length < 3) return 'Escribe al menos 3 caracteres.';
        if (value.length > 100) return 'El nombre no puede superar los 100 caracteres.';
        if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(value)) return 'Revisa el nombre e intenta de nuevo.';
        return '';
    },
    correo(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Ingresa un correo electrónico válido.';
    },
    telefono(value) {
        return /^\d{10}$/.test(value) ? '' : 'El teléfono debe tener exactamente 10 dígitos.';
    }
};

function validateField(input) {
    const message = rules[input.name](input.value.trim());
    document.getElementById(`err-${input.name}`).textContent = message;
    input.classList.toggle('invalido', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
}

function clearValidation() {
    form.querySelectorAll('input').forEach((input) => {
        input.classList.remove('invalido');
        input.removeAttribute('aria-invalid');
        document.getElementById(`err-${input.name}`).textContent = '';
    });
}

function resetForm() {
    form.reset();
    editingId = null;
    titleForm.textContent = 'Nuevo estudiante';
    saveButton.textContent = 'Guardar estudiante';
    cancelButton.hidden = true;
    clearValidation();
}

function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2800);
}

function initials(name) {
    return name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('');
}
//??????############
function esc(t) {
    const d = document.createElement('div');
    d.textContent = t; 
    return d.innerHTML;
}  

let temporizador;
functionmostrarMensaje(mensaje){
    toast.textContent = mensaje;
    toast.classList.add('visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => toast.classList.remove('visible'), 4000);
}

function render() {
    const students = readStudents();
    const query = searchInput.value.trim().toLocaleLowerCase('es');
    const filtered = students.filter((student) =>
        [student.nombre, student.matricula, student.correo, student.telefono]
            .some((value) => String(value).toLocaleLowerCase('es').includes(query))
    );

    counter.textContent = students.length;
    list.innerHTML = filtered.map((student) => `
        <li class="student-card">
            <span class="student-avatar" aria-hidden="true">${escapeHtml(initials(student.nombre))}</span>
            <div class="student-info">
                <strong>${escapeHtml(student.nombre)}</strong>
                <p>${escapeHtml(student.correo)}</p>
                <div class="student-meta"><span>Matrícula ${escapeHtml(student.matricula)}</span><span>${escapeHtml(student.telefono)}</span></div>
            </div>
            <div class="student-actions">
                <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(student.matricula)}" aria-label="Editar a ${escapeHtml(student.nombre)}" title="Editar">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>
                </button>
                <button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(student.matricula)}" aria-label="Eliminar a ${escapeHtml(student.nombre)}" title="Eliminar">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"></path></svg>
                </button>
            </div>
        </li>`).join('');

    emptyState.hidden = filtered.length > 0;
    if (!students.length) {
        emptyTitle.textContent = 'Aún no hay estudiantes';
        emptyCopy.textContent = 'Agrega el primer registro para verlo aquí.';
    } else {
        emptyTitle.textContent = 'No encontramos coincidencias';
        emptyCopy.textContent = 'Prueba con otro nombre, correo o matrícula.';
    }
}

form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
        if (input.classList.contains('invalido')) validateField(input);
    });
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll('input')];
    if (!fields.map(validateField).every(Boolean)) {
        fields.find((input) => input.classList.contains('invalido')).focus();
        return;
    }

    const student = {
        matricula: form.elements.matricula.value.trim(),
        nombre: form.elements.nombre.value.trim().replace(/\s+/g, ' '),
        correo: form.elements.correo.value.trim().toLowerCase(),
        telefono: form.elements.telefono.value.trim()
    };
    const students = readStudents();
    const wasEditing = editingId !== null;
    const updated = wasEditing
        ? students.map((item) => item.matricula === editingId ? student : item)
        : [student, ...students];

    if (saveStudents(updated)) {
        resetForm();
        render();
        showToast(wasEditing ? 'Estudiante actualizado.' : 'Estudiante agregado al directorio.');
    }
});

cancelButton.addEventListener('click', resetForm);
searchInput.addEventListener('input', render);

list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const students = readStudents();
    const student = students.find((item) => item.matricula === button.dataset.id);
    if (!student) return;

    if (button.dataset.action === 'edit') {
        editingId = student.matricula;
        Object.entries(student).forEach(([key, value]) => { form.elements[key].value = value; });
        titleForm.textContent = 'Editar estudiante';
        saveButton.textContent = 'Guardar cambios';
        cancelButton.hidden = false;
        clearValidation();
        form.elements.nombre.focus();
        return;
    }

    if (window.confirm(`¿Eliminar el registro de ${student.nombre}?`)) {
        if (saveStudents(students.filter((item) => item.matricula !== student.matricula))) {
            if (editingId === student.matricula) resetForm();
            render();
            showToast('Estudiante eliminado.');
        }
    }
});

function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    document.querySelector('meta[name="theme-color"]').content = isLight ? '#f1f4f7' : '#111923';
}

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    try { localStorage.setItem(THEME_KEY, nextTheme); } catch { /* Theme still changes for this session. */ }
});

function updateConnectionStatus() {
    const status = document.getElementById('status');
    const online = navigator.onLine;
    status.classList.toggle('offline', !online);
    status.lastElementChild.textContent = online ? 'En línea' : 'Sin conexión';
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();
render();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => console.error('No se pudo registrar el service worker:', error));
    });
}

