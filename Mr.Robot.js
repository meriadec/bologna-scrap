  'use strict';

// node modules
// ------------

var fs = require('fs');
var rimraf = require('rimraf'); // Pour créer des dossiers ?
var async = require('async'); // Facilite l'asynchronisme
var Nightmare = require('nightmare');
var util = require('util'); // Bibliothèque
var _ = require('underscore'); // Bibliothèque


// misc vars
var all_links = [];
var nb_page = 0;
var max_searchpage = 518; // nbr max de page
var $;
var baseUrl = 'http://www.fabert.com'; // URL de base

// core
// ----

async.waterfall([scrapLinks, scrapInfos], finish); // Appelles Asynchrones

// functions
// ---------

function scrapLinks (done) { // Récupère les liens

  var urls = [];
  var c = 0, page;

  console.log('> Create searchpage urls...');

// boucle de liens de search page
  while(c < 3) {
      page = c + 1;
      urls[c] = '/etablissement-prive/?m=4&p=' + page.toString(10);
      console.log(urls[c]);
      c++;
  }

  console.log('> scrapping links... (be patient)');
  async.eachSeries(urls, scrapLinksProcess, function(err) { // Récupére tous les liens de toutes les pages de la recherche
    if (err) return done(err);

    console.log('> extracted ' + all_links.length + ' links !');
    done(null, all_links);
  }); // async.eachSeries END

} // scrapLinks END


function scrapLinksProcess(url, done) {

  console.log("In scrapLinksProcess : " + baseUrl + url);

  new Nightmare() // Construit un objet nightmare
    .viewport(1000,2000)
    .goto(baseUrl + url) // Aller à l'url indiqué
    .wait(500)
    .evaluate(function() {  // Fonction de récupération des urls

      var links = [];
      var current = {};
      $('div.search-result.clearfix > div a').each(function() {
        var content = $(this).html(); // récupère le bout de la page html préciser au-dessus par $('div.blabla > div a...')
        var href = $(this).attr('href'); // récupère l'attribut "href" du bout de code html
        if (content.indexOf('img') == -1) { // test pour récupérer le bon lien
          current.name = content;
          current.href = href;
          links.push(current);
          current = {};
        }
      });
        return links;
     }) // evaluate END
    .end()
    .run(function (err, links) { // Exécuter après l'éxécution de evaluate
      var i = 0;

      if (err) {
          console.error("An error occured in the obtention of urls");
          return done(err);
        }
      nb_page = nb_page + 1;
      while (i < links.length) { // boucle de copie de links dans all_links a supprimer si trop long
        all_links.push(links[i]);
        i++;
      }
      console.log('> extracted links in progress ... Already ' + nb_page + ' page(s) checked on ' + max_searchpage + ' !');
      done(null, links);
    }); // run END
} // scrapUrls END

function scrapInfos (links, done) {

  console.log('> scrapping infos...');

  var total = links.length;
  var i = 0;

  async.eachSeries(links, function (link, done) {

    var current_url = baseUrl + link.href;

    new Nightmare()
      .goto(current_url)
      .wait(500)
      .evaluate(function () {

        var notf = 'Not found'
        var infos = {
          mail:notf, tel:notf, adrs:notf, mail2:notf, tel2:notf, adrs2:notf
        };
        var i = 1, test = 0;
        var content = $('tr').eq(1).text();

        while (content) { // tant qu'il y a du contenu à parcourir
          content = $('tr').eq(i).text(); // Récupère le texte de la balise tr récupéré
          content = content.replace(/[\n\t]/g, ''); // Enlève les \n et \t du content
          if (content) {
            if (content.indexOf('Mail:') != -1) {
              infos.mail = content.replace('Mail:', '');
            }
            else if (content.indexOf('Mail 2') != -1) {
              infos.mail2 = content.replace('Mail 2:', '');
            }
            else if (content.indexOf('Téléphone') != -1) {
              if (test == 0) {
                infos.tel = content.replace('Téléphone :', '');
                test++;
              }
              else {
                infos.tel2 = content.replace('Téléphone:', ''); // Test si un deuxième téléphone est indiqué
              }
            }
            else if (content.indexOf('Adresse') != -1) {
              infos.adrs = content.replace('Adresse :', '');
            }
            else if (content.indexOf('Autre adresse') != -1) {
              infos.adrs2 = content.replace('Autre adresse:', '');
            }
          }
          i++;
        }
        return infos;
      })
      .end()
      .run(function (err, infos) {
        if (err) {
          console.error("Error in scrapInfos");
          return done(err);
        }
        link.mail = infos.mail;
        link.mail2 = infos.mail2;
        link.tel = infos.tel;
        link.tel2 = infos.tel2;
        link.adrs = infos.adrs;
        link.adrs2 = infos.adrs2;
        console.log('> (' + (++i) + '/' + total + ') done ! extracted ' + JSON.stringify(link, null, '  '));
        if ((i % 500) == 0) {
          finish(err, links);
        }
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
  rimraf('Faber-scrap', function () {
    fs.mkdir('Faber-scrap', function(err) {
      if (err) {
        if (err.code == 'EEXIST') return null; // Force la création d'un nouveau dossier si il existe déjà
        else return err;
      } else return null;
    });
    fs.writeFileSync('Faber-scrap/Faber-schools.json', JSON.stringify(results, null, '  '));
    fs.writeFileSync('Faber-scrap/Faber-schools.csv', '"name","mail","mail2","tel","tel2","adrs","adrs2"\n' + results.map(function (l) {
      return '"' + l.name + '","' + l.mail + '","' + l.mail2 + '","' + l.tel + '","' + l.tel2 + '","' + l.adrs + '","' + l.adrs2 + '"';
    }).join('\n'));
    console.log('> done.');
  });
}

exports = module.exports;
