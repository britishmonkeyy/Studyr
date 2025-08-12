/*
Module Name: Analytics Dashboard Component
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: React component for comprehensive analytics visualization including charts, streak tracking, productivity metrics, and timeframe filtering
*/
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  LocalFireDepartment,
  Timer,
  EmojiEvents,
  Assessment,
  ArrowBack,
  CalendarToday,
  School,
  CheckCircle
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { analyticsAPI } from '../../services/api';
import { format, parseISO, subDays } from 'date-fns';

const AnalyticsPage = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analyticsAPI.getStats(timeframe);
      setAnalytics(response.data.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStreakColor = (streak) => {
    if (streak >= 30) return '#4CAF50'; // Green
    if (streak >= 14) return '#FF9800'; // Orange  
    if (streak >= 7) return '#2196F3';  // Blue
    return '#9E9E9E'; // Grey
  };

  const generateTrendData = () => {
    if (!analytics?.analytics?.trend) return [];
    
    return analytics.analytics.trend.map(day => ({
      date: format(parseISO(day.date), 'MMM d'),
      studyTime: Math.round(day.studyTime / 60 * 10) / 10, // Convert to hours
      sessions: day.sessions,
      productivity: day.productivity || 0
    }));
  };

  const generateSubjectData = () => {
    if (!analytics?.analytics?.subjectDistribution) return [];
    
    const colors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#9c27b0', '#00bcd4'];
    
    return Object.entries(analytics.analytics.subjectDistribution).map(([subjectId, minutes], index) => ({
      name: `Subject ${index + 1}`, // You might want to map this to actual subject names
      value: Math.round(minutes / 60 * 10) / 10,
      color: colors[index % colors.length]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const trendData = generateTrendData();
  const subjectData = generateSubjectData();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Study Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your progress and improve your study habits
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Timeframe Selector */}
      <Box sx={{ mb: 4 }}>
        <ButtonGroup variant="outlined" sx={{ mb: 3 }}>
          <Button 
            variant={timeframe === '7days' ? 'contained' : 'outlined'}
            onClick={() => setTimeframe('7days')}
          >
            7 Days
          </Button>
          <Button 
            variant={timeframe === '30days' ? 'contained' : 'outlined'}
            onClick={() => setTimeframe('30days')}
          >
            30 Days
          </Button>
          <Button 
            variant={timeframe === '90days' ? 'contained' : 'outlined'}
            onClick={() => setTimeframe('90days')}
          >
            90 Days
          </Button>
        </ButtonGroup>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <LocalFireDepartment 
                  sx={{ 
                    fontSize: 32, 
                    color: getStreakColor(analytics?.streak?.currentStreak || 0),
                    mr: 1 
                  }} 
                />
                <Typography variant="h3" sx={{ fontWeight: 600 }}>
                  {analytics?.streak?.currentStreak || 0}
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Current Streak
              </Typography>
              <Chip 
                label={analytics?.streak?.message || 'No streak yet'}
                size="small"
                color={analytics?.streak?.isAtRisk ? 'warning' : 'default'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Timer sx={{ fontSize: 32, color: '#1a73e8', mr: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 600 }}>
                  {formatTime(analytics?.analytics?.totalStudyTime || 0)}
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary">
                Total Study Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <CheckCircle sx={{ fontSize: 32, color: '#34a853', mr: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 600 }}>
                  {analytics?.sessions?.completedSessions || 0}
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary">
                Sessions Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Assessment sx={{ fontSize: 32, color: '#9c27b0', mr: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 600 }}>
                  {analytics?.analytics?.averageProductivity?.toFixed(1) || '0.0'}
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary">
                Avg Productivity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Study Time Trend */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Study Time Trend
              </Typography>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'studyTime' ? `${value}h` : value,
                        name === 'studyTime' ? 'Study Time' : 'Sessions'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="studyTime" 
                      stroke="#1a73e8" 
                      strokeWidth={3}
                      dot={{ fill: '#1a73e8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    No study data available for this period
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Subject Distribution */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Subject Distribution
              </Typography>
              {subjectData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={subjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}h`, 'Study Time']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2 }}>
                    {subjectData.map((subject, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: subject.color, 
                            borderRadius: '50%', 
                            mr: 1 
                          }} 
                        />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {subject.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {subject.value}h
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    No subject data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Study Patterns */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Study Consistency
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Days Studied
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {analytics?.analytics?.studyDays || 0} days
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analytics?.analytics?.studyDaysPercentage || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f1f3f4',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#34a853',
                      borderRadius: 4
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {analytics?.analytics?.studyDaysPercentage || 0}% of days in period
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" gutterBottom>
                  Average Session Length
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a73e8' }}>
                  {formatTime(analytics?.sessions?.avgSessionLength || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Session Types
              </Typography>
              {analytics?.sessions?.sessionTypes && (
                <Box>
                  {Object.entries(analytics.sessions.sessionTypes).map(([type, count]) => (
                    <Box key={type} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {type} Sessions
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / (analytics?.sessions?.totalSessions || 1)) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#f1f3f4',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: type === 'solo' ? '#1a73e8' : type === 'partner' ? '#34a853' : '#ea4335',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Achievements Section */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Streak Milestones
          </Typography>
          <Grid container spacing={2}>
            {[7, 14, 30, 60, 100].map((milestone) => {
              const achieved = (analytics?.streak?.currentStreak || 0) >= milestone;
              const isNext = (analytics?.streak?.nextMilestone) === milestone;
              
              return (
                <Grid item xs={6} sm={2.4} key={milestone}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: achieved ? '#e8f5e8' : isNext ? '#fff3e0' : '#f5f5f5',
                      border: `1px solid ${achieved ? '#4caf50' : isNext ? '#ff9800' : '#e0e0e0'}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: achieved ? '#4caf50' : isNext ? '#ff9800' : '#666',
                      mb: 1 
                    }}>
                      {achieved ? '🏆' : isNext ? '🎯' : '⭐'}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {milestone}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      days
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
          
          {analytics?.streak?.nextMilestone && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Next milestone: <strong>{analytics.streak.nextMilestone} days</strong>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analytics?.streak?.milestoneProgress || 0}
                sx={{
                  mt: 1,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#f1f3f4',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#ff9800',
                    borderRadius: 3
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AnalyticsPage;