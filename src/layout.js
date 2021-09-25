const { Trait, initial, bind, from } = require('janus');

const cheapGrid = (sections) => {
  let idx = 0, sect = 0, row = 0, col = 0;
  for (const section of sections) {
    col = 0;
    section.idx = idx;
    section.row = row;
    section.sect = sect++;
    for (const slide of section.get_('slides')) {
      if (col === 5) {
        row++;
        col = 0;
      }

      slide.idx = idx;
      slide.set('idx', idx++);
      slide.sect = sect;
      slide.row = row;
      slide.col = col++;
    }
    row++;
  }
};

const kscale = 0.12, kh = 110, kho = 130, kw = 110, ksect = 16;

const Layout = Trait(
  initial('origin.x', 0),
  initial('origin.y', 0),

  bind('layout-section', from('overview').and('active-idx')
    .all.map((overview, active) => ({ sect, row, idx }) => (overview === true)
      ? `translate(2vw, 5vh) scale(${kscale}) translate(0, ${(sect * ksect) + (row * kho)}vh)`
      : `translate(0, ${(idx - active) * kh}vh)`)),

  bind('layout-slide', from('overview').and('active-idx')
    .all.map((overview, active) => ({ sect, row, col, idx }) => (overview === true)
      ? `translate(2vw, 5vh) scale(${kscale}) translate(${col * kw}vw, ${(sect * ksect) + (row * kho)}vh)`
      : `translate(0, ${(idx - active) * kh}vh)`))
);

module.exports = { cheapGrid, Layout };

