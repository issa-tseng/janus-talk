const { Varying } = require('janus');

// TODO: it's possible this is functionality we want in inspect, and that we'd rather
// duplicate this behavior across all the disparate inspector classes (right now they
// have no superclass/superbehaviour at all) than splice in something from a central
// spot like this. but this makes initial experimentation far easier so yes for now.

const highlight = (app) => {
  const cache = new WeakMap();

  app.on('inspected', (view, target) => {
    let tracker = cache.get(target); // ugh js
    if (tracker == null) cache.set(target, (tracker = new Varying(0)));
    view.reactTo(tracker, (hover) => { view.artifact().toggleClass('highlight', hover > 0); });
  });

  let lastEvent = null; // essentially a scoped stopPropagation
  $('body').on('mouseover', '.highlights', (event) => {
    if (event.originalEvent === lastEvent) return;
    lastEvent = event.originalEvent;

    const dom = $(event.currentTarget);
    const tracker = cache.get(dom.view().highlight());
    if (tracker != null) {
      tracker.set(tracker.get() + 1);
      dom.one('mouseout', _ => { tracker.set(tracker.get() - 1); });
    }
  });
};

module.exports = { highlight };

