// dashboard.js (patched version)

const SESSION_KEY = "session";
function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// coursework categories and weights
const CATEGORY_WEIGHTS = {
    hw: 0.20,
    quiz: 0.10,
    mid: 0.30,
    final: 0.40
};

document.addEventListener("DOMContentLoaded", () => {
    const who = document.getElementById("who");
    const logoutBtn = document.getElementById("logoutBtn");
    const addClassBtn = document.getElementById("addClassBtn");
    const classContainer = document.getElementById("classContainer");
    const dashboard = document.querySelector(".dashboard");
    const courseDetail = document.getElementById("courseDetail");
    const backToDashboard = document.getElementById("backToDashboard");
    const courseTitle = document.getElementById("courseTitle");
    const addAssignmentBtn = document.getElementById("addAssignmentBtn");
    const upcomingContainer = document.getElementById("upcomingContainer");
    const upcomingAssignmentsContainer = document.getElementById("upcomingAssignmentsContainer");
    const gradedAssignmentsContainer = document.getElementById("gradedAssignmentsContainer");

    const addClassModal = document.getElementById("addClassModal");
    const closeModal = document.getElementById("closeModal");
    const saveClassBtn = document.getElementById("saveClassBtn");
    const newClassInput = document.getElementById("newClassInput");

    const assignmentModal = document.getElementById("assignmentModal");
    const closeAssignmentModal = document.getElementById("closeAssignmentModal");
    const modalTitle = document.getElementById("modalTitle");
    const assignmentName = document.getElementById("assignmentName");
    const assignmentGrade = document.getElementById("assignmentGrade");
    const assignmentDueDate = document.getElementById("assignmentDueDate");
    const saveAssignmentBtn = document.getElementById("saveAssignmentBtn");
    const assignmentCategory = document.getElementById("assignmentCategory");

    const sess = getSession();
    if (!sess) { window.location.href = "index.html"; return; }
    if (who) who.textContent = sess.username;

    logoutBtn?.addEventListener("click", () => {
        clearSession();
        window.location.href = "index.html";
    });

    const CLASS_KEY_PREFIX = "classes_";
    const userClassesKey = CLASS_KEY_PREFIX + sess.username;
    const ASSIGN_PREFIX = "assign_";

    const loadClasses = () => JSON.parse(localStorage.getItem(userClassesKey)) || [];
    const saveClasses = (arr) => localStorage.setItem(userClassesKey, JSON.stringify(arr));

    let currentCourse = null;

    const getAssignKey = (course) => `${ASSIGN_PREFIX}${course}_${sess.username}`;
    const loadAssignments = (course) => JSON.parse(localStorage.getItem(getAssignKey(course))) || [];
    const saveAssignments = (course, arr) => localStorage.setItem(getAssignKey(course), JSON.stringify(arr));

    const loadAllAssignments = () => {
        const classes = loadClasses();
        let allAssignments = [];
        classes.forEach(course => {
            const assignments = loadAssignments(course);
            assignments.forEach(assign => {
                allAssignments.push({ ...assign, course, dueDate: assign.dueDate || null });
            });
        });
        return allAssignments;
    };

    const getUpcomingAssignments = () => {
        const allAssignments = loadAllAssignments();
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        return allAssignments
            .filter(assign => assign.dueDate && (!assign.grade || assign.grade === 0) && new Date(assign.dueDate) >= today && new Date(assign.dueDate) <= nextWeek)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

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
                if (!assigns[assignIndex].grade) {
                    const grade = prompt(`Enter grade for "${assignmentName}" (0-100), or Cancel to skip:`);
                    if (grade !== null) {
                        const gradeNum = parseInt(grade);
                        if (!isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= 100) {
                            assigns[assignIndex].grade = gradeNum;
                        }
                    }
                }
                assigns[assignIndex].dueDate = "";
                saveAssignments(courseName, assigns);
                renderUpcomingAssignments();
                renderClasses();
            }
        }
    };

    const createAssignmentItem = (assign, index, isGraded) => {
        const item = document.createElement("div");
        item.className = "assignment-item";

        let dueDateText = "";
        if (assign.dueDate) dueDateText = ` - Due: ${new Date(assign.dueDate).toLocaleDateString()}`;

        const info = document.createElement("span");
        info.textContent = isGraded ? `${assign.name}: ${assign.grade}%${dueDateText}` : `${assign.name}${assign.grade ? `: ${assign.grade}%` : ''}${dueDateText}`;
        item.appendChild(info);

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "5px";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => openAssignmentModal(index));
        buttonContainer.appendChild(editBtn);

        if (!isGraded && assign.dueDate) {
            const completeBtn = document.createElement("button");
            completeBtn.textContent = "✓";
            completeBtn.style.background = "#4CAF50";
            completeBtn.addEventListener("click", () => completeAssignment(currentCourse, assign.name));
            buttonContainer.appendChild(completeBtn);
        }

        item.appendChild(buttonContainer);
        return item;
    };

    const renderAssignments = () => {
        const hwList = document.getElementById("hwList");
        const quizList = document.getElementById("quizList");
        const midList = document.getElementById("midList");
        const finalList = document.getElementById("finalList");

        hwList.innerHTML = quizList.innerHTML = midList.innerHTML = finalList.innerHTML = "";

        const assigns = loadAssignments(currentCourse);

        assigns.forEach((assign, i) => {
            const item = createAssignmentItem(assign, i, !!assign.grade);
            switch(assign.category) {
                case "hw": hwList.appendChild(item); break;
                case "quiz": quizList.appendChild(item); break;
                case "mid": midList.appendChild(item); break;
                case "final": finalList.appendChild(item); break;
            }
        });

        upcomingAssignmentsContainer.innerHTML = "";
        gradedAssignmentsContainer.innerHTML = "";

        const graded = assigns.filter(a => a.grade && a.grade > 0).sort((a,b) => b.grade - a.grade);
        const upcoming = assigns.filter(a => !a.grade || a.grade === 0).sort((a,b) => a.dueDate ? new Date(a.dueDate) - new Date(b.dueDate || "") : 1);

        graded.forEach(assign => gradedAssignmentsContainer.appendChild(createAssignmentItem(assign, assigns.indexOf(assign), true)));
        upcoming.forEach(assign => upcomingAssignmentsContainer.appendChild(createAssignmentItem(assign, assigns.indexOf(assign), false)));
    };

    const renderClasses = () => {
        classContainer.innerHTML = "";
        const classes = loadClasses();

        classes.forEach(name => {
            const card = document.createElement("div");
            card.className = "class-card";

            const title = document.createElement("div");
            title.innerHTML = `<strong>${name}</strong><br><small>Average: ${calculateClassAverage(name)}</small>`;
            card.appendChild(title);

            const more = document.createElement("button");
            more.textContent = "⋮";
            more.className = "morebtn";
            more.title = "Delete class";
            more.addEventListener("click", e => {
                e.stopPropagation();
                if (confirm(`Delete "${name}"?`)) {
                    const arr = loadClasses();
                    arr.splice(arr.indexOf(name),1);
                    saveClasses(arr);
                    localStorage.removeItem(getAssignKey(name));
                    renderClasses();
                }
            });
            card.appendChild(more);

            card.addEventListener("click", e => { if(e.target!==more) openCourseDetail(name); });
            classContainer.appendChild(card);
        });

        renderUpcomingAssignments();
    };
    renderClasses();

    const openCourseDetail = (courseName) => {
        currentCourse = courseName;
        dashboard.style.display = "none";
        courseDetail.style.display = "block";
        courseTitle.textContent = courseName;
        renderAssignments();
        drawDonutChart(currentCourse);
    };

    backToDashboard.addEventListener("click", () => {
        courseDetail.style.display = "none";
        dashboard.style.display = "block";
        currentCourse = null;
        upcomingAssignmentsContainer.innerHTML = "";
        gradedAssignmentsContainer.innerHTML = "";
    });

    addClassBtn?.addEventListener("click", () => { newClassInput.value=""; addClassModal.style.display="block"; newClassInput.focus(); });
    closeModal?.addEventListener("click", () => addClassModal.style.display="none");
    window.addEventListener("click", e=> { if(e.target===addClassModal) addClassModal.style.display="none"; });
    saveClassBtn?.addEventListener("click", () => {
        const name=newClassInput.value.trim();
        if(!name) return;
        const arr = loadClasses();
        if(!arr.includes(name)) arr.push(name);
        saveClasses(arr);
        renderClasses();
        addClassModal.style.display="none";
    });

    let editIndex = -1;
    const openAssignmentModal = (index=-1) => {
        editIndex=index;
        assignmentName.value = assignmentGrade.value = assignmentDueDate.value = "";
        modalTitle.textContent = index===-1 ? "Add Assignment" : "Edit Assignment";

        if(index!==-1){
            const assigns = loadAssignments(currentCourse);
            assignmentName.value=assigns[index].name;
            assignmentGrade.value=assigns[index].grade;
            if(assigns[index].dueDate) assignmentDueDate.value=assigns[index].dueDate;
            assignmentCategory.value=assigns[index].category || "hw";
        }

        assignmentModal.style.display="block";
        assignmentName.focus();
    };

    addAssignmentBtn?.addEventListener("click",()=>openAssignmentModal());
    closeAssignmentModal?.addEventListener("click",()=>assignmentModal.style.display="none");
    window.addEventListener("click", e=>{ if(e.target===assignmentModal) assignmentModal.style.display="none"; });

    saveAssignmentBtn?.addEventListener("click",()=>{
        const name=assignmentName.value.trim();
        let gradeValue=parseInt(assignmentGrade.value,10);
        const grade=isNaN(gradeValue)?0:gradeValue;
        const dueDate=assignmentDueDate.value;
        const category=assignmentCategory.value;

        if(!name){ alert("Enter a valid assignment name."); return; }

        const assigns=loadAssignments(currentCourse);
        if(editIndex===-1){ assigns.push({name,grade,dueDate,category}); }
        else { assigns[editIndex]={name,grade,dueDate,category}; }

        saveAssignments(currentCourse,assigns);
        renderAssignments();
        renderClasses();
        renderUpcomingAssignments();
        drawDonutChart(currentCourse);
        assignmentModal.style.display="none";
    });

    function calculateClassAverage(course){
        const assigns = loadAssignments(course).filter(a=>a.grade && a.grade>0);
        if(!assigns.length) return "N/A";
        return (assigns.reduce((sum,a)=>sum+a.grade,0)/assigns.length).toFixed(1)+"%";
    }

    // Calculate weighted grades including 0% grades
    function calculateweightedGrades(course) {
        const assigns = loadAssignments(course);
        const totals = { hw: 0, quiz: 0, mid: 0, final: 0 };
        const counts = { hw: 0, quiz: 0, mid: 0, final: 0 };

        assigns.forEach(a => {
            if (typeof a.grade === 'number' && CATEGORY_WEIGHTS[a.category]) {
                totals[a.category] += a.grade; // include 0% grades
                counts[a.category] += 1;
            }
        });

        const percentages = {};
        for (let cat in CATEGORY_WEIGHTS) {
            if (counts[cat] > 0) {
                percentages[cat] = (totals[cat] / counts[cat]) * CATEGORY_WEIGHTS[cat];
            } else {
                percentages[cat] = 0;
            }
        }

        const overall = Object.values(percentages).reduce((a, b) => a + b, 0);
        return { percentages, overall: Math.round(overall) };
    }

    function drawDonutChart(course) {
        const canvas = document.getElementById("gradeDonut");
        const center = document.getElementById("gradeCenter");
        if (!canvas || !center) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = 120;
        const lineWidth = 40;

        const colors = { hw: "#4CAF50", quiz: "#FF9800", mid: "#2196f3", final: "#9c27b0" };
        const categories = ["hw", "quiz", "mid", "final"];

        // STEP 1: Use the dedicated calculation function 
        const weightedResults = calculateweightedGrades(course);
        const overallGrade = weightedResults.overall; // The final grade (e.g., 88)
        const overallPointsEarned = weightedResults.percentages; // The points earned per category (e.g., HW: 18.5)

        let startAngle = -Math.PI / 2; // start at top

        categories.forEach(cat => {
            const weight = CATEGORY_WEIGHTS[cat] || 0;
            const percentageEarned = overallPointsEarned[cat] || 0;
            
            // 2. Calculate the MAX angle for this category (e.g., 20% of the circle)
            const sliceAngle = weight * 2 * Math.PI;

            // 3. Calculate the fraction of the slice that should be FILLED
            let earnedFraction = 0;
            if (weight > 0) {
                // This is (Points Earned) / (Max Possible Points for this Category)
                const maxPossiblePoints = weight * 100; 
                earnedFraction = percentageEarned / maxPossiblePoints; 
            }

            // Draw background slice (light gray)
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = "#eee";
            ctx.stroke();

            // Draw filled slice proportional to grade
            const filledAngle = sliceAngle * earnedFraction;
            if (filledAngle > 0) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, startAngle + filledAngle);
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = colors[cat];
                ctx.stroke();
            }

            startAngle += sliceAngle;
        });

        // 4. Set the center text using the grade returned by calculateweightedGrades
        center.innerText = overallGrade + "%";
    }

});

