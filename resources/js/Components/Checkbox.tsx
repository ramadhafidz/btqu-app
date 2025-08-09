import { InputHTMLAttributes } from 'react';

export default function Checkbox({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="checkbox"
      className={
  'rounded border-gray-300 text-[#826F4F] shadow-sm focus:ring-[#826F4F] ' +
        className
      }
    />
  );
}
