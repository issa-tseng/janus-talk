const attr = (prop, data) => (dom, point, immediate = true) =>
  data.all.point(point).react(immediate, x => { dom.attr(prop, safe(x)); });


const setId = attr('id', from('id'));


const data = new Model({ id: 42 });
setId($('#target'), data.pointer());



// data.get('id').react(x => { $('#target').attr('id', x); });

