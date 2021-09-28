const Task = Model.build(
  attribute('done', attribute.Boolean),
  attribute('name', attribute.Text)
);

class Checklist extends Model {}
