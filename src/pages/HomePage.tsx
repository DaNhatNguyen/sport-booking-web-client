import React from 'react';
import Header from '../components/Header';
import ImageSlider from '../components/ImageSlider';
import SearchBar from '../components/SearchBar';
import NearbyCourts from '../components/NearbyCourts';
import Footer from '../components/Footer';
import '../index.css';
import BookingHistoryModal from '@/components/BookingHistoryModal';

const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <ImageSlider />
      <div style={{ position: 'relative' }}>
        <SearchBar />
      </div>
      <div className="mtopCourt">
        <NearbyCourts />
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
