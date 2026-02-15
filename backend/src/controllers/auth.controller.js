const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const generateToken = require('../utils/generateToken');


exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 12);

    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), hashed]
    );

    const token = generateToken(result.rows[0].id);

    res.status(201).json({
      user: result.rows[0],
      token
    });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.json({
      user: { id: user.id, email: user.email },
      token
    });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


exports.resetPasswordByEmail = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password updated successfully" });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};