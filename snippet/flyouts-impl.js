class Person extends Model {}
const PersonView = DomView.build(
  $(`<div class="person"/>`),
  find2('.person')
    .text(from('name'))
    .flyout(from('friends'))
);

const AppView = DomView.build($(`
  <div class="content"/>
  <div class="flyouts"/>
`), template(
  find('.content').render(from('content')),
  find('.flyouts').render(from('flyouts'))
));

const app = new App({ flyouts: new List() });
stdlib.view($).registerWith(app.views);
app.views.register(App, AppView);
app.views.register(Flyout, FlyoutView);
app.views.register(Person, PersonView);

app.set('content', new Person({
  name: 'Blanca',
  friends: new List([
    new Person({ name: 'Angel',
      friends: new List([ new Person({ name: 'Papi' }) ]) }),
    new Person({ name: 'Pray Tell',
      friends: new List([ new Person({ name: 'Ricky' }) ]) })
  ])
}));

return app.view(app);

