// src/components/UpdateUser.js

import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CreateUser.css';
import './button.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const UpdateUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState(null);

    // Simple email validation (same logic as in CreateUser)
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Fetch user data on mount
    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/users/${id}`)
            .then((res) => {
                setUser({
                    name: res.data.name || '',
                    email: res.data.email || '',
                });
                setError(null);
            })
            .catch((err) => {
                console.error('Error fetching user:', err);
                navigate('/', {
                    state: {
                        notification: 'User not found.',
                        notificationType: 'error',
                    },
                    replace: true,
                });
            })
            .finally(() => setLoadingUser(false));
    }, [id, navigate]);

    const handleUpdate = () => {
        if (loading) return;

        setError(null);

        const trimmedName = user.name.trim();
        const trimmedEmail = user.email.trim();

        if (trimmedName === '' || trimmedEmail === '') {
            setError('Please enter both name and email before updating the user.');
            return;
        }

        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        axios
            .put(`${API_BASE_URL}/users/${id}`, {
                name: trimmedName,
                email: trimmedEmail,
            })
            .then(() => {
                navigate('/', {
                    state: {
                        notification: 'User updated successfully!',
                        notificationType: 'success',
                    },
                    replace: true,
                });
            })
            .catch((err) => {
                console.error('Error updating user:', err);

                let message = 'Error updating user. Please try again.';

                if (err.response && err.response.data && err.response.data.error) {
                    message = err.response.data.error;
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
                    style={{ fontFamily: 'Poppins' }}
                    onClick={handleUpdate}
                    disabled={loading}
                >
                    {loading ? 'Updating...' : 'Update User'}
                </button>
            </div>
        </div>
    );
};

export default UpdateUser;
