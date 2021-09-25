const { Trait, initial, bind, from } = require('janus');

const cheapGrid = (sections) => {
  let idx = 0, sect = 0, row = -1, col = 0;
  for (const section of sections) {
    section.idx = idx;
    section.sect = sect++;
    section.row = ++row;
    section.col = col = 0;
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
  }
};

const kscale = 0.12, kh = 110, kho = 130, kwo = 110, ksect = 16;

const Layout = Trait(
  initial('origin.x', 0),
  initial('origin.y', 0),

  bind('layout', from('overview').and('active-idx')
    .all.map((overview, active) => ({ sect, row, col, idx }) => (overview === true)
      ? `translate(2vw, 5vh) scale(${kscale}) translate(${col * kwo}vw, ${(sect * ksect) + (row * kho)}vh)`
      : `translate(0, ${(idx - active) * kh}vh)`))
);

module.exports = { cheapGrid, Layout };

