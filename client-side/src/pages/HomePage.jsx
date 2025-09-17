import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppShell,
  Text,
  Button,
  TextInput,
  Group,
  Container,
  Stack,
  Card,
  ActionIcon,
  Title,
  Space,
  Box,
  Flex,
  Burger,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { authApi, clearAuthData, getAuthData } from '../utils/authApi';
import { logout } from '../store/slices/authSlice';
import {
  IconMenu2,
  IconArrowsUpDown,
  IconBus,
  IconLanguage,
  IconSettings,
  IconBug,
  IconLogout,
} from '@tabler/icons-react';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  // Swap function for the from/to inputs
  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  // Handle burger menu click
  const handleBurgerClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    console.log('Logout started');
    
    // Close sidebar first
    closeSidebar();
    
    // Store current accessToken before clearing
    const currentAccessToken = accessToken;
    
    try {
      // Call logout API if we have a token
      if (currentAccessToken) {
        console.log('Calling logout API');
        await authApi.logout(currentAccessToken);
        console.log('Logout API successful');
      }
    } catch (error) {
      console.error('Logout API failed:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear auth data from Redux store
    console.log('Clearing Redux state');
    dispatch(logout());
    
    // Clear auth data from localStorage
    console.log('Clearing localStorage');
    clearAuthData();
    
    // Use window.location to force a complete page reload and redirect
    console.log('Redirecting to landing page with page reload');
    window.location.href = '/';
  };

  // Handle escape key to close sidebar
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && sidebarOpen) {
      closeSidebar();
    }
  };

  // Add escape key listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <>
      <AppShell
        header={{ height: 70 }}
        padding="md"
        styles={{
          main: {
            background: 'linear-gradient(to bottom, #FFF9E6, #FFECB3)',
            minHeight: '100vh',
          },
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            position: 'relative',
          },
        }}
      >
        <AppShell.Header>
          <Flex justify="space-between" align="center" h="100%" px="md" style={{ 
            paddingRight: 'max(1rem, calc(1rem + env(scrollbar-width, 15px)))',
            width: '100%',
            maxWidth: '100vw',
            position: 'relative',
            zIndex: 101,
          }}>
            {/* Hamburger Menu */}
            <Burger
              opened={sidebarOpen}
              onClick={handleBurgerClick}
              aria-label="Toggle navigation menu"
              size="sm"
              styles={{
                root: {
                  '&:focus': {
                    outline: '2px solid var(--mantine-color-blue-5)',
                    outlineOffset: '2px',
                  },
                },
              }}
            />

            {/* BusBuddy Brand */}
            <Text 
              size="xl" 
              fw={700} 
              style={{
                background: 'linear-gradient(45deg, #FF9B00, #FFC900)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BusBuddy
            </Text>
          </Flex>
        </AppShell.Header>

        <AppShell.Main>
          <Container size="md" px="md" py="xl">
          <Stack spacing="xl" align="center">
            {/* Hero Section */}
            <Box ta="center">
              <Title
                order={1}
                size="4rem"
                fw={900}
                style={{
                  background: 'linear-gradient(45deg, #FF9B00, #FFC900)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '1rem',
                }}
              >
                BusBuddy
              </Title>
              <Text size="xl" c="dimmed" ta="center">
                Your reliable companion for bus tracking and scheduling
              </Text>
            </Box>

            <Space h="md" />

            {/* Search Controls */}
            <Stack spacing="lg" align="center" style={{ width: '100%', maxWidth: '500px' }}>
              {/* From Input */}
              <TextInput
                placeholder="Enter your pickup location"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                size="xl"
                style={{ width: '100%' }}
                styles={{
                  input: {
                    fontSize: '1.2rem',
                    padding: '1rem',
                    borderRadius: '12px',
                  },
                }}
              />

              {/* Swap Button */}
              <ActionIcon
                variant="gradient"
                gradient={{ from: 'yellow.7', to: 'orange.7' }}
                size="xl"
                radius="xl"
                onClick={swapLocations}
                style={{
                  transition: 'all 0.2s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(255, 155, 0, 0.3)',
                    },
                  },
                }}
                aria-label="Swap pickup and destination locations"
              >
                <IconArrowsUpDown size={20} />
              </ActionIcon>

              {/* To Input */}
              <TextInput
                placeholder="Enter your destination"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                size="xl"
                style={{ width: '100%' }}
                styles={{
                  input: {
                    fontSize: '1.2rem',
                    padding: '1rem',
                    borderRadius: '12px',
                  },
                }}
              />

              {/* Date Picker */}
              <DatePickerInput
                placeholder="Select travel date"
                value={selectedDate}
                onChange={setSelectedDate}
                size="xl"
                style={{ width: '100%' }}
                styles={{
                  input: {
                    fontSize: '1.2rem',
                    padding: '1rem',
                    borderRadius: '12px',
                  },
                }}
                valueFormat="DD-MM-YYYY"
                clearable
              />

              {/* Find Buses Button */}
              <Button
                variant="gradient"
                gradient={{ from: 'yellow.7', to: 'orange.7' }}
                size="xl"
                fullWidth
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  height: '60px',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(255, 155, 0, 0.4)',
                    },
                  },
                }}
              >
                Find Buses
              </Button>
            </Stack>

            <Space h="xl" />

            {/* Track Child Bus Card */}
            <Card
              shadow="md"
              padding="lg"
              radius="md"
              withBorder
              style={{
                maxWidth: '400px',
                width: '100%',
                background: 'linear-gradient(135deg, #FFF9E6, #FFECB3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              styles={{
                root: {
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(255, 155, 0, 0.2)',
                  },
                },
              }}
            >
              <Group justify="center" spacing="md">
                <IconBus size={32} color="#FF9B00" />
                <Box>
                  <Text fw={600} size="lg" ta="center">
                    Track Your Child's Bus
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    Enter the school-provided bus ID to track in real-time
                  </Text>
                </Box>
              </Group>
            </Card>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>

    {/* Custom Sidebar */}
    {sidebarOpen && (
      <div 
        className="sidebar-overlay" 
        onClick={closeSidebar}
      />
    )}
    
    <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <Group>
          <IconBus size={24} color="#FF9B00" />
          <Text size="xl" fw={700} c="#FF9B00">
            BusBuddy
          </Text>
        </Group>
      </div>
      
      <div className="sidebar-content">
        <div 
          className="sidebar-item" 
          onClick={closeSidebar}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && closeSidebar()}
        >
          <IconLanguage size={20} />
          <Text>Language</Text>
        </div>
        
        <div 
          className="sidebar-item" 
          onClick={closeSidebar}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && closeSidebar()}
        >
          <IconSettings size={20} />
          <Text>Account Settings</Text>
        </div>
        
        <div 
          className="sidebar-item" 
          onClick={closeSidebar}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && closeSidebar()}
        >
          <IconBug size={20} />
          <Text>Report Issue</Text>
        </div>
        
        <div 
          className="sidebar-item logout-item" 
          onClick={handleLogout}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
        >
          <IconLogout size={20} />
          <Text>Log Out</Text>
        </div>
      </div>
    </div>
  </>
  );
};

export default HomePage;