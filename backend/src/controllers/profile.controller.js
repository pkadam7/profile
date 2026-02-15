const { pool } = require("../config/db");


exports.updateProfile = async (req, res) => {
  try {
    console.log("body:", req.body);
console.log("files:", req.files);
    const userId = req.userId;

    const {
      firstName,
      lastName,
      phone,
      address,
      bio,
      skills,
      education,
      certificates
    } = req.body;

    const educationData =
      typeof education === "string" ? JSON.parse(education) : education;

    const certificatesData =
      typeof certificates === "string" ? JSON.parse(certificates) : certificates;

    const profilePhoto = req.files?.profilePhoto?.[0]?.path || null;
    const resumeFile = req.files?.resume?.[0]?.path || null;

    await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           phone = $3,
           address = $4,
           bio = $5,
           skills = $6,
           education = $7,
           profile_photo = COALESCE($8, profile_photo),
           resume_file = COALESCE($9, resume_file),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [
        firstName || null,
        lastName || null,
        phone || null,
        address || null,
        bio || null,
        skills ? JSON.stringify(skills) : null,       // ✅ fixed
        educationData ? JSON.stringify(educationData) : null,
        profilePhoto,
        resumeFile,
        userId
      ]
    );

    if (Array.isArray(certificatesData)) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query("DELETE FROM certificates WHERE user_id = $1", [userId]);

        for (const cert of certificatesData) {
          await client.query(
            `INSERT INTO certificates
             (user_id, certificate_name, start_date, end_date, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              userId,
              cert.certificateName || null,
              cert.startDate || null,
              cert.endDate || null,
              cert.description || null
            ]
          );
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    return res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const userResult = await pool.query(
      `SELECT id, first_name, last_name, email, phone, address, bio,
              skills, education, profile_photo, resume_file
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const certsResult = await pool.query(
      `SELECT id, certificate_name, start_date, end_date, description
       FROM certificates WHERE user_id = $1 ORDER BY id ASC`,
      [userId]
    );

    return res.json({
      ...user,
      certificates: certsResult.rows,
    });

  } catch (err) {
    console.error("❌ Get profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};