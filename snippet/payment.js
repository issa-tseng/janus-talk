const Address = Model.build(
  attribute('street', attribute.Text),
  attribute('city', attribute.Text),
  attribute('country', attribute.Text)
);

const Payment = Model.build(
  attribute('fund', class extends attribute.Enum {
    _values() { return [
      'Community Bail Fund',
      'Total Abolition Fund',
      'Mutual Aid Fund'
    ]; }
  }),
  attribute('amount', attribute.Number),

  attribute('name', attribute.Text),
  attribute('ccn', attribute.Text),

  attribute('billing-address', attribute.Model.of(Address).withInitial()),
  attribute('shipping-address', attribute.Model.of(Address).withInitial())
);


const AddressView = DomView.build($(`
  <div class="address">
    <label><div class="street"/>street</label>
    <label><div class="city"/>city</label>
  </div>
`), template(
  find('.street').render(from.attribute('street')),
  find('.city').render(from.attribute('city'))
));
