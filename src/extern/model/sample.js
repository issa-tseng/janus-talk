const janus = require('janus');
const { Model, attribute, initial, List, bind, from, DomView, App, Library } = janus;
const stdlib = require('janus-stdlib');
const { inspect } = require('../util/inspect');
const { compile, success, fail, inert, Env } = require('../util/eval');
const { ifExists } = require('../util/util');


// create a reasonable base app for samples to use:
const views = new Library();
stdlib.view($).registerWith(views);
const app = new App({ views });


// assembles code from snippets, then compiles and runs it.
const Sample = Model.build(
  initial('env', new Env({ $, stdlib, inspect, app }, janus)),

  bind('main', from('snippets').and('pick').all.flatMap((snippets, pick) =>
    (snippets == null) ? '' :
    (new List(pick))
      .flatMap(p => snippets.get(p).flatMap(ifExists(s => s.get('snippet'))))
      .foldl('', (a, b) => a + b))),

  bind('compiled', from('env').and('main').all.map(compile)),
  bind('result', from.self().and('compiled')
    .all.flatMap((self, proc) => proc.flatMap(f => f()))
    .map(c => c.get())) // in docs we cared about the result case type. here, no.
);

const Samples = List.of(Sample);

module.exports = { Sample, Samples };

