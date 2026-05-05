import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { q: "What is FitTrack?",
      a: "FitTrack is Sri Lanka's complete fitness platform connecting clients with certified trainers. It offers weekly workout and meal plans, BMI tracking, weight progress charts, real-time chat, and AI goal predictions." },
    { q: "How do I get started?",
      a: "Register for a free account, complete your profile, then browse verified trainers. Send a subscription request to your chosen trainer and get started once they accept!" },
    { q: "How does the meal plan work?",
      a: "Your trainer creates a weekly meal plan using our Sri Lankan food database with 57+ local foods. You see each day's meals with calories, mark them as completed, and track your daily calorie intake." },
    { q: "Can I chat with my trainer?",
      a: "Yes! FitTrack has real-time WebSocket chat. Messages appear instantly — no refresh needed. You can message your trainer anytime from the Chat section." },
    { q: "How does progress tracking work?",
      a: "Log your weight daily, set a goal weight, and FitTrack shows you a line chart of your progress. Our AI predicts when you'll reach your goal based on your current rate of change." },
    { q: "Can I rate my trainer?",
      a: "Yes! After your subscription is active or expired, you can rate your trainer with 1-5 stars and write a review. Reviews are shown publicly on the trainers page." },
    { q: "What happens when my subscription expires?",
      a: "You'll see an EXPIRED status on your payments page. You can renew with the same trainer or choose a new one. Your workout and meal plans remain visible." },
    { q: "Do trainers need to be verified?",
      a: "Yes. All trainers must submit valid certifications that are reviewed and approved by our admin team before they can accept clients." },
    { q: "How do I cancel my subscription?",
      a: "Go to Payments → find your active subscription → click Cancel. No cancellation fees apply. Your access continues until the end of the billing period." },
    { q: "Is my payment information safe?",
      a: "Yes. FitTrack does not store any card details on our servers. All payments are processed securely through trusted payment gateways." },
  ];

  return (
    <div className="text-gray-800">

      {/* ── HERO ── */}
      <div className="relative text-white px-6 pt-32 pb-16"
        style={{ background: `linear-gradient(135deg,
          ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center
                        relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/20
                          flex items-center justify-center
                          text-3xl mx-auto mb-4">
            ❓
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-blue-100 text-xl">
            Find answers to common questions about FitTrack
          </p>
        </div>
        <div className="absolute right-10 top-8 w-40 h-40
                        bg-white/10 rounded-full"/>
      </div>

      {/* ── FAQ LIST ── */}
      <section className="py-20 px-6"
        style={{ background: "#f0f9ff" }}>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((item, i) => (
            <div key={i}
              className="bg-white rounded-2xl shadow-sm
                         overflow-hidden">
              <button
                onClick={() => setOpenIndex(
                  openIndex === i ? null : i
                )}
                className="w-full px-6 py-5 flex justify-between
                           items-center text-left">
                <span className="font-semibold text-gray-800
                                  pr-4">
                  {item.q}
                </span>
                <span className="text-2xl flex-shrink-0
                                  transition-transform duration-200"
                  style={{
                    color: BLUE,
                    transform: openIndex === i
                      ? "rotate(45deg)" : "rotate(0deg)"
                  }}>
                  +
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5"
                  style={{ borderTop:
                    `1px solid ${BLUE_LIGHT}` }}>
                  <p className="text-gray-600 text-sm
                                 leading-relaxed pt-4">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── SUPPORT CTA ── */}
        <div className="max-w-3xl mx-auto mt-12
                        rounded-2xl p-10 text-center"
          style={{ background: BLUE_LIGHT }}>
          <h2 className="text-2xl font-bold text-gray-800">
            Still have questions?
          </h2>
          <p className="text-gray-500 mt-2">
            Our support team is ready to help you!
          </p>
          <button onClick={() => navigate("/contact")}
            className="mt-6 px-8 py-3 rounded-xl text-white
                       font-bold transition-all hover:scale-105"
            style={{ background: BLUE }}>
            Contact Support
          </button>
        </div>
      </section>
    </div>
  );
}