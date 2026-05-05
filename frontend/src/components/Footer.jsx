import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#020617] text-gray-400 px-10 py-10">
      <div className="grid md:grid-cols-4 gap-8">

        {/* BRAND */}
        <div>
          <h3 className="text-white text-lg font-bold mb-2">
            Fit<span className="text-accent">Track</span>
          </h3>
          <p className="text-sm">
            Online fitness platform connecting clients with certified trainers
            across Sri Lanka.
          </p>
        </div>

        {/* LINKS */}
        <div>
          <h4 className="text-white font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/trainers" className="hover:text-white">
                Our Trainers
              </Link>
            </li>
            <li>
              <Link to="/stories" className="hover:text-white">
                Success Stories
              </Link>
            </li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h4 className="text-white font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/terms" className="hover:text-white">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <p className="text-sm">Email: support@fittrack.lk</p>
          <p className="text-sm mt-1">Sri Lanka</p>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm">
        © 2026 FitTrack. All rights reserved.
      </div>
    </footer>
  );
}
