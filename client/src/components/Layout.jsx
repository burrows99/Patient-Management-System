import React from 'react';
import Header from './Header';
import Footer from './Footer';  
// NHS.UK Layout component
// Single Responsibility: provides the main page layout wrapper and width container.
const Layout = ({ children }) => {
  return (
    <>
        <Header />
        <main className="nhsuk-main-wrapper nhsuk-main-wrapper--auto-spacing" id="maincontent" role="main">
        <div className="nhsuk-width-container">
            <div className="nhsuk-main-content">
            {children}
            </div>
        </div>
        </main>
        <Footer />
    </>
    
  );
};

export default Layout;
