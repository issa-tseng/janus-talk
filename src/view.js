const { Varying, Model, attribute, bind, DomView, template, find, from, mutators } = require('janus');
const stdlib = require('janus-stdlib');
const $ = require('jquery');

const { Snippet, Slide, Section, Deck } = require('./model');
const { highlight } = require('./extern/view/highlighter');


class SlideView extends DomView.build($(`
  <section class="slide">
    <div class="slide-contents"/>
    <div class="slide-name"/>
  </section>`
), template(
  find('.slide')
    .prop('id', from('idx').map(idx => `slide-${idx}`))
    .classed('active', from.subject()
      .and.app('active-slide')
      .all.map((slide, active) => slide === active))
    .css('transform', from.app('layout').and.subject().all.map((f, x) => f(x))),

  find('.slide-contents').html(from('contents')),
  find('.slide-name').text(from('name'))
)) {
  _render() {
    const artifact = DomView.prototype._render.call(this);

    for (const snippet of this.subject.get_('snippets').values_())
      this._bindings.push(mutators.render(from(new Varying(snippet)))
        (artifact.find(`#snippet-${snippet.get_('id')}`), this.pointer(), true));

    for (const sample of this.subject.get_('samples'))
      this._bindings.push(mutators.render(from(sample.get('result')).map(tap))
        (artifact.find(sample.get_('target')), this.pointer(), true));

    return artifact;
  }
}

const SnippetVM = Model.build(
  attribute('collapsed', attribute.Boolean),

  bind('name', from.subject('id').map(id => {
    const match = /^[^-]+-(.+)$/.exec(id);
    return (match == null) ? '' : match[1];
  }))
);
const SnippetView = DomView.build(SnippetVM, $(`
<div class="snippet">
  <h3/>
  <div class="snippet-code"/>
  <button class="snippet-revert">Revert</button>
`), template(
  find('.snippet').classed('collapsed', from.vm('collapsed')),
  find('h3').text(from.vm('name')),
  find('.snippet-code').render(from.attribute('snippet')).criteria({ style: 'code' }),
  find('.snippet-revert').on('click', (_, snippet) => { snippet.revert(); })
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
  DeckView,
  registerWith(library) {
    library.register(Section, SectionView);
    library.register(Snippet, SnippetView);
    library.register(Slide, SlideView);
    library.register(Deck, DeckView);
  }
};

