};

const pct = (x => `${x * 100}%`);

class Workspace extends Model {};
const WorkspaceView = DomView.build($('<div class="workspace"/>'),
  find('div').render(from('boxes')));

class Box extends Model {};
const BoxView = DomView.build($('<div class="box"/>'),
  find('div')
    .css('left', from('left').map(pct))
    .css('top', from('top').map(pct))
    .on('mousedown', drag(Workspace, 'left', 'top')));

