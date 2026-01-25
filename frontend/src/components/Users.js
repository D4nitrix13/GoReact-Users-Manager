// src/components/Users.js

import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./User.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Error fetching users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Delete user
    const handleDelete = async (id) => {
        if (!window.confirm("Do you really want to delete this user?")) return;

        try {
            await axios.delete(`${API_BASE_URL}/users/${id}`);

            // Refresh list
            await fetchUsers();

            // Notify at root
            navigate("/", {
                state: {
                    notification: "User deleted successfully!",
                    notificationType: "success",
                },
                replace: true,
            });
        } catch (error) {
            console.error("Error deleting user:", error);

            navigate("/", {
                state: {
                    notification: "Error deleting user.",
                    notificationType: "error",
                },
                replace: true,
            });
        }
    };

    const filteredUsers = users.filter((u) => {
        const term = search.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.email && u.email.toLowerCase().includes(term))
        );
    });

    return (
        <div className="users-container">
            <div className="users-header-row">
                <h2 className="users-title">Users</h2>

                <input
                    type="text"
                    className="users-search-input"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading && <p className="users-info-text">Loading users...</p>}
            {error && <p className="users-error-text">{error}</p>}

            {!loading && !error && (
                <>
                    {filteredUsers.length === 0 ? (
                        <p className="users-info-text">
                            {users.length === 0
                                ? "No users found."
                                : "No users match your search."}
                        </p>
                    ) : (
                        <div className="users-table-wrapper">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th style={{ textAlign: "center" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td className="actions-cell">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => navigate(`/edit-user/${user.id}`)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Users;
