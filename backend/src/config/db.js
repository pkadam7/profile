const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        bio TEXT,
        education JSONB DEFAULT '[]',
        skills JSONB DEFAULT '[]',
        profile_photo TEXT,
        resume_file TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL
          REFERENCES users(id) ON DELETE CASCADE,
        certificate_name VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_certificates_user_id
      ON certificates(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_education
      ON users USING GIN (education)
      WHERE education IS NOT NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_skills
      ON users USING GIN (skills)
      WHERE skills IS NOT NULL;
    `);

    console.log("Database initialized");

  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
};

module.exports = { pool, initDB };