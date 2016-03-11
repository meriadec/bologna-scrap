'use strict';

// node modules
// ------------

var fs = require('fs');
var rimraf = require('rimraf');
var async = require('async');
var Nightmare = require('nightmare');
var util = require('util');
var _ = require('underscore');

// misc vars
// ---------

var $;
var baseUrl = 'http://www.bookfair.bolognafiere.it';

// core
// ----

async.waterfall([scrapLinks, scrapMails], finish);

// functions
// ---------

function scrapLinks (done) {

  console.log('> scrapping links... (be patient)');

  var links = [];

  new Nightmare()
    .viewport(1000,2000)
    .goto(baseUrl + '/en/directory/exhibitors-list-2016/911.html')
    .wait(1000)
    .click('input[name=btnAll]')
    .wait(1000)
    .evaluate(function () {
      var links = [];
      var current = {};

      $('div.inner > div > div > div a').each(function() {
        var content = $(this).html();
        var href = $(this).attr('href')
        if (href.indexOf('idanagrafica') !== -1) {
          current.name = content.replace(/\n\t\t\t\t\t\t\t\t\t/g, '').replace(/,/g,' ').trim();
          current.href = href;
        } else if (href.indexOf('nazione_url') !== -1) {
          current.country = content.replace(/\n\t\t\t\t\t\t\t\t\t/g, '').replace(/,/g,' ').trim();
          links.push(current);
          current = {};
        }
      });

      return links;
    })
    .run(function (err, links) {
      if (err) { return done(err); }
      console.log('> extracted ' + links.length + ' exhibitors !');
      done(null, links);
    });

}

function scrapMails (links, done) {

  console.log('> scrapping mails...');

  var total = links.length;
  var i = 0;

  async.eachSeries(links, function (link, done) {

    new Nightmare()
      .goto(baseUrl + '/' + link.href)
      .evaluate(function () {
        return $('div.inner > div > p > a').eq(1).html();
      })
      .end()
      .run(function (err,mail) {
        if (err) { return done(err); }
        link.mail = mail;
        console.log('> (' + (++i) + '/' + total + ') done ! extracted ' + link.mail);
        done();
      });
  }, function (err) {
    if (err) { return done(err); }
    console.log('> finished !');
    done(null, links);
  });
}

function finish (err, results) {
  if (err) { return console.log(err); }
  console.log('> writing file...');
  rimraf('dist', function () {
    fs.mkdirSync('dist');
    fs.writeFileSync('dist/full.json', JSON.stringify(results, null, '  '));
    fs.writeFileSync('dist/full.csv', '"name","country","mail"\n' + results.map(function (l) {
      return '"' + l.name + '","' + l.country + '","' + l.mail + '"';
    }).join('\n'));
    fs.writeFileSync('dist/mails.txt', results.filter(function (e) {
      return !!e.mail;
    }).map(function (r) { return r.mail; }).join('\n'));
    console.log('> done.');
  });
}

exports = module.exports;
