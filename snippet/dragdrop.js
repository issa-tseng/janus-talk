const calc = (input, down, now) => (now != null) ? (input + now - down) : input;
class Drag extends Model.build(
  bind('out.x', from('in.x').and('down.x').and('now.x').all.flatMap(calc)),
  bind('out.y', from('in.y').and('down.y').and('now.y').all.flatMap(calc))
) {
  at_(prop, event) {
    if (arguments.length === 1) return (event => { this.at_(prop, event); });
    const container = this.get_('container');
    const { left, top } = container.position();
    this.set(prop, {
      x: (event.pageX - left) / container.width(),
      y: (event.pageY - top) / container.height()
    });
  }
}

const drag = (parent, xname, yname) => (event, it, view) => {
  event.preventDefault();
  const operation = new Drag({
    container: view.closest_(parent).artifact(),
    in: { x: it.get_(xname), y: it.get_(yname) }
  });
  operation.at_('down', event);
  operation.listenTo($(window), 'mousemove', operation.at_('now'));
  operation.reactTo(operation.get('out.x'), it.set(xname));
  operation.reactTo(operation.get('out.y'), it.set(yname));
  $(window).one('mouseup', (() => { operation.destroy(); }));
