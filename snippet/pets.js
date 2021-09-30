const kinds = new Set([ 'dog', 'cat', 'rabbit', 'hamster', 'iguana', 'parrot' ]);

const Pet = Model.build(
  attribute('name', attribute.Text),
  attribute('kind', class extends attribute.Enum {
    _values() { return kinds; }
  }));

const PetEditor = DomView.build(
  $('<div class="pet"><span class="name"/><span class="kind"/></div>'),
  template(
    find('.name').render(from.attribute('name')),
    find('.kind').render(from.attribute('kind'))
  ));

const pets = new List([
  new Pet({ name: 'Kenka', kind: 'dog' }),
  new Pet({ name: 'Gertrude', kind: 'cat' }),
  new Pet({ name: 'Maizie', kind: 'dog' }),
  new Pet({ name: 'Widget', kind: 'cat' }),
  new Pet({ name: 'Squawks', kind: 'parrot' })
]);
const editors = pets.map(pet => new PetEditor(pet, { app }));
const dogNames = pets
  .filter(pet => pet.get('kind').map(kind => kind === 'dog'))
  .flatMap(pet => pet.get('name'));

return new List([ editors, dogNames ]);

