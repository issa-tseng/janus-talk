const { DomView } = require('janus');
const jInspect = require('janus-inspect');
const { asPanel } = require('../view/context');

// we make our own inspect() that prevents re-inspection.
const inspect = (x, force = false) => {
  // we don't re-inspect inspectors and we don't try to inspect context views
  // since they're really just wrappers, but for eg the xray we just want to
  // force the true stack to show so we allow a passthrough flag.
  if ((force !== true) && (x != null) && ((x.isInspector === true) || (x.isContext === true)))
    return x;

  // otherwise fallthrough to the main inspector:
  return jInspect.inspect(x);
};

// augment inspect with the ability to directly request a panel view.
inspect.panel = (x) => asPanel(inspect(x));


// TODO: for now, we put some stdlib mutator extractors here but it's not clear
// where they really belong. it's obviously not here. it's also not clear how the
// library should be populated but we should obviously not be doing it globally.
const { ListView } = require('janus-stdlib').view($).list;
const { Mutation, DomViewInspector } = jInspect.inspector.domview;
const listViewExtractor = (view) => view._mappedBindings.mapPairs((idx, binding) =>
  new Mutation({ operation: `[${idx}]`, binding: (binding ? binding.parent : null) }));
DomViewInspector.extractors.register(ListView, listViewExtractor);

module.exports = { inspect };

