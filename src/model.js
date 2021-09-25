const { Model, attribute, initial, bind, from, List, App } = require('janus');
const { varying } = require('janus-stdlib');
const { cheapGrid, Layout } = require('./layout');

class Slide extends Model {}
const Slides = List.of(Slide);

const Section = Model.build(
  attribute('slides', attribute.List.of(Slides))
);
const Sections = List.of(Section);

class Deck extends App.build(
  Layout,

  attribute('sections', attribute.List.of(Sections)),
  initial('overview', false),

  bind('slides', from('sections').map(sxs => sxs.flatMap(sx => sx.get('slides')).flatten())),
  initial('active-idx', 0),
  bind('active-slide', from('slides').and('active-idx').all.flatMap((slides, idx) =>
    slides.get(idx)))
) {
  _initialize() {
    // annotate all the counts
    cheapGrid(this.get_('sections'));
  }

  previous() {
    const to = this.get_('active-idx') - 1;
    if (to === -1) return;
    this.set('active-idx', to);
  }
  advance() {
    const to = this.get_('active-idx') + 1;
    if (to === this.get_('slides').length_) return;
    this.set('active-idx', to);
  }

  toggleOverview() { this.set('overview', !this.get_('overview')); }
}


module.exports = { Slide, Section, Deck };

