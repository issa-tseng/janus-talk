const { Map, Model, attribute, initial, bind, from, List, App } = require('janus');
const { varying } = require('janus-stdlib');
const { cheapGrid, Layout } = require('./layout');

const { Confirm } = require('./extern/view/confirm');
const { Flyout, holdParent } = require('./extern/model/flyout');
const { Placeholder } = require('./extern/view/placeholder');
const { Repl } = require('./extern/model/repl');
const { Samples } = require('./extern/model/sample');
const { Sheet } = require('./extern/model/sheet');
const { Valuator } = require('./extern/model/valuator');
const { XRay } = require('./extern/model/xray');


class Snippet extends Model.build(
  attribute('snippet', attribute.Text),
  attribute('collapsed', attribute.Boolean)
) {
  _initialize() { this.set('initial', this.get_('snippet')); }
  revert() { this.set('snippet', this.get_('initial')); }
}

const Slide = Model.build(
  attribute('samples', attribute.List.of(Samples).withInitial()),
  initial('snippets', new Map())
)
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
    slides.get(idx))),

  attribute('flyouts', attribute.List.withInitial()),
  attribute('sheets', attribute.List.withInitial()),
  attribute('junk', attribute.List.withInitial()),
  initial.writing('repl', new Repl())
) {
  _initialize() {
    // annotate all the counts
    cheapGrid(this.get_('sections'));

    // enable highlighting for inspect / repl elements
    this.listenTo(this, 'createdView', (view) => {
      if (typeof view.highlight === 'function')
        this.original().emit('inspected', view, view.highlight());
    });

    // convenient moment to add a reference to deck
    this.get_('repl').reference(this, 'deck');
  }

  ////////////////////////////////////////////////////////////
  // DECK NAVIGATION

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


  ////////////////////////////////////////////////////////////
  // INSPECT / REPL
  // mostly copied from janus docs' App

  confirm(trigger, message, callback) {
    const confirm = new Confirm({ trigger, message });
    confirm.get('result').react(false, (result) => {
      if (result === true) callback();
      confirm.destroy();
    });
    holdParent(trigger, confirm);
    this.get_('junk').add(confirm);
    return confirm;
  }

  flyout(trigger, target, { context = 'default', type = 'Hover' } = {}) {
    const triggerNode = trigger[0];
    const flyouts = this.get_('flyouts');
    for (const flyout of flyouts) // don't retrigger the same flyout twice.
      if (flyout.get_('trigger')[0] === triggerNode)
        return;

    const flyout = new Flyout[type]({ trigger, target, context });
    flyouts.add(flyout);
    return flyout;
  }

  sheet(title, target) {
    const sheet = new Sheet({ title, target });
    this.get_('sheets').add(sheet);
    return sheet;
  }

  xray(callback) {
    const xray = new XRay();
    this.set('xray', xray);
    xray.get('result').react(false, (result) => {
      callback(result);
      xray.destroy();
    });
    return xray;
  }

  placehold(target) {
    const placeholder = new Placeholder({ target });
    if (!holdParent(target, placeholder, true)) return;
    this.get_('junk').add(placeholder);
    return placeholder;
  }

  // OPTIONS: title, values, initial, rider, focus
  valuator(trigger, options, callback) {
    const env = { inject: this.get_('eval.env') };
    const valuator = new Valuator(Object.assign({ trigger, env }, options));
    const flyout = this.flyout(trigger, valuator, { context: 'quick', type: 'Manual' });
    valuator.destroyWith(flyout);
    valuator.on('destroying', () => { this.placehold(trigger); });

    valuator.get('result').react(false, (result) => { // no point in reactTo
      callback(result);
      valuator.destroy();
    });
    return valuator;
  }
}

module.exports = { Slide, Snippet, Section, Deck };

