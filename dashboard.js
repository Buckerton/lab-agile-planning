// session helper struff copied from script.js
const SESSION_KEY = "session";

function getSession(){
    try { return JSON.parse(localStorage.getItem(SESSION_KEY));}
    catch {return null;}
}

function clearSession(){
    localStorage.removeItem(SESSION_KEY)
}

//DASHBOARD LOGIC
document.addEventListener("DOMContentLoaded", () => {
    const who = document.getElementById("who");
    const logoutBtn = document.getElementById("logoutBtn");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const addClassBtn = document.getElementById("addClassBtn");
    const classContainer = document.getElementById("classContainer");

    //Modal elements
    const addClassModal = document.getElementById("addClassModal");
    const closeModal = document.getElementById("closeModal");
    const saveClassBtn = document.getElementById("saveClassBtn");
    const newClassInput = document.getElementById("newClassInput");


    //verify session
    const sess = getSession();
    if(!sess)
    {
        window.location.href = "index.html"; //this will take user to the login if they arent logged in
        return;
    }

    //show logged in username
    if (who) who.textContent = sess.username;

    //logoutbtn
    if (logoutBtn)
    {
        logoutBtn.addEventListener("click", () => {
            clearSession();
            window.location.href = "index.html";
        });
    }

    // Classes Feature
    const CLASS_KEY_PREFIX = "classes_";
    const userClassesKey = CLASS_KEY_PREFIX + sess.username;

    function loadClasses() {
        try { return JSON.parse(localStorage.getItem(userClassesKey)) || []; }
        catch {return []; }
    }

    function saveClasses(classes) {
        localStorage.setItem(userClassesKey, JSON.stringify(classes));
    }

    function renderClasses() {
        classContainer.innerHTML = "";
        const classes = loadClasses();

        classes.forEach((className, i) => {
            const card = document.createElement("div");
            card.classList.add("class-card");

            //class name txt
            const title = document.createElement("span");
            title.textContent = className;
            card.appendChild(title);

            //more option button
            const moreBtn = document.createElement("button");
            moreBtn.textContent = "⋮";
            moreBtn.classList.add("more-btn");  
            card.appendChild(moreBtn);   
        
            //delete class
            moreBtn.addEventListener("click", () => {
                if(confirm(`Delete "${className}"?`)) {
                    classes.splice(i, 1);
                    saveClasses(classes);
                    renderClasses();
                }
            });

            classContainer.appendChild(card)
        });
    }

    renderClasses();

    //add class 
    if (addClassBtn)
    {
        addClassBtn.addEventListener("click", () => {
            newClassInput.value = "";
            addClassModal.style.display = "block";
            newClassInput.focus();
        });
    }

    if (closeModal)
    {
        closeModal.addEventListener("click", () => {
            addClassModal.style.display = "none";

        });
    }

    //save class from modal
    if (saveClassBtn)
    {
        saveClassBtn.addEventListener("click", () => {
            const className = newClassInput.value.trim();
            if(!className) return;

            const classes = loadClasses();
            classes.push(className);
            saveClasses(classes);
            renderClasses();
            addClassModal.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target == addClassModal) {
            addClassModal.style.display = "none";
        }
    });

})
