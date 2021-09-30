const app = new App();
stdlib.view($).registerWith(app.views);
app.views.register(Address, AddressView);
app.views.register(Payment, PaymentView);
return app.view(new Payment());
