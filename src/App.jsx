import React from "react";
import "./App.css";
import Pages from "./components/pages/Pages";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ScrollToTop from "./components/common/ScrollToTop";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="App">
          {/* Pages component handles all routing/pages */}
          <Pages />
          {/* Scroll to top button - appears on all pages */}
          <ScrollToTop />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
