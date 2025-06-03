import {
    DirectionsCar as CarIcon,
    Stars as StarsIcon,
    EmojiEvents as TrophyIcon,
    Volunteer as VolunteerIcon
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Drawer,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';
import CountUp from 'react-countup';

const levels = [
  { name: 'מתנדב מתחיל', points: 0, maxPoints: 100 },
  { name: 'מתנדב מתקדם', points: 100, maxPoints: 250 },
  { name: 'מתנדב מצטיין', points: 250, maxPoints: 500 },
  { name: 'מתנדב מוביל', points: 500, maxPoints: 1000 },
  { name: 'מתנדב אלוף', points: 1000, maxPoints: 2000 },
  { name: 'מתנדב על', points: 2000, maxPoints: null }
];

const MotionCar = motion(CarIcon);

function Navigation() {
  const currentPoints = 750; // נקודות בין שלב 4 ל-5
  const currentLevel = levels.findIndex(level => 
    currentPoints >= level.points && (!level.maxPoints || currentPoints < level.maxPoints)
  );

  // חישוב מיקום המכונית (רק בין שלב 4 ל-5)
  const carPosition = {
    x: `${((currentPoints - levels[3].points) / (levels[4].points - levels[3].points)) * 100}%`,
    y: '50%'
  };

  // בדיקה האם המכונית צריכה להיות מוצגת
  const shouldShowCar = currentPoints >= levels[3].points && currentPoints < levels[4].points;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          sx={{ 
            width: 80, 
            height: 80, 
            margin: '0 auto',
            border: '3px solid #FFC107',
            backgroundColor: '#81C784'
          }}
        >
          <VolunteerIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
          {levels[currentLevel].name}
        </Typography>
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <CountUp
              end={currentPoints}
              duration={2}
              separator=","
            />
            {' / '}
            {levels[currentLevel].maxPoints || '∞'} נקודות
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress 
              variant="determinate" 
              value={(currentPoints - levels[currentLevel].points) / 
                ((levels[currentLevel].maxPoints || currentPoints * 2) - levels[currentLevel].points) * 100}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#FFC107',
                  transition: 'transform 0.8s ease-in-out'
                }
              }}
            />
            {shouldShowCar && (
              <MotionCar
                animate={carPosition}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                sx={{
                  position: 'absolute',
                  top: -12,
                  color: '#FFC107',
                  fontSize: 24,
                  transform: 'translateX(-50%)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <List>
        {levels.map((level, index) => (
          <ListItem 
            key={level.name}
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: index === currentLevel ? 1 : 0.7,
              x: 0,
              scale: index === currentLevel ? 1.05 : 1
            }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            sx={{ 
              position: 'relative',
              '&::after': index === currentLevel ? {
                content: '""',
                position: 'absolute',
                right: 0,
                width: 4,
                height: '100%',
                backgroundColor: '#FFC107',
                borderRadius: '4px 0 0 4px',
                transition: 'all 0.3s ease-in-out'
              } : {}
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {index <= currentLevel ? <StarsIcon /> : <TrophyIcon />}
            </ListItemIcon>
            <ListItemText 
              primary={level.name}
              secondary={
                <CountUp
                  end={level.points}
                  duration={2}
                  separator=","
                  suffix="+ נקודות"
                />
              }
              sx={{ 
                '& .MuiListItemText-secondary': { 
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Navigation; 