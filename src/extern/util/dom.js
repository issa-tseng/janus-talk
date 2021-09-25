const { min } = Math;

const positionFlyout = (trigger, flyout, margin = 20) => { // margin in px
  const offset = trigger.offset();
  const bottomEdge = window.scrollY + window.innerHeight;
  const flyoutWidth = flyout.width();
  const flyoutHeight = flyout.height();
  const naiveTop = offset.top + trigger.outerHeight();
  if ((naiveTop + flyoutHeight) > (bottomEdge - margin)) {
    flyout.css('top', bottomEdge - margin - flyoutHeight);
    const triggerWidth = trigger.outerWidth();
    const squirtRight = offset.left + triggerWidth;
    if ((squirtRight + flyoutWidth) > (window.innerWidth - margin))
      flyout.css('left', offset.left - flyoutWidth);
    else
      flyout.css('left', squirtRight);
  } else {
    flyout.css('top', naiveTop);
    flyout.css('left', min(offset.left, $(window).width() - flyout.outerWidth() - margin));
  }
};

module.exports = { positionFlyout };

