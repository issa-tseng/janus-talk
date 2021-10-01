const data = new Model({ x: 2, y: 3 });
return inspect.panel(
  Varying.all([ data.get('x'), data.get('y') ]).map((x, y) => x + y)
);
