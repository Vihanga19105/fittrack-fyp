import { useNavigate } from "react-router-dom";

export default function TrainerCard({ trainer }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6 text-black">

      {/* IMAGE */}
      <img
        src={trainer.image}
        alt={trainer.name}
        className="w-24 h-24 rounded-full object-cover mx-auto"
      />

      {/* NAME */}
      <h3 className="mt-4 text-xl font-bold text-center text-black">
        {trainer.name}
      </h3>

      {/* PRICE */}
      <p className="text-center text-purple-600 font-semibold mt-1">
        ${trainer.price} / month
      </p>

      {/* DETAILS */}
      <div className="mt-4 text-sm text-gray-700 space-y-1">
        <p>
          <span className="font-semibold text-black">Specialization:</span>{" "}
          {trainer.specialization}
        </p>
        <p>
          <span className="font-semibold text-black">Certification:</span>{" "}
          {trainer.certification}
        </p>
      </div>

      {/* BUTTON */}
      <button
        onClick={() => navigate("/login")}
        className="mt-6 w-full bg-accent hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
      >
        Select Trainer
      </button>
    </div>
  );
}
