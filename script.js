
const API = "https://studentdatabasemanagement-production.up.railway.app";


let students = [];
let programmes = [];
let semesters = [];
let subjects = [];

let selectedStudent = null;
let currentUser = null;


// ============================================================
// AUTH
// ============================================================

const token = () => {
    return localStorage.getItem("studenthub_token");
};


function authHeaders(json = true) {

    const headers = {};

    if (json) {
        headers["Content-Type"] = "application/json";
    }

    if (token()) {
        headers["Authorization"] = `Bearer ${token()}`;
    }

    return headers;
}


// ============================================================
// API HELPER
// ============================================================

async function api(path, options = {}) {

    const response = await fetch(`${API}/api${path}`, {

        ...options,

        headers: {
            ...authHeaders(options.body !== undefined),
            ...(options.headers || {})
        }
    });


    let data = {};

    try {
        data = await response.json();
    } catch (_) {}


    if (response.status === 401) {

        logout(false);

        throw new Error("Please login first.");
    }


    if (!response.ok) {

        throw new Error(
            data.error || "Request failed."
        );
    }


    return data;
}


// ============================================================
// LOGIN
// ============================================================

function showLogin() {

    const email = prompt("Email:");

    if (email === null) {
        return;
    }


    const password = prompt("Password:");

    if (password === null) {
        return;
    }


    login(
        email.trim(),
        password
    );
}


async function login(email, password) {

    try {

        const data = await api("/login", {

            method: "POST",

            body: JSON.stringify({
                email,
                password
            })
        });


        localStorage.setItem(
            "studenthub_token",
            data.token
        );


        currentUser = data.user;


        alert(
            `Welcome, ${data.user.username}!`
        );


        await loadMe();

        await loadInitialData();

        await loadStudents();

    } catch (error) {

        alert(error.message);
    }
}


// ============================================================
// REGISTER
// ============================================================

function showRegister() {

    const username = prompt(
        "Choose username:"
    );

    if (username === null) {
        return;
    }


    const email = prompt(
        "Email:"
    );

    if (email === null) {
        return;
    }


    const password = prompt(
        "Password (minimum 6 characters):"
    );

    if (password === null) {
        return;
    }


    register(
        username.trim(),
        email.trim(),
        password
    );
}


async function register(
    username,
    email,
    password
) {

    try {

        await api("/register", {

            method: "POST",

            body: JSON.stringify({
                username,
                email,
                password
            })
        });


        alert(
            "Account created. Now login."
        );


        await login(
            email,
            password
        );

    } catch (error) {

        alert(error.message);
    }
}


// ============================================================
// LOGOUT
// ============================================================

function logout(showMessage = true) {

    localStorage.removeItem(
        "studenthub_token"
    );


    currentUser = null;

    students = [];


    if (showMessage) {
        alert("Logged out.");
    }


    location.reload();
}


// ============================================================
// CURRENT USER
// ============================================================

async function loadMe() {

    if (!token()) {
        return;
    }


    try {

        currentUser = await api("/me");

    } catch (_) {}
}


// ============================================================
// LOAD INITIAL DATA
// ============================================================

async function loadInitialData() {

    try {

        programmes =
            await api("/programmes");


        semesters =
            await api("/semesters");


        subjects =
            await api("/subjects");


        populateProgrammes();

        populateSemesters();

    } catch (error) {

        console.error(
            "Could not load academic data:",
            error
        );
    }
}


// ============================================================
// PROGRAMMES
// ============================================================

