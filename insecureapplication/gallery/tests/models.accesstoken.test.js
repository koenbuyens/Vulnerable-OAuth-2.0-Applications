var sinon = require('sinon')
var chai = require('chai');
var expect = chai.expect;
var config = require('../config/config.json')


var mongoose = require('mongoose');
require('sinon-mongoose');

var accesstoken = require('../models/accesstoken');

describe('an accesstoken', function(){
  it('should be invalid without ClientID', function(done) {
    var a = new accesstoken();
    a.validate(function(err){
      expect(err.errors.clientID).to.exist;
      done();
    });
  });

  it('should be invalid without user', function(done) {
    var a = new accesstoken();
    a.validate(function(err){
      expect(err.errors.user).to.exist;
      done();
    });
  });

  it('should be invalid without token', function(done) {
    var a = new accesstoken();
    a.validate(function(err){
      expect(err.errors.token).to.exist;
      done();
    });
  });

  it('should have a default expiry time when created', function(done) {
    var aMock = sinon.mock(new accesstoken()); //no expiry time, all other fields mocked
    var a = aMock.object;
    var expectedResult = {expires_in:config.token.access.expires_in};
    aMock.expects('save').yields(null, expectedResult);
    a.save(function(err, result) {
      aMock.verify();
      aMock.restore();
      expect(result.expires_in).to.equal(config.token.access.expires_in);
      done();
    });
  });

  it('should have a creation date', function(done) {
    var aMock = sinon.mock(new accesstoken()); //no expiry time, all other fields mocked
    var a = aMock.object;
    var expectedResult = {created_at:new Date()};
    aMock.expects('save').yields(null, expectedResult);
    a.save(function(err, result) {
      aMock.verify();
      aMock.restore();
      expect(result.created_at).to.equal(expectedResult.created_at);
      done();
    });
  });

  it('should expire', function(done) {
    var aMock = sinon.mock(new accesstoken()); //no expiry time, all other fields mocked
    var a = aMock.object;
    var currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth()-3);

    var expectedResult = {created_at:currentDate, expires_in:3600};
    aMock.expects('isExpired').yields(null, true);
    a.isExpired(function(err, result) {
      aMock.verify();
      aMock.restore();
      expect(result).to.equal(true);
      done();
    });
  });

});
