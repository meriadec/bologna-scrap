'use strict';

// node modules
// ------------

var fs = require('fs');
var rimraf = require('rimraf');
var async = require('async');
var Nightmare = require('nightmare');

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
    .headers({
      'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4'
    })
    .goto(baseUrl + '/nqcontent.cfm?a_id=911')
    .click('#lang > a:nth-child(2)')
    .wait(1000)
    .click('input[name=btnAll]')
    .wait(1000)
    .evaluate(function () {
      var links = [];
      var current = {};
      $('#wide > a').each(function (id, link) {
        link = $(link);
        var href = link.attr('href');
        var content = link.html();
        if (href.indexOf('idanagrafica') !== -1) {
          current.name = content.trim().replace(/\n/g, ' ').replace(/"/g, '');
          current.href = href;
        } else if (href.indexOf('nazione_url') !== -1) {
          current.country = content;
          links.push(current);
          current = {};
        }
      });
      return links;
    }, function (res) {
      links = res;
    })
    .run(function (err) {
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
      .headers({ 'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4' })
      .goto(baseUrl + '/' + link.href)
      .evaluate(function () {
        return $('#wide > a').first().html();
      }, function (mail) {
        link.mail = mail;
      })
      .run(function (err) {
        if (err) { return done(err); }
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
