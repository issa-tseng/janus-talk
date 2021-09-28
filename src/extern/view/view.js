const { Varying, DomView, mutators, from } = require('janus');
const { exists } = require('../util/util');

class ViewView extends DomView {
  _initialize() {
    this.error = new Varying(); // TODO: i guess this is viewmodel material
  }

  _render() {
    const dom = $(`<div class="view">
      <div class="view-content"/>
      <div class="view-error"/>
    </div>`);

    const errorWrapper = dom.find('.view-error');
    const point = this.pointer();
    this._bindings = [
      mutators.render(from.varying(this.error))(errorWrapper, point),
      mutators.classed('has-error', from.varying(this.error).map(exists))(errorWrapper, point)
    ];

    try {
      dom.find('.view-content').append(this.subject.artifact());
    } catch (ex) {
      this.error.set(ex);
    }

    return dom;
  }

  _wireEvents() {
    if (this.error.get() != null) return;

    try {
      this.subject.wireEvents();
    } catch (ex) {
      this.error.set(ex);
    }
  }

  _destroy() {
    // rather than destroy our subject we want to detach its dom. if it can be
    // garbage collected it (hopefully) still can be. but if it gets redrawn
    // at some point, then it's still intact.
    if (this.subject.destroyed !== true) this.subject.artifact().detach();
    if (this._bindings != null)
      for (const binding of this._bindings)
        binding.stop();
  }
}

module.exports = {
  ViewView,
  registerWith: (library) => { library.register(DomView, ViewView); }
};

