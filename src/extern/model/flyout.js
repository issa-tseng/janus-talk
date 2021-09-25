const { Model, attribute, bind, from, List } = require('janus');
const { sticky, fromEvents } = require('janus-stdlib').varying;

// TODO: once Model.build() x2 is unbroken for ES6 (see janus#150) we can have the
// two Flyout types inherit from a common ancestor to solve some typing issues
// elsewhere and add methods like addChild(flyout) without hating it.

// there are two flyout classes. manual flyouts only close when a button is
// clicked. hover flyouts, which are more commonly used, close when the mouse
// has left areas of interest (the original trigger, the flyout, and its
// descendants) for a small length of time.

// add a reference to our trigger's flyout parent to prevent its destruction.
// TODO: this is sort of the "canonical" way to do this from elsewhere too but
// somehow it still feels sort of lame.
// TODO: yeah this function is getting completely ridiculous. need a better
// way to do this. maybe a more automatic one.
const holdParent = (trigger, ref, abortIfHovered = false) => {
  const parentDom = trigger.closest('.flyout');
  if (parentDom.length === 0) return false;
  const flyout = parentDom.view().subject;
  if (abortIfHovered && flyout.get_('hover.target')) return false;
  flyout.get_('children').add(ref);
  return true;
};

// manual flyouts don't have much to do.
class ManualFlyout extends Model.build(
  attribute('children', attribute.List.withInitial())
) {
  _initialize() {
    this.destroyWith(this.get_('target'));
    holdParent(this.get_('trigger'), this);
  }
}

// hover flyouts have to track hovers.
class HoverFlyout extends Model.build(
  attribute('children', attribute.List.withInitial()),

  bind('hover.trigger', from('trigger').flatMap((trigger) =>
    fromEvents(trigger, true, { mouseenter: true, mouseleave: false }))),

  bind('active.target', from('hover.target').pipe(sticky({ true: 300 }))),
  bind('active.trigger', from('hover.trigger').pipe(sticky({ true: 300 }))),
  bind('active.children', from('children').flatMap((children) => children.nonEmpty())),
  bind('active.net', from('active.target').and('active.trigger').and('active.children')
    .all.map((x, y, z) => x || y || z))
) {
  _initialize() {
    // first, destroy ourselves if our subject is, or we're ever not active.
    this.destroyWith(this.get_('target'));
    this.reactTo(this.get('active.net'), false, (active) => {
      if (!active) this.destroy();
    });

    // and then add ourselves onto our flyout parent.
    holdParent(this.get_('trigger'), this);
  }
}


module.exports = {
  holdParent,
  Flyout: {
    manual: ManualFlyout,
    Manual: ManualFlyout,
    hover: HoverFlyout,
    Hover: HoverFlyout
  }
};

