const { fromEvents, sticky } = stdlib.varying;
const isHovered = (el => fromEvents(el, false, { mouseenter: true, mouseleave: false }));

const Flyout = Model.build(
  bind('hovered.trigger', from('trigger').flatMap(isHovered)),
  bind('hovered.flyout', from('flyout').flatMap(f => f ? isHovered(f) : false)),
  bind('hovered.any', from('hovered.trigger').and('hovered.flvout')
    .all.map((t, f) => t || f)),
  bind('active', from('hovered.any').pipe(sticky({ true: 250 })))
);

const px = (x => `${x + 5}px`);
class FlyoutView extends DomView.build(
  $(`<div class="flyout"/>`),
  find('div')
    .render(from('content'))
    .css('top', from('rect.bottom').map(px))
    .css('left', from('rect.left').map(px))
) {
  _wireEvents() {
    const trigger = this.subject.get_('trigger')[0];
    this.subject.set('rect', trigger.getBoundingClientRect().toJSON());
    this.subject.set('flyout', this.artifact());
  }
}

const flyout = (content) => (dom, point) => {
  const flyout = Varying.managed(
    (_ => new Flyout({ trigger: dom, content: content.all.point(point) })),
    (flyout => flyout)
  );

  const app = from.app().all.point(point).get();
  return Varying.all([ flyout, flyout.flatMap(f => f.get('active')) ])
    .react((flyout, active) => {
      if (active) app.get_('flyouts').add(flyout);
      else app.get_('flyouts').remove(flyout);
    });
}

const find2 = find.build({ ...mutators, flyout });
