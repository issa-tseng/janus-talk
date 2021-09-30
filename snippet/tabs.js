const Document = Model.build(
  initial('name', 'Untitled', attribute.Text),
  attribute('content', attribute.Text)
);

const Editor = Model.build(
  initial.writing('documents', () => new List([ new Document() ])),
  attribute('active-document', class extends attribute.Enum {
    initial() { return this.model.get_('documents').at_(0); }
    _values() { return from('documents'); }
  })
);

const DocumentView = DomView.build($(`
  <div class="document">
    <div class="name"/>
    <div class="content"/>
  </div>
`), template(
  find('.name').render(from.attribute('name')),
  find('.content').render(from.attribute('content'))
    .criteria({ style: 'multiline' })
));

const TabView = DomView.build(
  $(`<div class="tab"/>`),
  find('div').text(from('name'))
);

const EditorView = DomView.build($(`
  <div class="application">
    <div class="tabs"/>
    <button>+</button>
    <div class="active-document"/>
  </div>
`), template(
  find('.tabs').render(from.attribute('active-document'))
    .criteria({ style: 'list' })
    .options({ renderItem: (i => i.context('tab')) }),
  find('button').on('click', (_, editor) => { editor.get_('documents').add(new Document()); }),
  find('.active-document').render(from('active-document'))
));

const app = new App();
stdlib.view($).registerWith(app.views);
app.views.register(Document, DocumentView);
app.views.register(Document, TabView, { context: 'tab' });
app.views.register(Editor, EditorView);
return app.view(new Editor());

