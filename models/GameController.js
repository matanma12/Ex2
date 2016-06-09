var Game = require('./Game.js');
var Sentence = require('./Sentence.js');
var User = require('./User.js');
//var nodemailer = require('nodemailer');
//var smtpTransport = require('nodemailer-smtp-transport');
//var transporter = nodemailer.createTransport(smtpTransport({
//  host: 'localhost',
//  port: 25,
//  auth: {
//    user: 'mtn7896@gmail.com',
//    pass: 'Maman12!'
//  }
//}));
//
//// send mail
//transporter.sendMail({
//  from: 'mtn7896@gmail.com',
//  to: 'matan.maman@mail.huji.ac.il',
//  subject: 'hello world!',
//  text: 'Authenticated with OAuth2'
//}, function(error, response) {
//  if (error) {
//    console.log(error);
//  } else {
//    console.log('Message sent');
//  }
//});


exports.index = function(req, res) {
  User.findOne({username:req.session.username}, function(err, user) {
    var games = [];
    var errors = req.session.errors;
    req.session.errors = {};
    if(req.session.username) {
      if(user.games.length) {
        for(var i=0; i<user.games.length; i++) {
          Game.findById(user.games[i], function(err, game) {
            var turnsLeft = game.players.length*game.turnsPer - game.turnsElapsed;
            var gameData = {
              id:game.id,
              currentPlayer:game.players[game.currentPlayer],
              players:game.players,
              turnsLeft:turnsLeft,
              finished:game.finished
            };
            if(game.finished) {
              Sentence.find({game:game.id})
              .sort({created_at:'asc'})
              .exec(function(err, sentences) {
                var content = '';
                sentences.forEach(function(sentence) {
                  content += sentence.content + ' ';
                });
                gameData.content = content;
                games.push(gameData);
                if(games.length === user.games.length) {
                  res.render('gamelist', {user:user, games:games, errors:errors});
                }
              });
            }
            else {
              Sentence.find({game:game.id})
              .sort({created_at:'desc'})
              .limit(1)
              .exec(function(err, sentence) {
                gameData.sentence = sentence[0] ? sentence[0].content : null;
                games.push(gameData);
                if(games.length === user.games.length) {
                  res.render('gamelist', {user:user, games:games, errors:errors});
                }
              });
            }
          });
        }
      }
      else {
        res.render('gamelist', {user:user, games:[], errors:errors})
      }
    }
    else {
      res.redirect('/');
    }
  });
};

exports.showGame = function(req, res) {
  var errors = req.session.errors;
  req.session.errors = {};
  Game.findById(req.params.id, function(err, game) {
    if(game) {
      var turnsLeft = game.players.length*game.turnsPer - game.turnsElapsed;
      var gameData = {
        id:game.id,
        currentPlayer:game.players[game.currentPlayer],
        players:game.players,
        turnsLeft:turnsLeft,
        finished:game.finished
      };
      if(game.finished) {
        Sentence.find({game:game.id})
        .sort({created_at:'asc'})
        .exec(function(err, sentences) {
          var content = '';
          sentences.forEach(function(sentence) {
            content += sentence.content + ' ';
          });

          gameData.content = content;
          res.render('game', {user:req.session.username, game:gameData, errors:errors});
        });
      }
      else {
        if(!req.session.username || req.session.username!==gameData.currentPlayer) {
          res.redirect('/games');
        }
        Sentence.find({game:game.id})
        .sort({created_at:'desc'})
        .limit(1)
        .exec(function(err, sentence) {
          gameData.sentence = sentence[0] ? sentence[0].content : null;
          res.render('game', {user:{username:req.session.username}, game:gameData, errors:errors});
        });
      }
    }
    else {
      res.redirect('/');
    }
  });
};

exports.createGameForm = function(req, res) {
  var errors = req.session.errors;
  req.session.errors = {};
  User.findOne({username:req.session.username}, function(err, user) {
    if(err || !user) {
      res.redirect('/');
    }
    else {
      res.render('newgame', {errors:errors, user:user})
    }
  });
};

