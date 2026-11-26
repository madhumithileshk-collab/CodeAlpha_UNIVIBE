

// ======================================
// UNIVIBE - COMPLETE FRONTEND + BACKEND
// LOGIN + REGISTER + MONGODB
// LIKE FEATURE REMOVED
// ======================================

const API_URL = "http://localhost:5001/api";

// ======================================
// AUTHENTICATION
// ======================================

let currentStudent = null;
let authToken = sessionStorage.getItem("univibeToken");

function setMessage(id, message, success = false) {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = message;
    element.style.color = success ? "green" : "#c0392b";
}

function showLoginForm() {
    document.getElementById("login-form")?.classList.remove("hidden");
    document.getElementById("register-form")?.classList.add("hidden");

    setMessage("login-message", "");
    setMessage("register-message", "");
}

function showRegisterForm() {
    document.getElementById("login-form")?.classList.add("hidden");
    document.getElementById("register-form")?.classList.remove("hidden");

    setMessage("login-message", "");
    setMessage("register-message", "");
}

function showAuth() {
    document.getElementById("auth-section")?.classList.remove("hidden");
    document.getElementById("app-container")?.classList.add("hidden");

    currentStudent = null;
    authToken = null;
}

function showDashboard(student) {
    currentStudent = student;

    document.getElementById("auth-section")?.classList.add("hidden");
    document.getElementById("app-container")?.classList.remove("hidden");

    const name = "Mithilesh K";
    const initial = name.charAt(0).toUpperCase();

    // Update student name
    [
        "sidebar-name",
        "profile-name",
        "welcome-user"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = name;
    });

    // Update avatar initials
    [
        "sidebar-avatar",
        "topbar-avatar",
        "profile-avatar"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = initial;
    });

    refreshAll();
    renderConnections();
    openPage("home");

    // Load posts only after login
    loadBackendPosts();
}

// ======================================
// LOGIN
// ======================================

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("login-email")?.value.trim();
        const password = document.getElementById("login-password")?.value;

        if (!email || !password) {
            setMessage("login-message", "Please enter your email and password.");
            return;
        }

        const button = document.getElementById("login-button");

        if (button) button.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Login failed.");
            }

            if (!data.token || !data.student) {
                throw new Error("The server returned incomplete login information.");
            }

            authToken = data.token;
            currentStudent = data.student;

            sessionStorage.setItem("univibeToken", authToken);
            sessionStorage.setItem(
                "univibeStudent",
                JSON.stringify(currentStudent)
            );

            showDashboard(currentStudent);

        } catch (error) {
            setMessage("login-message", error.message);
            console.error("Login error:", error);

        } finally {
            if (button) button.disabled = false;
        }
    });
}

// ======================================
// REGISTRATION
// ======================================

const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("register-name")?.value.trim();
        const email = document.getElementById("register-email")?.value.trim();
        const password = document.getElementById("register-password")?.value;

        if (!name || !email || !password) {
            setMessage("register-message", "Please fill in all fields.");
            return;
        }

        if (password.length < 8) {
            setMessage("register-message", "Password must contain at least 8 characters.");
            return;
        }

        const button = document.getElementById("register-button");

        if (button) button.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Registration failed.");
            }

            setMessage(
                "register-message",
                "Registration successful! Please log in.",
                true
            );

            document.getElementById("login-email").value = email;

            registerForm.reset();

            setTimeout(() => {
                showLoginForm();
                setMessage(
                    "login-message",
                    "Account created! Please log in.",
                    true
                );
            }, 1200);

        } catch (error) {
            setMessage("register-message", error.message);
            console.error("Registration error:", error);

        } finally {
            if (button) button.disabled = false;
        }
    });
}

// ======================================
// AUTH FORM SWITCHING
// ======================================

document.getElementById("show-register")?.addEventListener(
    "click",
    showRegisterForm
);

document.getElementById("show-login")?.addEventListener(
    "click",
    showLoginForm
);

