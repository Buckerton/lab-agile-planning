// Demo Authentication System (Multiple Accounts) using localStorage
// NOTE: Replace with a secure backend & password hashing before making fully public (DEMO VERSION ONLY).

const USERS_KEY = "users";   // key where all accounts are stored
const SESSION_KEY = "session"; // key where current login session is stored

// Load existing users from storage
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

// Save user array back to storage
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Register a new user (throws error if duplicate username/email)
function createUser({ username, email, password }) {
  const users = loadUsers();
  const exists = users.some(
    u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    throw new Error("Username or email already exists.");
  }
  // Save user with a generated ID
  users.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    username,
    email,
    password // (⚠ stored in plaintext for demo purposes only)
  });
  saveUsers(users);
}

// Try to find a matching user for login
function findUserByCredentials(username, password) {
  const users = loadUsers();
  return users.find(u =>
    u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
}

// Session management
function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Attach event listeners once the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Register navigation button on login page
  const registerBtn = document.getElementById("registerButton");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => (window.location.href = "register.html"));
  }

  // Forgot password placeholder
  const forgotBtn = document.getElementById("forgotPassword");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", () => (window.location.href = "forgot.html"));
  }

  // Handle registration form submission
  const registerForm = document.getElementById("RegisterForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("newUsername").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      try {
        createUser({ username, email, password });
        alert("Account created successfully! You can now log in.");
        window.location.href = "index.html"; // redirect back to login
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Handle login form submission
  const loginForm = document.getElementById("LoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      const user = findUserByCredentials(username, password);
      if (!user) {
        alert("Invalid username or password.");
        return;
      }
      setSession(user.username);
      alert("Login successful! Redirecting...");
      window.location.href = "dashboard.html";
    });
  }

  // Dashboard page logic (show username + logout)
  const who = document.getElementById("who");
  const logoutBtn = document.getElementById("logoutBtn");
  if (who || logoutBtn) {
    const sess = getSession();
    if (!sess) {
      // if no session found, return to login
      window.location.href = "index.html";
      return;
    }
    if (who) who.textContent = sess.username;
    if (logoutBtn) logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "index.html";
    });
  }

  // Handle forgot password form
  const forgotForm = document.getElementById("ForgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("forgotEmail").value;
      const users = JSON.parse(localStorage.getItem("users")) || [];

      // Look for user by email
      const user = users.find(u => u.email === email);

      if (!user) {
        alert("Email not found. Please create an account.");
        return;
      }

      // Store email for reset
      localStorage.setItem("resetEmail", email);

      // Go to reset.html
      window.location.href = "reset.html";
    });
  }

  // Handle reset password form
  const resetForm = document.getElementById("ResetForm");
  if (resetForm) {
    resetForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      const email = localStorage.getItem("resetEmail");
      if (!email) {
        alert("Session expired. Please try again.");
        window.location.href = "index.html";
        return;
      }

      let users = JSON.parse(localStorage.getItem("users")) || [];

      // Update that user's password
      users = users.map(user => {
        if (user.email === email) {
          return { ...user, password: newPassword };
        }
        return user;
      });

      localStorage.setItem("users", JSON.stringify(users));
      localStorage.removeItem("resetEmail");

      alert("Password has been reset successfully!");
      window.location.href = "index.html";
    });
  }
});
