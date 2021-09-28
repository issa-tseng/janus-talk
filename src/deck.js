require('./util');
const $ = window.$ = require('jquery');
window.tap = (x) => { console.log(x); return x; };
window.scrollTo(0, 0);

const { Deck, Slide, Snippet } = require('./model');
const deck = Deck.deserialize({ sections: [{
  name: 'Introduction',
  slides: [
    { name: 'Title' },
    { name: 'Three Glimpses and an Apology' },
    { name: 'Exports' },
    { name: 'Tasks Example',
      samples: [{
        pick: [ 'tasks-model', 'tasks-view', 'tasks-main' ],
        target: '#tasks'
      }] },
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
require('./extern/view/confirm').registerWith(deck.views);
require('./extern/view/editor').registerWith(deck.views);
require('./extern/view/exception').registerWith(deck.views);
require('./extern/view/flyout').registerWith(deck.views);
require('./extern/view/placeholder').registerWith(deck.views);
require('./extern/view/repl').registerWith(deck.views);
require('./extern/view/sheet').registerWith(deck.views);
require('./extern/view/valuator').registerWith(deck.views);
require('./extern/view/view').registerWith(deck.views);
require('./extern/view/xray').registerWith(deck.views);
require('./view').registerWith(deck.views);

const markup = $('#content').detach();
for (const slide of deck.get_('slides')) {
  const contents = markup.children(`#s${slide.idx}`);
  const snippets = slide.get_('snippets');
  for (const sample of slide.get_('samples')) sample.set('snippets', snippets);
  contents.find('pre').each(function() {
    const $this = $(this);
    const id = $this.prop('id');
    snippets.set(id, new Snippet({ id, snippet: $this.find('code').text() }));
    $this.replaceWith(`<div id="snippet-${id}"/>`);
  });
  slide.set('contents', contents.html());
}

const deckView = deck.view(deck);
$('main').append(deckView.artifact());
deckView.wireEvents();

htmlClass = (c => {
  deck.get(c).react(false, x => { $('html').toggleClass(c, !!x) });
});
htmlClass('console'); htmlClass('overview');

$(() => { setTimeout(() => { // a collection of bad hacks.
  document.activeElement.blur();
  $('html, body').scrollLeft(0).scrollTop(0);
}), 100 });