// ======================================
// LOGOUT
// ======================================

document.getElementById("logout-button")?.addEventListener("click", () => {
    sessionStorage.removeItem("univibeToken");
    sessionStorage.removeItem("univibeStudent");

    showAuth();
    showLoginForm();
});

// ======================================
// LOCAL STORAGE
// ======================================

const getData = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

const normalizePost = post => {
    const mongoId = post._id ||
        (typeof post.id === "string" &&
         /^[a-f\d]{24}$/i.test(post.id)
            ? post.id
            : null);

    return {
        ...post,
        ...(mongoId ? { _id: String(mongoId) } : {}),
        id: String(mongoId || post.id || Date.now()),
        comments: Array.isArray(post.comments)
            ? post.comments
            : [],
        date: post.date ||
            (post.createdAt
                ? new Date(post.createdAt).toLocaleString()
                : "")
    };
};

let posts = getData("univibePosts", []).map(normalizePost);

let followedUsers = getData("univibeFollowing", []);
let savedPosts = getData("univibeSaved", []).map(String);
let notifications = getData("univibeNotifications", []);

const students = [
    { name: "Alex Morgan", detail: "Computer Science", initial: "A" },
    { name: "Sophia Lee", detail: "UI/UX Designer", initial: "S" },
    { name: "Ryan Cooper", detail: "Web Developer", initial: "R" },
    { name: "Jamie Wilson", detail: "Data Science", initial: "J" },
    { name: "Taylor Smith", detail: "Software Engineering", initial: "T" }
];

const saveData = () => {
    localStorage.setItem("univibePosts", JSON.stringify(posts));
    localStorage.setItem("univibeFollowing", JSON.stringify(followedUsers));
    localStorage.setItem("univibeSaved", JSON.stringify(savedPosts));
    localStorage.setItem("univibeNotifications", JSON.stringify(notifications));
};

// ======================================
// BACKEND - LOAD POSTS FROM MONGODB
// ======================================

async function loadBackendPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);

        if (!response.ok) {
            throw new Error("Unable to load backend posts.");
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.posts)) {
            const localOnlyPosts = posts.filter(post => !post._id);

            const backendPosts = data.posts.map(normalizePost);

            posts = [
                ...backendPosts,
                ...localOnlyPosts
            ];

            saveData();
            refreshAll();

            console.log("UniVibe MongoDB posts loaded successfully!");
        }

    } catch (error) {
        console.error("Backend connection error:", error);
    }
}

// ======================================
// NOTIFICATIONS
// ======================================

function addNotification(message, icon = "🔔") {
    notifications.unshift({
        id: Date.now() + Math.random(),
        message,
        icon,
        date: new Date().toLocaleString()
    });

    saveData();
}

function showEmpty(container, message) {
    if (!container) return;

    container.innerHTML = "";

    const p = document.createElement("p");
    p.className = "empty-message";
    p.textContent = message;

    container.appendChild(p);
}

// ======================================
// POST RENDERING
// ======================================

