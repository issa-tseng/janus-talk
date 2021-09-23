const { Trait, initial, bind, from } = require('janus');

const translate = ({ x, y }) => `translate(${x}vw, ${y}vh)`;

const scaleFactor = 0.12;

const Layout = Trait(
  initial('origin.x', 0),
  initial('origin.y', 0),

  bind('layout', from('overview').and('origin.x').and('origin.y')
    .all.map((overview, ox, oy) => ({ sect, row, col, idx }) =>
      (overview === true)
        ? { x: (col * 110) - ox, y: (sect * 30) + (row * 130) - oy }
        : { x: 0, y: idx * 110 })),

  bind('viewport', from('overview').and('origin.x').and('origin.y')
    .all.map((overview, ox, oy) => ({ idx }) =>
      (overview === true) ? `translate(${2 + (ox * scaleFactor)}vw, ${5 + (oy * scaleFactor)}vh) scale(${scaleFactor})`
        : `translate(0, ${idx * -110}vh`))
);

module.exports = { translate, Layout };

