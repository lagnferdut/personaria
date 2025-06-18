
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-5">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter">
          Personaria
          <span className="text-xl font-normal text-indigo-300 ml-2">
            Twój Generator Person AI
          </span>
        </h1>
      </div>
    </header>
  );
};
    