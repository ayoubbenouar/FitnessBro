import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// ==================== AUTH ====================
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// ==================== HOME & SUBSCRIPTION FLOW ====================
import Home from "./pages/Home";
import CheckoutPage from "./pages/CheckoutPage";
import MySubscription from "./pages/Coach/MySubscription";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";


// ==================== COACH ====================
import Layout from "./components/Layout";
import CoachDashboard from "./pages/Coach/CoachDashboard";
import ClientList from "./pages/Coach/ClientList";
import CreateProgram from "./pages/Coach/CreateProgram";
import EditProgram from "./pages/Coach/EditProgram";
import ClientProgram from "./pages/Coach/ClientProgram";
import CoachBilan from "./pages/Coach/CoachBilan";
import CoachClientProfile from "./pages/Coach/CoachClientProfile";
import CoachChatbot from "./pages/Coach/CoachChatbot";

// ==================== CLIENT ====================
import ClientLayout from "./components/Client/ClientLayout";
import ClientDashboard from "./pages/Client/ClientHome";
import ClientProgramFull from "./pages/Client/ClientProgram";
import ClientReport from "./pages/Client/ClientReport";
import ClientProfile from "./pages/Client/ClientProfile";
import WeightHistory from "./pages/Client/WeightHistory";

// ==================== GLOBAL COMPONENTS ====================
import ChatWidget from "./components/ChatWidget/Index";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const location = useLocation();

  // Pages où le ChatWidget doit être masqué
  const hideChat =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname === "/" ||
    location.pathname.startsWith("/subscription");

  return (
    <>
      <Routes>
        {/* ========================= HOME ========================= */}
        <Route path="/" element={<Home />} />

        {/* ========================= AUTH ========================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ========================= SUBSCRIPTION PUBLIC ========================= */}
        {/* Page après login où le coach choisit son abonnement */}
        <Route path="/subscription" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />


        {/* ========================= COACH ========================= */}
        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRole="coach">
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Redirect par défaut */}
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<CoachDashboard />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="bilan" element={<CoachBilan />} />

          {/* Programmes */}
          <Route path="create" element={<CreateProgram />} />
          <Route path="edit/:id" element={<EditProgram />} />
          <Route path="client/:id" element={<ClientProgram />} />
          <Route path="client/:clientId/report" element={<ClientReport />} />

          {/* Profil client pour le coach */}
          <Route
            path="client/:clientId/profile"
            element={<CoachClientProfile />}
          />

          {/* Chatbot mode page */}
          <Route path="chatbot" element={<CoachChatbot />} />

          {/* 🔥 Page Mon abonnement */}
          <Route path="subscription" element={<MySubscription />} />
        </Route>

        {/* ========================= CLIENT ========================= */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect par défaut */}
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="program" element={<ClientProgramFull />} />
          <Route path="summary" element={<ClientReport />} />

          {/* Profil / Historique */}
          <Route path="profile" element={<ClientProfile />} />
          <Route path="weight-history" element={<WeightHistory />} />
        </Route>

        {/* ========================= DEFAULT REDIRECTS ========================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ========================= CHATWIDGET ========================= */}
      {!hideChat && <ChatWidget />}
    </>
  );
}
