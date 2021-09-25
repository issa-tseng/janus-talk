const { Varying, DomView, template, find, from, match, otherwise, Model, bind, attribute, initial, List } = require('janus');
const { zipSequential } = require('janus-stdlib').varying;

const { Statement, Reference, Repl } = require('../model/repl');
const { success, fail, inert } = require('../util/eval');
const { blank, not, give, ifExists, exists } = require('../util/util');
const { inspect } = require('../util/inspect');


////////////////////////////////////////////////////////////////////////////////
// STATEMENTS

class StatementVM extends Model.build(
  bind('result', from.subject('result').map(ifExists((result) => result.mapSuccess(inspect).get()))),
  bind('status', from.subject().map((statement) => statement instanceof Reference)
    .and.subject('result').map(match(
      inert(give('inert')), success(give('success')), fail(give('fail')), otherwise(give('none'))))
    .all.map((isReference, status) => isReference ? 'success' : status)),

  bind('prev', from.subject().and.subject('statements')
    // guard because statements list is not populated for references.
    .all.map((it, all) => (all == null) ? new List() : all.take(all.indexOf(it)))),
  bind('stale', from.subject('at')
    .and('prev').flatMap((prev) => prev.flatMap((s) => s.get('at')).max())
    .all.map((thisAt, maxAt) => (thisAt != null) && (maxAt > thisAt))),

  attribute('panel.direct', attribute.Boolean),
  bind('panel.repl', from('view').flatMap((view) => {
    const replView = view.closest_(Repl);
    return (replView == null) ? false : replView.subject.get('autopanel');
  })),
  bind('panel.pin', from('view').map((view) => (view.closest_(Pin) != null))),
  bind('context', from('panel.direct').and('panel.repl').and('panel.pin')
    .all.map((x, y, z) => (x || y || z) ? 'panel' : null))
) {
  _initialize() {
    this.reactTo(this.get('last-commit').pipe(zipSequential), false, ([ a, b ]) => {
      if (b - a < 250) this.get_('subject').runTail();
    });
  }
}

class StatementView extends DomView.build(StatementVM, $(`
  <div class="statement">
    <div class="statement-header">
      <div class="statement-status">
        <div>
          <span class="statement-stale" title="This result may be outdated"/>
          <button class="statement-rerun" title="Rerun statement"/>
          <button class="statement-rerun-all" title="Rerun with all following statements (double-tap Enter in the future to automatically rerun)"/>
        </div>
      </div>
      <div class="statement-placeholder"/>
      <div class="statement-name"/>
      <div class="statement-toolbox">
        <button class="statement-insert" title="Add Statement"/>

        <span class="statement-panel" title="View as panel"/>
        <button class="statement-pin" title="Pin statement"/>
        <button class="statement-remove" title="Delete statement"/>
      </div>
    </div>
    <div class="statement-code"/>
    <div class="statement-result"/>
  </div>
`), template(
  find('.statement')
    .classed('named', from('named'))
    .classed('has-result', from('result').map(exists))
    .classed('is-stale', from.vm('stale'))
    .classGroup('status-', from.vm('status')),
  find('.statement-placeholder').text(from('name').map(s => blank(s) ? 'line' : s)),
  find('.statement-name').render(from.attribute('name')),

  template('toolbox',
    find('.statement-insert').on('click', (e, statement, view) => {
      const repl = view.closest_(Repl).subject;
      const idx = repl.get_('statements').list.indexOf(statement);
      repl.createStatement(idx);
    }),
    find('.statement-remove').on('click', (e, statement) => {
      statement.destroy();
    }),
    find('.statement-pin').on('click', (e, statement, view) => {
      view.closest_(Repl).subject.get_('pins').add(statement);
    }),
    find('.statement-panel').render(from.vm().attribute('panel.direct'))
      .criteria({ style: 'button' })
      .options({ stringify: give('') })
  ),

  find('.statement-rerun').on('click', (_, statement) => { statement.run(); }),
  find('.statement-rerun-all').on('click', (_, statement) => { statement.runTail(); }),

  find('.statement-result').render(from.vm('result'))
    .context(from.vm('context'))
    .options(from.app().and('env.final').all.map((app, env) =>
      ({ app: app.with({ eval: { env } }) }))),

  find('.statement-code').render(from.attribute('code'))
    .criteria({ style: 'code' })
    .options(from.self().map((view) => ({ onCommit: () => {
      const result = view.subject.commit();
      if (result === true) view.vm.set('last-commit', new Date());
      return result;
    } })))
)) {
  focus() {
    // we require this here because requiring codemirror at all server-side crashes jsdom.
    const { EditorView } = require('./editor');
    this.into_(EditorView).focus();
  }
}

