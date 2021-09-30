const app = new App();
stdlib.view($).registerWith(app.views);
app.views.register(Workspace, WorkspaceView);
app.views.register(Box, BoxView);

const workspace = new Workspace({ boxes: new List([
  new Box({ left: 0.2, top: 0.2 }),
  new Box({ left: 0.5, top: 0.5 }),
  new Box({ left: 0.8, top: 0.8 })
]) });
const view = app.view(workspace);
view.wireEvents();

const inspected = new Varying();
return new List([ view, inspect.panel(workspace), inspected.map(inspect.panel) ]);
