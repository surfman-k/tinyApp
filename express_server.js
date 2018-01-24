const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
	"b2xVn2": "http://www.lighthouselabs.ca",
	"9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

app.get('/', function (req, res) {
  console.log('Cookies: ', req.cookies);
});

app.get("/", (req, res) => {
	res.end("Hello!");
});

app.get("/urls", (req, res) => {
	let templateVars = { urls: urlDatabase,
	username: req.cookies.name };
	res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
	let templateVars = { username: req.cookies.name };
	res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
	let templateVars = { 
		shortURL: req.params.id, 
		fullURL: urlDatabase[req.params.id], 
		username: req.cookies.name  };
	res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
	let templateVars = { urls: urlDatabase,
	username: req.cookies.name };
	res.render("urls_reg", templateVars);
});

app.post("/urls", (req, res) => { 
	urlDatabase[uniqueId] = req.body.longURL;
	console.log(urlDatabase);
	res.redirect('http://localhost:8080/urls/' + uniqueId);  
});

app.post("/urls/:id/delete", (req, res) => { 
	delete urlDatabase[req.params.id];
	console.log(urlDatabase);
	res.redirect('http://localhost:8080/urls/');  
});

app.post("/urls/:id", (req, res) => { 
	urlDatabase[req.params.id] = req.body.currentURL;
	console.log(urlDatabase);
	res.redirect('http://localhost:8080/urls/');  
});

app.post("/login", (req, res) => { 
	res.cookie('name', req.body.username);
	console.log(req.cookies);
	res.redirect('http://localhost:8080/urls/');  
});

app.post("/logout", (req, res) => { 
	res.clearCookie('name');
	console.log(req.cookies);
	res.redirect('http://localhost:8080/urls/');  
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
	let chars = [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	let result = '';
	for (let i = 0; i < 6; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return(result);
}
let uniqueId = generateRandomString();