function populateProgrammes() {

    const select =
        document.getElementById(
            "programmeSelect"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select programme
        </option>
    `;


    programmes.forEach(programme => {

        const option =
            document.createElement("option");


        option.value =
            programme.programme_id;


        option.textContent =
            programme.programme_code
                ? `${programme.programme_name} (${programme.programme_code})`
                : programme.programme_name;


        select.appendChild(option);
    });
}


// ============================================================
// SEMESTERS
// ============================================================

function populateSemesters() {

    const select =
        document.getElementById(
            "semesterSelect"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select semester
        </option>
    `;


    semesters.forEach(semester => {

        const option =
            document.createElement("option");


        option.value =
            semester.semester_id;


        option.textContent =
            semester.semester_name;


        select.appendChild(option);
    });
}


// ============================================================
// STUDENTS
// ============================================================

async function loadStudents() {

    if (!token()) {

        renderLoginState();

        return;
    }


    try {

        students =
            await api("/students");


        renderStudents(students);

        updateStats();

    } catch (error) {

        console.error(error);
    }
}


// ============================================================
// LOGIN STATE
// ============================================================

function renderLoginState() {

    const table =
        document.getElementById(
            "studentTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="
                    text-align:center;
                    padding:55px
                "
            >

                <strong>
                    Login to view students
                </strong>

                <br><br>

                <button
                    class="primary-btn"
                    onclick="showLogin()"
                >
                    Login
                </button>

                <button
                    class="secondary-btn"
                    onclick="showRegister()"
                >
                    Create account
                </button>

            </td>

        </tr>
    `;
}


// ============================================================
// RENDER STUDENTS
// ============================================================

function renderStudents(data) {

    const table =
        document.getElementById(
            "studentTable"
        );


    if (!table) {
        return;
    }


    if (!data.length) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:50px;
                        color:#98a2b3
                    "
                >

                    No students yet.
                    Add your first student.

                </td>

            </tr>
        `;

        return;
    }


    table.innerHTML = "";


    data.forEach(student => {

        const row =
            document.createElement("tr");


        const initial =
            student.name
                ? student.name
                    .charAt(0)
                    .toUpperCase()
                : "?";


        row.innerHTML = `

            <td>

                <div class="student-cell">

                    <div class="avatar">
                        ${escapeHTML(initial)}
                    </div>

                    <div>

                        <div class="student-name">
                            ${escapeHTML(student.name)}
                        </div>

                        <div class="student-sub">
                            Student
                        </div>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(
                    student.enrollment_no || "-"
                )}
            </td>


            <td>
                -
            </td>


            <td>
                -
            </td>


            <td>

                <button
                    class="view"
                    onclick="viewStudent(
                        ${student.student_id}
                    )"
                >
                    View
                </button>

            </td>
        `;


        table.appendChild(row);
    });
}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const totalStudents =
        document.getElementById(
            "totalStudents"
        );


    const totalSubjects =
        document.getElementById(
            "totalSubjects"
        );


    const overallAverage =
        document.getElementById(
            "overallAverage"
        );


    if (totalStudents) {

        totalStudents.textContent =
            students.length;
    }


    if (totalSubjects) {

        totalSubjects.textContent =
            subjects.length;
    }


    if (overallAverage) {

        overallAverage.textContent =
            "0.00";
    }
}


// ============================================================
// ADD STUDENT MODAL
// ============================================================

async function openAddStudent() {

    if (!token()) {

        showLogin();

        return;
    }


    if (
        !programmes.length ||
        !semesters.length
    ) {

        await loadInitialData();
    }


    populateProgrammes();

    populateSemesters();


    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.classList.add("show");
    }
}


// ============================================================
// CLOSE ADD STUDENT
// ============================================================

function closeModal() {

    const modal =
        document.getElementById(
            "studentModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
}


// ============================================================
// SUBMIT STUDENT
// ============================================================

async function submitStudentForm(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "studentName"
        ).value.trim();


    const enrollmentNo =
        document.getElementById(
            "enrollmentNo"
        ).value.trim();


    const dateOfBirth =
        document.getElementById(
            "dateOfBirth"
        ).value;


    const gender =
        document.getElementById(
            "gender"
        ).value;


    const email =
        document.getElementById(
            "studentEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "studentPhone"
        ).value.trim();


    const address =
        document.getElementById(
            "studentAddress"
        ).value.trim();


    const admissionYear =
        document.getElementById(
            "admissionYear"
        ).value;


    const programmeId =
        document.getElementById(
            "programmeSelect"
        ).value;


    const semesterId =
        document.getElementById(
            "semesterSelect"
        ).value;


    const academicYear =
        document.getElementById(
            "academicYear"
        ).value.trim();


    if (!name || !enrollmentNo) {

        alert(
            "Name and enrollment number are required."
        );

        return;
    }


    if (!programmeId) {

        alert(
            "Please select a programme."
        );

        return;
    }


    if (!semesterId) {

        alert(
            "Please select a semester."
        );

        return;
    }


    if (!academicYear) {

        alert(
            "Please enter the academic year."
        );

        return;
    }


    try {

        // ----------------------------------------------------
        // 1. CREATE STUDENT
        // ----------------------------------------------------

        const student =
            await api("/students", {

                method: "POST",

                body: JSON.stringify({

                    enrollment_no:
                        enrollmentNo,

                    name,

                    date_of_birth:
                        dateOfBirth || null,

                    gender:
                        gender || null,

                    email:
                        email || null,

                    phone:
                        phone || null,

                    address:
                        address || null,

                    admission_year:
                        admissionYear
                            ? Number(admissionYear)
                            : null
                })
            });


        // ----------------------------------------------------
        // 2. ENROLL STUDENT
        // ----------------------------------------------------

        await api("/enrollments", {

            method: "POST",

            body: JSON.stringify({

                student_id:
                    student.student_id,

                programme_id:
                    Number(programmeId),

                semester_id:
                    Number(semesterId),

                academic_year:
                    academicYear
            })
        });


        closeModal();


        document
            .getElementById(
                "studentForm"
            )
            .reset();


        await loadStudents();


        alert(
            "Student created successfully!"
        );


    } catch (error) {

        alert(error.message);
    }
}


