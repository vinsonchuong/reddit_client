//= require jquery
//= require lodash
//= require jasmine-jquery
//= require sinon
(function() {
  'use strict';
  var exports = this,
      $ = exports.$,
      sinon = exports.sinon;

  $('#jasmine_content').addClass('application');

  var server = exports.server = sinon.fakeServer.create();
  server.respondTo = function(url, json) {
    _.last(_.where(exports.server.requests, {url: url})).respond(
      200, {'Content-Type': 'application/json'}, JSON.stringify(json));
  };
}).call(this);