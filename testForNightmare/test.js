/**
 * Created by iongradea on 10/03/2016.
 */

var Nightmare = require('nightmare');

var bandcamp = new Nightmare()
  .viewport(1000, 1000)
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto('http://aerotrak.bandcamp.com/album/at-ease')
  .wait()
  .click('h4.ft.compound-button button.download-link.buy-link')
  .screenshot('bandcamp2.png')
  .run(function (err, nightmare) {
    if (err) return console.log(err);
    console.log('Done!');
  });
