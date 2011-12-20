var sio = require('socket.io'),
    util = require('util');

/**
 * io module
 */
var io = null;

/**
 * Namespaces
 */
var namespaces = {};

/**
 * Listen app and create Socket.IO server.
 *
 * @param {Object} app Express application
 */
exports.listen = function(app) {
  if (!io) {
    io = sio.listen(app);

    io.configure('production', function() {
      io.enable('browser client minification');
      io.enable('browser client etag');
      io.enable('browser client gzip');
      io.set('log level', 1);
      // Heroku is not support WebSocket
      io.set('transports', [ 'xhr-polling' ]);
    });

    io.configure('development', function() {
      io.set('transports', ['websocket']);
    });
  }
};

/**
 * Get namespace for specified topic.
 * If namespace is not found, create new one and return it.
 *
 * @param {String} topicId Topic ID to create namespace
 * @return {Object} Socket.IO server for specified namespace.
 */
exports.namespace = function(topicId) {
  if (namespaces[topicId]) {
    return namespaces[topicId];
  } else {
    var namespace =
      io.of('/' + topicId)
        .on('connection', function(socket) {
          console.log('connected on ' + topicId);
          socket.on('error', function(e) {
            console.error(util.inspect(e, true));
          });
        });
    namespaces[topicId] = namespace;
    return namespace;
  }
};