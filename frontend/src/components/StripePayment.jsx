import { useState } from "react";
import {
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import api from "../api/api";
import Swal from "sweetalert2";

const BLUE = "#29ABE2";

const CARD_STYLE = {
  style: {
    base: {
      fontSize: "16px",
      color: "#374151",
      fontFamily: "sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

export default function StripePayment({
  sub, onSuccess, onCancel
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardName, setCardName] = useState("");
  const [error, setError] = useState("");

  const amount = sub.trainerPrice
    ? sub.trainerPrice.toLocaleString() : "N/A";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!cardName.trim()) {
      setError("Please enter cardholder name");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // step 1 — create payment intent
      const intentRes = await api.post(
        `/api/payment/create-intent/${sub.id}`
      );
      const { clientSecret } = intentRes.data;

      // step 2 — confirm payment with Stripe
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: { name: cardName },
          },
        });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // step 3 — confirm with backend
        await api.post(
          `/api/payment/confirm/${sub.id}`,
          { paymentIntentId: paymentIntent.id }
        );

        onSuccess({
          amount,
          paymentRef: paymentIntent.id,
          trainerName: sub.trainerName,
        });
      }
    } catch (err) {
      setError(
        err?.response?.data ||
        "Payment failed. Please try again."
      );
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}
      className="space-y-4">

      {/* SUMMARY */}
      <div className="p-4 rounded-xl"
        style={{ background: "#f0fdf4",
                 border: "1px solid #bbf7d0" }}>
        <p className="text-sm text-gray-600">
          Trainer: <strong>{sub.trainerName}</strong>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Duration: <strong>30 days</strong>
        </p>
        <p className="text-base font-bold mt-1"
          style={{ color: "#16a34a" }}>
          Amount: LKR {amount}
        </p>
      </div>

      {/* CARDHOLDER NAME */}
      <div>
        <label className="block text-sm font-medium
                          text-gray-700 mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="Name on card"
          className="w-full px-4 py-2.5 rounded-xl
                     border border-gray-200 text-sm
                     text-gray-800 focus:outline-none
                     focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* STRIPE CARD ELEMENT */}
      <div>
        <label className="block text-sm font-medium
                          text-gray-700 mb-1">
          Card Details
        </label>
        <div className="px-4 py-3 rounded-xl border
                        border-gray-200 bg-white">
          <CardElement options={CARD_STYLE} />
        </div>
      </div>

      {/* TEST CARD HINT */}
      <div className="p-3 rounded-xl text-xs"
        style={{ background: "#fefce8",
                 border: "1px solid #fde68a",
                 color: "#92400e" }}>
        <p className="font-semibold mb-1">
          Test card:
        </p>
        <p>Number: 4242 4242 4242 4242</p>
        <p>Expiry: Any future date | CVV: Any 3 digits</p>
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* BUTTONS */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-2.5 rounded-xl border
                     border-gray-200 text-sm font-semibold
                     text-gray-600 hover:bg-gray-50
                     disabled:opacity-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-2.5 rounded-xl text-white
                     text-sm font-semibold
                     disabled:opacity-60"
          style={{ background: BLUE }}>
          {processing
            ? "Processing..."
            : `Pay LKR ${amount}`}
        </button>
      </div>
    </form>
  );
}