// TODO: repetitive with above; sort of awaiting janus#138
const ReferenceView = DomView.build(StatementVM, $(`
  <div class="statement reference">
    <div class="statement-header">
      <div class="statement-placeholder">value</div>
      <div class="statement-name"/>
      <div class="statement-toolbox">
        <button class="statement-insert" title="Add Statement"/>

        <span class="statement-panel" title="View as panel"/>
        <button class="statement-pin" title="Pin value"/>
        <button class="statement-remove" title="Remove value"/>
      </div>
    </div>
    <div class="statement-result"/>
  </div>`), template(
  find('.statement').classed('named', from('named')),
  find('.statement-placeholder').text(from('name').map(s => blank(s) ? 'value' : s)),
  find('.statement-name').render(from.attribute('name')),
  StatementView.template.toolbox,
  find('.statement-result').render(from.vm('result')).context(from.vm('context'))
));


////////////////////////////////////////////////////////////////////////////////
// PINS

const Pin = Model.build(initial('expanded', true, attribute.Boolean));

const PinView = DomView.build($(`
  <div class="pin">
    <div class="pin-chrome">
      <div class="pin-expand" title="Expand/Collapse"/>
      <button class="pin-remove" title="Unpin"/>
    </div>
    <div class="pin-contents"/>
  </div>
`), template(
  find('.pin-contents').render(from('subject')),

  find('.pin').classed('expanded', from('expanded')),
  find('.pin-expand').render(from.attribute('expanded'))
    .criteria({ style: 'button' }).options({ stringify: give('') }),

  find('.pin-remove').on('click', (e, subject, view) => {
    // we do this by index on the parent list in case multiple instances of this
    // item exist.
    const idx = $(event.target).closest('.pin').prevAll().length;
    view.closest_(List).subject.parent.removeAt(idx);
  }),
));


////////////////////////////////////////////////////////////////////////////////
// REPL

class ReplView extends DomView.build($(`
  <div class="repl">
    <div class="repl-chrome">
      <h2>Console</h2>

      <div class="repl-toolbar">
        <span class="repl-autopanel" title="View all as panel"/>
        <button class="repl-xray" title="Inspect via X-Ray"/>
        <hr/>
        <button class="repl-clear" title="Clear All"/>
      </div>
    </div>
    <div class="repl-main"/>
    <div class="repl-pins">
      <div class="repl-chrome">
        <button class="repl-pins-clear" title="Clear Pins"/>
        <h2>Pinned Objects</h2>
      </div>
      <div class="repl-pins-list"/>
    </div>
  </div>
`), template(
  find('.repl').classed('autopaneled', from('autopanel')),
  find('.repl-xray').on('click', (e, repl, view) => {
    view.options.app.xray((result) => { repl.reference(result); });
  }),
  find('.repl-autopanel').render(from.attribute('autopanel'))
    .criteria({ style: 'button' })
    .options({ stringify: give('') }),
  find('.repl-clear').on('click', (event, repl, view) => {
    view.options.app.confirm($(event.target), // TODO: disallow multiple
      'Are you sure you want to completely clear the console?',
      _ => { repl.clear(); });
  }),

  find('.repl-main')
    .render(from('statements'))
    .on('click', (event, _, view) => {
      const target = $(event.target);
      if (target.is('.repl-main')) view.focusLast();
      if (target.is('.statement')) target.view().focus();
    }),

  find('.repl').classed('has-pins', from('pins').flatMap((pins) => pins.nonEmpty())),
  find('.repl-pins-clear').on('click', (e, subject) => { subject.get_('pins').removeAll(); }),
  find('.repl-pins-list')
    .render(from('pins').map((pins) => pins.map((subject) => new Pin({ subject }))))
)) {
  _wireEvents() {
    // any time a new statement is created, focus it.
    this.into_('statements').into(-1).react(ifExists((sv) => { sv.focus(); }));
  }
  focusLast() { this.into_('statements').into_(-1).focus(); }
}


module.exports = {
  ReplView,
  PinView,
  StatementView,
  registerWith: (library) => {
    library.register(Statement, StatementView);
    library.register(Reference, ReferenceView);
    library.register(Pin, PinView);
    library.register(Repl, ReplView);
  }
};

