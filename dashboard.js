// dashboard.js (complete updated version with assignments)

const SESSION_KEY = "session";
function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

document.addEventListener("DOMContentLoaded", () => {
    const who                = document.getElementById("who");
    const logoutBtn          = document.getElementById("logoutBtn");
    const addClassBtn        = document.getElementById("addClassBtn");
    const classContainer     = document.getElementById("classContainer");
    const dashboard          = document.querySelector(".dashboard"); // main dashboard
    const courseDetail       = document.getElementById("courseDetail");
    const backToDashboard    = document.getElementById("backToDashboard");
    const courseTitle        = document.getElementById("courseTitle");
    const addAssignmentBtn   = document.getElementById("addAssignmentBtn");
    const assignmentContainer= document.getElementById("assignmentContainer");

    // Modals
    const addClassModal      = document.getElementById("addClassModal");
    const closeModal         = document.getElementById("closeModal");
    const saveClassBtn       = document.getElementById("saveClassBtn");
    const newClassInput      = document.getElementById("newClassInput");

    const assignmentModal    = document.getElementById("assignmentModal");
    const closeAssignmentModal = document.getElementById("closeAssignmentModal");
    const modalTitle         = document.getElementById("modalTitle");
    const assignmentName     = document.getElementById("assignmentName");
    const assignmentGrade    = document.getElementById("assignmentGrade");
    const saveAssignmentBtn  = document.getElementById("saveAssignmentBtn");

    // Session check
    const sess = getSession();
    if (!sess) { window.location.href = "index.html"; return; }
    if (who) who.textContent = sess.username;

    // Logout
    logoutBtn?.addEventListener("click", () => {
        clearSession();
        window.location.href = "index.html";
    });

    // Storage keys
    const CLASS_KEY_PREFIX = "classes_";
    const userClassesKey = CLASS_KEY_PREFIX + sess.username;
    const ASSIGN_PREFIX = "assign_"; // per class: assign_className_username

    const loadClasses = () => JSON.parse(localStorage.getItem(userClassesKey)) || [];
    const saveClasses = (arr) => localStorage.setItem(userClassesKey, JSON.stringify(arr));

    let currentCourse = null; // track open course

    // Load assignments for a course
    const getAssignKey = (course) => `${ASSIGN_PREFIX}${course}_${sess.username}`;
    const loadAssignments = (course) => JSON.parse(localStorage.getItem(getAssignKey(course))) || [];
    const saveAssignments = (course, arr) => localStorage.setItem(getAssignKey(course), JSON.stringify(arr));

    // Render classes
    const renderClasses = () => {
        classContainer.innerHTML = "";
        const classes = loadClasses();

        classes.forEach((name) => {
            const card = document.createElement("div");
            card.className = "class-card";

            const title = document.createElement("div");
            title.innerHTML = `<strong>${name}</strong><br><small>Average: ${calculateClassAverage(name)}</small>`;
            card.appendChild(title);


            const more = document.createElement("button");
            more.textContent = "⋮";
            more.className = "morebtn";
            more.title = "Delete class";
            more.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent opening detail
                if (confirm(`Delete "${name}"?`)) {
                    const arr = loadClasses();
                    arr.splice(arr.indexOf(name), 1);
                    saveClasses(arr);
                    localStorage.removeItem(getAssignKey(name)); // delete assignments too
                    renderClasses();
                }
            });
            card.appendChild(more);

            // Click card to open detail
            card.addEventListener("click", (e) => {
                if (e.target === more) return; // ignore more btn
                openCourseDetail(name);
            });

            classContainer.appendChild(card);
        });
    };
    renderClasses();

    // Open course detail view
    const openCourseDetail = (courseName) => {
        currentCourse = courseName;
        dashboard.style.display = "none";
        courseDetail.style.display = "block";
        courseTitle.textContent = courseName;
        renderAssignments();
    };

    // Back to dashboard
    backToDashboard.addEventListener("click", () => {
        courseDetail.style.display = "none";
        dashboard.style.display = "block";
        currentCourse = null;
        assignmentContainer.innerHTML = "";
    });

    // Render assignments
    const renderAssignments = () => {
        assignmentContainer.innerHTML = "";
        const assigns = loadAssignments(currentCourse);

        assigns.forEach((assign, i) => {
            const item = document.createElement("div");
            item.className = "assignment-item";

            const info = document.createElement("span");
            info.textContent = `${assign.name}: ${assign.grade}%`;
            item.appendChild(info);

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => openAssignmentModal(i));
            item.appendChild(editBtn);

            assignmentContainer.appendChild(item);
        });
    };

    // Add class modal
    addClassBtn?.addEventListener("click", () => {
        newClassInput.value = "";
        addClassModal.style.display = "block";
        newClassInput.focus();
    });

    closeModal?.addEventListener("click", () => addClassModal.style.display = "none");
    window.addEventListener("click", e => { if (e.target === addClassModal) addClassModal.style.display = "none"; });

    saveClassBtn?.addEventListener("click", () => {
        const name = newClassInput.value.trim();
        if (!name) return;
        const arr = loadClasses();
        if (!arr.includes(name)) arr.push(name);
        saveClasses(arr);
        renderClasses();
        addClassModal.style.display = "none";
    });

    // Assignment modal
    let editIndex = -1; // -1 for add new

    const openAssignmentModal = (index = -1) => {
        editIndex = index;
        assignmentName.value = "";
        assignmentGrade.value = "";
        modalTitle.textContent = index === -1 ? "Add Assignment" : "Edit Assignment";

        if (index !== -1) {
            const assigns = loadAssignments(currentCourse);
            assignmentName.value = assigns[index].name;
            assignmentGrade.value = assigns[index].grade;
        }

        assignmentModal.style.display = "block";
        assignmentName.focus();
    };

    addAssignmentBtn?.addEventListener("click", () => openAssignmentModal());

    closeAssignmentModal?.addEventListener("click", () => assignmentModal.style.display = "none");
    window.addEventListener("click", e => { if (e.target === assignmentModal) assignmentModal.style.display = "none"; });

    saveAssignmentBtn?.addEventListener("click", () => {
        const name = assignmentName.value.trim();
        const grade = parseInt(assignmentGrade.value, 10);
        if (!name || isNaN(grade) || grade < 0 || grade > 100) {
            alert("Enter valid name and grade (0-100).");
            return;
        }

        const assigns = loadAssignments(currentCourse);
        if (editIndex === -1) {
            assigns.push({ name, grade });
        } else {
            assigns[editIndex] = { name, grade };
        }
        saveAssignments(currentCourse, assigns);
        renderAssignments();
        renderClasses(); // update average grade shown on dashboard
        assignmentModal.style.display = "none";
    });

    // --- Calculate Class Grade Function ---
    function calculateClassAverage(course) {
        const assigns = loadAssignments(course);
        if (!assigns.length) return "N/A";
        const total = assigns.reduce((sum, a) => sum + a.grade, 0);
        return (total / assigns.length).toFixed(1) + "%";
}

});