const API =
    "https://studentdatabasemanagement-production.up.railway.app";


let students = [];

let selectedStudent = null;


// ======================================
// LOAD STUDENTS
// ======================================

async function loadStudents() {

    try {

        const response =
            await fetch(
                `${API}/students`
            );


        if (!response.ok) {

            throw new Error(
                "Backend error"
            );

        }


        students =
            await response.json();


        renderStudents(
            students
        );


        updateStats();


    } catch (error) {

        console.error(error);

    }

}


// ======================================
// RENDER STUDENTS
// ======================================

function renderStudents(
    data
) {

    const table =
        document.getElementById(
            "studentTable"
        );


    if (data.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                    text-align:center;
                    padding:50px;
                    color:#98a2b3;
                    "
                >

                    No students yet.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML = "";


    data.forEach(student => {

        const row =
            document.createElement(
                "tr"
            );


        const initial =
            student.name
                .charAt(0)
                .toUpperCase();


        row.innerHTML = `

            <td>

                <div class="student-cell">

                    <div class="avatar">

                        ${initial}

                    </div>

                    <div>

                        <div class="student-name">

                            ${escapeHTML(
                                student.name
                            )}

                        </div>

                        <div class="student-sub">

                            Student

                        </div>

                    </div>

                </div>

            </td>


            <td>

                ${escapeHTML(
                    student.student_id
                )}

            </td>


            <td>

                <span
                    class="subject-badge"
                >

                    ${student.subjects.length}
                    subject${
                        student.subjects.length !== 1
                            ? "s"
                            : ""
                    }

                </span>

            </td>


            <td>

                <span class="average">

                    ${student.average.toFixed(2)}

                </span>

            </td>


            <td>

                <button
                    class="view"
                    onclick="viewStudent(
                        '${escapeJS(
                            student.student_id
                        )}'
                    )"
                >

                    View

                </button>

            </td>

        `;


        table.appendChild(row);

    });

}


// ======================================
// STATS
// ======================================

function updateStats() {

    document.getElementById(
        "totalStudents"
    ).textContent =
        students.length;


    let subjects = 0;

    let grades = [];


    students.forEach(student => {

        subjects +=
            student.subjects.length;


        student.subjects.forEach(
            subject => {

                grades.push(
                    subject.grade
                );

            }
        );

    });


    document.getElementById(
        "totalSubjects"
    ).textContent =
        subjects;


    const average =
        grades.length
            ? grades.reduce(
                (a, b) => a + b,
                0
            ) / grades.length
            : 0;


    document.getElementById(
        "overallAverage"
    ).textContent =
        average.toFixed(2);

}


// ======================================
// ADD STUDENT MODAL
// ======================================

function openAddStudent() {

    document.getElementById(
        "studentModal"
    ).classList.add("show");

}


function closeModal() {

    document.getElementById(
        "studentModal"
    ).classList.remove("show");

}


// ======================================
// ADD STUDENT
// ======================================

document.getElementById(
    "studentForm"
).addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const name =
            document.getElementById(
                "studentName"
            ).value.trim();


        const id =
            document.getElementById(
                "studentId"
            ).value.trim();


        try {

            const response =
                await fetch(
                    `${API}/students`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                name: name,

                                student_id: id

                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error
                );

            }


            closeModal();


            document.getElementById(
                "studentForm"
            ).reset();


            await loadStudents();


        } catch (error) {

            alert(
                error.message
            );

        }

    }
);


// ======================================
// VIEW STUDENT
// ======================================

async function viewStudent(id) {

    try {

        const response =
            await fetch(
                `${API}/students/${
                    encodeURIComponent(id)
                }`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        selectedStudent =
            data;


        document.getElementById(
            "detailName"
        ).textContent =
            data.name;


        document.getElementById(
            "detailId"
        ).textContent =
            `ID: ${data.student_id}`;


        document.getElementById(
            "detailAverage"
        ).textContent =
            data.average.toFixed(2);


        document.getElementById(
            "profileAvatar"
        ).textContent =
            data.name
                .charAt(0)
                .toUpperCase();


        renderSubjects(
            data.subjects
        );


        document.getElementById(
            "detailsModal"
        ).classList.add(
            "show"
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}


// ======================================
// SUBJECTS
// ======================================

function renderSubjects(
    subjects
) {

    const container =
        document.getElementById(
            "subjectList"
        );


    if (!subjects.length) {

        container.innerHTML = `

            <div
                style="
                padding:25px;
                text-align:center;
                color:#98a2b3;
                font-size:12px;
                "
            >

                No subjects added yet.

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    subjects.forEach(item => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "subject-row";


        row.innerHTML = `

            <span>

                ${escapeHTML(
                    item.subject
                )}

            </span>


            <span class="grade">

                ${item.grade.toFixed(2)}

            </span>

        `;


        container.appendChild(row);

    });

}


// ======================================
// ADD SUBJECT
// ======================================

async function addSubject() {

    if (!selectedStudent) {

        return;

    }


    const subject =
        document.getElementById(
            "subjectInput"
        ).value.trim();


    const grade =
        Number(
            document.getElementById(
                "gradeInput"
            ).value
        );


    if (!subject) {

        alert(
            "Enter a subject."
        );

        return;

    }


    if (
        isNaN(grade) ||
        grade < 0 ||
        grade > 100
    ) {

        alert(
            "Grade must be between 0 and 100."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/students/${
                    encodeURIComponent(
                        selectedStudent.student_id
                    )
                }/subjects`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            subject:
                                subject,

                            grade:
                                grade

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        document.getElementById(
            "subjectInput"
        ).value = "";


        document.getElementById(
            "gradeInput"
        ).value = "";


        await loadStudents();


        await viewStudent(
            selectedStudent.student_id
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}


// ======================================
// EDIT STUDENT
// ======================================

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

        const response =
            await fetch(
                `${API}/students/${
                    encodeURIComponent(
                        selectedStudent.student_id
                    )
                }`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name:
                                name.trim()

                        })

                }
            );


        if (!response.ok) {

            const data =
                await response.json();

            throw new Error(
                data.error
            );

        }


        await loadStudents();


        await viewStudent(
            selectedStudent.student_id
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}


// ======================================
// DELETE
// ======================================

async function deleteStudent() {

    if (!selectedStudent) {

        return;

    }


    const confirmDelete =
        confirm(
            `Delete ${selectedStudent.name}?`
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/students/${
                    encodeURIComponent(
                        selectedStudent.student_id
                    )
                }`,
                {

                    method: "DELETE"

                }
            );


        if (!response.ok) {

            const data =
                await response.json();

            throw new Error(
                data.error
            );

        }


        closeDetails();


        await loadStudents();


    } catch (error) {

        alert(
            error.message
        );

    }

}


// ======================================
// CLOSE DETAILS
// ======================================

function closeDetails() {

    document.getElementById(
        "detailsModal"
    ).classList.remove(
        "show"
    );

    selectedStudent = null;

}


// ======================================
// SEARCH
// ======================================

document.getElementById(
    "searchInput"
).addEventListener(
    "input",
    function() {

        const query =
            this.value
                .toLowerCase()
                .trim();


        const filtered =
            students.filter(
                student =>

                    student.name
                        .toLowerCase()
                        .includes(query)

                    ||

                    student.student_id
                        .toLowerCase()
                        .includes(query)
            );


        renderStudents(
            filtered
        );

    }
);


// ======================================
// SECURITY
// ======================================

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


function escapeJS(value) {

    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );

}


// ======================================
// START
// ======================================

loadStudents();
