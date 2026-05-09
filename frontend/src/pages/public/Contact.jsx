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
      Swal.fire("Error", "Please fill all required fields", "error");
      return;
    }

    if (!form.email.includes("@")) {
      Swal.fire("Error", "Please enter a valid email address", "error");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("http://localhost:8080/api/contact/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject || "Contact Form Message",
          message: form.message,
        }),
      });

      // Email sent successfully regardless of response parsing
      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          title: "Message Sent! ✅",
          text: "Our team will get back to you within 24 hours!",
          icon: "success",
          confirmButtonColor: BLUE,
        });
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        // Try to read error
        try {
          const data = await res.json();
          Swal.fire("Error", data.message || "Failed to send. Please try again.", "error");
        } catch {
          Swal.fire("Error", "Failed to send. Please try again.", "error");
        }
      }
    } catch (err) {
      // Network error
      Swal.fire("Error", "Cannot connect to server. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="text-gray-800">

      {/* HERO */}
      <div className="relative text-white px-6 pt-32 pb-16"
        style={{ background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-blue-100 text-xl">
            We'd love to hear from you. Send us a message!
          </p>
        </div>
        <div className="absolute right-10 top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute left-10 bottom-4 w-24 h-24 bg-white/10 rounded-full" />
      </div>

      <section className="py-20 px-6" style={{ background: "#f0f9ff" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">

          {/* INFO CARDS */}
          <div className="space-y-4">
            {[
              { icon: "📧", title: "Email",          value: "support@fittrack.lk",  sub: "We reply within 24 hours" },
              { icon: "📞", title: "Phone",          value: "+94 11 234 5678",       sub: "Mon-Fri, 9am-6pm"         },
              { icon: "📍", title: "Location",       value: "Colombo, Sri Lanka",    sub: "Head Office"              },
              { icon: "⏰", title: "Support Hours",  value: "Mon-Fri",               sub: "9:00 AM – 6:00 PM"        },
            ].map(({ icon, title, value, sub }) => (
              <div key={title} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: BLUE_LIGHT }}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400">{title}</p>
                  <p className="font-bold text-gray-800 text-sm">{value}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FORM */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Send us a Message</h2>
            <p className="text-sm text-gray-400 mb-6">Fill the form below and we'll get back to you shortly!</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Your Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Email Address *</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@email.com"
                    type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Subject</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows="5"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 hover:opacity-90"
                style={{ background: BLUE }}>
                {sending ? "⏳ Sending..." : "✉️ Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}