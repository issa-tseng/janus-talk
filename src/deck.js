window.tap = (x) => { console.log(x); return x; };

require('./util');
const $ = window.$ = require('jquery');

const { Deck, Slide } = require('./model');
const deck = Deck.deserialize({ sections: [{
  name: 'Introduction',
  slides: [
    { name: 'Title' },
    { name: 'Three Glimpses and an Apology' },
    { name: 'Exports' },
    { name: 'Tasks Example' },
    { name: 'Drag and Drop' }
  ]
}, {
  name: 'Primer',
  slides: [
    { name: 'Abc' }
  ]
}] });

const stdlib = require('janus-stdlib');
const inspect = require('janus-inspect');
stdlib.view($).registerWith(deck.views);
inspect.view($).registerWith(deck.views);
require('./view').registerWith(deck.views);

const deckView = deck.view(deck);
$('main').append(deckView.artifact());
deckView.wireEvents();

deck.get('overview').react(false, active => { $('html').toggleClass('overview', !!active) });

