var db = require('../lib/db'),
    should = require('should');

var TEST_DB = 'localhost/rtvote-test';

describe('db', function() {

  before(function(done) {
    db.connect(TEST_DB, function(err) {
      if (err) {
        throw new Error('Error in db.connect(' + TEST_DB + ')');
      }
      done();
    });
  });

  after(function(done) {
    db.close(function(err) {
      if (err) {
        throw new Error('Error in db.close()');
      }
      done();
    });
  });

  describe('.createTopic()', function() {
    it('should create a topic', function(done) {
      var topic = {
        title: 'Test topic',
        body: 'What kind of fruit do you like?',
        selections: [ 'apple', 'banana' ]
      };

      db.createTopic(topic, function(err, result) {
        should.not.exist(err);
        result.should.have.property('_id');
        result.should.have.property('title', topic.title);
        result.should.have.property('body', topic.body);
        result.should.have.property('selections', topic.selections);

        done();
      });
    });
  });

});
