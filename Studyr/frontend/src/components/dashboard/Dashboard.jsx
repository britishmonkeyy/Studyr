/*
Module Name: Main Dashbaord Page
Module Author: Adam Bolton
Date Modified: 6/08/2025
Description: This is the dashboard containing most of the components that are used on the main page of Studyr
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Logout,
  School,
  Add,
  TrendingUp,
  Timer,
  Book,
  PlayArrow,
  Schedule,
  Dashboard as DashboardIcon,
  Assignment,
  Today,
  EmojiEvents,
  Analytics,
  People,
  Message
} from '@mui/icons-material';
import { sessionsAPI, subjectsAPI, analyticsAPI, removeAuthToken } from '../../services/api';
import { format, isToday, parseISO, isWithinInterval, addMinutes } from 'date-fns';
import { studyPartnersAPI, messagesAPI } from '../../services/api';
import CreateSessionModal from './CreateSessionModal';
import SessionsList from './SessionsList';
import SubjectManagement from './SubjectManagement';
import AnalyticsPage from './AnalyticsPage';
import SessionTimer from './SessionTimer';
import StudyPartnersPage from '../social/StudyPartnersPage';
import MessagesPage from '../social/MessagesPage';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [showSubjectManagement, setShowSubjectManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStudyPartners, setShowStudyPartners] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedPartnerForChat, setSelectedPartnerForChat] = useState(null);
  const [socialStats, setSocialStats] = useState({
  partnersCount: 0,
  unreadMessages: 0,
  pendingRequests: 0
});
  
  // Session Timer States
  const [activeSession, setActiveSession] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadAnalytics();
    loadSocialStats();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('studyr_user'));
      setUser(userData);

      const [sessionsResponse, subjectsResponse] = await Promise.all([
        sessionsAPI.getAll(),
        subjectsAPI.getAll()
      ]);

      setSessions(sessionsResponse.data.data.sessions || []);
      setSubjects(subjectsResponse.data.data.subjects || []);
      
      // Check for active sessions
      const activeSessions = (sessionsResponse.data.data.sessions || []).filter(s => s.status === 'inProgress');
      if (activeSessions.length > 0) {
        setActiveSession(activeSessions[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await analyticsAPI.getDashboard();
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSessionCreated = (newSession) => {
    setSessions(prev => [newSession, ...prev]);
  };

  const handleSessionUpdate = (updatedSession) => {
    setSessions(prev => 
      prev.map(session => 
        session.sessionId === updatedSession.sessionId ? updatedSession : session
      )
    );
    
    // Update active session tracking
    if (updatedSession.status === 'inProgress') {
      setActiveSession(updatedSession);
    } else if (updatedSession.sessionId === activeSession?.sessionId && updatedSession.status !== 'inProgress') {
      setActiveSession(null);
    }
    
    // Reload analytics when a session is updated/completed
    if (updatedSession.status === 'completed') {
      loadAnalytics();
    }
  };

  const handleSessionDelete = (sessionId) => {
    setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
    if (activeSession?.sessionId === sessionId) {
      setActiveSession(null);
    }
  };

  const handleStartSession = async (session) => {
    try {
      const response = await sessionsAPI.update(session.sessionId, { status: 'inProgress' });
      if (response.data.success) {
        const updatedSession = response.data.data.session;
        handleSessionUpdate(updatedSession);
        setActiveSession(updatedSession);
        setTimerOpen(true);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleOpenTimer = () => {
    if (activeSession) {
      setTimerOpen(true);
    }
  };

  const loadSocialStats = async () => {
  try {
    const [partnersResponse, requestsResponse, messagesResponse] = await Promise.all([
      studyPartnersAPI.getAccepted(),
      studyPartnersAPI.getRequests(),
      messagesAPI.getStats()
    ]);

    setSocialStats({
      partnersCount: partnersResponse.data.data.partners?.length || 0,
      unreadMessages: messagesResponse.data.data.unreadCount || 0,
      pendingRequests: requestsResponse.data.data.receivedRequests?.filter(r => r.status === 'pending').length || 0
    });
  } catch (error) {
    console.error('Failed to load social stats:', error);
  }
};

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress sx={{ height: 3 }} />
      </Box>
    );
  }

  // Calculate basic stats from sessions (fallback if analytics aren't loaded)
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalStudyTime = sessions
    .filter(s => s.status === 'completed')
    .reduce((total, session) => total + session.durationMinutes, 0);
  
  // Use analytics data if available, otherwise fall back to calculated data
  const streak = analytics?.stats?.streak || { currentStreak: 0, status: 'no_streak', message: 'Complete a session to start your streak!' };
  const weeklyGoal = analytics?.goalProgress || { progress: 0, current: 0, target: 900, remaining: 900 }; // 15 hours default
  const weekProgress = weeklyGoal.progress || 0;

  // Get today's sessions
  const todaySessions = sessions.filter(session => {
    if (!session.startTime) return false;
    return isToday(parseISO(session.startTime));
  });

  // Get upcoming sessions
  const upcomingSessions = sessions
    .filter(session => {
      if (!session.startTime) return false;
      const sessionDate = parseISO(session.startTime);
      return sessionDate > new Date() && session.status === 'scheduled';
    })
    .sort((a, b) => parseISO(a.startTime) - parseISO(b.startTime))
    .slice(0, 3);

  const getSubjectColor = (subject) => {
    return subject?.colorHex || '#1a73e8';
  };

  const getCurrentView = () => {
    if (showAnalytics) return 'Analytics';
    if (showSubjectManagement) return 'Subjects';
    if (showSessionsList) return 'Sessions';
    if (showStudyPartners) return 'Study Partners';
    if (showMessages) return 'Messages';             
    return 'Dashboard';
  };

  const getStreakIcon = () => {
    if (streak.currentStreak >= 30) return '🏆';
    if (streak.currentStreak >= 14) return '⭐';
    if (streak.currentStreak >= 7) return '🔥';
    return '📚';
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#fafafa', minHeight: '100vh' }}>
      {/* Enhanced App Bar with Active Session Indicator */}
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          bgcolor: activeSession ? '#ff6b35' : 'white',
          color: activeSession ? 'white' : '#202124',
          borderBottom: '1px solid #e0e0e0',
          transition: 'all 0.3s ease'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ mr: 2, color: activeSession ? 'white' : '#1a73e8', fontSize: 28 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 400,
                color: activeSession ? 'white' : '#202124',
                cursor: 'pointer',
                fontFamily: '"Google Sans", Roboto, sans-serif'
              }}
              onClick={() => {
                setShowSessionsList(false);
                setShowSubjectManagement(false);
                setShowAnalytics(false);
                setShowMessages(false);
                setShowStudyPartners(false);
              }}
            >
              Studyr
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 2,
                color: activeSession ? 'rgba(255,255,255,0.9)' : '#5f6368',
                fontWeight: 500
              }}
            >
              {getCurrentView()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Active Session Timer Button */}
            {activeSession && (
              <Button
                variant="outlined"
                startIcon={<Timer />}
                onClick={handleOpenTimer}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  },
                  mr: 2,
                  animation: 'pulse 2s infinite'
                }}
              >
                Session Active
              </Button>
            )}
            
            
            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar sx={{ 
                bgcolor: '#1a73e8',
                width: 32, 
                height: 32,
                fontSize: '1rem'
              }}>
                {user?.firstName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { borderRadius: 2, mt: 1, minWidth: 200 }
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 2 }} />
                Sign out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Add CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
      {showStudyPartners ? (
        <StudyPartnersPage 
          onBack={() => {
            setShowStudyPartners(false);
            loadSocialStats();
          }}
          onStartChat={(partner) => {
            setSelectedPartnerForChat(partner);
            setShowStudyPartners(false);
            setShowMessages(true);
          }}
        />
      ) : showMessages ? (
        <MessagesPage 
          onBack={() => {
            setShowMessages(false);
            setSelectedPartnerForChat(null);
            loadSocialStats();
          }}
          selectedPartner={selectedPartnerForChat}
        />
        ) : showAnalytics ? (
          <AnalyticsPage onBack={() => setShowAnalytics(false)} />
        ) : showSubjectManagement ? (
          <SubjectManagement onBack={() => setShowSubjectManagement(false)} />
        ) : showSessionsList ? (
          <SessionsList
            sessions={sessions}
            onSessionUpdate={handleSessionUpdate}
            onSessionDelete={handleSessionDelete}
            onCreateSession={() => setCreateModalOpen(true)}
            onStartTimer={(session) => {
              setActiveSession(session);
              setTimerOpen(true);
            }}
          />
        ) : (
          <>
            {/* Active Session Alert */}
            {activeSession && (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3, 
                  bgcolor: '#fff3e0',
                  border: '1px solid #ff9800',
                  '& .MuiAlert-icon': { color: '#ff9800' }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    startIcon={<Timer />}
                    onClick={handleOpenTimer}
                  >
                    Open Timer
                  </Button>
                }
              >
                <strong>{activeSession.sessionTitle}</strong> is currently in progress
              </Alert>
            )}

            {/* Welcome Header */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 400,
                  color: '#202124',
                  mb: 1,
                  fontFamily: '"Google Sans", Roboto, sans-serif'
                }}
              >
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {format(new Date(), 'EEEE, MMMM d')} • {sessions.length} total sessions
              </Typography>
            </Box>

            {/* Analytics Loading */}
            {analyticsLoading && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                  Loading analytics...
                </Box>
              </Alert>
            )}

            {/* Enhanced Stats with Real Analytics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 2,
                    background: streak.currentStreak > 0 ? 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)' : 'white'
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <Typography variant="h3" sx={{ mr: 1, fontSize: '2rem' }}>
                        {getStreakIcon()}
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 400, 
                          color: streak.currentStreak > 0 ? 'white' : '#202124' 
                        }}
                      >
                        {streak.currentStreak}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: streak.currentStreak > 0 ? 'rgba(255,255,255,0.9)' : 'text.secondary' 
                      }}
                    >
                      Day streak
                    </Typography>
                    {streak.isAtRisk && (
                      <Chip 
                        label="At Risk!" 
                        size="small" 
                        color="warning" 
                        sx={{ mt: 1 }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <Timer sx={{ color: '#1a73e8', mr: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 400, color: '#202124' }}>
                        {formatTime(weeklyGoal.current)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      This week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <TrendingUp sx={{ color: '#34a853', mr: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 400, color: '#202124' }}>
                        {analytics?.stats?.sessions?.completedSessions || completedSessions}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Sessions done
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <Book sx={{ color: '#ea4335', mr: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 400, color: '#202124' }}>
                        {subjects.length}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                       Subjects
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Enhanced Weekly Progress */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiEvents sx={{ mr: 1, color: '#1a73e8' }} />
                    <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124' }}>
                      Weekly goal
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(weeklyGoal.current)} of {formatTime(weeklyGoal.target)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={weekProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f1f3f4',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: weekProgress >= 100 ? '#34a853' : '#1a73e8',
                      borderRadius: 4
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {weekProgress.toFixed(0)}% complete
                  </Typography>
                  {weekProgress >= 100 ? (
                    <Typography variant="body2" sx={{ color: '#34a853', fontWeight: 500 }}>
                      🎉 Goal achieved!
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(weeklyGoal.remaining)} remaining
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* Today's Sessions */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, height: 'fit-content' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Today sx={{ mr: 1, color: '#5f6368' }} />
                      <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124' }}>
                        Today
                      </Typography>
                    </Box>
                    
                    {todaySessions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No sessions scheduled today
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setCreateModalOpen(true)}
                          sx={{
                            borderColor: '#1a73e8',
                            color: '#1a73e8',
                            textTransform: 'none'
                          }}
                        >
                          Create session
                        </Button>
                      </Box>
                    ) : (
                      todaySessions.map((session) => (
                        <Box
                          key={session.sessionId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            bgcolor: session.status === 'inProgress' ? '#fff3e0' : '#f8f9fa',
                            borderRadius: 2,
                            mb: 1,
                            border: `1px solid ${session.status === 'inProgress' ? '#ff9800' : '#e0e0e0'}`
                          }}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 40,
                              bgcolor: getSubjectColor(session.subject),
                              borderRadius: 2,
                              mr: 2
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {session.sessionTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {session.subject?.subjectName} • {format(parseISO(session.startTime), 'h:mm a')}
                            </Typography>
                          </Box>
                          {session.status === 'scheduled' && isWithinInterval(new Date(), { 
                            start: addMinutes(parseISO(session.startTime), -15), 
                            end: parseISO(session.endTime) 
                          }) && (
                            <Button
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => handleStartSession(session)}
                              sx={{ color: '#1a73e8', textTransform: 'none' }}
                            >
                              Start
                            </Button>
                          )}
                          {session.status === 'inProgress' && (
                            <Button
                              size="small"
                              startIcon={<Timer />}
                              onClick={handleOpenTimer}
                              sx={{ color: '#ff9800', textTransform: 'none' }}
                            >
                              Timer
                            </Button>
                          )}
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Upcoming Sessions */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, height: 'fit-content' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Schedule sx={{ mr: 1, color: '#5f6368' }} />
                      <Typography variant="h6" sx={{ fontWeight: 500, color: '#202124' }}>
                        Upcoming
                      </Typography>
                    </Box>
                    
                    {upcomingSessions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No upcoming sessions
                        </Typography>
                      </Box>
                    ) : (
                      upcomingSessions.map((session, index) => (
                        <Box
                          key={session.sessionId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2,
                            borderBottom: index === upcomingSessions.length - 1 ? 'none' : '1px solid #f0f0f0'
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              bgcolor: getSubjectColor(session.subject),
                              borderRadius: '50%',
                              mr: 2
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {session.subject?.subjectName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(session.startTime), 'MMM d, h:mm a')}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Button
              variant="outlined"
              startIcon={<People />}
              onClick={() => setShowStudyPartners(true)}
              sx={{
                borderColor: '#dadce0',
                color: '#202124',
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#f8f9fa',
                  borderColor: '#1a73e8'
                }
              }}
            >
              Study Partners
            </Button>

            <Button
              variant="outlined"
              startIcon={<Message />}
              onClick={() => setShowMessages(true)}
              sx={{
                borderColor: '#dadce0',
                color: '#202124',
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#f8f9fa',
                  borderColor: '#1a73e8'
                }
              }}
            >
              Messages
            </Button>

            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  bgcolor: '#1a73e8',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#1557b0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                  }
                }}
              >
                New session
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Assignment />}
                onClick={() => setShowSessionsList(true)}
                sx={{
                  borderColor: '#dadce0',
                  color: '#202124',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    borderColor: '#1a73e8'
                  }
                }}
              >
                View all sessions
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Book />}
                onClick={() => setShowSubjectManagement(true)}
                sx={{
                  borderColor: '#dadce0',
                  color: '#202124',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    borderColor: '#1a73e8'
                  }
                }}
              >
                Manage subjects
              </Button>

              <Button
                variant="outlined"
                startIcon={<Analytics />}
                onClick={() => setShowAnalytics(true)}
                sx={{
                  borderColor: '#dadce0',
                  color: '#202124',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    borderColor: '#1a73e8'
                  }
                }}
              >
                View analytics
              </Button>
            </Box>
          </>
        )}

        {/* Create Session Modal */}
        <CreateSessionModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSessionCreated={handleSessionCreated}
        />

        {/* Session Timer Modal */}
        <SessionTimer
          session={activeSession}
          open={timerOpen}
          onClose={() => setTimerOpen(false)}
          onSessionUpdate={handleSessionUpdate}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;