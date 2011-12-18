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
  res.render('index', { title: 'Express' });
};

/**
 * POST Create topic
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
