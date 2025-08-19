const express = require("express");
const path = require('path');
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(cookieParser());

const get_id = () => crypto.randomBytes(16).toString("hex");

const notes = new Map;

/* post a note */
app.post("/api/post", (req, res) => {
	const {
		noteTitle,
		noteContent
	} = req.body;
	if (!noteTitle || typeof noteTitle !== "string" || !noteContent || typeof noteContent !== "string") {
		return res.status(400).json({
			message: "invalid note"
		});
	};
	const id = get_id();
	notes.set(id, {
		noteTitle,
		noteContent
	});
	return res.json({
		id
	});
});

/* retrieve a note */
app.get("/api/view/:note", (req, res) => {
	return res.jsonp(notes.get(req.params.note));
});

/* retrieve the flag */
app.get("/api/flag", (req, res) => {
	if (req.cookies.secret === process.env.SECRET){
		return res.json({
			flag: process.env.FLAG
		});
	} else {
		return res.json({
			error: "unauthorized"
		});
	};
});

/* view a note */
app.get("/note/:id", (req, res) => {
	return res.render("notes", {
		note: req.params.id
	});
});


/* index */
app.use("*path", (req, res) => {
	return res.render("index");
});


app.listen(process.env.PORT || 1337, () => {
	console.log("listening...")
});
