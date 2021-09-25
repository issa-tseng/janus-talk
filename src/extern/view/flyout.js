const { DomView, template, find, from } = require('janus');

const { Flyout } = require('../model/flyout');
const { positionFlyout } = require('../util/dom.js');


const className = (x) => {
  if (x == null) return null;
  else if (x.constructor == null) return null;
  else return x.constructor.name.replace(/^.+Error/, 'Error');
};

// TODO: because the close button is part of the enclosing container, it seems
// like it'll be really difficult to style for different contents. but also,
// requiring contents to supply their own close buttons seems bad too.
class ManualFlyoutView extends DomView.build($(`
  <div class="flyout">
    <div class="flyout-contents"/>
    <button class="flyout-close" title="Close"/>
  </div>`), template(
  find('.flyout').classGroup('class-', from('target').map(className)),
  find('.flyout-contents').render(from('target')).context(from('context')),
  find('.flyout-close').on('click', (e, subject) => { subject.destroy(); })
)) {
  _wireEvents() {
    // we do this here instead of _render because here we are guaranteed to be
    // attached to the document, which we need in order to measure ourselves.
    positionFlyout(this.subject.get_('trigger'), this.artifact());
    this.destroyWith(this.subject.get_('target'));
    this.destroyWith(this.subject);
    this.subject.destroyWith(this); // TODO: some sort of mutual pact shortcut?
  }
}

class HoverFlyoutView extends DomView.build(
  $('<div class="flyout"/>'),
  find('.flyout')
    .render(from('target')).context(from('context'))
    .on('mouseenter', (_, subject) => { subject.set('hover.target', true); })
    .on('mouseleave', (_, subject) => { subject.set('hover.target', false); })
) {
  _wireEvents() {
    ManualFlyoutView.prototype._wireEvents.call(this);
  }
}


module.exports = {
  ManualFlyoutView, HoverFlyoutView,
  registerWith: (library) => {
    library.register(Flyout.Manual, ManualFlyoutView);
    library.register(Flyout.Hover, HoverFlyoutView);
  }
};

