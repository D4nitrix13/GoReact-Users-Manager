// frontend/src/components/UpdateUser.tsx

import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateUser.css";
import "./button.css";

const API_URL: string =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

type EditableUser = {
  name: string;
  email: string;
};

const UpdateUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<EditableUser>({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (!id) {
      navigate("/", {
        state: {
          notification: "Invalid user id.",
          notificationType: "error",
        },
        replace: true,
      });
      return;
    }

    axios
      .get(`${API_URL}/users/${id}`)
      .then((res) => {
        setUser({
          name: res.data.name ?? "",
          email: res.data.email ?? "",
        });
        setError(null);
      })
      .catch((err: unknown) => {
        console.error("Error fetching user:", err);
        navigate("/", {
          state: {
            notification: "User not found.",
            notificationType: "error",
          },
          replace: true,
        });
      })
      .finally(() => setLoadingUser(false));
  }, [id, navigate]);

  const handleUpdate = (): void => {
    if (loading || !id) return;

    setError(null);

    const trimmedName = user.name.trim();
    const trimmedEmail = user.email.trim();

    if (trimmedName === "" || trimmedEmail === "") {
      setError("Please enter both name and email before updating the user.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    axios
      .put(`${API_URL}/users/${id}`, {
        name: trimmedName,
        email: trimmedEmail,
      })
      .then(() => {
        navigate("/", {
          state: {
            notification: "User updated successfully!",
            notificationType: "success",
          },
          replace: true,
        });
      })
      .catch((err: unknown) => {
        console.error("Error updating user:", err);

        let message = "Error updating user. Please try again.";

        if (
          axios.isAxiosError(err) &&
          err.response?.data &&
          (err.response.data as any).error
        ) {
          message = (err.response.data as any).error;
        }

        setError(message);
      })
      .finally(() => setLoading(false));
  };

  if (loadingUser) {
    return (
      <div className="create-user-container">
        <h2>Edit User</h2>
        <p>Loading user...</p>
      </div>
    );
  }

  return (
    <div className="create-user-container">
      <h2>Edit User</h2>

      {error && <p className="error-message">{error}</p>}

      <div className="create-user-form">
        <label>
          Name:
          <input
            type="text"
            value={user.name}
            onChange={(e) =>
              setUser({ ...user, name: e.target.value })
            }
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            value={user.email}
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            }
          />
        </label>

        <button
          className="button"
          style={{ fontFamily: "Poppins" }}
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update User"}
        </button>
      </div>
    </div>
  );
};

export default UpdateUser;
