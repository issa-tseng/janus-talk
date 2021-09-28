const Task = Model.build(
  attribute('name', attribute.Text),
  attribute('done', attribute.Boolean)
);

class Checklist extends Model {}