function renderPosts(container, postList) {
    if (!container) return;

    container.innerHTML = "";

    if (!postList.length) {
        showEmpty(container, "Nothing to show here yet. 💜");
        return;
    }

    postList.forEach(post => {
        const card = document.createElement("article");
        card.className = "post-card";

        const author = document.createElement("h3");
        author.textContent = post.author || "Student";

        const date = document.createElement("small");
        date.textContent = post.date || "";

        const content = document.createElement("p");
        content.className = "post-content";
        content.textContent = post.text || "";

        const actions = document.createElement("div");
        actions.className = "post-card-actions";

        // SAVE POST
        const save = document.createElement("button");
        save.className = "save-button";

        const postId = String(post.id);
        const isSaved = savedPosts.includes(postId);

        save.textContent = isSaved ? "🔖 Saved" : "🔖 Save";

        if (isSaved) save.classList.add("saved");

        save.addEventListener("click", () => {
            if (savedPosts.includes(postId)) {
                savedPosts = savedPosts.filter(id => id !== postId);
            } else {
                savedPosts.push(postId);
                addNotification("You saved a post for later.", "🔖");
            }

            saveData();
            refreshAll();
        });

        actions.appendChild(save);

        // COMMENTS
        const commentsSection = document.createElement("div");
        commentsSection.className = "comments-section";

        const title = document.createElement("h4");
        title.textContent = `Comments (${post.comments.length})`;

        commentsSection.appendChild(title);

        post.comments.forEach(comment => {
            const item = document.createElement("p");
            item.className = "comment-item";

            item.textContent =
                `${comment.author || "Student"}: ${comment.text}`;

            commentsSection.appendChild(item);
        });

        // COMMENT FORM
        const form = document.createElement("form");
        form.className = "comment-form";

        const input = document.createElement("input");
        input.placeholder = "Write a comment...";
        input.maxLength = 250;
        input.required = true;

        const button = document.createElement("button");
        button.type = "submit";
        button.textContent = "Comment";

        form.append(input, button);

        form.addEventListener("submit", event => {
            event.preventDefault();

            const text = input.value.trim();

            if (!text) return;

            post.comments.push({
                author: currentStudent?.name || "Student",
                text
            });

            addNotification(
                "You commented on a community post.",
                "💬"
            );

            saveData();
            refreshAll();
        });

        card.append(
            author,
            date,
            content,
            actions,
            commentsSection,
            form
        );

        container.appendChild(card);
    });
}

// ======================================
// CREATE POST - MONGODB
// ======================================

const createPostButton =
    document.getElementById("create-post-button");

if (createPostButton) {
    createPostButton.addEventListener("click", async () => {
        const input = document.getElementById("post-input");

        if (!input || !currentStudent) return;

        const text = input.value.trim();

        if (!text) {
            alert("Please write something before posting!");
            return;
        }

        createPostButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(authToken
                        ? { "Authorization": `Bearer ${authToken}` }
                        : {})
                },
                body: JSON.stringify({
                    author: currentStudent.name,
                    text
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Post creation failed.");
            }

            const newPost = normalizePost(data.post);

            posts.unshift(newPost);

            input.value = "";

            addNotification(
                "Your post was published successfully.",
                "✨"
            );

            saveData();
            refreshAll();

            alert("Your post was published successfully! 💜");

        } catch (error) {
            console.error("Post creation error:", error);

            alert(
                "Unable to publish your post. Please check your backend server."
            );

        } finally {
            createPostButton.disabled = false;
        }
    });
}

// ======================================
// FOLLOW SYSTEM
// ======================================

function toggleFollow(name) {
    if (followedUsers.includes(name)) {
        followedUsers = followedUsers.filter(user => user !== name);
    } else {
        followedUsers.push(name);

        addNotification(
            `You are now following ${name}.`,
            "👥"
        );
    }

    saveData();

    renderConnections();
    updateProfile();
    updateFollowButtons();
}

function updateFollowButtons() {
    document.querySelectorAll("[data-follow]").forEach(button => {
        const name = button.dataset.follow;

        button.textContent =
            followedUsers.includes(name)
                ? "Following"
                : "Follow";
    });
}

// ======================================
// CONNECTIONS
// ======================================

function renderConnections() {
    const container =
        document.getElementById("connections-list");

    if (!container) return;

    container.innerHTML = "";

    students.forEach(student => {
        const card = document.createElement("div");
        card.className = "connection-card";

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = student.initial;

        const info = document.createElement("div");
        info.className = "connection-info";

        const name = document.createElement("strong");
        name.textContent = student.name;

        const detail = document.createElement("p");
        detail.textContent = student.detail;

        info.append(name, detail);

        const button = document.createElement("button");
        button.dataset.follow = student.name;

        button.textContent =
            followedUsers.includes(student.name)
                ? "Following"
                : "Follow";

        button.addEventListener("click", () => {
            toggleFollow(student.name);
        });

        card.append(avatar, info, button);
        container.appendChild(card);
    });
}

