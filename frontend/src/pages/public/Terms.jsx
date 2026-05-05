const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";
const BLUE_LIGHT = "#E8F7FD";

export default function Terms() {
  const sections = [
    { title: "1. Introduction",
      content: "FitTrack is an online fitness platform that connects clients with certified trainers to provide personalized workout plans, nutrition guidance, and progress tracking tools. By accessing or using our platform, you agree to comply with and be bound by these Terms & Conditions." },
    { title: "2. User Eligibility",
      content: "You must be at least 16 years old to use FitTrack. By registering, you confirm that the information you provide is accurate and complete. FitTrack reserves the right to verify your eligibility." },
    { title: "3. Health Disclaimer",
      content: "FitTrack does not provide medical advice. All fitness and nutrition content is for informational purposes only. Always consult a qualified healthcare professional before starting any fitness or diet program. FitTrack is not liable for any health issues arising from use of the platform." },
    { title: "4. Account Responsibility",
      content: "You are responsible for maintaining the confidentiality of your account credentials. FitTrack is not responsible for any loss or damage arising from unauthorized account use. Please notify us immediately if you suspect unauthorized access." },
    { title: "5. Payments & Subscriptions",
      content: "Some features require paid subscriptions. All payments are processed securely through third-party payment gateways. FitTrack does not store your card details. Subscription fees are non-refundable unless required by law." },
    { title: "6. Trainer Verification",
      content: "All trainers on FitTrack must submit valid fitness certifications for admin review. FitTrack verifies trainer credentials before allowing them to accept clients. However, we do not guarantee the accuracy of trainer-provided information." },
    { title: "7. Reviews & Ratings",
      content: "Clients may rate and review trainers after active or expired subscriptions. Reviews must be honest and based on real experiences. FitTrack reserves the right to remove reviews that violate our community guidelines." },
    { title: "8. Termination of Service",
      content: "FitTrack reserves the right to suspend or terminate accounts that violate these terms or misuse the platform. Users may also delete their accounts at any time from settings." },
    { title: "9. Privacy Policy",
      content: "Your privacy is important to us. We collect only necessary data to provide our services. We do not sell your personal information to third parties. All data is stored securely and protected by industry-standard encryption." },
    { title: "10. Changes to Terms",
      content: "FitTrack may update these Terms & Conditions from time to time. We will notify users of significant changes. Continued use of the platform after updates means you accept the revised terms." },
    { title: "11. Contact Information",
      content: "If you have any questions regarding these terms, please contact us at support@fittrack.lk or visit our Contact page. We aim to respond within 24 hours." },
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
            📋
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Terms & Conditions
          </h1>
          <p className="text-blue-100 text-xl">
            Please read these terms carefully before using
            FitTrack
          </p>
          <p className="text-blue-200 text-sm mt-3">
            Last updated: April 2026
          </p>
        </div>
        <div className="absolute right-10 top-8 w-40 h-40
                        bg-white/10 rounded-full"/>
      </div>

      {/* ── CONTENT ── */}
      <section className="py-20 px-6"
        style={{ background: "#f0f9ff" }}>
        <div className="max-w-3xl mx-auto">

          {/* quick nav */}
          <div className="bg-white rounded-2xl p-6 shadow-sm
                          mb-8"
            style={{ borderLeft: `4px solid ${BLUE}` }}>
            <p className="text-sm font-semibold text-gray-700
                           mb-3">
              Quick Navigation
            </p>
            <div className="grid grid-cols-2 gap-2">
              {sections.slice(0, 6).map((s) => (
                <a key={s.title}
                  href={`#${s.title.split(".")[0]}`}
                  className="text-xs hover:underline"
                  style={{ color: BLUE }}>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* sections */}
          <div className="space-y-6">
            {sections.map((s) => (
              <div key={s.title}
                id={s.title.split(".")[0]}
                className="bg-white rounded-2xl p-6
                           shadow-sm">
                <h2 className="text-lg font-bold
                                text-gray-800 mb-3 flex
                                items-center gap-2">
                  <span className="w-8 h-8 rounded-lg
                                   text-white text-sm
                                   font-bold flex items-center
                                   justify-center flex-shrink-0"
                    style={{ background: BLUE }}>
                    {s.title.split(".")[0]}
                  </span>
                  {s.title.split(". ")[1]}
                </h2>
                <p className="text-gray-600 text-sm
                               leading-relaxed">
                  {s.content}
                </p>
              </div>
            ))}
          </div>

          {/* footer note */}
          <div className="mt-8 rounded-2xl p-6 text-center"
            style={{ background: BLUE_LIGHT }}>
            <p className="text-sm text-gray-600">
              By using FitTrack, you agree to these terms.
              For questions contact{" "}
              <span className="font-semibold"
                style={{ color: BLUE }}>
                support@fittrack.lk
              </span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}