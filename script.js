const API = "https://studentdatabasemanagement-production.up.railway.app";

let students = [];
let selectedStudent = null;
let currentUser = null;

const token = () => localStorage.getItem("studenthub_token");

function authHeaders(json = true) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (token()) headers["Authorization"] = `Bearer ${token()}`;
    return headers;
}

async function api(path, options = {}) {
    const response = await fetch(`${API}/api${path}`, {
        ...options,
        headers: {
            ...authHeaders(options.body !== undefined),
            ...(options.headers || {})
        }
    });

    let data = {};
    try { data = await response.json(); } catch (_) {}

    if (response.status === 401) {
        logout(false);
        throw new Error("Please login first.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}

function showLogin() {
    const email = prompt("Email:");
    if (email === null) return;

    const password = prompt("Password:");
    if (password === null) return;

    login(email.trim(), password);
}

async function login(email, password) {
    try {
        const data = await api("/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem("studenthub_token", data.token);
        currentUser = data.user;

        alert(`Welcome, ${data.user.username}!`);
        await loadMe();
        await loadStudents();
    } catch (error) {
        alert(error.message);
    }
}

function showRegister() {
    const username = prompt("Choose username:");
    if (username === null) return;

    const email = prompt("Email:");
    if (email === null) return;

    const password = prompt("Password (minimum 6 characters):");
    if (password === null) return;

    register(username.trim(), email.trim(), password);
}

async function register(username, email, password) {
    try {
        await api("/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password })
        });

        alert("Account created. Now login.");
        await login(email, password);
    } catch (error) {
        alert(error.message);
    }
}

function logout(showMessage = true) {
    localStorage.removeItem("studenthub_token");
    currentUser = null;
    students = [];

    if (showMessage) alert("Logged out.");
    location.reload();
}

async function loadMe() {
    if (!token()) return;

    try {
        currentUser = await api("/me");
    } catch (_) {}
}

async function loadStudents() {
    if (!token()) {
        renderLoginState();
        return;
    }

    try {
        students = await api("/students");
        renderStudents(students);
        updateStats();
    } catch (error) {
        console.error(error);
    }
}

function renderLoginState() {
    const table = document.getElementById("studentTable");
    if (!table) return;

    table.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;padding:55px">
                <strong>Login to view students</strong><br><br>
                <button class="primary-btn" onclick="showLogin()">Login</button>
                <button class="secondary-btn" onclick="showRegister()">Create account</button>
            </td>
        </tr>
    `;
}

function renderStudents(data) {
    const table = document.getElementById("studentTable");
    if (!table) return;

    if (!data.length) {
        table.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:50px;color:#98a2b3">
                    No students yet. Add your first student.
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = "";

    data.forEach(student => {
        const row = document.createElement("tr");
        const initial = student.name.charAt(0).toUpperCase();
        const mine = currentUser && Number(student.owner_id) === Number(currentUser.id);

        row.innerHTML = `
            <td>
                <div class="student-cell">
                    <div class="avatar">${escapeHTML(initial)}</div>
                    <div>
                        <div class="student-name">${escapeHTML(student.name)}</div>
                        <div class="student-sub">${mine ? "Your record" : "Other user"}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHTML(student.student_id)}</td>
            <td><span class="subject-badge">${student.subjects.length} subject${student.subjects.length !== 1 ? "s" : ""}</span></td>
            <td><span class="average">${Number(student.average || 0).toFixed(2)}</span></td>
            <td>
                <button class="view" onclick="viewStudent(${student.id})">View</button>
            </td>
        `;

        table.appendChild(row);
    });
}

function updateStats() {
    const totalStudents = document.getElementById("totalStudents");
    const totalSubjects = document.getElementById("totalSubjects");
    const overallAverage = document.getElementById("overallAverage");

    if (totalStudents) totalStudents.textContent = students.length;

    let subjectCount = 0;
    let grades = [];

    students.forEach(student => {
        subjectCount += student.subjects.length;
        student.subjects.forEach(subject => grades.push(Number(subject.grade)));
    });

    if (totalSubjects) totalSubjects.textContent = subjectCount;

    const average = grades.length
        ? grades.reduce((a, b) => a + b, 0) / grades.length
        : 0;

    if (overallAverage) overallAverage.textContent = average.toFixed(2);
}

function openAddStudent() {
    if (!token()) {
        showLogin();
        return;
    }

    const modal = document.getElementById("studentModal");
    if (modal) modal.classList.add("show");
}

function closeModal() {
    const modal = document.getElementById("studentModal");
    if (modal) modal.classList.remove("show");
}

async function submitStudentForm(event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const id = document.getElementById("studentId").value.trim();

    if (!name || !id) {
        alert("Enter both name and student ID.");
        return;
    }

    try {
        await api("/students", {
            method: "POST",
            body: JSON.stringify({
                name,
                student_id: id
            })
        });

        closeModal();
        document.getElementById("studentForm").reset();
        await loadStudents();
    } catch (error) {
        alert(error.message);
    }
}

async function viewStudent(id) {
    try {
        const data = await api(`/students/${encodeURIComponent(id)}`);
        selectedStudent = data;

        const detailName = document.getElementById("detailName");
        const detailId = document.getElementById("detailId");
        const detailAverage = document.getElementById("detailAverage");
        const profileAvatar = document.getElementById("profileAvatar");

        if (detailName) detailName.textContent = data.name;
        if (detailId) detailId.textContent = `ID: ${data.student_id}`;
        if (detailAverage) detailAverage.textContent = Number(data.average || 0).toFixed(2);
        if (profileAvatar) profileAvatar.textContent = data.name.charAt(0).toUpperCase();

        renderSubjects(data.subjects);

        // Owner-only buttons
        const mine = currentUser && Number(data.owner_id) === Number(currentUser.id);
        document.querySelectorAll(".owner-only").forEach(el => {
            el.style.display = mine ? "" : "none";
        });

        const modal = document.getElementById("detailsModal");
        if (modal) modal.classList.add("show");
    } catch (error) {
        alert(error.message);
    }
}

function renderSubjects(subjects) {
    const container = document.getElementById("subjectList");
    if (!container) return;

    if (!subjects.length) {
        container.innerHTML = `
            <div style="padding:25px;text-align:center;color:#98a2b3">
                No subjects added yet.
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    subjects.forEach(item => {
        const row = document.createElement("div");
        row.className = "subject-row";

        row.innerHTML = `
            <span>${escapeHTML(item.subject || item.name || item.subject_name || "Unknown Subject")}</span>
            <span class="grade">${Number(item.grade).toFixed(2)}</span>
        `;

        container.appendChild(row);
    });
}

async function addSubject() {
    if (!selectedStudent) return;

    if (Number(selectedStudent.owner_id) !== Number(currentUser?.id)) {
        alert("You can only add subjects to your own student.");
        return;
    }

    const subject = document.getElementById("subjectInput").value.trim();
    const grade = Number(document.getElementById("gradeInput").value);

    if (!subject) {
        alert("Enter a subject.");
        return;
    }

    if (Number.isNaN(grade) || grade < 0 || grade > 100) {
        alert("Grade must be between 0 and 100.");
        return;
    }

    try {
        await api(`/students/${selectedStudent.id}/subjects`, {
            method: "POST",
            body: JSON.stringify({ name: subject, grade })
        });

        document.getElementById("subjectInput").value = "";
        document.getElementById("gradeInput").value = "";

        await loadStudents();
        await viewStudent(selectedStudent.id);
    } catch (error) {
        alert(error.message);
    }
}

async function editStudent() {
    if (!selectedStudent) return;

    if (Number(selectedStudent.owner_id) !== Number(currentUser?.id)) {
        alert("You can only edit your own student.");
        return;
    }

    const name = prompt("Enter new student name:", selectedStudent.name);
    if (!name || !name.trim()) return;

    try {
        await api(`/students/${selectedStudent.id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: name.trim(),
                student_id: selectedStudent.student_id
            })
        });

        await loadStudents();
        await viewStudent(selectedStudent.id);
    } catch (error) {
        alert(error.message);
    }
}

async function deleteStudent() {
    if (!selectedStudent) return;

    if (Number(selectedStudent.owner_id) !== Number(currentUser?.id)) {
        alert("You can only delete your own student.");
        return;
    }

    if (!confirm(`Delete ${selectedStudent.name}?`)) return;

    try {
        await api(`/students/${selectedStudent.id}`, {
            method: "DELETE"
        });

        closeDetails();
        await loadStudents();
    } catch (error) {
        alert(error.message);
    }
}

function closeDetails() {
    const modal = document.getElementById("detailsModal");
    if (modal) modal.classList.remove("show");
    selectedStudent = null;
}

function setupSearch() {
    const search = document.getElementById("searchInput");
    if (!search) return;

    search.addEventListener("input", function () {
        const query = this.value.toLowerCase().trim();

        const filtered = students.filter(student =>
            student.name.toLowerCase().includes(query) ||
            String(student.student_id).toLowerCase().includes(query)
        );

        renderStudents(filtered);
    });
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.showLogin = showLogin;
window.showRegister = showRegister;
window.logout = logout;
window.openAddStudent = openAddStudent;
window.closeModal = closeModal;
window.viewStudent = viewStudent;
window.addSubject = addSubject;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.closeDetails = closeDetails;

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("studentForm");
    if (form) form.addEventListener("submit", submitStudentForm);

    setupSearch();
    await loadMe();
    await loadStudents();
});
