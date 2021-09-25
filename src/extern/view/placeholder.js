const { Model, DomView, find, from } = require('janus');
const { floor } = Math;

class Placeholder extends Model {}

const px = (x) => `${floor(x)}.px`;
class PlaceholderView extends DomView.build(
  $('<div class="placeholder"/>'),
  find('div')
    .css('left', from('left').map(px))
    .css('top', from('top').map(px))
    .on('mouseover', (_, subject) => { subject.destroy(); })
) {
  _wireEvents() {
    this.subject.set(this.subject.get_('target').offsetCenter());
    this.destroyWith(this.subject);
  }
}

module.exports = {
  Placeholder, PlaceholderView,
  registerWith(library) { library.register(Placeholder, PlaceholderView); }
};

