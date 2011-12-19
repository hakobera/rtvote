var db = require('../lib/db');

var MONGO_URL = process.env.MONGOHQ_URL || 'localhost/rtvote';
if (process.env.NODE_ENV === 'test') {
  MONGO_URL = 'localhost/rtvote-test';
}
db.connect(process.env.MONGOHQ_URL || 'localhost/rtvote', function(err) {
  if (err) {
    throw err;
  }
});

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Create Topic' });
};

/**
 * POST create topic
 */
exports.createTopic = function(req, res) {
  var topic = req.body;
  if (!topic.title || !topic.body || !topic.selections) {
    res.json({}, 400);
  } else {
    db.createTopic(topic, function(err, result) {
      if (err) {
        res.json(err, 500);
      } else {
        res.json(result);
      }
    });
  }
};

/**
 * GET find topic by topicId
 */
exports.findTopic = function(req, res) {
  var topicId = req.param('topicId');
  if (!topicId) {
    res.json({}, 404);
  } else {
    db.findTopic(topicId, function(err, result) {
      if (err) {
        if (err instanceof db.EntityNotFoundError) {
          res.json(err.message, 404);
        } else {
          res.json(err, 500);
        }
      } else {
        res.json(result);
      }
    });
  }
};

/**
 * GET show topic
 */
exports.showTopic = function(req, res, next) {
  var topicId = req.param('topicId');
  db.findTopic(topicId, function(err, result) {
    if (err) {
      if (err instanceof db.EntityNotFoundError) {
        res.json(err.message, 404);
      } else {
        res.json(err, 500);
      }
    } else {
      res.render('vote.ejs', { title: result.title, topic: result });
    }
  });
};

/**
 * POST make a vote
 */
exports.makeVote = function(req, res, next) {
  var topicId = req.param('topicId'),
      selection = req.param('selection');

  db.makeVote(topicId, selection, function(err, result) {
    if (err) {
      if (err instanceof db.EntityNotFoundError) {
        res.json(err.message, 404);
      } else {
        res.json(err, 500);
      }
    } else {
      res.json(result);
    }
  });
};
