import React from 'react';
import { Link } from 'react-router-dom';
import { IconProposal, IconSupervision, IconMilestone, IconDashboard } from '../components/icons';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">BR</div>
            <span className="font-bold text-lg tracking-tight">BRACU ResearchHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-4 py-2 transition-colors">Log In</Link>
            <Link to="/signup" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 transition-colors">Sign Up</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="w-10 h-1 bg-blue-600 mb-6" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5 text-slate-900">
              Run your thesis from proposal to defense, in one place.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              BRACU ResearchHub is where BRAC University students submit proposals, track
              supervisor feedback, and stay ahead of every milestone deadline — built for the
              way thesis work actually happens.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 transition-colors">Get Started</Link>
              <Link to="/login" className="border border-slate-300 hover:border-blue-600 hover:text-blue-600 font-semibold px-6 py-3 transition-colors">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-8">Everything on one dashboard</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200">
            {[
              { icon: IconDashboard, name: 'My Thesis Workspace', desc: 'Detailed phase progress tracking, phase marks, and supervisor evaluations.' },
              { icon: IconProposal, name: 'Proposals', desc: 'Submit and revise proposals with full history.' },
              { icon: IconSupervision, name: 'Literature Review', desc: 'Log research papers, authors, journal publications, and reviews.' },
              { icon: IconMilestone, name: 'Datasets & Revisions', desc: 'Upload thesis datasets and documents with multi-version revision history.' }
            ].map(({ icon: Icon, name, desc }) => (
              <div key={name} className="bg-white p-6">
                <Icon className="w-6 h-6 text-blue-600 mb-4" />
                <h3 className="font-bold mb-1.5 text-slate-900">{name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-6 text-sm text-slate-400">BRACU ResearchHub — Thesis Management Platform</div>
      </footer>
    </div>
  );
};

export default Homepage;


