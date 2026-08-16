import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-white">
    <Navbar />
    <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
  </div>
);

export default Layout;
