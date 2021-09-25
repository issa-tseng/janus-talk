const { Model, bind, from, List, Varying } = require('janus');

// this is a cute little contraption.
class XRay extends Model.build(
  bind('stack', from('dom').map((target) => {
    const stack = new List(target);
    if (target != null) {
      let ptr = target;
      while ((ptr = ptr.parent_()) != null) stack.add(ptr);
    }
    return stack;
  })),

  bind('select.index', from('stack').and('select.view')
    .all.flatMap((stack, view) => (stack == null) ? null : stack.indexOf(view)))
) {
  _initialize() {
    // if the selection index ever goes negative, we will try to point the
    // selection target back to whatever is at zero. this way the target can be
    // a lazy pointer and we just catch it if it wanders off. we also reset
    // the selection if the user mouses in a more-specific direction only.
    // if the stack changes, we also have to perform this operation.
    this.reactTo(Varying.all([ this.get('select.index'), this.get('stack') ]), false, (idx, stack) => {
      const sproing = (idx === -1) || (stack.list.indexOf(this.get_('select.view')) > idx);
      if (sproing) this.set('select.view', stack.get_(0));
    });
  }

  stepIn() {
    const nextIdx = this.get_('select.index') + 1;
    const next = this.get_('stack').get_(nextIdx);
    if (next != null) this.set('select.view', next);
  }
  stepOut() {
    const prevIdx = this.get_('select.index') - 1;
    if (prevIdx < 0) return;
    this.set('select.view', this.get_('stack').get_(prevIdx));
  }
}


// a simplification of xray that simply displays a box around a target view for 4 seconds.
class Flash extends Model.build(
  bind('stack', from('target').map((t) => new List([ t ]))),
  bind('select.index', from(0))
) {
  _initialize() {
    setTimeout(() => { this.destroy(); }, 4000);
  }
}
XRay.Flash = Flash;

module.exports = { XRay };

