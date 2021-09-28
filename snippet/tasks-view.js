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
<div class="checklist">
  <p><span class="done"/> of <span class="total"/> complete</p>
  <div class="list"/>
  <button>New</button>
</div>`), template(
  find('.list').render(from('tasks')),

  find('.done').text(from('tasks').flatMap(ts => ts.filter(t => t.get('done')).length)),
  find('.total').text(from('tasks').flatMap(ts => ts.length)),

  find('button').on('click', (event, subject) => { subject.get_('tasks').add(new Task()); })
));
