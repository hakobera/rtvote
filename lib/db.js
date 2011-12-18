var mongo = require('mongoskin')
  , util = require('util');

/**
 * Connection to mongodb
 */
var db = null;

/**
 * Topic collection name
 */
var COLLECTION_TOPIC = 'topics';

/**
 * Entity not found error
 */
function EntityNotFoundError(message) {
  Error.call(this)
  this.message = message;
  Error.captureStackTrace(this, this.constructor);
}
util.inherits(EntityNotFoundError, Error);
exports.EntityNotFoundError = EntityNotFoundError;

/**
 * Set MongoDB URL.
 *
 * @param {String} url MongoDB URL to connect
 * @param {Function} callback Called when connected or failed.
 */
exports.connect = function(url, callback) {
  try {
    db = mongo.db(url);
    callback();
  } catch (e) {
    callback(e);
  }
};

/**
 * Close connection to MongoDB if available.
 *
 * @param {Function} callback Called when connection closed or failed.
 */
exports.close = function(callback) {
  if (db) {
    db.close(function(err) {
      if (err) {
        callback(err);
      } else {
        db = null;
        callback();
      }
    });
  } else {
    callback();
  }
};

/**
 * Create topic and save it to database.
 *
 * @param {Object} topic Topic data to create
 * @param {Function} callback Call when topic created or failed
 */
exports.createTopic = function(topic, callback) {
  topic.createdAt = new Date();
  db.collection(COLLECTION_TOPIC).insert(topic, function(err, docs) {
    if (err) {
      callback(err);
    } else {
      callback(null, docs[0]);
    }
  });
};

/**
 * Find topic by topicId.
 *
 * @param {String} topicId Topic ID to find
 * @param {Function} callback Call when topic found or failed
 */
exports.findTopic = function(topicId, callback) {
  try {
    db.collection(COLLECTION_TOPIC).findById(topicId, function(err, topic) {
      if (err) {
        callback(err);
      } else {
        if (!topic) {
          callback(new EntityNotFoundError('Topic not found for topic id = ' + topicId));
        } else {
          callback(null, topic);
        }
      }
    });
  } catch (e) {
    callback(e);
  }
};

