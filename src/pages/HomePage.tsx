import React from 'react';
import Header from '../components/Header';
import ImageSlider from '../components/ImageSlider';
import SearchBar from '../components/SearchBar';
import TopRatedCourts from '../components/TopRatedCourts';
import NearbyCourts from '../components/NearbyCourts';
import Footer from '../components/Footer';
import '../index.css';
import BookingHistoryModal from '@/components/BookingHistoryModal';
import { Space } from '@mantine/core';

const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <ImageSlider />
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <SearchBar />
      </div>
      <div className="mtopCourt">
        <TopRatedCourts />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <NearbyCourts />
      </div>
      <Space h={50} />
      <Footer />
    </>
  );
};

export default HomePage;
