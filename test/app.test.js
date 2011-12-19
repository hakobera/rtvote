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
        json: {}
      }, function(err, res, body) {
        should.not.exist(err);
        res.statusCode.should.equal(400);

        done();
      });
    });
  });

  describe('GET /topics/:topicId', function() {
    it('should return topic specified by topicId', function(done) {
      var topic = {
        title: 'title',
        body: 'body',
        selections: [ 'opt1', 'opt2' ]
      };
      
      request.post({
        url: testUrl('/topics'),
        json: topic
      }, function(e, r, b) {
        should.not.exist(e);
        b.should.have.property('_id');

        var topicId = b._id;
        request.get({
          url: testUrl('/topics/' + topicId)
        }, function(err, res, body) {
          should.not.exist(err);
          res.statusCode.should.equal(200);
          res.header('content-type').should.equal('application/json; charset=utf-8');

          var result = JSON.parse(body);
          result.title.should.equal(topic.title);
          result.body.should.equal(topic.body);
          result.selections.should.eql(topic.selections);

          done();
        });
      });
    });

    it('should return 404 when topic specified by topicId is not found', function(done) {
      request.get({
        url: testUrl('/topics/aaaaceee2da6f9e837000001')
      }, function(err, res, body) {
        should.not.exist(err);
        res.statusCode.should.equal(404);

        done();
      });
    });
  });

  describe('POST /votes/:topicId', function() {
    it('should make a vote and return it', function(done) {
      var topic = {
        title: 'title',
        body: 'body',
        selections: [ 'opt1', 'opt2' ]
      };

      request.post({
        url: testUrl('/topics'),
        json: topic
      }, function(e, r, b) {
        should.not.exist(e);
        b.should.have.property('_id');

        request.post({
          url: testUrl('/votes/' + b._id),
          json: { selection: topic.selections[0] }
        }, function(err, res, body) {
          should.not.exist(err);
          body.should.have.property('_id');
          body.selection.should.equal(topic.selections[0]);
          body.should.have.property('createdAt');

          done();
        });
      });
    });

    it('should return 404 when vote target topic specified by topicId is not found', function(done) {
      request.get({
        url: testUrl('/votes/aaaaceee2da6f9e837000001')
      }, function(err, res, body) {
        should.not.exist(err);
        res.statusCode.should.equal(404);

        done();
      });
    });
  });
});

