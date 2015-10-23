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
var moment = require('moment');
var jsesc = require('jsesc');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Log', {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    timestamp: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },

    properties: {
      type: DataTypes.JSON,

      get: function() {
        try {
          return JSON.parse(this.getDataValue('properties'));
        } catch (err) {
          throw new Error('invalid event properties in database');
        }
      },

      set: function(newProperties) {
        if (_.isNull(newProperties) || _.isUndefined(newProperties)) {
          newProperties = {};
        }
        if (!_.isObject(newProperties) || _.isArray(newProperties)) {
          throw new Error('invalid event properties');
        }

        _.each(newProperties, function(value, key) {
          var isValidType = _.isNull(value) || _.isString(value) || _.isBoolean(value) ||
            (_.isNumber(value) && _.isFinite(value));
          var isReserved = key === 'timestamp';
          if (!isValidType || isReserved) {
            throw new Error('invalid event property ' + key + ': ' + value);
          }
        });

        try {
          // only used to test if it's a valid json, jsesc will escape keys & values and stringify
          JSON.stringify(newProperties);
        } catch (err) {
          throw new Error('invalid event properties');
        }
        var strProps = jsesc(newProperties, { json: true });
        this.setDataValue('properties', strProps);
      }
    }
  }, { timestamps: false });
};