exports.createGame = function(req, res) {
  var players = [];
  var friends = req.body.friends;
  if(friends) {
    if(typeof friends === 'object') players = friends;
    else players = [friends];
    players.unshift(req.session.username);
    var turnsPer = ~~req.body.turnsPer;
    if(turnsPer >= 1) {
      new Game({players:players, turnsPer:turnsPer}).save(function(err, game) {
        if(err) {
          res.redirect('/games');
        }
        else {
          players.forEach(function(player) {
            User.findOne({username:player}, function(err, user) {
              if(user.username !== req.session.username) {
                if(user.username) {
                  //var mailOptions = {
                  //  from: 'Matan Maman <mtn7896@gmail.com>', // sender address
                  //  to: user.username, // list of receivers
                  //  subject: 'You\'ve been added to a game!', // Subject line
                  //  text: 'Hey, ' + user.username + '! You have just been added to a new game by ' + req.session.username + '.'
                  //};
                  //
                  //smtpTransport.sendMail(mailOptions, function(error, response) {
                  //  if(error) {
                  //    console.log(error);
                  //  }
                  //  else {
                  //    console.log('message sent: ' + response.message);
                  //  }
                  //});
                  //var transporter = nodemailer.createTransport('smtps://mtn7896@gmail.com:Maman12!@smtp.gmail.com');
                  //var mailOptions = {
                  //  transport: transporter,
                  //  from: '"Maman Maman" <mtn7896@gmail>', // sender address
                  //  to: user.username, // list of receivers
                  //  subject: 'You\'ve been added to a game!', // Subject line
                  //  text:  'Hey, ' + user.username + '! You have just been added to a new game by ' + req.session.username + '.', // plaintext body
                  //  //html: 'http://127.0.0.1:3000/file/'+file._id // html body
                  //  html: 'http://52.160.107.169:3000' + ' Click to play!' // html body
                  //
                  //};
                  //transporter.sendMail(mailOptions, function(error, info) {
                  //  if (error) {
                  //    return console.log(error);
                  //  }
                  //  console.log('Message sent: ' + info.response);
                  //});
                  res.redirect('/game/'+game.id);
                  //return res.status(200).send({
                  //  message: 'Success'
                  //});
                }
              }
              user.games.push(game.id);
              user.save();
            });
          });

          res.redirect('/game/'+game.id);
        }
      });
    }
    else {
      req.session.errors = {newgame:['turns per player must be a number that is one or greater']};
      res.redirect('/newgame');
    }
  }
  else {
    req.session.errors = {newgame:['you must add at least one other player']};
    res.redirect('/newgame');
  }
};

exports.addSentence = function(req,res) {
  Game.findById(req.body.gameId, function(err, game) {
    if(err) console.log(err);
    else {
      var currentPlayerName = game.players[game.currentPlayer];
      if(currentPlayerName===req.session.username) {
        new Sentence({
            game:game.id,
            player:currentPlayerName,
            content:req.body.sentence
          }).save(function(err) {
          if(err) {
            console.log(err);
            res.redirect('/game/'+game.id);
          }
          else {
            game.currentPlayer++;
            if(game.currentPlayer>=game.players.length) game.currentPlayer = 0;
            game.turnsElapsed++;
            game.save();

            var nextPlayerName = game.players[game.currentPlayer];
            User.findOne({username:nextPlayerName}, function(err, user) {
              if(user.username) {
                //var mailOptions = {
                //  from: 'Matan Maman <mtn7896@gmail.com>', // sender address
                //  to: user.username, // list of receivers
                //  subject: 'It\'s your turn!', // Subject line
                //  text: 'Hey, ' + nextPlayerName + '! ' + currentPlayerName + ' just submitted a sentence for a story you\'re participating in, and now it\'s your turn. http://stories.mobyvb.com/game/'+game._id
                //};
                //
                //smtpTransport.sendMail(mailOptions, function(error, response) {
                //  if(error) {
                //    console.log(error);
                //  }
                //  else {
                //    console.log('message sent: ' + response.message);
                //  }
                //});
                //var transporter = nodemailer.createTransport('smtps://mtn7896@gmail.com:Maman12!@smtp.gmail.com');
                //var mailOptions = {
                //  transport: transporter,
                //  from: '"Maman Maman" <mtn7896@gmail>', // sender address
                //  to: user.username, // list of receivers
                //  subject: 'It\'s your turn!', // Subject line
                //  text: 'Hey, ' + nextPlayerName + '! ' + currentPlayerName + ' just submitted a sentence for a story you\'re participating in, and now it\'s your turn.',
                //  http:'http://52.160.107.169:3000/game/'+game.id
                //};
                //
                //transporter.sendMail(mailOptions, function(error, info) {
                //  if (error) {
                //    return console.log(error);
                //  }
                //  console.log('Message sent: ' + info.response);
                //});
                //res.redirect('/games');
                //return res.status(200).send({
                //  message: 'Success'
                //});
              }
            });
            res.redirect('/games');
          }
        });
      }
      else console.log('not your turn');
    }
  });
};
