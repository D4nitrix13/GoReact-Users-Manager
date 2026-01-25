// src/App.js

import { useEffect, useState } from "react";
import {
  Link,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import CreateUser from "./components/CreateUser";
import UpdateUser from "./components/UpdateUser";
import Users from "./components/Users";

// Small component to show notifications at the root
function NotificationBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [type, setType] = useState("success");

  useEffect(() => {
    // Read notification from navigation state (if any)
    const state = location.state;

    if (state && state.notification) {
      setNotification(state.notification);
      setType(state.notificationType || "success");

      // Clean state so refresh doesn't show it again
      navigate(location.pathname, { replace: true, state: {} });

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  if (!notification) return null;

  return (
    <div className={`notification-bar notification-${type}`}>
      {notification}
    </div>
  );
}

function Home() {
  return (
    <>
      <header className="App-header">
        <h1 className="App-title">Go API Frontend</h1>
        <p className="App-subtitle">Simple CRUD with Go + PostgreSQL + React</p>
      </header>

      <div className="content">
        <Users />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-logo">Go API</div>

          <ul className="navbar-links">
            <li>
              <Link to="/">Home / Users</Link>
            </li>
            <li>
              <Link to="/create-user">Create User</Link>
            </li>
          </ul>
        </nav>

        {/* Global notification bar */}
        <NotificationBar />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/create-user"
            element={
              <div className="content">
                <CreateUser />
              </div>
            }
          />

          <Route
            path="/edit-user/:id"
            element={
              <div className="content">
                <UpdateUser />
              </div>
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
