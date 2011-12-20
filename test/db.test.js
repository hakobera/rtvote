var db = require('../lib/db'),
    should = require('should'),
    async = require('async');

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
        result.title.should.equal(topic.title);
        result.body.should.equal(topic.body);
        result.selections.should.eql(topic.selections);
        result.should.have.property('createdAt');

        done();
      });
    });
  });

  describe('.findTopic()', function() {
    it('should return a topic specified by topic id', function(done) {
      var topic = {
        title: 'Test topic',
        body: 'What kind of fruit do you like?',
        selections: [ 'apple', 'banana' ]
      };

      db.createTopic(topic, function(err, tp) {
        should.not.exist(err);
        tp.should.have.property('_id');
        
        var topicId = tp._id;
        db.findTopic(topicId, function(err, result) {
          result._id.should.eql(topicId);
          result.title.should.equal(topic.title);
          result.body.should.equal(topic.body);
          result.selections.should.eql(topic.selections);
          result.should.have.property('createdAt');
          
          done();
        });
      });
    });

    it('should throw error when entity specified by topic id is not found', function(done) {
      db.findTopic('aaaaa5e7b8990c0000000002', function(err, result) {
        should.exist(err);
        err.should.instanceof(db.EntityNotFoundError);
        err.message.should.equal('Topic not found for topic id = aaaaa5e7b8990c0000000002');

        done();
      });
    });

    it('should throw error when topic id format is invalid', function(done) {
      db.findTopic('invalid', function(err, result) {
        should.exist(err);
        err.message.should.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters in hex format');

        done();
      });
    });
  });

  describe('.makeVote()', function() {
    it('should create vote and return it', function(done) {
      var topic = {
        title: 'Test topic',
        body: 'What kind of fruit do you like?',
        selections: [ 'apple', 'banana' ]
      };

      db.createTopic(topic, function(e, tp) {
        should.not.exist(e);
        tp.should.have.property('_id');

        var selection = topic.selections[1];
        db.makeVote(tp._id, selection, function(err, result) {
          should.not.exist(err);
          result.should.have.property('_id');
          result.topicId.should.equal(tp._id);
          result.selection.should.equal(selection);
          result.should.have.property('createdAt');

          done();
        });
      });
    });

    it('should throw error when vote target topic specified by topic id is not found', function(done) {
      db.makeVote('aaaaa5e7b8990c0000000002', 'value', function(err, result) {
        should.exist(err);
        err.should.instanceof(db.EntityNotFoundError);
        err.message.should.equal('Topic not found for topic id = aaaaa5e7b8990c0000000002');

        done();
      });
    });
  });

  describe('.getSummary()', function() {
    it('should return count of each selection', function(done) {
      var s1 = 'apple';
      var s2 = 'banana';

      async.waterfall([
        function(callback) {
          var topic = {
            title: 'Test topic',
            body: 'What kind of fruit do you like?',
            selections: [ s1, s2 ]
          };

          db.createTopic(topic, function(err, tp) {
            callback(err, tp);
          });
        },
        function(topic, callback) {
          db.makeVote(topic._id, s1, function(err, vote) {
            callback(err, topic);
          });
        },
        function(topic, callback) {
          db.getSummary(topic._id, function(err, summary) {
            should.not.exist(err);
            summary[s1].should.equal(1);

            callback(err, topic);
          });
        },
        function(topic, callback) {
          db.makeVote(topic._id, s2, function(err, vote) {
            callback(err, topic);
          });
        },
        function(topic, callback) {
          db.getSummary(topic._id, function(err, summary) {
            should.not.exist(err);
            summary[s2].should.equal(1);

            callback(err, topic);
          });
        },
        function(topic, callback) {
          db.makeVote(topic._id, s2, function(err, vote) {
            callback(err, topic);
          });
        },
        function(topic, callback) {
          db.getSummary(topic._id, function(err, summary) {
            should.not.exist(err);
            summary[s1].should.equal(1);
            summary[s2].should.equal(2);

            callback(err, topic);
          });
        }
      ],
      function(err) {
        done();
      });
    });
  });
});
