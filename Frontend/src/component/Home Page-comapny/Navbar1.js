import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import { useAppStore } from './appStore';
import Avatar from "@mui/material/Avatar";
import { useState } from "react";
import { useEffect } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import { navigate, useNavigate } from 'react-router-dom';
import settingss from"../../images/Settingss-icon.png"
import { Gradient } from '@mui/icons-material';
import Drawer from '@mui/material/Drawer';
import Tab from '@mui/material/Tab';
import { postRequest } from "../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../serverconfiguration/serverconfig";
import { REPORTS, SAVE } from "../../serverconfiguration/controllers";
import {Stack } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; 
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: '#FFFFFF',
  boxShadow: 'none',
  borderRadius:"10px"
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '80%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export default function Navbar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const updateOpen = useAppStore((state) => state.updateOpen);
  const dopen = useAppStore((state) => state.dopen);
  const isLoggedIn = sessionStorage.getItem("user") !== null;
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [company, setCompany] = useState(null);
  const [pnCompanyId, setPnCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userImage, setUserImage] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');

  // const fetchCompanyData = async () => {
  //   try {
  //     const isloggedin = sessionStorage.getItem("user");
  //     if (!isloggedin) return;

  //     const companyData = await postRequest(ServerConfig.url, REPORTS, {
  //       query: `SELECT [pn_CompanyID], [CompanyName], [CompanyLogo] FROM [dbo].[paym_Company] WHERE company_user_id = '${isloggedin}'`,
  //     });

  //     if (companyData.data && companyData.data.length > 0) {
  //       setCompany(companyData.data);
  //       setPnCompanyId(companyData.data[0].pn_CompanyID);
  //       setCompanyName(companyData.data[0].CompanyName);
        
  //       // Handle company logo
  //       if (companyData.data[0].CompanyLogo) {
  //         // Check if logo is already a data URL or needs conversion
  //         const logo = companyData.data[0].CompanyLogo.startsWith('data:image') 
  //           ? companyData.data[0].CompanyLogo 
  //           : `data:image/png;base64,${companyData.data[0].CompanyLogo}`;
  //         setCompanyLogo(logo);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error fetching company data:", error);
  //   }
  // };

  const fetchCompanyData = async () => {
  try {
    const isloggedin = sessionStorage.getItem("user");
    const databaseName = sessionStorage.getItem("databaseName"); // ✅ get db name from session

    if (!isloggedin || !databaseName) {
      console.warn("Missing login or database name in sessionStorage.");
      return;
    }

    // ✅ Build the SQL query dynamically with the stored DB name
    const query = `
      SELECT 
        [pn_CompanyID], 
        [CompanyName], 
        [CompanyLogo] 
      FROM 
        [${databaseName}].[dbo].[paym_Company]
      WHERE 
        company_user_id = '${isloggedin}';
    `;

    const companyData = await postRequest(ServerConfig.url, REPORTS, { query });

    if (companyData.data && companyData.data.length > 0) {
      const companyInfo = companyData.data[0];
      setCompany(companyData.data);
      setPnCompanyId(companyInfo.pn_CompanyID);
      setCompanyName(companyInfo.CompanyName);

      // ✅ Handle base64 company logo safely
      if (companyInfo.CompanyLogo) {
        const logo = companyInfo.CompanyLogo.startsWith("data:image")
          ? companyInfo.CompanyLogo
          : `data:image/png;base64,${companyInfo.CompanyLogo}`;
        setCompanyLogo(logo);
      }
    } else {
      console.warn("No company data found for user:", isloggedin);
    }
  } catch (error) {
    console.error("Error fetching company data:", error);
  }
};


  useEffect(() => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      setUserEmail(userData?.email || '');
      setUserImage(userData?.image || '');
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    fetchCompanyData();
  }, []);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let storedStart = sessionStorage.getItem('startTime');
    if (!storedStart) {
      const now = Date.now();
      sessionStorage.setItem('startTime', now.toString());
      storedStart = now;
    }

    const start = Number(storedStart);
    setStartTime(start);
    setElapsedTime(Date.now() - start);

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "http://localhost:3000/";
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleDropdownOpen = (event) => {
    setDropdownAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownAnchorEl(null);
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
  };

  const isDropdownOpen = Boolean(dropdownAnchorEl);
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  if (!isLoggedIn) {
    return <navigate to="/" />;
  }

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleMenuClose}>My account</MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-search-account-menu-mobile';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}> </Box>
        <IconButton size="large" aria-label="show 4 new mails" color="inherit">
          <Badge badgeContent={4} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem>
        <IconButton
          size="large"
          aria-label="show 17 new notifications"
          color="inherit"
        >
          <Badge badgeContent={17} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ height: '70px'}}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color='black'
            aria-label="open drawer"
            sx={{ mr: 2 }}
            onClick={() => updateOpen(!dopen)}
          >
            <MenuIcon />
          </IconButton>
          <Tab sx={{ color: 'black', mr: 4 }} />
          
          <Stack direction="column" spacing={1} sx={{ marginLeft: "60px", padding: "16px" }}>
            <Typography
              variant="h5"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'black',
                textAlign: 'left'
              }}
            >
              HR MANAGEMENT SYSTEM
            </Typography>
            <Typography sx={{ fontWeight: "normal", color: "black", textAlign: 'center' }}>
              {formatTime(elapsedTime)}
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            {/* Search box can be added here if needed */}
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', ml: 8 }}>
            <IconButton
              size="large"
              aria-label="show calendar"
              color='black'
              onClick={handleCalendarToggle}
            >
              <CalendarTodayIcon /> 
            </IconButton>
            {showCalendar && (
              <Box sx={{ position: 'absolute', zIndex: 1000, backgroundColor: '#f2eded', marginTop: 40 }}>
                <Calendar />
              </Box>
            )}
            <IconButton
              size="large"
              aria-label="show 17 new notifications"
              color='black'
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={17} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color='black'
              sx={{ mr: 1 }}
            >
              <img src={settingss} width={25} height={25} color='black' sizes=''/>
            </IconButton>
           
            {/* Display company logo if available, otherwise fall back to user image or initials */}
            <Avatar 
              alt={companyName} 
              src={companyLogo || userImage} 
              sx={{ 
                width: 40, 
                height: 40,
                backgroundColor: companyLogo ? 'transparent' : undefined
              }}
              onError={() => setCompanyLogo('')}
            >
              {!companyLogo && !userImage && (companyName || userEmail).charAt(0).toUpperCase()}
            </Avatar>
            
            <Typography variant="h6" sx={{ marginLeft: 1 }}>
              {userEmail}
            </Typography>
            <Box sx={{ marginLeft: "10px", display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ color: "black" }}>
                Welcome
              </Typography>
              <IconButton
                aria-controls="company-menu"
                aria-haspopup="true"
                onClick={handleDropdownOpen}
                sx={{ padding: 0, justifyContent: 'left' }}
              >
                <Typography sx={{ color: "black", fontWeight: "normal", fontSize: "16px" }}>
                  {companyName}
                </Typography>
                <ArrowDropDownIcon sx={{ color: "black" }} />
              </IconButton>
              <Menu
                id="company-menu"
                anchorEl={dropdownAnchorEl}
                open={isDropdownOpen}
                onClose={handleDropdownClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem sx={{ display: 'flex', justifyContent: 'center' }} onClick={() => {
                  handleLogout();
                  handleDropdownClose();
                }}>
                  <LogoutIcon />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color='black'
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
    </Box>
  );
}