// IMPORTANT! this code makes NO EFFORT to sandbox userland code for security
// purposes. it's not possible to do so, and so we don't even try.

const janus = require('janus');
const cases = { success, fail, inert } = janus.Case.build('success', 'fail', 'inert');

// special method for success/fail cases which flatMaps successes/fails appropriately.
// TODO: non-hack way to do this.
success().__proto__.flatMap = function(f) { return f(this.get()); };
fail().__proto__.flatMap = function() { return this; };
inert().__proto__.flatMap = function() { return this; };

const compile = (env, code) => {
  const inject = `const { ${Object.keys(env).join(', ')} } = __env`;

  try {
    const f_ = new Function('__env', '__arg', `${inject};return (function() {\n${code};\n})();`);
    const wrapped = (x) => {
      try {
        return success(f_.call(null, env, x));
      } catch(ex) { return fail(ex); }
    };
    return success(wrapped);
  } catch(ex) {
    return fail(ex);
  }
};

// we need env to not be a plain object so that it assigns into Model as a single
// unit. so we make it a simple class.
class Env { constructor(...props) { Object.assign(this, ...props); } };

module.exports = { compile, success, fail, inert, Env };

