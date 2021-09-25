const { DomView, template, find, from } = require('janus');
const stdlib = require('janus-stdlib');
const $ = require('jquery');

const { Slide, Section, Deck } = require('./model');

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
    const dom = this.artifact();
    const $window = $(window);

    // keypress events
    $window.on('keydown', (event) => {
      if ($(event.target).closest('input,textarea').length > 0) return;

      if (event.which === 192) this.subject.toggleOverview();
      else if (event.which === 37) this.subject.previous();
      else if (event.which === 39) this.subject.advance();
    });

    // resize events
    stdlib.varying.fromEvent($window, 'resize', () => {
      this.subject.set('width', $window.width());
      this.subject.set('height', $window.height());
    });

    // fix weird safari bug with bad hacks events
    this.subject.get('overview').react(() => {
      $('html, body').scrollLeft(0);
      setTimeout(() => { $('html, body').scrollLeft(0); }, 0);
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

