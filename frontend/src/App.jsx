import { Navigate, Route, Routes } from "react-router-dom";
import { useOffline, OfflineBanner } from "./hooks/useOffline.jsx";
import Area from "./pages/Area";
import AdminPanel from "./pages/AdminPanel";
import Detection from "./pages/Detection";
import Education from "./pages/Education";
import Extinguisher from "./pages/Extinguisher";
import FireCalc from "./pages/FireCalc";
import Home from "./pages/Home";
import Hydrant from "./pages/Hydrant";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quiz from "./pages/Quiz";
import Reports from "./pages/Reports";
import SprinklerDemand from "./pages/SprinklerDemand";
import FireWaterTank from "./pages/FireWaterTank";
import EvacuationTime from "./pages/EvacuationTime";
import OccupantLoad from "./pages/OccupantLoad";
import SmokeExhaust from "./pages/SmokeExhaust";
import FireRating from "./pages/FireRating";
import BatteryBackup from "./pages/BatteryBackup";
import CableDerating from "./pages/CableDerating";
import FoamSystem from "./pages/FoamSystem";
import GeneratorSizing from "./pages/GeneratorSizing";
import VoiceAssistant from "./pages/VoiceAssistant";
import Copilot from "./pages/Copilot";
import Teams from "./pages/Teams";
import Compliance from "./pages/Compliance";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import Badges from "./pages/Badges";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const isOffline = useOffline();

  return (
    <>
      <OfflineBanner isOffline={isOffline} />
      <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/fire" element={<FireCalc />} />
      <Route path="/extinguisher" element={<Extinguisher />} />
      <Route path="/hydrant" element={<Hydrant />} />
      <Route path="/sprinkler" element={<SprinklerDemand />} />
      <Route path="/water-tank" element={<FireWaterTank />} />
      <Route path="/evacuation" element={<EvacuationTime />} />
      <Route path="/detection" element={<Detection />} />
      <Route path="/area" element={<Area />} />
      <Route path="/occupant-load" element={<OccupantLoad />} />
      <Route path="/smoke-exhaust" element={<SmokeExhaust />} />
      <Route path="/fire-rating" element={<FireRating />} />
      <Route path="/battery-backup" element={<BatteryBackup />} />
      <Route path="/cable-derating" element={<CableDerating />} />
      <Route path="/foam-system" element={<FoamSystem />} />
      <Route path="/generator-sizing" element={<GeneratorSizing />} />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="/education" element={<Education />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/voice" element={<VoiceAssistant />} />
      <Route
        path="/copilot"
        element={
          <ProtectedRoute>
            <Copilot />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <Teams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute>
            <Compliance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulator"
        element={
          <ProtectedRoute>
            <ScenarioSimulator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ProtectedRoute>
            <Integrations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/badges"
        element={
          <ProtectedRoute>
            <Badges />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
    </>
  );
}
