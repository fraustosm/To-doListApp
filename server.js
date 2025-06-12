const express = require("express");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.static("public"));
app.use(session({
    secret: "tu_secreto_super_seguro",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Base de datos en memoria
const users = [];
const tasks = {}; // { "usuario1": [ {task: "Hacer ejercicio", completed: false}, ... ] }

// Ruta de registro
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (users.some(u => u.username === username)) {
        return res.status(400).send("Usuario ya existe");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: "To-Do App" });

    users.push({
        username,
        password: hashedPassword,
        mfaSecret: secret.base32,
        mfaEnabled: false
    });

    tasks[username] = []; // Inicializar tareas vacías

    // Generar QR para Google Authenticator
    qrcode.toDataURL(secret.otpauth_url, (err, qrCodeUrl) => {
        if (err) return res.status(500).send("Error al generar QR");
        res.send({ qrCodeUrl, secret: secret.base32 });
    });
});

// Ruta de login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Credenciales incorrectas");
    }

    req.session.user = { username, mfaEnabled: user.mfaEnabled };
    
    if (user.mfaEnabled) {
        res.send({ mfaRequired: true });
    } else {
        res.send({ mfaRequired: false });
    }
});

// Ruta para verificar MFA
app.post("/verify-mfa", (req, res) => {
    const { username, token } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) return res.status(400).send("Usuario no encontrado");

    const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token,
        window: 1
    });

    if (verified) {
        user.mfaEnabled = true;
        req.session.user = { username, mfaVerified: true };
        res.send({ verified: true });
    } else {
        res.send({ verified: false });
    }
});

// Ruta para manejar tareas
app.get("/api/tasks", (req, res) => {
    if (!req.session.user?.mfaVerified) {
        return res.status(401).send("No autorizado");
    }
    res.send(tasks[req.session.user.username] || []);
});

app.post("/api/tasks", (req, res) => {
    if (!req.session.user?.mfaVerified) {
        return res.status(401).send("No autorizado");
    }
    const { task } = req.body;
    tasks[req.session.user.username].push({ task, completed: false });
    res.send({ ok: true });
});

// Ruta para cerrar sesión
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.send({ ok: true });
});

// Ruta para servir la To-Do List
app.get("/todo.html", (req, res) => {
    if (!req.session.user?.mfaVerified) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "public", "todo.html"));
});

// Iniciar servidor
app.listen(3000, () => console.log("Servidor en http://localhost:3000"));