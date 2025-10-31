// dashboard.js (complete updated version with assignments and due dates)

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
    const upcomingAssignmentsContainer = document.getElementById("upcomingAssignmentsContainer");
    const gradedAssignmentsContainer = document.getElementById("gradedAssignmentsContainer");
    const upcomingContainer = document.getElementById("upcomingContainer");

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
    const assignmentDueDate  = document.getElementById("assignmentDueDate");
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

    // Load all assignments across all classes for upcoming assignments
    const loadAllAssignments = () => {
        const classes = loadClasses();
        let allAssignments = [];
        classes.forEach(course => {
            const assignments = loadAssignments(course);
            assignments.forEach(assign => {
                allAssignments.push({
                    ...assign,
                    course: course,
                    dueDate: assign.dueDate || null
                });
            });
        });
        return allAssignments;
    };

    // Get upcoming assignments (next 7 days)
    const getUpcomingAssignments = () => {
        const allAssignments = loadAllAssignments();
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        return allAssignments
            .filter(assign => {
                if (!assign.dueDate) return false;
                if (assign.grade && assign.grade > 0) return false;
                const dueDate = new Date(assign.dueDate);
                return dueDate >= today && dueDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

    // Render upcoming assignments on dashboard
    const renderUpcomingAssignments = () => {
        upcomingContainer.innerHTML = "";
        const upcoming = getUpcomingAssignments();
        
        if (upcoming.length === 0) {
            upcomingContainer.innerHTML = "<p>No upcoming assignments in the next week.</p>";
            return;
        }

        upcoming.forEach(assign => {
            const item = document.createElement("div");
            item.className = "upcoming-item";
    
            const dueDate = new Date(assign.dueDate);
            const formattedDate = dueDate.toLocaleDateString();
    
            item.innerHTML = `
                <div class="upcoming-content">
                    <strong>${assign.name}</strong> - ${assign.course}<br>
                    <small>Due: ${formattedDate}</small>
                </div>
                <button class="check-btn" data-course="${assign.course}" data-assignment="${assign.name}">✓</button>
            `;
    
            // Add check button functionality
            const checkBtn = item.querySelector('.check-btn');
            checkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                completeAssignment(assign.course, assign.name);
            });
    
            upcomingContainer.appendChild(item);
        });
    };

    const completeAssignment = (courseName, assignmentName) => {
        if (confirm(`Mark "${assignmentName}" as completed?`)) {
            const assigns = loadAssignments(courseName);
            const assignIndex = assigns.findIndex(a => a.name === assignmentName);
        
            if (assignIndex !== -1) {
                // If not graded, ask if they want to add a grade
                if (!assigns[assignIndex].grade) {
                    const grade = prompt(`Enter grade for "${assignmentName}" (0-100), or click Cancel to skip:`);
                    if (grade !== null) {
                        const gradeNum = parseInt(grade);
                        if (!isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= 100) {
                            assigns[assignIndex].grade = gradeNum;
                        }
                    }
                }
                // Remove due date to remove from upcoming
                assigns[assignIndex].dueDate = "";
                saveAssignments(courseName, assigns);
                renderUpcomingAssignments();
                renderClasses();
            }
        }
    };

    // Helper function to create assignment item
    const createAssignmentItem = (assign, index, isGraded) => {
        const item = document.createElement("div");
        item.className = "assignment-item";

        let dueDateText = "";
        if (assign.dueDate) {
            const dueDate = new Date(assign.dueDate);
            dueDateText = ` - Due: ${dueDate.toLocaleDateString()}`;
        }

        const info = document.createElement("span");
        if (isGraded) {
            info.textContent = `${assign.name}: ${assign.grade}%${dueDateText}`;
        } else {
            info.textContent = `${assign.name}${assign.grade ? `: ${assign.grade}%` : ''}${dueDateText}`;
        }
        item.appendChild(info);

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "5px";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => openAssignmentModal(index));
        item.appendChild(editBtn);

        if (!isGraded && assign.dueDate) {
            const completeBtn = document.createElement("button");
            completeBtn.textContent = "✓";
            completeBtn.style.background = "#4CAF50";
            completeBtn.addEventListener("click", () => {
                completeAssignment(currentCourse, assign.name);
            });
            buttonContainer.appendChild(completeBtn);
        }

        item.appendChild(buttonContainer);

        return item;
    };

    // Render assignments by category (upcoming vs graded)
    const renderAssignments = () => {
        upcomingAssignmentsContainer.innerHTML = "";
        gradedAssignmentsContainer.innerHTML = "";
    
        const assigns = loadAssignments(currentCourse);
    
        // Graded assignments - anything with a grade goes here
        const graded = assigns.filter(assign => assign.grade && assign.grade > 0)
                            .sort((a, b) => b.grade - a.grade);

        // Upcoming assignments - only ungraded assignments
        const upcoming = assigns.filter(assign => !assign.grade || assign.grade === 0)
                            .sort((a, b) => {
            // Sort by due date, assignments without due date go last
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        // Render upcoming assignments
        if (upcoming.length === 0) {
            upcomingAssignmentsContainer.innerHTML = "<p>No upcoming assignments.</p>";
        } else {
            upcoming.forEach((assign, i) => {
                const originalIndex = assigns.indexOf(assign);
                const item = createAssignmentItem(assign, originalIndex, false);
                upcomingAssignmentsContainer.appendChild(item);
            });
        }

        // Render graded assignments
        if (graded.length === 0) {
            gradedAssignmentsContainer.innerHTML = "<p>No graded assignments.</p>";
        } else {
            graded.forEach((assign, i) => {
                const originalIndex = assigns.indexOf(assign);
                const item = createAssignmentItem(assign, originalIndex, true);
                gradedAssignmentsContainer.appendChild(item);
            });
        }
    };

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
        
        renderUpcomingAssignments();
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
        upcomingAssignmentsContainer.innerHTML = "";
        gradedAssignmentsContainer.innerHTML = "";
    });

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
        assignmentDueDate.value = "";
        modalTitle.textContent = index === -1 ? "Add Assignment" : "Edit Assignment";

        if (index !== -1) {
            const assigns = loadAssignments(currentCourse);
            assignmentName.value = assigns[index].name;
            assignmentGrade.value = assigns[index].grade;
            if (assigns[index].dueDate) {
                assignmentDueDate.value = assigns[index].dueDate;
            }
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
        const dueDate = assignmentDueDate.value;

        if (!name) {
            alert("Enter a valid assignment name.");
            return;
        }

        const assigns = loadAssignments(currentCourse);
        if (editIndex === -1) {
            assigns.push({ name, grade, dueDate });
        } else {
            assigns[editIndex] = { name, grade, dueDate };
        }
        saveAssignments(currentCourse, assigns);
        renderAssignments();
        renderClasses();
        renderUpcomingAssignments();
        assignmentModal.style.display = "none";
    });

    // Calculate Class Grade Function
    function calculateClassAverage(course) {
        const assigns = loadAssignments(course);
        const gradedAssigns = assigns.filter(a => a.grade && a.grade > 0);
        if (!gradedAssigns.length) return "N/A";
        const total = gradedAssigns.reduce((sum, a) => sum + a.grade, 0);
        return (total / gradedAssigns.length).toFixed(1) + "%";
    }
});