const { Model, attribute, initial, bind, from, List, App } = require('janus');
const { varying } = require('janus-stdlib');
const { Layout } = require('./layout');

class Slide extends Model {}
const Slides = List.of(Slide);

const Section = Model.build(
  attribute('slides', attribute.List.of(Slides))
);
const Sections = List.of(Section);

class Deck extends App.build(
  Layout,

  attribute('sections', attribute.List.of(Sections)),
  initial('_overview', false),
  bind('overview', from('_overview').pipe(varying.delay(1000))),

  bind('slides', from('sections').map(sxs => sxs.flatMap(sx => sx.get('slides')).flatten())),
  initial('active-idx', 0),
  bind('active-slide', from('slides').and('active-idx').all.flatMap((slides, idx) =>
    slides.get(idx)))
) {
  _initialize() {
    // annotate all the counts
    let idx = 0, sect = 0, row = 0, col = 0;
    for (const section of this.get_('sections')) {
      col = 0;
      for (const slide of section.get_('slides')) {
        slide.idx = idx;
        slide.set('idx', idx++);
        slide.sect = sect;
        slide.row = row;
        slide.col = col++;

        if (col === 5) {
          row++;
          col = 0;
        }
      }
      sect++; row++;
    }
  }

  previous() {
    const to = this.get_('active-idx') - 1;
    if (to === -1) return;
    this.set('active-idx', to);
  }
  advance() {
    console.log(this.get_('active-idx'));
    const to = this.get_('active-idx') + 1;
    if (to === this.get_('slides').length_) return;
    this.set('active-idx', to);
  }

  toggleOverview() {
    this.setOrigin();
    this.set('_overview', !this.get_('_overview'));
  }

  setOrigin() {
    this.set('relayout', true);
    const { x, y } = tap(this.get_('layout')(this.get_('active-slide')));
    this.set('origin', { x: this.get_('origin.x') + x, y: this.get_('origin.y') + y });
    this.set('relayout', false);
  }
}


module.exports = { Slide, Deck };

