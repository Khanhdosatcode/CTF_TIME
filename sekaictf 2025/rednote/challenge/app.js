const { rateLimit } = require("express-rate-limit");
const express = require("express");
const crypto = require("crypto");

const PORT = process.env.PORT || 80;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(require("express-session")({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true
    }
}));
app.set("view engine", "hbs");

const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

const notes = new Map();
const users = new Map();

app.use((req, res, next) => {
    res.setHeader("Document-Policy", "force-load-at-top");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");

    const nonce = crypto.randomBytes(16).toString("hex");
    res.locals.nonce = nonce;
    res.setHeader("Content-Security-Policy", `
        default-src 'none';
        script-src 'nonce-${nonce}' 'unsafe-inline';
        style-src 'unsafe-inline';
        form-action 'self';
        base-uri 'none';
        frame-ancestors 'none';
    `.replace(/\n/g, "").trim());

    if (req.session.user) {
        res.locals.user = users.get(req.session.user);
    }

    next();
});

app.use(express.static("public"));

app.get("/register", (req, res) => res.render("register"));
app.get("/login", (req, res) => res.render("login"));
app.get("/", (req, res) => res.render("index"));

app.post("/register", (req, res) => {
    const { user, pass } = req.body;

    if (typeof user !== "string" || typeof pass !== "string") {
        return res.render("register", { error: "missing username or password" });
    }

    if (user.length < 5 || user.length > 32) {
        return res.render("register", { error: "username must have length [5, 32]" });
    }

    if (/[^a-zA-Z0-9_]/.test(user)) {
        return res.render("register", { error: "username must only contain alphanumeric characters and underscores" });
    }

    if (pass.length < 8) {
        return res.render("register", { error: "password must be at least 8 characters" });
    }

    if (pass.includes(user)) {
        return res.render("register", { error: "password must not contain username" });
    }

    if (users.has(user)) {
        return res.render("register", { error: "username already taken" });
    }

    users.set(user, {
        user,
        pass: sha256(pass),
        notes: []
    });
    req.session.user = user;
    res.redirect("/home");
});

app.post("/login", (req, res) => {
    const { user, pass } = req.body;

    if (typeof user !== "string" || typeof pass !== "string") {
        return res.render("register", { error: "missing username or password" });
    }

    const u = users.get(user);
    if (!u || u.pass !== sha256(pass)) {
        return res.render("login", { error: "invalid username or password" });
    }

    req.session.user = user;
    res.redirect("/home");
});

app.post("/logout", (req, res) => req.session.destroy(() => res.redirect("/")));

app.use((req, res, next) => {
    if (req.session.user && res.locals.user) {
        return next();
    }
    res.redirect("/login");
});

app.use(rateLimit({
    windowMs: 4_000,
    limit: 4,
    message: "you are making requests too fast, please slow down!",
    keyGenerator: (req, res) => res.locals.user.user
}));

app.get("/home", (req, res) => res.render("home"));

app.get("/note/:id", (req, res) => {
    const note = notes.get(req.params.id);
    if (!note || note.user !== res.locals.user.user) {
        return res.render("home", { error: "note not found" });
    }
    res.render("note", { note: encodeURIComponent(JSON.stringify(note)) });
});

app.get("/search", (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
        return res.render("home", { error: "missing query" });
    }

    const filter = query.slice(0, 128);
    const result = res.locals.user.notes.map(n => notes.get(n.id)).find(n => n.title.includes(filter) || n.note.includes(filter));
    if (!result) {
        return res.render("home", { error: "no note found matching that query" });
    }

    res.render("note", { note: encodeURIComponent(JSON.stringify(result)) });
});

app.post("/create", (req, res) => {
    const { title, note } = req.body;

    if (typeof title !== "string" || typeof note !== "string") {
        return res.render("home", { error: "missing title or note" });
    }

    if (!title || title.length > 64) {
        return res.render("home", { error: "title must have length [1, 64]" });
    }

    if (!note || note.length > 128) {
        return res.render("home", { error: "note must have length [1, 128]" });
    }

    const id = crypto.randomUUID();
    notes.set(id, {
        id,
        title,
        note,
        user: res.locals.user.user
    });
    res.locals.user.notes.push({ id, title });
    res.redirect(`/note/${id}`);
});

app.post("/remove", (req, res) => {
    const { id } = req.body;

    if (typeof id !== "string") {
        return res.render("home", { error: "missing id to remove" });
    }

    const note = notes.get(id);
    if (!note || note.user !== res.locals.user.user) {
        return res.render("home", { error: "note to remove not found" });
    }

    notes.delete(id);
    res.locals.user.notes = res.locals.user.notes.filter(n => n.id !== id);
    res.redirect("/home");
});


app.listen(PORT, () => console.log(`web/rednote listening on port ${PORT}`));
