import axios from "axios";
const stripe = Stripe('pk_test_51Oiyf9SBeM51ECZi7y8h7NYfWIG7UMMJ7eKVsWb04zrvenjvnlQzAazdtQg0fGUXCSgsFdvhZSOlmWvucz4oEoxs00MrW114BC');

export const bookTour = async tourId => {
  try {
    //1. Get checkout Session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session, 'sessionsss');

    // 2) Create checkout form + chanre credit card
    const res = await stripe.redirectToCheckout({
        sessionId: session.data.session.id
      });
      console.log(res);
    //2. create checkout form + change credit card
  } catch (err) {
    console.log(err);
  }
};
