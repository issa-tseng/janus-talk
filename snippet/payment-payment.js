class PaymentViewModel extends Model.build(
  attribute('different-address', attribute.Boolean),
  bind('network', from.subject('ccn').map(n =>
    /^4/.test(n) ? 'visa'
    : ('2221' < n && n < '2721') ? 'mastercard'
    : ('51' < n && n < '56') ? 'mastercard'
    : 'unknown'))
) {
  _initialize() {
    const payment = this.get_('subject');
    this.get('different-address').react(different => {
      if (different) return;
      payment.set('shipping-address', payment.get_('billing-address').shadow());
    });
  }
}

const PaymentView = DomView.build(PaymentViewModel, $(`
  <div class="payment">
    <label><div class="fund"/>fund</label>
    <label><div class="amount"/>amount</label>
    <hr/>
    <label><div class="name"/>name</label>
    <label><div class="ccn"/>cc#</label>
    <div class="networks">
      <span class="visa"/>
      <span class="mastercard"/>
    </div>
    <div class="billing-address"/>
    <label><span class="different-address"/>ship stickers to a different address</label>
    <div class="shipping-address"/>
  </div>
`), template(
  find('.fund').render(from.attribute('fund')),
  find('.amount').render(from.attribute('amount')),

  find('.name').render(from.attribute('name')),
  find('.ccn').render(from.attribute('ccn')),
  find('.networks').classGroup('network-', from.vm('network')),
  find('.month').render(from.attribute('month')),
  find('.year').render(from.attribute('year')),

  find('.billing-address').render(from('billing-address')),
  find('.different-address').render(from.vm().attribute('different-address')),
  find('.shipping-address')
    .render(from('shipping-address'))
    .classed('active', from.vm('different-address'))
));
