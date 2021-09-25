const { DomView, template, find, from } = require('janus');
const stdlib = require('janus-stdlib');
const $ = require('jquery');

const { Slide, Section, Deck } = require('./model');
const { highlight } = require('./extern/view/highlighter');

const SlideView = DomView.build($(`
<section class="slide">
  <div class="slide-contents"/>
  <div class="slide-name"/>
</section>`), template(
  find('.slide')
    .prop('id', from('idx').map(idx => `slide-${idx}`))
    .classed('active', from.subject()
      .and.app('active-slide')
      .all.map((slide, active) => slide === active))
    .css('transform', from.app('layout').and.subject().all.map((f, x) => f(x))),

  find('.slide-contents').html(from('idx').map(idx => $(`#content #s${idx}`).html())), // lol :(
  find('.slide-name').text(from('name'))
));

const SectionView = DomView.build(
  $(`<h2/>`),
  find('h2')
    .text(from('name'))
    .css('transform', from.app('layout').and.subject().all.map((f, x) => f(x)))
);

class DeckView extends DomView.build($(`
<div class="deck">
  <nav id="chrome"/>
  <div id="canvas">
    <div id="sections"/>
    <div class="slides"/>
  </div>
  <div id="repl"/>
  <div id="flyouts"/>
  <div id="sheets"/>
  <div id="xray"/>
  <div id="junk"/>
</div>`), template(
  find('#sections').render(from('sections')),
  find('.slides').render(from('slides')),

  find('#repl').render(from('repl')),
  find('#flyouts').render(from('flyouts')),
  find('#sheets').render(from('sheets')),
  find('#xray').render(from('xray')),
  find('#junk').render(from('junk'))
)) {
  _wireEvents() {
    const deck = this.subject;
    const dom = this.artifact();
    const $window = $(window);

    // keypress events
    $window.on('keydown', (event) => {
      if ($(event.target).closest('input,textarea').length > 0) return;

      if (event.which === 192) deck.toggleOverview();
      else if (event.which === 37) deck.previous();
      else if (event.which === 39) deck.advance();
    });

    // resize events
    stdlib.varying.fromEvent($window, 'resize', () => {
      deck.set('width', $window.width());
      deck.set('height', $window.height());
    });

    // fix weird safari bug with bad hacks events
    deck.get('overview').react(() => {
      $('html, body').scrollLeft(0);
      setTimeout(() => { $('html, body').scrollLeft(0); }, 0);
    });

    // inspect highlighting
    highlight(deck);

    // inspect hovering
    dom.on('mouseenter', '.entity-title', (event) => {
      const trigger = $(event.target);
      const entity = trigger.closest('.janus-inspect-entity');
      if (entity.hasClass('no-panel')) return;

      const timer = setTimeout(_ => { deck.flyout(trigger, entity.view().subject, { context: 'panel' }); }, 300);
      trigger.one('mouseleave', _ => { clearTimeout(timer); });
    });

    dom.on('mouseenter', '.varying-node', (event) => {
      const node = $(event.currentTarget);
      if (node.parents('.varying-tree').length === 2) return; // is the root node in the panel.
      const timer = setTimeout(_ => { deck.flyout(node, node.view().subject, { context: 'panel' }); }, 300);
      node.one('mouseleave', _ => { clearTimeout(timer); });
    });
  }
}

module.exports = {
  SlideView, DeckView,
  registerWith(library) {
    library.register(Slide, SlideView);
    library.register(Section, SectionView);
    library.register(Deck, DeckView);
  }
};

