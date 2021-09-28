const app = new App();
stdlib.view($).registerWith(app.views);
app.views.register(Task, TaskView);
app.views.register(Checklist, ChecklistView);
const checklist = new Checklist({ tasks: new List() });

return app.view(checklist);
