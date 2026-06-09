import { MercadoPagoConfig, Payment } from 'mercadopago';

async function run() {
  try {
    const mp = new MercadoPagoConfig({ accessToken: 'APP_USR-5925942878336609-060810-869d45d8e136367b3eea1044dbb84861-1832224759' });
    const paymentClient = new Payment(mp);
    await paymentClient.create({
      body: {
        transaction_amount: 19.90,
        payment_method_id: 'pix',
        payer: { email: 'teste@email.com' },
        description: 'Página Romântica'
      }
    });
  } catch (err) {
    const e = err as { message?: string; response?: { message?: string } }
    const errorMsg = e?.message || e?.response?.message || (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err))
    console.log('errorMsg is:', errorMsg);
    console.log('err is:', err);
  }
}

run();
