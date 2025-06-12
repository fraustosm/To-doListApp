// Mostrar/ocultar login y registro
function showRegister() {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("register-container").style.display = "block";
}

function showLogin() {
    document.getElementById("register-container").style.display = "none";
    document.getElementById("login-container").style.display = "block";
}

// Registrar usuario
async function register() {
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById("register-container").style.display = "none";
        document.getElementById("mfa-setup-container").style.display = "block";
        document.getElementById("qrcode").src = data.qrCodeUrl;
        document.getElementById("mfa-secret").textContent = data.secret;
    } else {
        alert("Error al registrar");
    }
}

// Login
async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.mfaRequired) {
            document.getElementById("login-container").style.display = "none";
            document.getElementById("mfa-verify-container").style.display = "block";
        } else {
            window.location.href = "/todo.html";
        }
    } else {
        alert("Credenciales incorrectas");
    }
}

// Verificar MFA
async function verifyMFA() {
    const username = document.getElementById("login-username").value;
    const code = document.getElementById("mfa-code").value;

    const response = await fetch("/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token: code })
    });

    const data = await response.json();
    if (data.verified) {
        window.location.href = "/todo.html";
    } else {
        alert("Código MFA inválido");
    }
}