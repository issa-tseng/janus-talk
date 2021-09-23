const { DomView, template, find, from } = require('janus');
const stdlib = require('janus-stdlib');
const $ = require('jquery');

const { Slide, Deck } = require('./model');
const { translate } = require('./layout');

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
    .css('transform', from.app('layout').and.subject().all.map((f, x) => translate(f(x)))),

  find('.slide-contents').html(from('idx').map(idx => $(`#content #s${idx}`).html())), // lol :(
  find('.slide-name').text(from('name'))
));

class DeckView extends DomView.build($(`
<div class="deck">
  <nav id="chrome"/>
  <div id="canvas">
    <div id="sections"/>
    <div class="slides"/>
  </div>
</div>`), template(
  find('#canvas')
    .classed('relayout', from('relayout').pipe(stdlib.varying.sticky({ true: 0 })))
    .css('transform', from('viewport').and('active-slide').all.map((f, x) => f(x))),

  find('.sections').render(from('sections')),
  find('.slides').render(from('slides'))
)) {
  _wireEvents() {
    const dom = this.artifact();
    const $window = $(window);

    // keypress events
    $window.on('keydown', (event) => {
      if (event.which === 192) this.subject.toggleOverview();
      else if (event.which === 37) this.subject.previous();
      else if (event.which === 39) this.subject.advance();
    });

    // resize events
    stdlib.varying.fromEvent($window, 'resize', () => {
      this.subject.set('width', $window.width());
      this.subject.set('height', $window.height());
    });
  }
}

module.exports = {
  SlideView, DeckView,
  registerWith(library) {
    library.register(Slide, SlideView);
    library.register(Deck, DeckView);
  }
};

