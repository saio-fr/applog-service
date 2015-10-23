/*-------------------------------------------------*\
 |                                                 |
 |      /$$$$$$    /$$$$$$   /$$$$$$   /$$$$$$     |
 |     /$$__  $$  /$$__  $$ |_  $$_/  /$$__  $$    |
 |    | $$  \__/ | $$  \ $$   | $$   | $$  \ $$    |
 |    |  $$$$$$  | $$$$$$$$   | $$   | $$  | $$    |
 |     \____  $$ | $$__  $$   | $$   | $$  | $$    |
 |     /$$  \ $$ | $$  | $$   | $$   | $$  | $$    |
 |    |  $$$$$$/ | $$  | $$  /$$$$$$ |  $$$$$$/    |
 |     \______/  |__/  |__/ |______/  \______/     |
 |                                                 |
 |                                                 |
 |                                                 |
 |    *---------------------------------------*    |
 |    |   © 2015 SAIO - All Rights Reserved   |    |
 |    *---------------------------------------*    |
 |                                                 |
\*-------------------------------------------------*/

var when = require('when');
var _ = require('underscore');
var moment = require('moment');
var tape = require('blue-tape');
var WSocket = require('@saio/wsocket-component');
var Db = require('@saio/db-component');
var TestContainer = require('@saio/service-runner').Tester;
var config = require('./config.json');

var TestService = function(container) {
  this.ws = container.use('ws', WSocket, config.ws);
  this.db = container.use('db', Db, config.db);
};

// call applog-service to log the event, then run the query (if defined) and return the results
TestService.prototype.run = function(event, query) {
  var connector = this.db.sequelize;
  return this.ws.call('fr.saio.service.applog.log', [], event)
  .then(function() {
    if (_.isUndefined(query)) {
      return when.resolve();
    }
    return connector.query(query, { type: connector.QueryTypes.SELECT });
  });
};

tape('applog-service integration test', function(t) {
  var testServiceInstance;

  function test(event, query) {
    return testServiceInstance.service.run(event, query);
  }

  t.test('connect test environment', function() {
    testServiceInstance = new TestContainer(TestService);
    return testServiceInstance.start();
  });

  t.test('undefined event', function(st) {
    return test(undefined)
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('missing event.name', function(st) {
    return test({
      userId: 'johnDoe',
      license: 42
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('empty event.name', function(st) {
    return test({
      name: '',
      userId: 'johnDoe',
      license: 42
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('missing event.userId', function(st) {
    return test({
      name: 'connect',
      license: 42
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('empty event.userId', function(st) {
    return test({
      name: 'connect',
      userId: '',
      license: 42
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('invalid property (array)', function(st) {
    return test({
      name: 'connect',
      userId: 'johnDoe',
      prop: [4, 'pouet', 2, 'pouet', 42]
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('invalid property (object)', function(st) {
    return test({
      name: 'connect',
      userId: 'johnDoe',
      prop: { license: 42 }
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('invalid property (reserved key: timestamp)', function(st) {
    return test({
      name: 'connect',
      userId: 'johnDoe',
      timestamp: 42
    })
    .then(function() {
      var msg = 'test should have failed';
      st.fail(msg);
      return when.reject(new Error(msg));
    }, function() { return when.resolve(); });
  });

  t.test('valid event (undefined properties)', function(st) { // TODO check result
    return test({
      name: 'validEventNoProp',
      userId: 'johnDoe',
    }, 'select * from Logs where name = "validEventNoProp"')
    .then(function(rows) {
      st.equals(rows.length, 1);
      row = rows[0];
      st.equal(row.name, 'validEventNoProp');
      st.equal(row.userId, 'johnDoe');
      var now = moment.utc().valueOf();
      st.ok(row.timestamp < now);
      st.ok(row.timestamp > now - 10000);
      st.ok(_.isString(row.properties));
      st.equal(row.properties, '{}');
    });
  });

  t.test('valid event (properties of every allowed type)', function(st) {
    var props = {
      nullProp: null,
      boolProp: true,
      numberProp: 42,
      stringProp: '42'
    };

    var event = {
      name: 'validEventFull',
      userId: 'johnDoe',
    };

    _.extend(event, props);

    return test(event, 'select * from Logs where name = "validEventFull"')
    .then(function(rows) {
      st.equals(rows.length, 1);
      row = rows[0];
      st.equal(row.name, 'validEventFull');
      st.equal(row.userId, 'johnDoe');
      var now = moment.utc().valueOf();
      st.ok(row.timestamp < now);
      st.ok(row.timestamp > now - 10000);
      st.ok(_.isString(row.properties));
      st.deepEqual(JSON.parse(row.properties), props);
    });
  });

  t.test('disconnect test environment', function() {
    return testServiceInstance.stop();
  });
});
