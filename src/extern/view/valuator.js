const { DomView, template, find, from } = require('janus');
const { not } = require('../util/util');
const { success } = require('../util/eval');
const { Valuator } = require('../model/valuator');
const { Statement } = require('../model/repl');
const { ReplView } = require('../view/repl');
const { holdParent, Flyout } = require('../model/flyout');


////////////////////////////////////////////////////////////////////////////////
// QUICK VALUATOR
// used initially, in a flyout layout.

class QuickValuatorView extends DomView.build($(`
  <div class="valuator-quick">
    <div class="valuator-rider"/>
    <div class="quick-statement"/>
    <button class="quick-expand" title="Full Editor"/>
  </div>`), template(
  find('.valuator-rider').render(from('rider')),
  find('.quick-statement')
    // here we deliberately don't react to changes, since whatever the initial
    // statement was when the valuator was created is what we always want to show.
    .render(from('statements').map((statements) => statements.at_(-1))),

  find('.quick-expand').on('click', (e, valuator, view) => {
    const sheet = view.options.app.sheet(valuator.get_('title'), valuator);
    valuator.destroyWith(sheet);

    // prepare to clear the flyout away, then do so:
    // first hold our parent flyout open as long as the sheet lives, if any.
    const flyoutView = view.closest_(Flyout.Manual);
    if (flyoutView != null) holdParent(flyoutView.subject.get_('trigger'), sheet);

    valuator.tap(); // because app#valuator/flyout will try (correctly) to destroy()
    view.closest_(Flyout.Manual).destroy(); // and now gone.
  })
)) {
  _wireEvents() {
    const valuator = this.subject;
    const statement = valuator.get_('statements').at_(-1);
    this.reactTo(statement.get('result'), false, (result) => {
      valuator.offer(this.artifact(), this, result);
    });

    if (valuator.get_('focus') !== false) {
      const { EditorView } = require('./editor');
      this.into_(Statement).into_(EditorView).focus();
    }
  }
}


////////////////////////////////////////////////////////////////////////////////
// FULL VALUATOR
// used when the valuator is expanded out into a sheet view.

const fromSelf = (f) => from.self().map(f);
class ValuatorLineView extends DomView.build($(`
  <div class="valuator-line">
    <div class="valuator-statement"/>
    <button class="valuator-accept" title="Use this value"/>
  </div>`), template(
  find('.valuator-statement').render(fromSelf((view) => view.subject)),
  find('.valuator-accept').classed('disabled', from('result').map(success.match).map(not))
)) {
  focus() { this.into_(Statement).focus(); }
}


class ValuatorView extends DomView.build($(`
  <div class="valuator">
    <button class="valuator-xray" title="Inspect via X-Ray"/>
    <div class="valuator-rider"/>
    <div class="valuator-statements"/>
  </div>`), template(
  find('.valuator-rider').render(from('rider')),

  find('.valuator-statements')
    .render(from('statements'))
      .options({ renderItem: (r) => r.context('valuator') })

    .on('click', '.valuator-accept', (event, subject, view) => {
      const button = $(event.target);
      subject.offer(button, view, button.view().subject.get_('result'));
    })

    .on('commit', 'li:last-child .valuator-line', (e, subject) => {
      subject.get_('repl').createStatement();
    }),

  find('.valuator-xray').on('click', (e, repl, view) => {
    view.options.app.xray((result) => { repl.reference(result); });
  })
)) {
  _wireEvents() { ReplView.prototype._wireEvents.call(this); }
}


module.exports = {
  ValuatorLineView,
  ValuatorView,
  registerWith: (library) => {
    library.register(Statement, ValuatorLineView, { context: 'valuator' });
    library.register(Valuator, ValuatorView);
    library.register(Valuator, QuickValuatorView, { context: 'quick' });
  }
};

