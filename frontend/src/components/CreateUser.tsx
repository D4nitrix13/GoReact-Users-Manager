// frontend/src/components/CreateUser.tsx

import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateUser.css";
import "./button.css";

const API_URL: string =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

type NewUser = {
  name: string;
  email: string;
};

interface CreateUserProps {
  onUserCreated?: () => void;
}

const CreateUser: React.FC<CreateUserProps> = ({ onUserCreated }) => {
  const [newUser, setNewUser] = useState<NewUser>({ name: "", email: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateUser = (): void => {
    if (loading) return;

    setMessage(null);
    setError(null);

    const trimmedName = newUser.name.trim();
    const trimmedEmail = newUser.email.trim();

    if (trimmedName === "" || trimmedEmail === "") {
      setError("Please enter both name and email before creating a user.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    axios
      .post(`${API_URL}/users`, { name: trimmedName, email: trimmedEmail })
      .then((response) => {
        console.log("User created successfully:", response.data);

        if (onUserCreated) {
          onUserCreated();
        }

        navigate("/", {
          state: {
            notification: "User created successfully!",
            notificationType: "success",
          },
          replace: true,
        });
      })
      .catch((err) => {
        console.error("Error creating user:", err);
        setError("Error creating user. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="create-user-container">
      <h2>Create User</h2>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="create-user-form">
        <label>
          Name:
          <input
            type="text"
            value={newUser.name}
            onChange={(e) =>
              setNewUser({ ...newUser, name: e.target.value })
            }
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            value={newUser.email}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
          />
        </label>

        <button
          onClick={handleCreateUser}
          className="button"
          style={{ fontFamily: "Poppins" }}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
};

export default CreateUser;
