import React from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  Globe2,
  Laptop2,
  Users,
  Zap,
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-dark text-light">
      {/* Hero Section */}
      <header className="relative px-6 pt-12 pb-32 md:px-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="src/images/bg.png"
            alt="bg"
            className="absolute inset-0 w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-accent/5 via-dark/70 to-dark/90"></div>
        </div>

        <nav className="flex items-center justify-between mb-20 relative z-10">
          <h1 className="text-2xl font-bold tracking-tighter">
            MARCUS & MUSE<span className="text-accent">.</span>
          </h1>
          <button className="px-6 py-3 text-sm font-medium border border-light/20 text-light rounded-full hover:bg-light/10 transition-colors">
            Get in Touch
          </button>
        </nav>

        <div className="max-w-4xl relative z-10">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none mb-8">
            Strategic Digital Consulting
          </h2>
          <p className="text-xl text-muted mb-12 max-w-2xl">
            Empowering businesses through programmatic enablement, CTV
            optimization, business development, and operational support.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#about"
              className="group flex items-center gap-2 px-6 py-3 text-sm font-medium bg-accent text-dark rounded-full hover:bg-accent/90 transition-colors"
            >
              About Marcus and Muse
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </div>
      </header>

      {/* About Section */}
      <section
        id="about"
        className="px-6 py-32 md:px-24 border-t border-light/10"
      >
        <div className="max-w-4xl">
          <h3 className="text-4xl font-bold tracking-tighter mb-8">
            About Marcus and Muse
          </h3>
          <div className="space-y-6 text-muted text-lg">
            <p>
              Marcus and Muse, founded by Aaron Foley, is a strategic
              consultancy specializing in programmatic advertising and digital
              monetization. With over 15 years of experience at the intersection
              of ad tech, revenue optimization, and operational leadership,
              Aaron partners with publishers, platforms, and technology
              providers to navigate the complexities of the programmatic
              ecosystem.
            </p>
            <p>
              With a deep specialization in Connected TV (CTV) monetization,
              Marcus and Muse helps clients design and execute scalable,
              high-impact programmatic strategies. Drawing on expertise with
              leading platforms across DSPs and SSPs the consultancy provides
              guidance on demand integrations, ad tech infrastructure, and
              revenue growth.
            </p>
            <p>
              Beyond technology, Marcus and Muse is built on a foundation of
              strategic leadership—developing high-performing teams, refining
              operational processes, and fostering cross-functional
              collaboration to drive sustainable success. Whether optimizing
              programmatic channels, streamlining demand partnerships, or
              advising on the next phase of digital strategy, Marcus and Muse
              delivers a results-driven approach tailored to each client's
              unique needs.
            </p>
            <div className="mt-12 p-6 rounded-xl bg-light/5 border border-light/10">
              <h4 className="text-xl font-bold tracking-tighter text-accent mb-4">
                Why Marcus and Muse?
              </h4>
              <p className="text-muted">
                Our name reflects the harmonious blend of wisdom and creativity
                that drives our approach. Drawing inspiration from Marcus
                Aurelius's thoughtful and reasoned philosophy, combined with the
                creative spark embodied by the Muse, we deliver strategic
                solutions that are both methodical and innovative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-6 py-32 md:px-24 border-t border-light/10">
        <div className="max-w-4xl mb-16">
          <h3 className="text-4xl font-bold tracking-tighter mb-6">Services</h3>
          <p className="text-muted text-lg">
            We deliver comprehensive solutions that transform digital operations
            and drive sustainable growth through strategic leadership and
            technical expertise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <ServiceCard
            icon={<Zap />}
            title="Programmatic Enablement"
            description="Optimize your programmatic advertising strategy with cutting-edge solutions and data-driven insights."
          />
          <ServiceCard
            icon={<Laptop2 />}
            title="CTV Optimization"
            description="Maximize your Connected TV advertising performance with advanced targeting and measurement strategies."
          />
          <ServiceCard
            icon={<Globe2 />}
            title="Business Development"
            description="Strategic partnership cultivation and growth opportunities to expand your market presence."
          />
          <ServiceCard
            icon={<Users />}
            title="Fractional Leadership"
            description="Leadership on a fractional basis, acting as a part-time Head of Operations. We collaborate directly with executive teams to develop custom strategies for ad revenue growth, demand optimization, and operational efficiency, ensuring long-term success without the need for a full-time hire."
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-32 md:px-24 border-t border-light/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-4xl font-bold tracking-tighter mb-6">
            Bespoke Solutions
          </h3>
          <p className="text-muted text-lg">
            We believe every business has unique challenges and opportunities.
            That's why we create custom-tailored solutions starting at $2,500,
            designed specifically for your organization's needs and goals.
          </p>
          <div className="mt-12 flex justify-center">
            <a
              href="mailto:hello@marcusandmuse.com"
              className="group flex items-center gap-2 px-8 py-4 text-sm font-medium bg-accent text-dark rounded-full hover:bg-accent/90 transition-colors"
            >
              Let's Discuss Your Project
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-32 md:px-24 border-t border-light/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter mb-4">
              MARCUS & MUSE<span className="text-accent">.</span>
            </h1>
            <p className="text-muted max-w-xs">
              Strategic digital consulting for the modern age.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            <div>
              <h5 className="font-medium mb-4">Contact</h5>
              <a
                href="mailto:hello@marcusandmuse.com"
                className="text-muted hover:text-light transition-colors"
              >
                hello@marcusandmuse.com
              </a>
            </div>
            <div>
              <h5 className="font-medium mb-4">Follow</h5>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-muted hover:text-light transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://linkedin.com/in/aaronfoley"
                  className="text-muted hover:text-light transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-8 rounded-2xl border border-light/10 hover:border-accent/50 transition-all hover:-translate-y-1 duration-300">
      <div className="w-12 h-12 flex items-center justify-center text-accent mb-6">
        {icon}
      </div>
      <h4 className="text-2xl font-bold tracking-tighter mb-3">{title}</h4>
      <p className="text-muted">{description}</p>
    </div>
  );
}

export default App;
