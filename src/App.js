import { Box, ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Green color representing growth and volunteering
      light: '#81C784',
      dark: '#388E3C',
    },
    secondary: {
      main: '#FFC107', // Yellow/gold for achievements
      light: '#FFD54F',
      dark: '#FFA000',
    },
  },
  typography: {
    fontFamily: '"Rubik", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 