const { Model, attribute, bind, DomView, template, find, from, Varying } = require('janus');

// really just switches inspection contexts between standard and panel.
class ContextModel extends Model {
  get isContext() { return true; } // TODO: ugh hack.
}

const ContextView = DomView.build($(`<div/>`),
  find('div').render(from('target')).context(from('context')));

const asPanel = (target) => new ContextModel({ target, context: 'panel' });

module.exports = {
  ContextModel, ContextView,
  asPanel,
  registerWith: (library) => { library.register(ContextModel, ContextView); }
};

