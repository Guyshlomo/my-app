import {
    LocationOn as LocationIcon,
    Star as StarIcon,
    AccessTime as TimeIcon,
    EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';

const MotionCard = motion(Card);

const opportunities = [
  {
    id: 1,
    title: 'עזרה בגינה קהילתית',
    location: 'גן הקהילתי שער הנגב',
    points: 50,
    time: '2 שעות',
    level: 1,
    tags: ['גינון', 'קהילה', 'סביבה']
  },
  {
    id: 2,
    title: 'חונכות לתלמידי יסודי',
    location: 'בית ספר שער הנגב',
    points: 100,
    time: '3 שעות',
    level: 2,
    tags: ['חינוך', 'העשרה']
  },
  {
    id: 3,
    title: 'עזרה לקשישים',
    location: 'מרכז יום לקשיש',
    points: 75,
    time: '2.5 שעות',
    level: 1,
    tags: ['קשישים', 'חברה']
  }
];

const achievements = [
  {
    title: 'מתנדב השבוע',
    description: 'התנדבת 3 פעמים השבוע',
    points: 150,
    icon: '🌟'
  },
  {
    title: 'חבר אמיתי',
    description: 'עזרת ל-5 קשישים',
    points: 200,
    icon: '🤝'
  }
];

function Dashboard() {
  return (
    <Box sx={{ pt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2E7D32' }}>
        הזדמנויות התנדבות
      </Typography>
      
      <Grid container spacing={3}>
        {opportunities.map((opportunity) => (
          <Grid item xs={12} md={4} key={opportunity.id}>
            <MotionCard
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              sx={{ height: '100%' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {opportunity.title}
                  </Typography>
                  <Chip
                    icon={<StarIcon />}
                    label={`${opportunity.points} נקודות`}
                    color="secondary"
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {opportunity.location}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {opportunity.time}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  {opportunity.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>

                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  הרשמה להתנדבות
                </Button>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" sx={{ mt: 6, mb: 4, fontWeight: 'bold', color: '#2E7D32' }}>
        הישגים אחרונים
      </Typography>

      <Grid container spacing={3}>
        {achievements.map((achievement) => (
          <Grid item xs={12} md={4} key={achievement.title}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)',
                color: 'white'
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  fontSize: '2rem'
                }}
              >
                {achievement.icon}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {achievement.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {achievement.description}
                </Typography>
                <Chip
                  icon={<TrophyIcon />}
                  label={`${achievement.points} נקודות`}
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard; 