// ======================================
// EXPLORE SEARCH
// ======================================

const exploreSearch =
    document.getElementById("explore-search");

if (exploreSearch) {
    exploreSearch.addEventListener("input", event => {
        const keyword = event.target.value.toLowerCase().trim();

        const filtered = posts.filter(post =>
            String(post.text || "").toLowerCase().includes(keyword) ||
            String(post.author || "").toLowerCase().includes(keyword)
        );

        renderPosts(
            document.getElementById("explore-posts"),
            filtered
        );
    });
}

// ======================================
// RENDER NOTIFICATIONS
// ======================================

function renderNotifications() {
    const container =
        document.getElementById("notifications-list");

    if (!container) return;

    container.innerHTML = "";

    if (!notifications.length) {
        showEmpty(
            container,
            "You're all caught up! No notifications yet. 💜"
        );
        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement("div");
        item.className = "notification-item";

        const icon = document.createElement("span");
        icon.className = "notification-icon";
        icon.textContent = notification.icon || "🔔";

        const message = document.createElement("div");
        message.textContent = notification.message;

        item.append(icon, message);
        container.appendChild(item);
    });
}

// ======================================
// SAVED POSTS
// ======================================

function renderSavedPosts() {
    const saved = posts.filter(post =>
        savedPosts.includes(String(post.id))
    );

    renderPosts(
        document.getElementById("saved-posts"),
        saved
    );
}

// ======================================
// NAVIGATION
// ======================================

const pageDetails = {
    home: [
        "Home Feed",
        "Stay connected with your campus."
    ],
    explore: [
        "Explore",
        "Discover what's happening in your community."
    ],
    connections: [
        "Connections",
        "Meet people from your campus."
    ],
    notifications: [
        "Notifications",
        "Your latest community activity."
    ],
    saved: [
        "Saved Posts",
        "Your favourite posts in one place."
    ]
};

function openPage(page) {
    if (!pageDetails[page]) return;

    document.querySelectorAll(".page-view").forEach(section => {
        section.classList.remove("active-view");
    });

    const targetPage =
        document.getElementById(`${page}-view`);

    if (!targetPage) return;

    targetPage.classList.add("active-view");

    document.querySelectorAll(".sidebar nav a").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.view === page
        );
    });

    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");

    if (pageTitle) pageTitle.textContent = pageDetails[page][0];
    if (pageSubtitle) pageSubtitle.textContent = pageDetails[page][1];

    if (page === "explore") {
        renderPosts(
            document.getElementById("explore-posts"),
            posts
        );
    }

    if (page === "connections") renderConnections();
    if (page === "notifications") renderNotifications();
    if (page === "saved") renderSavedPosts();
}

document.querySelectorAll(".sidebar nav a").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        openPage(link.dataset.view);
    });
});

// ======================================
// PROFILE COUNTS
// ======================================

function updateProfile() {
    const postCount =
        document.getElementById("profile-post-count");

    const followCount =
        document.getElementById("profile-follow-count");

    if (postCount) postCount.textContent = posts.length;
    if (followCount) followCount.textContent = followedUsers.length;
}

// ======================================
// REFRESH ALL SECTIONS
// ======================================

function refreshAll() {
    renderPosts(
        document.getElementById("posts-container"),
        posts
    );

    renderPosts(
        document.getElementById("explore-posts"),
        posts
    );

    renderSavedPosts();
    renderNotifications();
    updateProfile();
    updateFollowButtons();
}

// ======================================
// START APPLICATION
// ======================================

saveData();

const savedStudent = sessionStorage.getItem("univibeStudent");

if (authToken && savedStudent) {
    try {
        showDashboard(JSON.parse(savedStudent));
    } catch (error) {
        sessionStorage.removeItem("univibeToken");
        sessionStorage.removeItem("univibeStudent");

        authToken = null;
        showAuth();
    }
} else {
    showAuth();
    showLoginForm();
}