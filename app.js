var express = require('express')
  , users = require('./models/UserController.js')
  , games = require('./models/GameController.js')
  , http = require('http')
  , path = require('path');
var mongoose = require('mongoose');
var forever = require('forever-monitor');
var request = require('request');
var powerOff = require('power-off');

var app = express();

var uristring = 'mongodb://40.78.104.48/The-Sentence-Game';

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  secret:'4J6YlRpJhFvgNmg',
  cookie: {maxAge:2*365*24*60*60*1000},
  store: new (require('express-sessions'))({
    storage: 'mongodb',
    instance: mongoose,
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || 27017,
    db: process.env.MONGO_DATABASE || 'The-Sentence-Game',
    collection: 'sessions',
    expire: 2*365*24*60*60*1000
  })
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(uristring);

app.get('/', users.index);
app.post('/signup', users.signup);
app.post('/signin', users.signin);
app.get('/signout', users.signout);
app.post('/addfriend', users.addFriend);
app.get('/games', games.index);
app.get('/game/:id', games.showGame);
app.get('/newgame', games.createGameForm);
app.post('/newgame', games.createGame);
app.post('/game', games.addSentence);

app.get('/killserver', function (req,res){

  console.log("Received kill signal, shutting down.");
  server.close(function() {
    console.log("Close connections.");
    process.exit();
  });
  // if after
  setTimeout(function() {
    console.error("Could not close connection in time, forcefully shutting down");
    process.exit();
  }, 5*1000);
});

app.get('/kill', function (req, res) {
  powerOff(function (err, stderr, stdout) {
    if (err) {
      util.log(err);
      res.status(500).json({ error: 'Can\'t run power-off' })
    } else {
      res.end()
    }
  })
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

