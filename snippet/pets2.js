const dog = new Model({ name: 'dog', mammal: true });
const cat = new Model({ name: 'cat', mammal: true });
const parrot = new Model({ name: 'parrot', mammal: false });

const Pet = Model.build(
  attribute('name', attribute.Text),
  attribute('kind', class extends attribute.Enum {
    _values() { return new List([ dog, cat, parrot ]); }
  }));

const PetEditor = DomView.build(
  $('<div class="pet"><span class="name"/><span class="kind"/></div>'),
  template(
    find('.name').render(from.attribute('name')),
    find('.kind').render(from.attribute('kind'))
      .options({ stringify: (k => k.get('name')) })
  ));

const pets = new List([
  new Pet({ name: 'Kenka', kind: dog }),
  new Pet({ name: 'Gertrude', kind: cat }),
  new Pet({ name: 'Maizie', kind: dog }),
  new Pet({ name: 'Widget', kind: cat }),
  new Pet({ name: 'Squawks', kind: parrot })
]);
const editors = pets.map(pet => new PetEditor(pet, { app }));
const dogNames = pets
  .filter(pet => pet.get('kind').map(kind => kind === dog))
  .flatMap(pet => pet.get('name'));

return new List([ inspect(dog), editors, dogNames ]);

