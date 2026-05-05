import { useState } from "react";
import Swal from "sweetalert2";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", subject: "", message: ""
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      Swal.fire("Error", "Please fill all required fields",
        "error");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    Swal.fire({
      title: "Message Sent! ✅",
      text: "Our team will get back to you within 24 hours",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
    setForm({ name: "", email: "",
      subject: "", message: "" });
    setSending(false);
  };

  return (
    <div className="text-gray-800">

      {/* ── HERO ── */}
      <div className="relative text-white px-6 pt-32 pb-16"
        style={{ background: `linear-gradient(135deg,
          ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center
                        relative z-10">
          <h1 className="text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-blue-100 text-xl">
            We'd love to hear from you. Send us a message!
          </p>
        </div>
        <div className="absolute right-10 top-8 w-40 h-40
                        bg-white/10 rounded-full"/>
      </div>

      <section className="py-20 px-6"
        style={{ background: "#f0f9ff" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3
                        gap-8">

          {/* ── INFO CARDS ── */}
          <div className="space-y-4">
            {[
              { icon: "📧", title: "Email",
                value: "support@fittrack.lk",
                sub: "We reply within 24 hours" },
              { icon: "📞", title: "Phone",
                value: "+94 11 234 5678",
                sub: "Mon-Fri, 9am-6pm" },
              { icon: "📍", title: "Location",
                value: "Colombo, Sri Lanka",
                sub: "Head Office" },
              { icon: "⏰", title: "Support Hours",
                value: "Mon-Fri",
                sub: "9:00 AM – 6:00 PM" },
            ].map(({ icon, title, value, sub }) => (
              <div key={title}
                className="bg-white rounded-2xl p-5
                           shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl
                                flex items-center
                                justify-center text-2xl
                                flex-shrink-0"
                  style={{ background: BLUE_LIGHT }}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    {title}
                  </p>
                  <p className="font-bold text-gray-800 text-sm">
                    {value}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FORM ── */}
          <div className="md:col-span-2 bg-white rounded-2xl
                          shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800
                            mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit}
              className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500
                                    mb-1 block">
                    Your Name *
                  </label>
                  <input name="name" value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full border border-gray-200
                               rounded-xl px-4 py-3
                               text-gray-800 focus:outline-none
                               text-sm"/>
                </div>
                <div>
                  <label className="text-sm text-gray-500
                                    mb-1 block">
                    Email Address *
                  </label>
                  <input name="email" value={form.email}
                    onChange={handleChange}
                    placeholder="john@email.com"
                    type="email"
                    className="w-full border border-gray-200
                               rounded-xl px-4 py-3
                               text-gray-800 focus:outline-none
                               text-sm"/>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500
                                  mb-1 block">
                  Subject
                </label>
                <input name="subject" value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full border border-gray-200
                             rounded-xl px-4 py-3
                             text-gray-800 focus:outline-none
                             text-sm"/>
              </div>
              <div>
                <label className="text-sm text-gray-500
                                  mb-1 block">
                  Message *
                </label>
                <textarea name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us more..."
                  rows="5"
                  className="w-full border border-gray-200
                             rounded-xl px-4 py-3
                             text-gray-800 focus:outline-none
                             text-sm resize-none"/>
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl text-white
                           font-bold text-sm transition-all
                           active:scale-95 disabled:opacity-50"
                style={{ background: BLUE }}>
                {sending ? "Sending..." : "✉️ Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}