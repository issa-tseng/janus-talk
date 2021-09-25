const { parse } = require('cherow');
const { blank } = require('../util/util');

// recursive helper for atomize below.
// one case we don't (yet?) account for is sequence expressions mixing assignment
// and other statements; for example:
// myvar = 4, f(), yourvar = 6;
const _atomize = (nodes) => {
  const result = [];
  for (const node of nodes) {
    // first, our recursive cases.
    if ((node.type === 'ExpressionStatement') &&
      (node.expression.type === 'SequenceExpression') &&
      (node.expression.expressions.every((e) => e.type === 'AssignmentExpression')))
      Array.prototype.push.apply(result, _atomize(node.expression.expressions));
    else if (node.type === 'VariableDeclaration')
      Array.prototype.push.apply(result, _atomize(node.declarations));

    // then, our atomic ones.
    else if ((node.type === 'ExpressionStatement') &&
      (node.expression.type === 'AssignmentExpression') &&
      (node.expression.left.type === 'Identifier'))
      result.push([ node.expression.left, node.expression.right ]);
    else if ((node.type === 'AssignmentExpression') && (node.left.type === 'Identifier'))
      result.push([ node.left, node.right ]);
    else if ((node.type === 'VariableDeclarator') && (node.id.type === 'Identifier'))
      result.push([ node.id, node.init ]);
    else
      result.push([ null, node ]);
  }
  return result;
};

// atomizes the code. this splits statements apart, and splits assignments
// if present. it returns either false, or an ast tree.
const atomize = (code) => {
  if (blank(code)) return false; // if no code, do nothing.

  let tree; // es6 is the best
  try {
    tree = parse(code, { ranges: 'index' });
  } catch(ex) { // TODO: return + show what the exception is?
    return false; // if we don't compile, bail and allow newline.
  }

  // again, if there is no code, do nothing. otherwise, process and return.
  return (tree.body.length === 0) ? false : _atomize(tree.body);
};

// TODO: some bug here where pairs may not have #filter
const filterRequires = (pairs) => pairs.filter((p) =>
  !((p[1].type === 'CallExpression') &&
    (p[1].callee.type === 'Identifier') && (p[1].callee.name === 'require')));

// recevies a code string, and returns a new code string with any root-level
// return statements removed. we do this because in the samples we return to
// output result data, but the repl shows expression results directly and won't
// execute the return statements sensibly.
//
// if anything goes wrong at any point, we just return the original code.
const dereturn = (code) => {
  const wrapped = `_=>{${code}}`;

  let tree; // again, thank you based es6.
  try { tree = parse(wrapped, { ranges: 'index' }); }
  catch(ex) { return code; }

            // prgm-----   expr------ arrw block
  const body = tree.body[0].expression.body.body;
  let result = '';

  // go through the root statements. we track a return-less span of the string at
  // a time, and each time we see a return we output that span then start it again
  // with the start of the return subexpression.
  // we also have to track a ptr to mind the gap between the end of the previous
  // statement and the start of the present one.
  let head = 0, tail = 0, ptr = 4;
  for (const stmt of body) {
    tail += (stmt.start - ptr);
    ptr = stmt.end;

    if (stmt.type === 'ReturnStatement') {
      result += code.slice(head, tail);
      head = tail + (stmt.argument.start - stmt.start);
      tail = head + (stmt.end - stmt.argument.start);
    } else {
      tail += (stmt.end - stmt.start);
    }
  }

  // now output any leftovers if we have any.
  if (head < tail) result += code.slice(head, tail);
  return result;
};

module.exports = { atomize, filterRequires, dereturn };

