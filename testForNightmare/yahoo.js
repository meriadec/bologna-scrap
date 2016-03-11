/**
 * Created by iongradea on 10/03/2016.
 */

var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true })

nightmare
  .goto('http://yahoo.com')
  .type('input[title="Search"]', 'github nightmare')
  .click('#uh-search-button')
  .wait('#main')
  .evaluate(function () {
    return $('#main .searchCenterMiddle li a').href
  })
  .then(function (result) {
    console.log(result)
  })
