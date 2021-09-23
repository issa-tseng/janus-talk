// models

const Task = Model.build(
  attribute('name', attribute.Text),
  attribute('done', attribute.Boolean)
);

class Checklist extends Model {}

// views

const TaskView = DomView.build($(`
<div class="task">
  <span class="done"/>
  <span class="name"/>
  <button>&times;</button>
</div>`), template(
  find('.done').render(from.attribute('done')),
  find('.name').render(from.attribute('name')),

  find('button').on('click', (_, task) => { task.destroy(); })
));

const ChecklistView = DomView.build($(`
<div class="todo">
  <p>Completed: <span class="done"/> of <span class="total"/></p>
  <div class="list"/>
  <button>New</button>
</div>`), template(
  find('.list').render(from('tasks')),

  find('.done').text(from('tasks').flatMap(ts => ts.filter(t => t.get('done')).length)),
  find('.total').text(from('tasks').flatMap(ts => ts.length)),

  find('button').on('click', (event, subject) => { subject.get_('tasks').add(new Task()); })
));

// app setup

const app = new App();
stdlib.view.registerWith(app.views);
app.views.register(Task, TaskView);
app.views.register(Checklist, ChecklistView);
const checklist = new Checklist({ tasks: new List() });

return app.view(checklist);

