import React from 'react';
import { Button } from '@mantine/core';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  className?: string;
  children: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  type = 'button',
  className = '',
  children,
  ...rest
}) => {
  return (
    <Button type={type} className={className} {...rest} style={{ backgroundColor: '#0e5089' }}>
      {children}
    </Button>
  );
};

export default CustomButton;
