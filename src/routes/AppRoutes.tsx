import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import SearchResultsPage from '../pages/SearchResultsPage';
import CourtByTypePage from '../pages/CourtByTypePage';
import BookingPage from '../pages/BookingPage';
import { CourtBookingTable } from '../components/CourtBookingTable';
import PaymentPage from '../pages/PaymentPage';
import CollaborationPage from '../pages/CollaborationPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/search-results" element={<SearchResultsPage />} />
      <Route path="/loai-san/:type" element={<CourtByTypePage />} />
      <Route path="/booking/:groupId/data" element={<BookingPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/collaboration" element={<CollaborationPage />} />
    </Routes>
  );
};

export default AppRoutes;
