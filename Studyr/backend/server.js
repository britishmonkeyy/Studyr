/*
Module Name: Server Routing
Module Author: Adam Bolton
Date Modified: 8/08/2025
Description:  Express.js server configuration and startup also handles API routes, middleware setup, and port binding
*/
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const studyPartnersRoutes = require('./routes/studyPartnersRoutes');
const messagesRoutes = require('./routes/messagesRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', studySessionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/partners', studyPartnersRoutes);
app.use('/api/messages', messagesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server working!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}/api/health`);
  console.log(`Network access: http://10.13.2.231:${PORT}/api/health`);
  console.log(`Frontend local: http://localhost:3000`);
  console.log(`Frontend network: http://10.13.2.231:3000`);
});

// Temp route for table checks
/*app.get('/api/debug/check-tables', async (req, res) => {
  try {
    const { sequelize } = require('./models');
    
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('study_streaks', 'user_analytics', 'achievements', 'user_achievements')
      ORDER BY table_name;
    `);
    
    res.json({
      success: true,
      analyticsTablesFound: results.map(row => row.table_name),
      message: `Found ${results.length} analytics tables`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});*/