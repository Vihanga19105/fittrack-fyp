import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function ProgressChart({ logs = [] }) {

  // ✅ If no real data — show empty message
  if (logs.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-3">📊</p>
        <p className="text-gray-500 font-semibold text-lg">
          No progress data yet
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Your weight progress chart will appear here
          once your trainer starts logging your data!
        </p>
      </div>
    );
  }

  // ✅ Use real data when available
  const labels = logs.map((log) => log.loggedDate);
  const weights = logs.map((log) => log.weightKg);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Weight (kg)",
        data: weights,
        borderColor: "#38BDF8",
        backgroundColor: "rgba(56,189,248,0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#ffffff" },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9CA3AF" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "#9CA3AF" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}