import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import SearchResultsPage from '../pages/SearchResultsPage';
import CourtByTypePage from '../pages/CourtByTypePage';
import BookingPage from '../pages/BookingPage';
import { CourtBookingTable } from '../components/CourtBookingTable';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/search-results" element={<SearchResultsPage />} />
      <Route path="/loai-san/:type" element={<CourtByTypePage />} />
      <Route path="/booking/:groupId/data" element={<BookingPage />} />
    </Routes>
  );
};

export default AppRoutes;
