import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref} // refをforwardRefで受け取れるようにする
      className={`w-full p-2 border rounded ${className}`}
      {...props}
    />
  );
});


