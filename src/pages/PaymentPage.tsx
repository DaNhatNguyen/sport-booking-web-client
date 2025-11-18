import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import React from 'react';

const PaymentPage = () => {
  const location = useLocation();
  const state = location.state;
  console.log(state);
  return (
    <>
      <Header />
      <>Payment page</>
    </>
  );
};

export default PaymentPage;
