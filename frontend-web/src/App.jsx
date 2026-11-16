import { AdminPage } from "./pages/AdminPage.jsx";
import { TouristPage } from "./pages/TouristPage.jsx";

export default function App() {
  return window.location.pathname.startsWith("/admin") ? <AdminPage /> : <TouristPage />;
}
