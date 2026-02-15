const API = process.env.NEXT_PUBLIC_API_URL;

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    'Authorization': token ? `Bearer ${token}` : '',
  };
  return headers;
}

export async function getProfile() {
  try {
    const token = getAuthToken();
    console.log('Fetching profile with token:', token ? 'Token exists' : 'No token');
    console.log('API URL:', `${API}/api/profile`);
    
    const res = await fetch(`${API}/api/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log('Profile fetch status:', res.status);

    let data;
    try {
      data = await res.json();
      console.log('Raw response data:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      data = {};
    }

    if (!res.ok) {
      const message =
        data?.message || data?.error || res.statusText || "Failed to fetch profile";
      console.log('Profile fetch failed:', message);
      return { success: false, error: message };
    }

    return { success: true, data: data };
  } catch (err) {
    console.error('Profile fetch error:', err);
    return {
      success: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}

export async function updateProfile(formData) {
  try {
    console.log('=== UPDATE PROFILE START ===');
    console.log('Form data received:', formData);
    
    const payload = new FormData();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      return { 
        success: false, 
        error: "First name, last name, and email are required" 
      };
    }

    payload.append("firstName", formData.firstName.trim());
    payload.append("lastName", formData.lastName.trim());
    payload.append("phone", (formData.phone || "").trim());
    payload.append("address", (formData.address || "").trim());
    payload.append("bio", (formData.bio || "").trim());

    const skillsArray = formData.skills
      ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    payload.append("skills", JSON.stringify(skillsArray));
    console.log('Skills array:', skillsArray);

    const hasEducation = 
      formData.educationLevel || 
      formData.university || 
      formData.courseName || 
      formData.fieldOfStudy;

    const education = hasEducation ? [
      {
        degree: formData.educationLevel || null,
        institution: formData.university || null,
        course: formData.courseName || null,
        fieldOfStudy: formData.fieldOfStudy || null,
        startDate: formData.startDate || null,
        endDate: formData.currentlyStudying ? null : formData.endDate || null,
        currentlyStudying: !!formData.currentlyStudying,
        experienceLevel: formData.experienceLevel || null,
      },
    ] : [];
    payload.append("education", JSON.stringify(education));
    console.log('Education data:', education);
    const certificates = (formData.certificates || [])
      .filter((c) => {
        return c.certificateName && c.certificateName.trim()
      })
      .map((c) => ({
        certificateName: c.certificateName.trim(),
        startDate: c.certificateStart || null,
        endDate: c.certificateEnd || null,
        description: (c.certificateDescription || "").trim() || null,
      }));
    payload.append("certificates", JSON.stringify(certificates));
    console.log('Certificates data:', certificates);

    // Files - only append if they exist and are File objects
    if (formData.profilePhoto && formData.profilePhoto instanceof File) {
      console.log('Adding profile photo:', formData.profilePhoto.name);
      payload.append("profilePhoto", formData.profilePhoto);
    } else {
      console.log('No new profile photo to upload');
    }
    
    if (formData.resume && formData.resume instanceof File) {
      console.log('Adding resume:', formData.resume.name);
      payload.append("resume", formData.resume);
    } else {
      console.log('No new resume to upload');
    }

    console.log('=== FormData Contents ===');
    for (let [key, value] of payload.entries()) {
      if (value instanceof File) {
        console.log(key, ':', `File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(key, ':', value);
      }
    }
    const token = getAuthToken();
    console.log('Sending request to:', `${API}/api/profile`);
    
    const res = await fetch(`${API}/api/profile`, {
      method: "PUT",
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: payload,
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        const text = await res.text();
        console.log('Response text:', text);
        data = { error: text };
      }
    } else {
      const text = await res.text();
      console.log('Non-JSON response:', text);
      data = { error: text || 'No response data' };
    }

    if (!res.ok) {
      if (res.status === 413) {
        return { success: false, error: "File size too large - please upload smaller files" };
      }
      if (res.status === 422) {
        const detailedError = data?.message || data?.error || "Invalid data format";
        console.error('Validation error (422):', detailedError);
        return { 
          success: false, 
          error: `Validation error: ${detailedError}. Please check all required fields.` 
        };
      }
      if (res.status === 401) {
        return { success: false, error: "Authentication required. Please sign in again." };
      }
      if (res.status === 400) {
        const detailedError = data?.message || data?.error || "Bad request";
        console.error('Bad request (400):', detailedError);
        return { 
          success: false, 
          error: `Request error: ${detailedError}` 
        };
      }
      
      const message =
        data?.message || data?.error || res.statusText || "Failed to update profile";
      console.error('Update failed:', message);
      return { success: false, error: message };
    }

    console.log('=== UPDATE PROFILE SUCCESS ===');
    return { success: true, data };
  } catch (err) {
    console.error('=== UPDATE PROFILE ERROR ===');
    console.error('Error:', err);
    
    if (err.name === 'AbortError') {
      return { success: false, error: "Request timeout - please try again" };
    }
    return {
      success: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}

export async function deleteProfile() {
  try {
    const res = await fetch(`${API}/api/profile`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        data?.message || data?.error || res.statusText || "Failed to delete profile";
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