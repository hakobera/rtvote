var app = require('../app.js');

var should = require('should'),
    request = require('request'),
    util = require('util');

function testUrl(path) {
  if (path.substr(0, 1) !== '/') {
    path = '/' + path;
  }
  return util.format('http://localhost:%d%s', app.address().port, path);
}

describe('app', function() {
  describe('POST /topics', function() {
    it('should create topic and return it as JSON', function(done) {
      var topic = {
        title: 'title',
        body: 'body',
        selections: [ 'opt1', 'opt2' ]
      };
      
      request.post({
        url: testUrl('/topics'),
        json: topic
      }, function(err, res, body) {
        should.not.exist(err);
        res.statusCode.should.equal(200);
        res.header('content-type').should.equal('application/json; charset=utf-8');
        body.should.have.property('_id');
        body.title.should.equal(topic.title);
        body.body.should.equal(topic.body);
        body.selections.should.eql(topic.selections);

        done();
      });
    });

    it('should not accept when no body is supplied', function(done) {
      request.post({
        url: testUrl('/topics'),
        json: {},
        onRequest: function(err, ress) {
          console.log(ress);
        }
      }, function(err, res, body) {
        should.not.exist(err);
        res.statusCode.should.equal(400);

        done();
      });
    });
  });
});

