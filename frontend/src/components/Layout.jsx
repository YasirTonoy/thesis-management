import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col">
    <Navbar />
    <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full">{children}</main>
  </div>
);

export default Layout;


