const API_URL =
    "https://studentdatabasemanagement-production.up.railway.app";


let selectedStudentId = null;

let allStudents = [];


// ==========================================
// CHECK BACKEND CONNECTION
// ==========================================

async function checkBackend() {

    const dot =
        document.getElementById("statusDot");

    const text =
        document.getElementById("statusText");


    try {

        const response =
            await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                "Backend unavailable"
            );

        }


        dot.style.background =
            "#22c55e";

        text.textContent =
            "Backend connected";


    } catch (error) {

        dot.style.background =
            "#ef4444";

        text.textContent =
            "Backend offline";

    }

}



// ==========================================
// LOAD ALL STUDENTS
// ==========================================

async function loadStudents() {

    const list =
        document.getElementById(
            "studentList"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/students`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load students"
            );

        }


        allStudents =
            await response.json();


        displayStudents(
            allStudents
        );


    } catch (error) {

        list.innerHTML = `
            <div class="empty">
                Could not connect to the backend.
            </div>
        `;

    }

}



// ==========================================
// DISPLAY STUDENTS
// ==========================================

function displayStudents(students) {

    const list =
        document.getElementById(
            "studentList"
        );


    const count =
        document.getElementById(
            "studentCount"
        );


    count.textContent =
        `${students.length} student${
            students.length !== 1
                ? "s"
                : ""
        }`;


    if (students.length === 0) {

        list.innerHTML = `
            <div class="empty">
                No students found.
            </div>
        `;

        return;

    }


    list.innerHTML = "";


    students.forEach(student => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "student";


        div.innerHTML = `

            <div class="student-left">

                <div class="student-name">
                    ${escapeHTML(
                        student.name
                    )}
                </div>

                <div class="student-id">
                    ID:
                    ${escapeHTML(
                        student.student_id
                    )}
                </div>

            </div>


            <button
                class="view-button"
                onclick="viewStudent(
                    '${escapeJS(
                        student.student_id
                    )}'
                )"
            >
                View Details
            </button>

        `;


        list.appendChild(div);

    });

}



// ==========================================
// ADD STUDENT
// ==========================================

document
    .getElementById("studentForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "studentName"
                    )
                    .value
                    .trim();


            const studentId =
                document
                    .getElementById(
                        "studentId"
                    )
                    .value
                    .trim();


            const message =
                document.getElementById(
                    "studentMessage"
                );


            try {

                const response =
                    await fetch(
                        `${API_URL}/students`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    name: name,

                                    student_id:
                                        studentId

                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Failed to add student"
                    );

                }


                message.textContent =
                    "Student added successfully!";

                message.className =
                    "message success";


                document
                    .getElementById(
                        "studentForm"
                    )
                    .reset();


                await loadStudents();


            } catch (error) {

                message.textContent =
                    error.message;

                message.className =
                    "message error";

            }

        }
    );



// ==========================================
// VIEW STUDENT
// ==========================================

async function viewStudent(
    studentId
) {

    try {

        const response =
            await fetch(
                `${API_URL}/students/${
                    encodeURIComponent(
                        studentId
                    )
                }`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Student not found"
            );

        }


        selectedStudentId =
            studentId;


        document.getElementById(
            "detailsCard"
        ).style.display =
            "block";


        document.getElementById(
            "detailId"
        ).textContent =
            data.student_id;


        document.getElementById(
            "detailName"
        ).textContent =
            data.name;


        document.getElementById(
            "detailStudentName"
        ).textContent =
            data.name;


        document.getElementById(
            "detailGpa"
        ).textContent =
            Number(
                data.gpa
            ).toFixed(2);


        displayGrades(
            data.grades
        );


        document
            .getElementById(
                "detailsCard"
            )
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        alert(
            error.message
        );

    }

}



// ==========================================
// DISPLAY GRADES
// ==========================================

function displayGrades(
    grades
) {

    const container =
        document.getElementById(
            "gradesList"
        );


    if (
        !grades ||
        grades.length === 0
    ) {

        container.textContent =
            "No grades yet.";

        return;

    }


    container.innerHTML = "";


    grades.forEach(grade => {

        const span =
            document.createElement(
                "span"
            );


        span.className =
            "grade";


        span.textContent =
            Number(
                grade
            ).toFixed(2);


        container.appendChild(
            span
        );

    });

}



// ==========================================
// ADD GRADE
// ==========================================

async function addGrade() {

    if (!selectedStudentId) {

        return;

    }


    const input =
        document.getElementById(
            "gradeInput"
        );


    const grade =
        Number(input.value);


    const message =
        document.getElementById(
            "gradeMessage"
        );


    if (
        input.value === "" ||
        isNaN(grade) ||
        grade < 0 ||
        grade > 100
    ) {

        message.textContent =
            "Enter a grade between 0 and 100.";

        message.className =
            "message error";

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/students/${
                    encodeURIComponent(
                        selectedStudentId
                    )
                }/grades`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            grade: grade
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to add grade"
            );

        }


        message.textContent =
            "Grade added successfully!";

        message.className =
            "message success";


        input.value = "";


        await viewStudent(
            selectedStudentId
        );


    } catch (error) {

        message.textContent =
            error.message;

        message.className =
            "message error";

    }

}



// ==========================================
// EDIT STUDENT
// ==========================================

async function editStudent() {

    if (!selectedStudentId) {

        return;

    }


    const currentName =
        document.getElementById(
            "detailStudentName"
        ).textContent;


    const newName =
        prompt(
            "Enter new student name:",
            currentName
        );


    if (
        !newName ||
        !newName.trim()
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/students/${
                    encodeURIComponent(
                        selectedStudentId
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
                                newName.trim()

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to update student"
            );

        }


        await loadStudents();


        await viewStudent(
            selectedStudentId
        );


        alert(
            "Student updated successfully!"
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}



// ==========================================
// DELETE STUDENT
// ==========================================

async function deleteStudent() {

    if (!selectedStudentId) {

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this student?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/students/${
                    encodeURIComponent(
                        selectedStudentId
                    )
                }`,
                {

                    method: "DELETE"

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to delete student"
            );

        }


        closeDetails();


        await loadStudents();


        alert(
            "Student deleted successfully!"
        );


    } catch (error) {

        alert(
            error.message
        );

    }

}



// ==========================================
// CLOSE DETAILS
// ==========================================

function closeDetails() {

    document.getElementById(
        "detailsCard"
    ).style.display =
        "none";


    selectedStudentId =
        null;

}



// ==========================================
// SEARCH
// ==========================================

document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "input",
        function() {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            const filtered =
                allStudents.filter(
                    student =>

                        student.name
                            .toLowerCase()
                            .includes(
                                search
                            )

                        ||

                        student.student_id
                            .toLowerCase()
                            .includes(
                                search
                            )
                );


            displayStudents(
                filtered
            );

        }
    );



// ==========================================
// SECURITY HELPERS
// ==========================================

function escapeHTML(
    value
) {

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


function escapeJS(
    value
) {

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



// ==========================================
// START APPLICATION
// ==========================================

checkBackend();

loadStudents();
