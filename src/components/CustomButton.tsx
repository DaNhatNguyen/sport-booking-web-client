import React from 'react';
import { Button } from 'react-bootstrap';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  className?: string;
  children: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  type = 'button',
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  return (
    <Button type={type} variant={variant} className={className} {...rest}>
      {children}
    </Button>
  );
};

export default CustomButton;
