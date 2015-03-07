var fs = require('fs');
var async = require('async');
var Nightmare = require('nightmare');
var $;

async.waterfall([scrapLinks, scrapMails], finish);

function scrapLinks (done) {

  console.log('> scrapping links... (be patient)');

  var links = [];

  new Nightmare()
    .headers({
      'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4'
    })
    .goto('http://www.bookfair.bolognafiere.it/nqcontent.cfm?a_id=911')
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
          current.name = content;
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

  console.log('> scrapping mails');

  console.log(links.length);
  done();
}

function finish (err) {
  if (err) { return console.log(err); }
  console.log('scrapping terminé.');
}

exports = module.exports;
