const API = process.env.NEXT_PUBLIC_API_URL;

export async function registerUser({ email, password }) {
  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        data?.message || data?.error || res.statusText || "Registration failed";
      return { success: false, error: message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}

export async function resetPassword({ email, newPassword, confirmPassword }) {
  try {
    const res = await fetch(`${API}/api/auth/reset-by-email`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword, confirmPassword }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        data?.message || data?.error || res.statusText || "Password reset failed";
      return { success: false, error: message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}

export async function loginUser({ email, password }) {
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        data?.message || data?.error || res.statusText || "Login failed";
      return { success: false, error: message };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}