import { useNavigate } from "react-router-dom";

const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function About() {
  const navigate = useNavigate();

  const features = [
    { icon: "🥗", title: "Sri Lankan Food Database",
      desc: "57+ local foods with accurate calorie and macro data for meal planning." },
    { icon: "💪", title: "Weekly Workout Plans",
      desc: "Day-by-day exercise schedules with YouTube video guides." },
    { icon: "💬", title: "Real-Time Chat",
      desc: "WebSocket-powered instant messaging between clients and trainers." },
    { icon: "📊", title: "Progress Tracking",
      desc: "Weight logs, BMI history, charts and AI goal prediction." },
    { icon: "⭐", title: "Trainer Reviews",
      desc: "Rate and review trainers to help others make informed decisions." },
    { icon: "💳", title: "Secure Payments",
      desc: "Safe subscription management with payment processing." },
  ];

  return (
    <div className="text-gray-800">

      {/* ── HERO ── */}
      <div className="relative text-white px-6 pt-32 pb-16"
        style={{ background: `linear-gradient(135deg,
          ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center
                        relative z-10">
          <h1 className="text-5xl font-bold mb-4">
            About FitTrack
          </h1>
          <p className="text-blue-100 text-xl max-w-2xl
                        mx-auto leading-relaxed">
            Sri Lanka's complete fitness ecosystem connecting
            clients, trainers, and administrators in one
            powerful platform.
          </p>
        </div>
        <div className="absolute right-10 top-8 w-40 h-40
                        bg-white/10 rounded-full"/>
        <div className="absolute left-10 bottom-4 w-24 h-24
                        bg-white/10 rounded-full"/>
      </div>

      {/* ── MISSION & VISION ── */}
      <section className="py-20 px-6"
        style={{ background: "#f0f9ff" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2
                        gap-10">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="w-14 h-14 rounded-xl flex
                            items-center justify-center
                            text-3xl mb-4"
              style={{ background: BLUE_LIGHT }}>
              🎯
            </div>
            <h2 className="text-2xl font-bold text-gray-800
                            mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              At FitTrack, we believe everyone deserves
              access to professional fitness guidance and
              powerful tracking tools. Our mission is to
              democratize fitness in Sri Lanka by connecting
              people with certified trainers and providing
              comprehensive health tracking capabilities.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="w-14 h-14 rounded-xl flex
                            items-center justify-center
                            text-3xl mb-4"
              style={{ background: BLUE_LIGHT }}>
              🌟
            </div>
            <h2 className="text-2xl font-bold text-gray-800
                            mb-4">
              Our Vision
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We envision a world where achieving fitness
              goals is accessible, trackable, and sustainable
              for every Sri Lankan. Through technology and
              expert guidance, we're making fitness
              transformation a reality for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center
                          text-gray-800 mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4
                          gap-6 text-center">
            {[
              { icon: "🎯", title: "Goal Oriented",
                desc: "Set and achieve measurable goals",
                color: "#E8F7FD" },
              { icon: "👥", title: "Community",
                desc: "Connect with fitness enthusiasts",
                color: "#f0fdf4" },
              { icon: "🎓", title: "Professional",
                desc: "Certified trainers only",
                color: "#fef9f0" },
              { icon: "❤️", title: "Health First",
                desc: "Your health is our priority",
                color: "#fef2f2" },
            ].map(({ icon, title, desc, color }) => (
              <div key={title}
                className="rounded-2xl p-6 text-center">
                <div className="w-16 h-16 rounded-full
                                mx-auto flex items-center
                                justify-center text-3xl mb-4"
                  style={{ background: color }}>
                  {icon}
                </div>
                <h3 className="font-bold text-gray-800">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6"
        style={{ background: "#f0f9ff" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center
                          text-gray-800 mb-4">
            Platform Features
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Everything you need in one place
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl p-6
                           shadow-sm hover:shadow-md
                           transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center
                          text-gray-800 mb-12">
            Built For Everyone
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "For Clients", color: BLUE,
                icon: "🏃",
                items: [
                  "Personalized workout plans",
                  "Weekly meal plans with Sri Lankan foods",
                  "BMI calculator & history",
                  "Progress charts & AI predictions",
                  "Real-time chat with trainer",
                  "Rate & review trainers",
                ]},
              { title: "For Trainers", color: "#10b981",
                icon: "💪",
                items: [
                  "Client management dashboard",
                  "Assign weekly workout plans",
                  "Assign nutrition meal plans",
                  "Monitor client progress",
                  "Real-time chat with clients",
                  "Income tracking & reports",
                ]},
              { title: "For Admins", color: "#8b5cf6",
                icon: "⚙️",
                items: [
                  "Platform analytics dashboard",
                  "User & trainer management",
                  "Trainer verification system",
                  "Payment monitoring",
                  "Content management",
                  "System configuration",
                ]},
            ].map(({ title, color, icon, items }) => (
              <div key={title}
                className="rounded-2xl overflow-hidden
                           shadow-sm">
                <div className="p-5 text-white"
                  style={{ background: color }}>
                  <span className="text-3xl">{icon}</span>
                  <h3 className="text-xl font-bold mt-2">
                    {title}
                  </h3>
                </div>
                <div className="bg-white p-5">
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item}
                        className="flex items-center gap-2
                                   text-sm text-gray-600">
                        <span style={{ color }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-6 text-white text-center"
        style={{ background: `linear-gradient(135deg,
          ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-blue-100 mb-8">
          Join FitTrack and transform your fitness today
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button onClick={() => navigate("/register")}
            className="px-8 py-3 rounded-xl font-bold
                       bg-white transition-all
                       hover:scale-105"
            style={{ color: BLUE }}>
            Get Started Free
          </button>
          <button onClick={() => navigate("/trainers")}
            className="px-8 py-3 rounded-xl font-bold
                       border-2 border-white/50
                       hover:bg-white/10 transition-all">
            Browse Trainers
          </button>
        </div>
      </section>
    </div>
  );
}