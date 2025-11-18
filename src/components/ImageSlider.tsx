import React from 'react';
import { Carousel } from 'react-bootstrap';
import slide1 from '../assets/slide/slide1.png';
import slide2 from '../assets/slide/slide2.png';

const ImageSlider: React.FC = () => {
  return (
    <div className="w-100">
      <Carousel>
        <Carousel.Item>
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
        </Carousel.Item>

        <Carousel.Item>
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
        </Carousel.Item>
      </Carousel>
    </div>
  );
};

export default ImageSlider;