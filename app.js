
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    io = require('./lib/io');

var app = module.exports = express.createServer();
io.listen(app);

process.on('uncaughtException', function(e) {
  console.error(e.message);
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.post('/topics', routes.createTopic);
app.get('/topics/:topicId', routes.findTopic);

app.get('/votes/:topicId', routes.showTopic);
app.post('/votes/:topicId', routes.makeVote);


app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);