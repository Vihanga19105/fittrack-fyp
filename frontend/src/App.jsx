import { Routes, Route } from "react-router-dom";

/* ================= LAYOUTS ================= */
import PublicLayout from "./layouts/PublicLayout";

/* ================= PUBLIC ================= */
import LandingPage from "./pages/public/LandingPage";
import About from "./pages/public/About";
import Terms from "./pages/public/Terms";
import Contact from "./pages/public/Contact";
import FAQ from "./pages/public/FAQ";
import Trainers from "./pages/public/Trainers";
import GoalPredictor from "./pages/public/GoalPredictor";
import TrainerPublicProfile from "./pages/public/TrainerPublicProfile";

/* ================= AUTH ================= */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

/* ================= CLIENT ================= */
import ClientLayout from "./layouts/ClientLayout";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProfile from "./pages/client/ClientProfile";
import ClientProgress from "./pages/client/ClientProgress";
import ClientWorkoutPlan from "./pages/client/ClientWorkoutPlan";
import ClientNutritionPlan from "./pages/client/ClientNutritionPlan";
import ClientPayments from "./pages/client/ClientPayments";
import ClientSettings from "./pages/client/ClientSettings";
import ClientChat from "./pages/client/ClientChat";
import ClientBMI from "./pages/client/ClientBMI";
import ClientTrainers from "./pages/client/ClientTrainers";

/* ================= TRAINER ================= */
import TrainerLayout from "./layouts/TrainerLayout";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";
import TrainerProfile from "./pages/trainer/TrainerProfile";
import TrainerClientRequests from "./pages/trainer/TrainerClientRequests";
import TrainerMyClients from "./pages/trainer/TrainerMyClients";
import TrainerClientDetails from "./pages/trainer/TrainerClientDetails";
import TrainerAssignWorkout from "./pages/trainer/TrainerAssignWorkout";
import TrainerAssignMeal from "./pages/trainer/TrainerAssignMeal";
import TrainerClientProgress from "./pages/trainer/TrainerClientProgress";
import TrainerChatList from "./pages/trainer/TrainerChatList";
import TrainerChatRoom from "./pages/trainer/TrainerChatRoom";
import TrainerIncomeReport from "./pages/trainer/TrainerIncomeReport";
import TrainerAvailability from "./pages/trainer/TrainerAvailability";
import TrainerNotifications from "./pages/trainer/TrainerNotifications";
import TrainerSettings from "./pages/trainer/TrainerSettings";

/* ================= ADMIN ================= */
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManageUsers from "./pages/admin/AdminManageUsers";
import AdminManageTrainers from "./pages/admin/AdminManageTrainers";
import AdminVerifyTrainers from "./pages/admin/AdminVerifyTrainers";
import AdminPlatformAnalytics from "./pages/admin/AdminPlatformAnalytics";
import AdminPaymentMonitoring from "./pages/admin/AdminPaymentMonitoring";
import AdminContentManagement from "./pages/admin/AdminContentManagement";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import AdminReportsExport from "./pages/admin/AdminReportsExport";
import AdminProfile from "./pages/admin/AdminProfile";

export default function App() {
  return (
    <Routes>

      {/* ========== PUBLIC — all wrapped in PublicLayout ========== */}
      <Route element={<PublicLayout />}>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/about"          element={<About />} />
        <Route path="/terms"          element={<Terms />} />
        <Route path="/contact"        element={<Contact />} />
        <Route path="/faq"            element={<FAQ />} />
        <Route path="/trainers"       element={<Trainers />} />
        <Route path="/trainers/:id"   element={<TrainerPublicProfile />} />
        <Route path="/goal-predictor" element={<GoalPredictor />} />
      </Route>

      {/* ========== AUTH — no navbar/footer ========== */}
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email"   element={<VerifyEmail />} />

      {/* ========== CLIENT ========== */}
      <Route path="/client" element={<ClientLayout />}>
        <Route path="dashboard"    element={<ClientDashboard />} />
        <Route path="profile"      element={<ClientProfile />} />
        <Route path="progress"     element={<ClientProgress />} />
        <Route path="workout-plan" element={<ClientWorkoutPlan />} />
        <Route path="nutrition"    element={<ClientNutritionPlan />} />
        <Route path="payments"     element={<ClientPayments />} />
        <Route path="settings"     element={<ClientSettings />} />
        <Route path="chat"         element={<ClientChat />} />
        <Route path="bmi"          element={<ClientBMI />} />
        <Route path="trainers"     element={<ClientTrainers />} />
      </Route>

      {/* ========== TRAINER ========== */}
      <Route path="/trainer" element={<TrainerLayout />}>
        <Route path="dashboard"       element={<TrainerDashboard />} />
        <Route path="profile"         element={<TrainerProfile />} />
        <Route path="client-requests" element={<TrainerClientRequests />} />
        <Route path="my-clients"      element={<TrainerMyClients />} />
        <Route path="client/:id"      element={<TrainerClientDetails />} />
        <Route path="client/:id/assign-workout" element={<TrainerAssignWorkout />} />
        <Route path="client/:id/assign-diet"    element={<TrainerAssignMeal />} />
        <Route path="client-progress" element={<TrainerClientProgress />} />
        <Route path="chat"            element={<TrainerChatList />} />
        <Route path="chat/:id"        element={<TrainerChatRoom />} />
        <Route path="income"          element={<TrainerIncomeReport />} />
        <Route path="availability"    element={<TrainerAvailability />} />
        <Route path="notifications"   element={<TrainerNotifications />} />
        <Route path="settings"        element={<TrainerSettings />} />
      </Route>

      {/* ========== ADMIN ========== */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard"          element={<AdminDashboard />} />
        <Route path="users"              element={<AdminManageUsers />} />
        <Route path="trainers"           element={<AdminManageTrainers />} />
        <Route path="verify-trainers"    element={<AdminVerifyTrainers />} />
        <Route path="platform-analytics" element={<AdminPlatformAnalytics />} />
        <Route path="payments"           element={<AdminPaymentMonitoring />} />
        <Route path="content"            element={<AdminContentManagement />} />
        <Route path="settings"           element={<AdminSystemSettings />} />
        <Route path="reports"            element={<AdminReportsExport />} />
        <Route path="profile"            element={<AdminProfile />} />
      </Route>

    </Routes>
  );
}