import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
} from "@heroui/react";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Header from "./components/Header";

function App() {
  return (
    <div className="flex flex-col h-screen">
      <Header>
        <NavbarItem>
          <Link to="/" className="p-2 rounded">
            Tasks
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/calendar" className="p-2 rounded">
            Calendar
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/analytics" className="p-2 rounded">
            Analytics
          </Link>
        </NavbarItem>
      </Header>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route element={<Dashboard />} path="/" />
          <Route element={<Calendar />} path="/calendar" />
          <Route element={<Analytics />} path="/analytics" />
        </Routes>
      </main>
    </div>
  );
}

export default App;
