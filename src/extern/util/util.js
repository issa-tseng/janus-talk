const identity = (x) => x;

const exists = (x) => (x != null);
const nonblank = (x) => (x != null) && (x !== '');
const blank = (x) => (x == null) || (x === '');

const not = (x) => !x;
const equals = (x, y) => x === y;
const give = (x) => () => x;

const ifExists = (f) => (x) => (x == null) ? null : f(x);
const debounce = (interval, f) => {
  let timer;
  return () => {
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => { f(); timer = null; }, interval);
  };
};

module.exports = { identity, exists, nonblank, blank, not, equals, give, ifExists, debounce };

