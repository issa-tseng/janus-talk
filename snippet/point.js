const chain = from('x').and('y').all.flatMap((x, y) => x + y);

const data = new Model({ x: 2, y: 3 });
return inspect.panel(chain.point(match(
  types.from.dynamic(key => data.get(key))
)));
