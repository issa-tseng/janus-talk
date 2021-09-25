const janus = require('janus');
const stdlib = require('janus-stdlib');

const { Map, Model, attribute, initial, bind, from, List, Varying, App } = janus;
const { compile, success, fail, inert, Env } = require('../util/eval');
const { blank, nonblank, ifExists } = require('../util/util');
const { atomize, filterRequires, dereturn } = require('../util/code');
const { inspect } = require('../util/inspect');

const rootEnv = Object.assign({ $, stdlib, inspect }, janus);


const baseViews = () => {
  const { Library } = require('janus');
  const stdlib = require('janus-stdlib');
  const inspect = require('janus-inspect');

  const views = new Library();
  stdlib.view($).registerWith(views);
  inspect.view($).registerWith(views);
  return views;
};


// so, this used to be a beautiful purely functional databound process, which
// meant that statements all re-evaluated as necessary as edits were made. but
// i was unable to answer the questions "if a repl statement is impure, do we
// rerun that too? if not, how do we know it's impure?" such that the result
// seemed usable without an instruction manual. so now we have this chunky
// imperativeness instead. c'est la vie. :/
class Statement extends Model.build(
  attribute('name', attribute.Text),
  attribute('code', attribute.Text),
  bind('named', from('name').map(nonblank))
) {
  _initialize() {
    this.reactTo(this.get('result'), false, _ => { this.set('at', new Date()); });
  }

  commit() {
    // parse and atomize. bail if we can't run the thing.
    const code = this.get_('code');
    const atomized = filterRequires(atomize(code));
    if (atomized === false) return false;

    const own = atomized.shift();
    if (own[0] != null) {
      // our own statement has an assignment. regardless what we had already for
      // our name binding, clobber it with what's now been provided.
      const [ left, right ] = own;
      this.set('name', code.substring(left.start, left.end));
      this.set('code', code.substring(right.start, right.end));
    }

    const additional = [];
    if (atomized.length > 0) {
      const statements = this.get_('statements');
      // we have additional statements that have been split off. add them following
      // this one, and assign the name/code bindings appropriately as we do so.
      for (const [ left, right ] of atomized) {
        const name = (left == null) ? null : code.substring(left.start, left.end);
        const env = { base: this.get_('env.base') };
        additional.push(new Statement({
          statements, name, env, code: code.substring(right.start, right.end)
        }));
      }
      statements.add(additional, statements.list.indexOf(this) + 1);
    }

    // now, run our own code:
    this.run();

    // and then, if relevant, run the split-out statements that got added. we just
    // did all the parsing work so it's safe to just run it without commit.
    for (const statement of additional) statement.run();

    return true; // regardless of runtime errors, we at least tried to run. return true.
  }

  run() {
    // default an app reference:
    const app = new App({ views: baseViews() });

    // build a context of previous statement bindings.
    const context = Object.assign({ app }, this.get_('env.base'));
    for (const statement of this.get_('statements')) {
      if (statement === this) break;

      const name = statement.get_('name');
      if (blank(name)) continue;

      const result = statement.get_('result');
      if (success.match(result)) context[name] = result.getSuccess();
    }

    // build an environment, and compile and run our final code:
    const env = new Env(context);
    this.set('env.final', env); // save this for other purposes.

    const compiled = compile(env, `return ${this.get_('code')};`);
    try { this.set('result', compiled.flatMap((f) => f())); }
    catch(ex) { this.set('result', fail(ex)); }
  }

  runTail() {
    const statements = this.get_('statements');
    for (let idx = statements.list.indexOf(this); idx < statements.length_; idx++) {
      const statement = statements.get_(idx);
      const result = statement.get_('result');
      if ((result == null) || inert.match(result)) continue; // TODO: eliminate null case.
      statement.run();
    }
  }
}

class Reference extends Statement {
  commit() {}
  run() {}
}

class Repl extends Model.build(
  attribute('statements', attribute.List.withInitial()), // ref immutative
  initial.writing('env.inject', {}),

  attribute('pins', attribute.List.withInitial()),
  attribute('autopanel', attribute.Boolean) // TODO: => viewmodel?
) {
  _initialize() {
    this.set('env.base', new Env(rootEnv, this.get_('env.inject')));

    // any time the repl is empty, create a statement.
    const statements = this.get_('statements');
    statements.length.react((l) => { if (l === 0) this.createStatement(); });

    // any time the very last statement is finalized, make a new one following.
    statements.at(-1).flatMap(ifExists((s) => s.get('result'))).react((result) => {
      if (result != null) this.createStatement();
    });
  }

  createStatement(idx) {
    const statements = this.get_('statements');
    const statement = new Statement({ statements, env: { base: this.get_('env.base') } });
    statements.add(statement, idx);
    return statement;
  }

  transfer(code) {
    const last = this.get_('statements').get_(-1);
    const target = blank(last.get_('code')) ? last : this.createStatement();

    target.set('code', dereturn(code));
    target.commit();
  }

  reference(obj, name) {
    this.get_('statements').add(new Reference({ result: success(obj), name }), -1);
  }

  clear() {
    this.get_('pins').removeAll();
    this.get_('statements').removeAll();
  }
}

module.exports = { Statement, Reference, Repl };

