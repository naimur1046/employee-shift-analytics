import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#053355] text-white py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-sm sm:text-base text-gray-300 text-center sm:text-left">
            &copy; {currentYear} Char Bata Ram Gobinda High School Alumni. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-300 text-center sm:text-right">
            <span>Developed by</span>
            <span className="hidden sm:inline">|</span>
            <a
              href="mailto:naimurrahman1046@gmail.com"
              className="text-gray-400 hover:text-[#FFB452] transition-colors text-xs sm:text-sm"
            >
              naimurrahman1046@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;