//Dependencies
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const moment = require('moment');


app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    signed: false
}));

const urlDatabase = {};
const users = {};
const personalURLs = {};


function urlsForUser(id) {
    personalURLs[id] = {};
    for (let key in urlDatabase) {
        if (urlDatabase[key].userID === id) {
            personalURLs[id][key] = urlDatabase[key];
        }
    }
}


app.get("/", (req, res) => {
    if (!req.session.userid) {
        res.redirect("/login");
    } else {
        res.redirect("/urls");
    }
});


//Index of URLs
app.get("/urls", (req, res) => {
    if (!req.session.userid) {
        let templateVars = {
            user: users[req.session.userid],
            loggedin: false
        };
        res.render("urls_login", templateVars);
    } else {
        urlsForUser(req.session.userid);
        let templateVars = {
            urls: personalURLs[req.session.userid],
            user: users[req.session.userid],
            PORT: PORT
        };
        res.render("urls_index", templateVars);
    }
});


//Page to make a new Short URL
app.get("/urls/new", (req, res) => {
    if (!users[req.session.userid]) {
        let templateVars = {
            user: users[req.session.userid],
            loggedin: false
        };
        res.redirect("/login");
    } else {
        let templateVars = {
            urls: urlDatabase,
            user: users[req.session.userid]
        };
        res.render("urls_new", templateVars);
    }
});


//Page to edit or update Short URL
app.get("/urls/:id", (req, res) => {
    if (!req.session.userid) {
        let templateVars = {
            user: users[req.session.userid],
            loggedin: false
        };
        res.render("urls_login", templateVars);
    } else if (urlDatabase[req.params.id].userID !== req.session.userid) {
        res.status(400).send("You do not own this URL!");
    } else {
        let templateVars = {
            shortURL: req.params.id,
            fullURL: urlDatabase[req.params.id].longURL,
            user: users[req.session.userid],
            visit: req.session[req.params.id].visits,
            uniqueVisit: req.session[req.params.id].uniqueUsers.length,
            timeStamps: req.session[req.params.id].timeStamp
        };

        res.render("urls_show", templateVars);
    }
});


//Registration Page
app.get("/register", (req, res) => {
    if (req.session.userid) {
        res.redirect("/urls");
    } else {
        let templateVars = {
            user: users[req.session.userid],
            loggedin: true
        };
        res.render("urls_reg", templateVars);
    }
});


//Login Page
app.get("/login", (req, res) => {
    if (req.session.userid) {
        res.redirect("/urls");
    } else {
        let templateVars = {
            user: users[req.session.userid],
            loggedin: true
        };
        res.render("urls_login", templateVars);
    }
});


//Creates new Short URL
app.post("/urls", (req, res) => {
    let uniqueId = generateRandomString();
    urlDatabase[uniqueId] = {};
    urlDatabase[uniqueId].longURL = req.body.longURL;
    urlDatabase[uniqueId].userID = req.session.userid;
    req.session[uniqueId] = {
        visits: 0,
        uniqueUsers: [],
        timeStamp: [{
            time: moment(Date.now()).subtract(5, 'hours').format("dddd, MMMM Do YYYY, h:mm:ss a"),
            viewedBy: "Created Short Link"
        }]
    };
    res.redirect('http://localhost:8080/urls/' + uniqueId);
});



//Deletes Short URL from Index Page
app.delete("/urls/:id/", (req, res) => {
    if (urlDatabase[req.params.id].userID !== req.session.userid) {
        res.redirect('http://localhost:8080/urls/');
    } else {
        delete urlDatabase[req.params.id];
        res.redirect('http://localhost:8080/urls/');
    }
});


//Updates Short URL from
app.put("/urls/:id", (req, res) => {
    if (urlDatabase[req.params.id].userID !== req.session.userid) {
        res.redirect('http://localhost:8080/urls/');
    } else {
        urlDatabase[req.params.id].longURL = req.body.currentURL;
        req.session[req.params.id] = {
            visits: 0,
            uniqueUsers: [],
            timeStamp: [{
                time: moment(Date.now()).subtract(5, 'hours').format("dddd, MMMM Do YYYY, h:mm:ss a"),
                viewedBy: "Created Short Link"
            }]
        };
        res.redirect('http://localhost:8080/urls/');
    }
});


//Logs users in by verifying the encrypted password
app.post("/login", (req, res) => {
    for (let key in users) {
        if (req.body.email === users[key].email && bcrypt.compareSync(req.body.password, users[key].password)) {
            req.session.userid = users[key].id;
            res.redirect('http://localhost:8080/urls/');
        }
    }
    res.status(403).send({
        error: 'Please verify your credentials!'
    });
});


//Logs User Out and returns to Login page
app.post("/logout", (req, res) => {
    req.session.userid = null;
    res.redirect('http://localhost:8080/login/');
});


//Creates new users with encrypted passwords
app.post("/register", (req, res) => {
    for (let key in users) {
        if (req.body.email === users[key].email) {
            res.status(400).send({
                error: 'That email address is already registered!'
            });
            break;
        }
    }
    if (req.body.email.length === 0) {
        res.status(400).send({
            error: 'Make sure you enter a valid email!'
        });
    } else if (req.body.password.length === 0) {
        res.status(400).send({
            error: 'Make sure you enter a valid password!'
        });
    } else {
        let uniqueId = generateRandomString();
        users[uniqueId] = {};
        users[uniqueId].id = uniqueId;
        users[uniqueId].email = req.body.email;
        let passwordToHash = req.body.password;
        users[uniqueId].password = bcrypt.hashSync(passwordToHash, 10);
        req.session.userid = uniqueId;
        res.redirect('http://localhost:8080/urls/');
    }
});


//Redirects to the Full URL
app.get("/u/:shortURL", (req, res) => {
	//Feature that tracks every visit to a Short URL with a timestamp and userID
    if (!req.session[req.params.shortURL]) {
        req.session[req.params.shortURL] = {
            visits: 1,
            uniqueUsers: [req.session.userid],
            timeStamp: [{
                time: moment(Date.now()).subtract(5, 'hours').format("dddd, MMMM Do YYYY, h:mm:ss a"),
                viewedBy: req.session.userid
            }]
        };
    } else { 
        req.session[req.params.shortURL].visits += 1;
        req.session[req.params.shortURL].timeStamp.push({
            time: moment(Date.now()).subtract(5, 'hours').format("dddd, MMMM Do YYYY, h:mm:ss a"),
            viewedBy: req.session.userid
        });
        if (req.session[req.params.shortURL].uniqueUsers.indexOf(req.session.userid) < 0) {
            req.session[req.params.shortURL].uniqueUsers.push(req.session.userid);
        }
    }

    if (!urlDatabase[req.params.shortURL]) {
        res.status(400).send("That Short URL does not exist!");
    } else {
        let longURL = urlDatabase[req.params.shortURL].longURL;
        res.redirect(longURL);
    }

});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
    let chars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return (result);
}