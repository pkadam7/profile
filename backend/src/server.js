const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT,"0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};



startServer();