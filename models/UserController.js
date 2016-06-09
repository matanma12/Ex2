var User = require('./User.js');
var Game = require('./Game.js');
var Sentence = require('./Sentence.js');


exports.index = function(req, res) {
  User.findOne({username:req.session.username}, function(err, user) {
    var errors = req.session.errors;
    var success = req.session.success;
    req.session.errors = {};
    req.session.success = {};
    if(req.session.username) {
      res.redirect('/games');
      }
      else {
      res.render('index', {errors:errors, success:success});
    }
  });
};

exports.signup = function(req, res) {
  //if(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(req.body.username)) {
  //        req.session.errors = {signup:['please enter a valid email']};
  //        res.redirect('/');
  //}
  if(req.body.password !== req.body.confirmPassword) {
    req.session.errors = {signup:['your passwords do not match']};
    res.redirect('/');
  }
  else {
    new User({username: req.body.username.replace(' ', ''),
      password: req.body.password}).save(function(err) {
      if(err) {
        if(err.code===11000) {
          req.session.errors = {signup:[req.body.username + ' already exists']};
        }
        console.log(err);
        res.redirect('/');
      }
      else {
        req.session.success = {signup:['account successfully created']};
        res.redirect('/');
      }
    });
  }
};

exports.signin = function(req, res) {
  User.findOne({username:req.body.username.replace(' ', '')}, function(err, user) {
    if(user) {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if(err) {
          console.log(err);
          res.redirect('/');
        }
        else if(isMatch) {
          req.session.username = user.username;
          res.redirect('/games');
        }
        else {
          req.session.errors = {signin:['incorrect username or password']};
          res.redirect('/');
        }
      });
    }
    else {
      req.session.errors = {signin:[req.body.username + ' doesn\'t exist']};
      res.redirect('/');
    }
  });
};

exports.signout = function(req, res) {
  req.session.username = undefined;
  res.redirect('/');
};

exports.addFriend = function(req, res) {
  var currUserName = req.session.username;
  var friendName = req.body.username.replace(' ', '');
  if(friendName === currUserName) {
    req.session.errors = {friends:['you can\'t be friends with yourself']};
    res.redirect('/newgame');
  }
  else {
    User.findOne({username:friendName}, function(err, friend) {
      if(err) console.log(err);
      else if(friend) {
        User.findOne({username:currUserName}, function(err, currUser) {
          if(err) console.log(err);
          else {
            if(currUser.friends.indexOf(friendName)===-1 && currUser.pendingFriends.indexOf(friendName)===-1) {
              currUser.friends.push(friendName);
              currUser.save();
              friend.pendingFriends.push(currUserName);
              friend.save();
              res.redirect('/newgame');
            }
            else if(currUser.pendingFriends.indexOf(friendName) !== -1) {
              var index = currUser.pendingFriends.indexOf(friendName);
              currUser.friends.push(friendName);
              currUser.pendingFriends.splice(index, 1);
              currUser.save();
              res.redirect('/newgame');
            }
            else {
              req.session.errors = {friends:['already friends with ' + friendName]};
              res.redirect('/newgame');
            }
          }
        });
      }
      else {
        req.session.errors = {friends:['there is no user named ' + friendName]};
        res.redirect('/newgame');
      }
    });
  }
};

