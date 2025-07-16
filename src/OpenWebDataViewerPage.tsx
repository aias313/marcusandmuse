import React from 'react';

const features = [
  {
    title: 'Publisher Transparency Data',
    description:
      'Instantly view detailed publisher metrics, including ad-to-content ratios, ads in view, supply paths, and more—direct from the OpenSincera API.',
  },
  {
    title: 'Allow List Management',
    description:
      'Effortlessly create, manage, and export allow lists for compliance, campaign optimization, and brand safety.',
  },
  {
    title: 'Real-Time Data',
    description:
      'Get up-to-date, accurate publisher information every time you browse—no stale or outdated data.',
  },
  {
    title: 'Material Design UI',
    description:
      'Enjoy a clean, modern interface that’s intuitive and easy to use, following Google’s Material Design guidelines.',
  },
  {
    title: 'Seamless API Integration',
    description:
      'Securely connect your OpenSincera API key and unlock the full power of publisher data.',
  },
];

const audiences = [
  {
    title: 'Digital Advertisers & Media Buyers',
    description:
      'Make smarter buying decisions with instant access to publisher quality metrics.',
  },
  {
    title: 'Brand Safety & Compliance Teams',
    description: 'Ensure your campaigns run on trusted, high-quality sites.',
  },
  {
    title: 'Publishers & Ad Tech Professionals',
    description: 'Benchmark your properties and stay ahead of industry standards.',
  },
  {
    title: 'Researchers & Analysts',
    description: 'Access granular, real-time data for in-depth analysis.',
  },
];

const benefits = [
  {
    title: 'No Personal Data Collected',
    description:
      'Your privacy is our priority. We only request the permissions needed to function.',
  },
  {
    title: 'Fast, Lightweight, and Secure',
    description: 'Loads in under 2 seconds and uses minimal system resources.',
  },
  {
    title: 'Trusted by Industry Leaders',
    description:
      'Built by experts at Marcus & Muse, leveraging the power of OpenSincera.',
  },
  {
    title: 'Free to Use',
    description: 'No hidden fees. Get started today!',
  },
];

export default function OpenWebDataViewerPage() {
  return (
    <div className="min-h-screen bg-dark text-light">
      {/* Site Navigation */}
      <nav className="flex items-center justify-between px-6 pt-8 md:px-24 mb-8">
        <h1 className="text-2xl font-bold tracking-tighter">
          MARCUS & MUSE<span className="text-accent">.</span>
        </h1>
        <button className="px-6 py-3 text-sm font-medium border border-light/20 text-light rounded-full hover:bg-light/10 transition-colors">
          <a
            href="mailto:hello@marcusandmuse.com"
            className="text-muted hover:text-light transition-colors"
          >Get in Touch</a>
        </button>
      </nav>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent/80 via-dark/90 to-dark px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter">Open Web Data Viewer</h1>
        <p className="text-xl md:text-2xl text-accent mb-6">Unlock True Transparency in Digital Advertising</p>
        <p className="max-w-2xl mx-auto text-lg text-muted mb-8">
          See Beyond the Surface—Instantly. The essential Chrome extension for digital advertisers, media buyers, and brand safety professionals who demand real-time, actionable insights into website publishers. Powered by the OpenSincera API.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a href="#" className="px-8 py-3 rounded-full bg-accent text-dark font-semibold shadow hover:bg-accent/90 transition-colors">Install from Chrome Web Store</a>
          <a href="https://open.sincera.io/" className="px-8 py-3 rounded-full border border-accent text-accent font-semibold hover:bg-accent/10 transition-colors">Learn More About OpenSincera</a>
          <a href="/privacy-policy" className="px-8 py-3 rounded-full border border-light/20 text-light font-semibold hover:bg-light/10 transition-colors">Read Our Privacy Policy</a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-0 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-accent text-center tracking-tighter">Key Features</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-light/5 rounded-xl p-8 border border-light/10">
              <h3 className="text-xl font-semibold mb-2 text-accent">{f.title}</h3>
              <p className="text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who Is It For Section */}
      <section className="py-16 px-6 md:px-0 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-accent text-center tracking-tighter">Who Is It For?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {audiences.map((a) => (
            <div key={a.title} className="bg-light/5 rounded-xl p-8 border border-light/10">
              <h3 className="text-xl font-semibold mb-2 text-accent">{a.title}</h3>
              <p className="text-muted">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 md:px-0 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-accent text-center tracking-tighter">How It Works</h2>
        <ol className="list-decimal list-inside space-y-4 text-lg max-w-2xl mx-auto text-muted">
          <li><span className="font-semibold text-accent">Install the Extension:</span> Add Open Web Data Viewer to Chrome in seconds.</li>
          <li><span className="font-semibold text-accent">Connect Your API Key:</span> Enter your OpenSincera API key in the Settings tab.</li>
          <li><span className="font-semibold text-accent">Browse the Web:</span> Click the extension icon on any site to view publisher transparency data.</li>
          <li><span className="font-semibold text-accent">Manage Allow Lists:</span> Add publishers to your lists, export data, and optimize your campaigns.</li>
        </ol>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 md:px-0 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-accent text-center tracking-tighter">Why Choose Open Web Data Viewer?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((b) => (
            <div key={b.title} className="bg-light/5 rounded-xl p-8 border border-light/10">
              <h3 className="text-xl font-semibold mb-2 text-accent">{b.title}</h3>
              <p className="text-muted">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 text-center bg-gradient-to-br from-accent/80 via-dark/90 to-dark">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-light tracking-tighter">Get Started Now</h2>
        <p className="text-lg text-accent mb-8">Open Web Data Viewer—Empowering you with the data you need to make smarter, safer, and more effective advertising decisions.</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a href="#" className="px-8 py-3 rounded-full bg-accent text-dark font-semibold shadow hover:bg-accent/90 transition-colors">Install from Chrome Web Store</a>
          <a href="#" className="px-8 py-3 rounded-full border border-accent text-accent font-semibold hover:bg-accent/10 transition-colors">Learn More About OpenSincera</a>
          <a href="/privacy-policy" className="px-8 py-3 rounded-full border border-light/20 text-light font-semibold hover:bg-light/10 transition-colors">Read Our Privacy Policy</a>
        </div>
      </section>
    </div>
  );
} 