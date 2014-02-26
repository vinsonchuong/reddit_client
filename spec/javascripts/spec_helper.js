//= require jquery
//= require jasmine-jquery
//= require sinon
(function() {
  'use strict';
  var exports = this,
      $ = exports.$,
      sinon = exports.sinon;

  $('#jasmine_content').addClass('app');

  exports.server = sinon.fakeServer.create();
  exports.server.respondTo = function(url, json) {
    _.last(_.where(exports.server.requests, {url: url})).respond(
      200, {'Content-Type': 'application/json'}, JSON.stringify(json));
  }
}).call(this);