// ============================================================
// VIEW STUDENT
// ============================================================

async function viewStudent(studentId) {

    try {

        const student =
            await api(
                `/students/${encodeURIComponent(studentId)}`
            );


        selectedStudent =
            student;


        const detailName =
            document.getElementById(
                "detailName"
            );


        const detailId =
            document.getElementById(
                "detailId"
            );


        const profileAvatar =
            document.getElementById(
                "profileAvatar"
            );


        if (detailName) {

            detailName.textContent =
                student.name;
        }


        if (detailId) {

            detailId.textContent =
                `Enrollment: ${
                    student.enrollment_no || "-"
                }`;
        }


        if (profileAvatar) {

            profileAvatar.textContent =
                student.name
                    ? student.name
                        .charAt(0)
                        .toUpperCase()
                    : "?";
        }


        renderStudentDetails(
            student
        );


        const modal =
            document.getElementById(
                "detailsModal"
            );


        if (modal) {

            modal.classList.add(
                "show"
            );
        }


    } catch (error) {

        alert(error.message);
    }
}


// ============================================================
// STUDENT DETAILS
// ============================================================

function renderStudentDetails(student) {

    const container =
        document.getElementById(
            "studentDetails"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="subject-list">

            <div class="subject-row">
                <span>Date of Birth</span>
                <strong>
                    ${escapeHTML(
                        student.date_of_birth || "-"
                    )}
                </strong>
            </div>


            <div class="subject-row">
                <span>Gender</span>
                <strong>
                    ${escapeHTML(
                        student.gender || "-"
                    )}
                </strong>
            </div>


            <div class="subject-row">
                <span>Email</span>
                <strong>
                    ${escapeHTML(
                        student.email || "-"
                    )}
                </strong>
            </div>


            <div class="subject-row">
                <span>Phone</span>
                <strong>
                    ${escapeHTML(
                        student.phone || "-"
                    )}
                </strong>
            </div>


            <div class="subject-row">
                <span>Admission Year</span>
                <strong>
                    ${escapeHTML(
                        student.admission_year || "-"
                    )}
                </strong>
            </div>


            <div class="subject-row">
                <span>Address</span>
                <strong>
                    ${escapeHTML(
                        student.address || "-"
                    )}
                </strong>
            </div>

        </div>
    `;
}


// ============================================================
// EDIT STUDENT
// ============================================================

async function editStudent() {

    if (!selectedStudent) {
        return;
    }


    const name =
        prompt(
            "Enter new student name:",
            selectedStudent.name
        );


    if (!name || !name.trim()) {
        return;
    }


    try {

        await api(
            `/students/${selectedStudent.student_id}`,
            {

                method: "PUT",

                body: JSON.stringify({

                    name: name.trim()
                })
            }
        );


        await loadStudents();


        await viewStudent(
            selectedStudent.student_id
        );


    } catch (error) {

        alert(error.message);
    }
}


// ============================================================
// DELETE STUDENT
// ============================================================

async function deleteStudent() {

    if (!selectedStudent) {
        return;
    }


    if (
        !confirm(
            `Delete ${selectedStudent.name}?`
        )
    ) {

        return;
    }


    try {

        await api(
            `/students/${selectedStudent.student_id}`,
            {
                method: "DELETE"
            }
        );


        closeDetails();

        await loadStudents();


    } catch (error) {

        alert(error.message);
    }
}


// ============================================================
// CLOSE DETAILS
// ============================================================

function closeDetails() {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );
    }


    selectedStudent = null;
}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

    const search =
        document.getElementById(
            "searchInput"
        );


    if (!search) {
        return;
    }


    search.addEventListener(
        "input",
        function () {

            const query =
                this.value
                    .toLowerCase()
                    .trim();


            const filtered =
                students.filter(
                    student =>

                        (
                            student.name || ""
                        )
                            .toLowerCase()
                            .includes(query)

                        ||

                        String(
                            student.enrollment_no || ""
                        )
                            .toLowerCase()
                            .includes(query)
                );


            renderStudents(
                filtered
            );
        }
    );
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.showLogin =
    showLogin;

window.showRegister =
    showRegister;

window.logout =
    logout;

window.openAddStudent =
    openAddStudent;

window.closeModal =
    closeModal;

window.viewStudent =
    viewStudent;

window.editStudent =
    editStudent;

window.deleteStudent =
    deleteStudent;

window.closeDetails =
    closeDetails;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const form =
            document.getElementById(
                "studentForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                submitStudentForm
            );
        }


        setupSearch();


        await loadMe();


        if (token()) {

            await loadInitialData();

            await loadStudents();

        } else {

            renderLoginState();
        }
    }
);
