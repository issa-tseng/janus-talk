const l = new List([ 4, 8, 15, 16, 23, 42 ]);
l.map(x => x * 2);

l.foldl(0, (total, x) => total + x);

