import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: `${API_URL}/api/auth`,
    headers: {
        "Content-Type": "application/json",
    },
});

export const registerUser = async (userData) => {
    try {
        const response = await api.post("/register", userData);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Registration failed",
        };
    }
};

export const loginUser = async (userData) => {
    try {
        const response = await api.post("/login", userData);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Login failed",
        };
    }
};

export const resetPassword = async (data) => {
    try {
        const response = await api.put("/reset-by-email", data);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Reset password failed",
        };
    }
};
