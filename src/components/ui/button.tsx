// button.tsx
import React, { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`px-4 py-2 text-white rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

