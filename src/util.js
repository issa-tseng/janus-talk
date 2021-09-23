const $ = require('jquery');


var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi;
$.htmlPrefilter = (html => html.replace(rxhtmlTag, '<$1></$2>'));

$.fn.view = function() {
  let ptr = this;
  while (ptr.length > 0) {
    const view = ptr.data('view')
    if (view != null) return view;
    ptr = ptr.parent();
  }
};

$.fn.offsetCenter = function() {
  const offset = this.offset();
  offset.top += (this.height() / 2);
  offset.left += (this.width() / 2);
  return offset;
};

