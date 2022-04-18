let express = require('express');
let app = express();
let bodyParser = require('body-parser');
session = require('express-session');
cookieParser = require('cookie-parser');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('main.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS blog (link TEXT, heading TEXT, text_value TEXT, small_text TEXT, login_user TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS users (login TEXT, password TEXT)");
});

const sqlite = require('sqlite-sync');
sqlite.connect('main.db');

let urlencodedParser = bodyParser.urlencoded({ extended: false });

let secret_key = '!@&hsdadnsld;pdeE&6gdbaghd7EG*@E@';
app.use(cookieParser(secret_key));
app.use(
  session({
    secret: secret_key,
    saveUninitialized: true,
  })
);


app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    res.redirect('blog');
});


app.get('/blog', (req, res) => {
    console.log(req.session);
    // check login
    if (typeof req.session.login === "undefined") {
        // if we don't have the login
        res.redirect('/login');
    } else {
        if (typeof req.session.number_reboots !== "undefined") {
          // with key
          req.session.number_reboots += 1;
          console.log(`Number Reboots: ${req.session.number_reboots}. With key`);
        } else {
          // without key
          req.session.number_reboots = 1;
          console.log(`Number Reboots: ${req.session.number_reboots}. Without key`);
        }

        let req_ = sqlite.run("SELECT * FROM blog");
        res.render('blog', {result_array: req_, what: 'Выйти', login_value: req.session.login});
    }
});


app.get('/delete_news/:number', (req, res) => {
  if (typeof req.session.login === "undefined") {
      // if we don't have the login
      res.redirect('/login');
  } else {
      let req_ = sqlite.run(`SELECT * FROM blog WHERE link = "${req.params.number}"`);
      if (req_.length != 0) {
          if (req_[0].login_user == req.session.login) {
              sqlite.run(`DELETE FROM blog WHERE link = "${req.params.number}"`);
              res.redirect('/');
          } else {
              res.redirect('/');
          }
      } else {
          res.redirect('/');
      }
  }
});


app.get('/news/:number', (req, res) => {
    // check login
    if (typeof req.session.login === "undefined") {
        // if we don't have the login
        res.redirect('/login');
    } else {
      db.each("SELECT * FROM blog", (err, row) => {
        console.log(row.link, req.params.number);
        if (row.link == req.params.number) {
          if (row.login_user == req.session.login) {
            res.render('different_news', {element: row, what: 'Выйти', login_value: req.session.login, can_delete: 'true'});
          } else {
            res.render('different_news', {element: row, what: 'Выйти', login_value: req.session.login, can_delete: 'false'});
          }
        };
      });
    }
});


app.get('/add_new', (req, res) => {
    // check login
    if (typeof req.session.login === "undefined") {
        // if we don't have the login
        res.redirect('/login');
    } else {
        res.render('new_news', {what: 'Выйти', login_value: req.session.login});
    }
});


app.get('/login', (req, res) => {
    res.render('login', {error: '', what: 'Войти'});
});


app.post('/login', urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);

    let list_data = [];

    let req_ = sqlite.run("SELECT * FROM users");
    Array.from(req_).forEach(row => {
      if (row.login == req.body.login_value && row.password == req.body.password_value) {
        list_data.push(row);
      }
    });

    // check user in list_data
    if (list_data.length == 0) {
      console.log('Not find');
      res.render('login', {error: 'Not registered'});
    } else {
      console.log(list_data);
      req.session.login = list_data[0].login;
      req.session.password = list_data[0].password;
      res.redirect('/');
    }
});


app.get('/registration', (req, res) => {
    res.render('registration', {what: 'Войти'});
});


app.post('/registration', urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);

    let list_data = [];

    let req_ = sqlite.run("SELECT * FROM users");
    Array.from(req_).forEach(row => {
      if (row.login == req.body.login_value && row.password == req.body.password_value) {
        list_data.push(row);
      }
    });

    // check user in list_data
    if (list_data.length == 0) {
      sqlite.insert("users", {login: req.body.login_value, password: req.body.password_value}, (res) => { console.log(res); });
      // update session
      req.session.login = req.body.login_value;
      req.session.password = req.body.password_value;
      res.redirect('/');
    } else {
      req.session.login = req.body.login_value;
      req.session.password = req.body.password_value;
      res.redirect('/');
    }
});


app.get('/logout', (req, res) => {
    if (typeof req.session.login === "undefined") {
        // if we don't have the login
        res.redirect('/login');
    } else {
        delete req.session.login;
        delete req.session.password;
        res.redirect('/login');
    }
})


app.post('/add_new', urlencodedParser, (req, res) => {
    // check login
    if (typeof req.session.login === "undefined") {
        // if we don't have the login
        res.redirect('/login');
    } else {
      if (!req.body) return res.sendStatus(400);

      let req_ = sqlite.run("SELECT * FROM blog");
      console.log(req_);
      sqlite.insert("blog", {link: req_.length + 1, heading: req.body.Heading, text_value: req.body.Text, small_text: req.body.Small_Text, login_user: req.session.login}, (res) => { console.log(res); });

      console.log('Successfully added data to db');
      res.redirect('/');
    }
});


app.listen(5000);
