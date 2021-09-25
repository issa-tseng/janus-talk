const { Model, attribute, bind, List, DomView, template, find, from } = require('janus');
const { isNumber } = require('janus').util;
const { filter } = require('janus-stdlib').varying;
const ESP = require('error-stack-parser')
const { give, blank } = require('../util/util');


////////////////////////////////////////////////////////////////////////////////
// EXCEPTION VIEWMODEL

class StackLine extends Model {}
const ExceptionViewModel = Model.build(
  attribute('expanded', attribute.Boolean),
  bind('has_expanded', from('expanded').pipe(filter((x) => x === true))),

  bind('message', from.subject().map((error) => error.message)),
  bind('name', from.subject().map((error) => error.name)),
  bind('stack', from.subject().map((error) => {
    const frames = ESP.parse(error);

    // we have to do some nasty work to extract eval/anon information, since
    // ESP doesn't generally do it for us. (TODO: IE/Edge?)
    if ((frames[0].functionName != null) && frames[0].functionName.startsWith('anonymous')) { // firefox
      frames[0].functionName = frames[0].functionName.replace(/<$/, '');
      frames[0].navigable = true;
    } else if (isNumber(error.line) && isNumber(error.column)) { // safari
      frames.unshift({ functionName: 'anonymous', lineNumber: error.line + 1, columnNumber: error.column, isNative: false, navigable: true });
    } else {
      const fromChrome = /\(eval.*<anonymous>:(\d+):(\d+)\)\n/i.exec(error.stack); // yeah it's chrome
      if (fromChrome != null)
        frames.unshift({ functionName: 'anonymous', lineNumber: parseInt(fromChrome[1]), columnNumber: parseInt(fromChrome[2]), isNative: false, navigable: true });
    }
    frames[0].lineNumber -= 3; // adjust for our injection boilerplate. (TODO: why 3?)
    return new List(frames.map(({ functionName, lineNumber, columnNumber, isNative, navigable }) =>
      new StackLine({ context: functionName, line: lineNumber, col: columnNumber, isNative, navigable })));
  }))
);


////////////////////////////////////////////////////////////////////////////////
// EXCEPTION ENTITY VIEW
// mimicks janus-inspect entity inspector dom structure.

const ExceptionEntityView = DomView.build(ExceptionViewModel, $(`
  <span class="janus-inspect-entity janus-inspect-error">
    <span class="entity-title">Exception</span>
    <span class="entity-content"/>
  </span>`),
  find('.entity-content').text(from.vm('name'))
);


////////////////////////////////////////////////////////////////////////////////
// MAIN EXCEPTION VIEW

const StackLineView = DomView.build($(`
  <div class="stack-line">at
    <span class="stack-line-context"/>
    <a href="#go" class="stack-line-location">
      (line <span class="stack-line-line"/>:<span class="stack-line-col"/>)
    </a>
  </div>`), template(

  find('.stack-line-context')
    .classed('no-context', from('context').map(blank))
    .text(from('context').map((x) => x || 'anonymous')),
  find('.stack-line-line').text(from('line')),
  find('.stack-line-col').text(from('col')),

  find('.stack-line-location')
    .classed('navigable', from('navigable'))
    .classed('hide', from('line').map(Number.isNaN))
    .on('click', (event, subject) => {
      event.preventDefault();
      if (subject.get_('navigable') !== true) return;
      $(event.target).trigger('code-navigate', {
        line: subject.get_('line'),
        col: subject.get_('col')
      });
    })
));

const ExceptionView = DomView.build(ExceptionViewModel, $(`
  <div class="exception">
    <div class="exception-message"></div>
    <div class="exception-stack"></div>
    <div class="exception-expando"></div>
  </div>`),

  template(
    find('.exception')
      .classGroup('exception-name-', from.vm('name'))
      .classed('expanded', from.vm('expanded'))
      .classed('has-expanded', from.vm('has_expanded')),
    find('.exception-message').text(from.vm('message')),
    find('.exception-stack').render(from.vm('stack')),

    find('.exception-expando').render(from.vm().attribute('expanded'))
      .criteria({ style: 'button' })
      .options({ stringify: give('') })
  ));


module.exports = {
  StackLine,
  StackLineView,
  ExceptionViewModel,
  ExceptionEntityView,
  ExceptionView,
  registerWith: (library) => {
    library.register(StackLine, StackLineView),
    library.register(RangeError, ExceptionView),
    library.register(ReferenceError, ExceptionView),
    library.register(SyntaxError, ExceptionView),
    library.register(TypeError, ExceptionView),
    library.register(Error, ExceptionEntityView, { context: 'entity' })
    library.register(Error, ExceptionView)
  }
};

