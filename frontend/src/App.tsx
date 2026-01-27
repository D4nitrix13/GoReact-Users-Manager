// frontend/src/App.tsx

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
import CreateUser from "./components/CreateUser.tsx";
import UpdateUser from "./components/UpdateUser.tsx";
import Users from "./components/Users.tsx";


interface NavigationState {
  notification?: string;
  notificationType?: "success" | "error" | "info" | "warning";
}

function NotificationBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [notification, setNotification] = useState<string | null>(null);
  const [type, setType] = useState<"success" | "error" | "info" | "warning">(
    "success"
  );

  useEffect(() => {
    const state = location.state as NavigationState | null;

    if (state?.notification) {
      setNotification(state.notification);
      setType(state.notificationType || "success");

      navigate(location.pathname, { replace: true, state: {} });

      const timer = setTimeout(() => setNotification(null), 4000);
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
        <p className="App-subtitle">
          Simple CRUD with Go + PostgreSQL + React
        </p>
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

        <NotificationBar />

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
