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

var _ = require('underscore');
var when = require('when');
var moment = require('moment');
var Db = require('@saio/db-component');
var Wsocket = require('@saio/wsocket-component');
var Config = require('./config.js');

var AppLogService = function(container, options) {
  var config = Config.build(options);
  this.db = container.use('db', Db, config.db);
  this.ws = container.use('ws', Wsocket, config.ws);
};

AppLogService.prototype.start = function() {
  return this.ws.register(
    'fr.saio.service.applog.log',
    this.log.bind(this),
    { invoke: 'roundrobin' })
  .tap(function() {
    console.log('applog service started');
  });
};

AppLogService.prototype.stop = function() {
  return this.ws.unregister()
  .tap(function() {
    console.log('applog service stopped');
  });
};

/**
 * kwargs.name: string, mandatory (event name)
 * kwargs.userId: string, user emitting the event
 * kwargs.<other event specific properties>: optional (finite number, boolean or string only)
 */
AppLogService.prototype.log = function(args, kwargs) {
  if (_.isUndefined(kwargs) || _.isNull(kwargs)) {
    throw new Error('invalid event');
  }
  var event = _.pick(kwargs, 'name', 'userId');
  event.properties = _.omit(kwargs, 'name', 'userId');
  event.timestamp = moment.utc().valueOf();
  return this.db.model.Log.create(event)
  .then(function() {
    // do not return a model instance to the caller
    return when.resolve();
  });
};

module.exports = AppLogService;
