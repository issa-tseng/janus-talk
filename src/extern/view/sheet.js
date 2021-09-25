const { DomView, template, find, from, Model } = require('janus');
const { Sheet } = require('../model/sheet');


const SheetView = DomView.build($(`
  <div class="sheet">
    <div class="sheet-header">
      <span class="sheet-title"/>
      <button class="sheet-close" title="Close"/>
    </div>
    <div class="sheet-contents"/>
  </div>`), template(

  find('.sheet-title').text(from('title')),
  find('.sheet-contents').render(from('target')),
  find('.sheet-close').on('click', (e, subject, view) => { subject.destroy(); })
))


module.exports = {
  SheetView,
  registerWith: (library) => { library.register(Sheet, SheetView); }
};

