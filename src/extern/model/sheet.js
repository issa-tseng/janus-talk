const { Model } = require('janus');

class Sheet extends Model {
  _initialize() { this.destroyWith(this.get_('target')); }
}

module.exports = { Sheet };

