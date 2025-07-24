const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Add auth routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', studySessionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/api/auth/test`);
});

// temp route for table checks
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