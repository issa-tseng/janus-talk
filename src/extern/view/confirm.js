const { Model, DomView, template, find, from } = require('janus');
const { positionFlyout } = require('../util/dom');

class Confirm extends Model {}
class ConfirmView extends DomView.build($(`
  <div class="confirm">
    <p/>
    <div class="confirm-buttons">
      <button class="confirm-yes" title="Yes"/>
      <button class="confirm-no" title="No"/>
    </div>
  </div>`), template(
    find('p').text(from('message')),
    find('.confirm-yes').on('click', (e, subject) => { subject.set('result', true); }),
    find('.confirm-no').on('click', (e, subject) => { subject.set('result', false); })
)) {
  _wireEvents() {
    positionFlyout(this.subject.get_('trigger'), this.artifact());
    this.destroyWith(this.subject);
  }
}

module.exports = {
  Confirm, ConfirmView,
  registerWith(library) { library.register(Confirm, ConfirmView); }
};

