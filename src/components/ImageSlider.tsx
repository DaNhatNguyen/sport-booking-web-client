import React from 'react';
import { Carousel } from 'react-bootstrap';
import slide1 from '../assets/slide/slide1.png';
import slide2 from '../assets/slide/slide2.png';
import './ImageSlider.css';

const ImageSlider: React.FC = () => {
  return (
    <div className="w-100 image-slider-container">
      <Carousel fade interval={4000} pause="hover">
        <Carousel.Item>
          <div className="carousel-image-wrapper">
            <img
              className="d-block w-100"
              src={slide1}
              alt="Slide 1"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '3 / 1',
                objectFit: 'cover',
              }}
            />
            <div className="carousel-overlay"></div>
          </div>
          <Carousel.Caption className="carousel-caption-custom">
            <h1 className="carousel-title animate-fade-in">
              NSport - Hệ thống đặt sân thể thao hàng đầu Việt Nam
            </h1>
            <p className="carousel-subtitle animate-fade-in-delay">
              Mang đến trải nhiệm đặt sân trực tuyến thuận tiện và linh hoạt cho người chơi
            </p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <div className="carousel-image-wrapper">
            <img
              className="d-block w-100"
              src={slide2}
              alt="Slide 2"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '3 / 1',
                objectFit: 'cover',
              }}
            />
            <div className="carousel-overlay"></div>
          </div>
          <Carousel.Caption className="carousel-caption-custom">
            <h1 className="carousel-title animate-fade-in">
              NSport - Hệ thống đặt sân thể thao hàng đầu Việt Nam
            </h1>
            <p className="carousel-subtitle animate-fade-in-delay">
              Mang đến trải nhiệm đặt sân trực tuyến thuận tiện và linh hoạt cho người chơi
            </p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
    </div>
  );
};

export default ImageSlider;