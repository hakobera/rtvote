var mongo = require('mongoskin');

/**
 * Connection to mongodb
 */
var db = null;

/**
 * Topic collection name
 */
var COLLECTION_TOPIC = 'topics';

/**
 * Set MongoDB URL.
 *
 * @param {String} url MongoDB URL to connect
 * @param {Function} fn Called when connected or failed.
 */
exports.connect = function(url, fn) {
  try {
    db = mongo.db(url);
    fn();
  } catch (e) {
    fn(e);
  }
};

/**
 * Close connection to MongoDB if available.
 *
 * @param {Function} fn Called when connection closed or failed.
 */
exports.close = function(fn) {
  if (db) {
    db.close(function(err) {
      if (err) {
        fn(err);
      } else {
        db = null;
        fn();
      }
    });
  } else {
    fn();
  }
};

/**
 * Create topic and save it to database.
 *
 * @param {Object} topic Topic data to create
 * @param {Function} fn Call when topic created or failed
 */
exports.createTopic = function(topic, fn) {
  topic.createdAt = new Date();
  db.collection(COLLECTION_TOPIC).insert(topic, function(err, docs) {
    if (err) {
      fn(err);
    } else {
      fn(null, docs[0]);
    }
  });
};

/**
 * Find topic by topicId.
 *
 * @param {String} topicId Topic ID to find
 * @param {Function} fn Call when topic found or failed
 */
exports.findTopic = function(topicId, fn) {
  try {
    db.collection(COLLECTION_TOPIC).findById(topicId, function(err, topic) {
      if (err) {
        fn(err);
      } else {
        if (!topic) {
          fn(new Error('Topic not found for topic id = ' + topicId));
        } else {
          fn(null, topic);
        }
      }
    });
  } catch (e) {
    fn(e);
  }
};

