const { Model, bind, from } = require('janus');
const { isPrimitive } = require('janus').util;
const { Repl } = require('./repl');

// the valuator is a repl but with some changes to better suit temporary work
// and a notion of accepting some result value as the result.
//
// that process is worth explaining in terms of resource destruction: when the
// user decides on a value, the Valuator indicates this by setting its .result
// data property to that user value. that's all that it does.
//
// it is the duty of whatever created Valuator to notice this, pick up the value,
// and destroy() on the valuator. the valuator view is set up to automatically
// destroy with its model.
class Valuator extends Repl {
  _initialize() {
    Repl.prototype._initialize.call(this); // thanks for nothing es6

    // populate seed values
    const values = this.get_('values')
    if (values != null)
      for (const { name, value } of values) this.reference(value, name);

    // populate working statement
    const initial = this.get_('initial');
    // TODO: why do i need this defer? it crashes codemirror if i directly assign.
    if (isPrimitive(initial)) setTimeout(() => {
      this.get_('statements').at_(-1).set('code', JSON.stringify(this.get_('initial')))
    });
  }

  // called to actually offer up a final value for this valuator session.
  // trigger is the dom element that is causing this offer attempt.
  offer(trigger, view, result) {
    if (!success.match(result)) return;
    const rider = this.get_('rider');
    if ((rider != null) && (rider.valid().get() !== true)) return;

    try {
      this.set('result', result.get());
    } catch (ex) {
      view.options.app.flyout(trigger, ex, { type: 'Manual' });
    }
  }
}

module.exports = { Valuator };

