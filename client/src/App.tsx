import { Routes, Route } from "react-router-dom";
// import { NavbarItem } from "@heroui/react";
import { Toast } from "@heroui/react";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Header from "./components/Header";

function App() {
  return (
    <div className="flex flex-col h-screen">
      <Toast.Provider />
      <Header />
      <main className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 overflow-y-scroll">
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
