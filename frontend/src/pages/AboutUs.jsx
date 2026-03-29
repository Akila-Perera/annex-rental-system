import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Scroll-reveal hook ── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── Reusable reveal wrapper ── */
function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Animated counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function AboutUs() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const team = [
    { name: 'AKILA PERERA',        role: 'CEO & Co-Founder',       emoji: '👨‍💻', colorClasses: 'bg-purple-500/10 border-purple-500/25', roleColor: 'text-purple-300', avatarBg: 'bg-purple-500/15 border-purple-500/30', bio: 'Former student housing advocate turned entrepreneur. Passionate about making affordable living a reality for every student.' },
    { name: 'PASINDU WANASINGHA',  role: 'CTO & Co-Founder',       emoji: '👨‍💻', colorClasses: 'bg-blue-500/10 border-blue-500/25',   roleColor: 'text-blue-300',   avatarBg: 'bg-blue-500/15 border-blue-500/30',   bio: 'Full-stack engineer with 10+ years building platforms that connect people and communities at scale.' },
    { name: 'THARUSHA DASANAYAKA', role: 'Head of Verification',   emoji: '👨‍💻', colorClasses: 'bg-teal-500/10 border-teal-500/25',   roleColor: 'text-teal-300',   avatarBg: 'bg-teal-500/15 border-teal-500/30',   bio: 'Ensures every listing meets our safety and quality standards through rigorous on-site inspection protocols.' },
    { name: 'ATHEEK AHAMED',       role: 'Head of Student Support', emoji: '👨‍💻', colorClasses: 'bg-orange-500/10 border-orange-500/25', roleColor: 'text-orange-300', avatarBg: 'bg-orange-500/15 border-orange-500/30', bio: 'Dedicated to making sure every student has a smooth, stress-free housing journey from search to move-in.' },
  ];

  const milestones = [
    { year: '2019', title: 'The Idea',         desc: 'Two university students struggled to find safe housing. They decided to build the solution they wished existed.',        yearColor: 'text-blue-400',   cardClasses: 'bg-blue-500/8 border-blue-500/20',   dotColor: 'bg-blue-400'   },
    { year: '2020', title: 'First Launch',      desc: 'AnnexFinder launched with 12 verified listings in Colombo. Word spread fast — 500 students signed up in 30 days.',  yearColor: 'text-purple-400', cardClasses: 'bg-purple-500/8 border-purple-500/20', dotColor: 'bg-purple-400' },
    { year: '2021', title: 'Expanded Citywide', desc: 'Grew to 5 cities and 1,200 listings. Introduced our landmark Verified Badge program trusted by students.',          yearColor: 'text-teal-400',   cardClasses: 'bg-teal-500/8 border-teal-500/20',   dotColor: 'bg-teal-400'   },
    { year: '2022', title: 'Series A Funding',  desc: 'Raised $3.2M to build out our tech platform, verification team, and student support infrastructure.',             yearColor: 'text-orange-400', cardClasses: 'bg-orange-500/8 border-orange-500/20', dotColor: 'bg-orange-400' },
    { year: '2023', title: '10,000 Students',   desc: 'Hit the milestone of 10,000 students successfully housed. Launched the Owner Dashboard for property managers.',    yearColor: 'text-amber-400',  cardClasses: 'bg-amber-500/8 border-amber-500/20',  dotColor: 'bg-amber-400'  },
    { year: '2024', title: 'National Scale',    desc: 'Now operating across 50+ universities nationwide with 500+ verified listings and a 4.9-star average rating.',      yearColor: 'text-pink-400',   cardClasses: 'bg-pink-500/8 border-pink-500/20',   dotColor: 'bg-pink-400'   },
  ];

  const values = [
    { icon: '🛡️', title: 'Safety First',       desc: 'Every property is physically inspected before listing. No exceptions, no shortcuts.',           colorClasses: 'bg-blue-500/8 border-blue-500/20',   iconBg: 'bg-blue-500/15 border-blue-500/30'   },
    { icon: '🤝', title: 'Genuine Trust',       desc: 'We earn trust through transparency — honest reviews, verified hosts, and clear pricing.',       colorClasses: 'bg-purple-500/8 border-purple-500/20', iconBg: 'bg-purple-500/15 border-purple-500/30' },
    { icon: '💡', title: 'Student-Centric',     desc: 'Every decision we make starts with one question: does this make life better for our students?', colorClasses: 'bg-teal-500/8 border-teal-500/20',   iconBg: 'bg-teal-500/15 border-teal-500/30'   },
    { icon: '🌍', title: 'Inclusive Community', desc: 'Safe housing is a right, not a privilege. We serve students of all backgrounds and budgets.',   colorClasses: 'bg-orange-500/8 border-orange-500/20', iconBg: 'bg-orange-500/15 border-orange-500/30' },
    { icon: '⚡', title: 'Move Fast',           desc: 'We iterate quickly on feedback so our platform always reflects what students actually need.',   colorClasses: 'bg-amber-500/8 border-amber-500/20',  iconBg: 'bg-amber-500/15 border-amber-500/30'  },
    { icon: '📊', title: 'Data Driven',         desc: 'Every listing, rating, and review fuels our algorithms to surface the best options for you.',   colorClasses: 'bg-pink-500/8 border-pink-500/20',   iconBg: 'bg-pink-500/15 border-pink-500/30'   },
  ];

  const partners = ['University of Colombo', 'SLIIT', 'NSBM', 'Moratuwa University', 'Eastern University', 'Kelaniya University'];

  const testimonials = [
    { name: 'Nisha K.',    uni: 'University of Colombo', text: 'I found my room in under a week. The verified badge gave me complete peace of mind — no scams, no surprises.',                                                           emoji: '👩‍🎓', colorClasses: 'bg-blue-500/6 border-blue-500/18',   quoteColor: 'text-blue-400'   },
    { name: 'Rajan M.',   uni: 'SLIIT',                  text: 'The support team responded within minutes when I had an issue. Never felt alone through the whole process.',                                                            emoji: '👨‍💻', colorClasses: 'bg-purple-500/6 border-purple-500/18', quoteColor: 'text-purple-400' },
    { name: 'Thilini S.', uni: 'Moratuwa University',    text: "As a female student moving cities, safety was everything. AnnexFinder's female-only filter and verification made all the difference.", emoji: '👩‍🔬', colorClasses: 'bg-teal-500/6 border-teal-500/18',   quoteColor: 'text-teal-400'   },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f4ff] font-sans overflow-x-hidden">

      {/* ── Custom styles for things Tailwind can't do inline ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp        { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow     { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.7;transform:scale(1.08);} }
        @keyframes floatBob      { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
        @keyframes particleDrift { 0%{transform:translateY(0) translateX(0) scale(1);opacity:.6;} 50%{transform:translateY(-60px) translateX(20px) scale(1.2);opacity:.3;} 100%{transform:translateY(-120px) translateX(-10px) scale(.8);opacity:0;} }
        @keyframes scrollBounce  { 0%,100%{transform:translateY(0);} 50%{transform:translateY(8px);} }
        @keyframes marqueeTick   { from{transform:translateX(0);} to{transform:translateX(-50%);} }

        .animate-fade-up  { animation: fadeUp 0.7s ease forwards; opacity:0; }
        .delay-1          { animation-delay: 0.15s; }
        .delay-2          { animation-delay: 0.30s; }
        .delay-3          { animation-delay: 0.45s; }
        .delay-4          { animation-delay: 0.60s; }
        .animate-pulse-glow   { animation: pulseGlow 5s ease-in-out infinite; }
        .animate-float-1      { animation: floatBob 4s ease-in-out infinite; }
        .animate-float-2      { animation: floatBob 4s ease-in-out infinite 0.7s; }
        .animate-float-3      { animation: floatBob 4s ease-in-out infinite 1.4s; }
        .animate-scroll-bounce{ animation: scrollBounce 1.4s ease-in-out infinite; }
        .animate-marquee      { animation: marqueeTick 22s linear infinite; }
        .animate-marquee:hover{ animation-play-state: paused; }

        .particle { animation: particleDrift calc(4s + var(--i) * 0.6s) ease-in-out infinite; animation-delay: calc(var(--i) * 0.3s); }

        .marquee-mask { mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }

        .hero-glow-bg { background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,126,247,0.13) 0%, transparent 70%); }
        .hero-glow-orb { background: radial-gradient(circle, rgba(45,126,247,0.16) 0%, transparent 70%); }
        .cta-glow-orb  { background: radial-gradient(ellipse, rgba(45,126,247,0.18) 0%, transparent 70%); }
        .mission-glow  { background: radial-gradient(circle, rgba(45,126,247,0.08) 0%, transparent 70%); }
        .timeline-line { background: linear-gradient(to bottom, transparent, rgba(45,126,247,0.4) 10%, rgba(45,126,247,0.4) 90%, transparent); }
        .hero-highlight{ color: #2d7ef7; text-shadow: 0 0 50px rgba(45,126,247,0.5); }
      `}</style>

      {/* ════════════════════════ NAVBAR ════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${scrolled ? 'bg-[#0d1117]/92 backdrop-blur-lg border-b border-white/7 py-3' : 'py-[18px]'}`}>
        <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-8">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-blue-500 rounded-[10px] flex items-center justify-center text-lg">🏠</div>
            <span className="font-display text-[1.3rem] font-extrabold text-[#f0f4ff]">UNI<span className="text-blue-400">NEST</span></span>
          </div>
          <ul className="hidden md:flex gap-1 ml-auto">
            {[['/', 'Home'], ['#mission', 'Mission'], ['#team', 'Team'], ['#timeline', 'Story']].map(([href, label]) => (
              <li key={label}><a href={href} className="px-3.5 py-2 rounded-lg text-[#8a96b0] text-sm hover:text-[#f0f4ff] hover:bg-white/5 transition-all duration-300">{label}</a></li>
            ))}
          </ul>
          <div className="hidden md:flex gap-2.5 items-center">
            <button onClick={() => navigate('/')}    className="px-5 py-2 rounded-lg text-[#8a96b0] text-sm bg-transparent cursor-pointer hover:text-[#f0f4ff] transition-all duration-300">Home</button>
            <button onClick={() => navigate('/support')} className="px-5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium cursor-pointer hover:bg-blue-400 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">Contact Us</button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 pt-[120px] pb-20 text-center hero-glow-bg">
        {/* Glow orb */}
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full hero-glow-orb animate-pulse-glow pointer-events-none" />
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute rounded-full particle"
              style={{
                width: `${4 + i * 2}px`, height: `${4 + i * 2}px`,
                left: `${5 + i * 8}%`, top: `${20 + i * 5}%`,
                '--i': i,
                background: i % 3 === 0 ? 'rgba(45,126,247,0.5)' : i % 3 === 1 ? 'rgba(139,92,246,0.4)' : 'rgba(20,184,166,0.4)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[780px]">
          <div className="animate-fade-up inline-block mb-5 px-4 py-2 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm font-medium">🏠 Our Story</div>
          <h1 className="font-display animate-fade-up delay-1 text-[clamp(2.8rem,6.5vw,4.8rem)] font-extrabold leading-[1.08] mb-5 text-[#f0f4ff]">
            Built by Students,<br />
            <span className="hero-highlight">For Students</span>
          </h1>
          <p className="animate-fade-up delay-2 text-[#8a96b0] text-lg leading-[1.75] max-w-[580px] mx-auto mb-9">
            We started UNINEST because we lived the problem ourselves — searching desperately for safe, affordable housing near campus with no reliable platform to turn to. That changes now.
          </p>
          <div className="animate-fade-up delay-3 flex gap-3.5 justify-center flex-wrap mb-14">
            <button onClick={() => navigate('/')} className="px-9 py-3.5 rounded-[14px] bg-blue-500 text-white text-base font-semibold cursor-pointer hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300">Find a Room</button>
            <a href="#mission" className="px-9 py-3.5 rounded-[14px] border border-white/10 text-[#8a96b0] text-base font-medium hover:border-blue-500/40 hover:text-[#f0f4ff] hover:-translate-y-0.5 transition-all duration-300">Our Mission ↓</a>
          </div>
        </div>
        <div className="animate-fade-up delay-4 flex flex-col items-center gap-2 text-[#5a6478] text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-scroll-bounce" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ════════════════════════ STATS ════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[1200px] mx-auto px-8 pb-20">
        {[
          { target: 10000, suffix: '+', label: 'Students Housed',      numColor: 'text-blue-400',   labelColor: 'text-blue-300',   bg: 'bg-blue-500/8 border-blue-500/20'   },
          { target: 500,   suffix: '+', label: 'Verified Listings',    numColor: 'text-purple-400', labelColor: 'text-purple-300', bg: 'bg-purple-500/8 border-purple-500/20' },
          { target: 50,    suffix: '+', label: 'Universities Covered', numColor: 'text-teal-400',   labelColor: 'text-teal-300',   bg: 'bg-teal-500/8 border-teal-500/20'   },
          { target: 98,    suffix: '%', label: 'Satisfaction Rate',    numColor: 'text-orange-400', labelColor: 'text-orange-300', bg: 'bg-orange-500/8 border-orange-500/20' },
        ].map((s) => (
          <Reveal key={s.label} className={`rounded-[20px] p-8 text-center border ${s.bg} hover:-translate-y-1 transition-all duration-300`}>
            <div className={`font-display text-[2.4rem] font-extrabold mb-1.5 leading-none ${s.numColor}`}><Counter target={s.target} suffix={s.suffix} /></div>
            <div className={`text-sm font-medium ${s.labelColor}`}>{s.label}</div>
          </Reveal>
        ))}
      </div>

      {/* ════════════════════════ MISSION ════════════════════════ */}
      <section className="py-20 bg-[#161b25] border-t border-b border-white/7" id="mission">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <Reveal delay={0}>
              <span className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/8 text-blue-300 text-xs font-medium tracking-widest">Our Mission</span>
              <h2 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-[#f0f4ff] leading-[1.15] mb-4">
                Safe housing for <span className="text-blue-400">every</span> student
              </h2>
              <p className="text-[#8a96b0] text-base leading-[1.75]">Finding a place to live while studying should be the least of your worries. Yet for millions of students, it's one of the most stressful experiences of their academic journey — scams, unsafe conditions, hidden fees, unreliable landlords.</p>
              <p className="text-[#8a96b0] text-base leading-[1.75] mt-4">AnnexFinder exists to eliminate that stress. We physically verify every listing, vet every owner, and stand behind every booking with our student-first guarantee.</p>
              <div className="flex gap-2.5 flex-wrap mt-7">
                <span className="px-4 py-1.5 rounded-full text-xs font-medium border bg-blue-500/10 border-blue-500/35 text-blue-300">🔍 Verified Listings</span>
                <span className="px-4 py-1.5 rounded-full text-xs font-medium border bg-teal-500/10 border-teal-500/35 text-teal-300">🔒 Secure Payments</span>
                <span className="px-4 py-1.5 rounded-full text-xs font-medium border bg-purple-500/10 border-purple-500/35 text-purple-300">🎧 24/7 Support</span>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="relative flex flex-col gap-4">
                {[
                  { icon: '✅', title: 'Verified Property',  sub: 'Inspected on-site by our team',   border: 'border-l-blue-500',   anim: 'animate-float-1' },
                  { icon: '⭐', title: 'Rated 4.9 / 5.0',   sub: 'By 10,000+ real students',         border: 'border-l-purple-500', anim: 'animate-float-2', ml: 'ml-5' },
                  { icon: '🛡️', title: 'Safety Guaranteed', sub: 'Zero-compromise standards',        border: 'border-l-teal-500',   anim: 'animate-float-3' },
                ].map(({ icon, title, sub, border, anim, ml }) => (
                  <div key={title} className={`bg-[#1a2030] border border-white/7 ${border} border-l-[3px] rounded-[14px] p-4 flex items-center gap-4 ${anim} ${ml || ''} hover:translate-x-1.5 hover:border-blue-500/30 transition-all duration-300`}>
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="font-display font-bold text-[#f0f4ff] text-sm">{title}</p>
                      <p className="text-[#5a6478] text-xs mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full mission-glow pointer-events-none" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════ VALUES ════════════════════════ */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/8 text-blue-300 text-xs font-medium tracking-widest">What We Stand For</span>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-[#f0f4ff] leading-[1.15] mb-4">Our Core <span className="text-blue-400">Values</span></h2>
            <p className="text-[#8a96b0] text-sm max-w-[560px] mx-auto leading-[1.7]">The principles that shape every feature we build, every property we verify, and every student we serve.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <Reveal key={v.title} className={`rounded-[20px] p-8 border ${v.colorClasses} hover:-translate-y-1.5 transition-all duration-300`} delay={i * 80}>
                <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl mb-4 border ${v.iconBg}`}>{v.icon}</div>
                <h3 className="font-display text-base font-bold text-[#f0f4ff] mb-2.5">{v.title}</h3>
                <p className="text-[#8a96b0] text-sm leading-[1.65]">{v.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TIMELINE ════════════════════════ */}
      <section className="py-20 bg-[#161b25] border-t border-b border-white/7" id="timeline">
        <div className="max-w-[1200px] mx-auto px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/8 text-blue-300 text-xs font-medium tracking-widest">How We Got Here</span>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-[#f0f4ff] leading-[1.15] mb-4">Our <span className="text-blue-400">Journey</span></h2>
            <p className="text-[#8a96b0] text-sm max-w-[560px] mx-auto leading-[1.7]">From a frustrated idea in a university dorm to Sri Lanka's most trusted student housing platform.</p>
          </Reveal>
          <div className="relative pt-5">
            {/* Center line — hidden on mobile */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 timeline-line hidden md:block" />
            {milestones.map((m, i) => (
              <Reveal key={m.year} className={`flex items-center mb-10 relative ${i % 2 === 0 ? 'md:flex-row-reverse md:pr-[calc(50%+36px)]' : 'md:flex-row md:pl-[calc(50%+36px)]'}`} delay={i * 100}>
                <div className={`rounded-[20px] p-6 border w-full ${m.cardClasses} hover:scale-[1.02] transition-all duration-300`}>
                  <div className={`font-display text-xs font-bold tracking-[0.1em] mb-1.5 ${m.yearColor}`}>{m.year}</div>
                  <h3 className="font-display text-[1.05rem] font-extrabold text-[#f0f4ff] mb-2">{m.title}</h3>
                  <p className="text-[#8a96b0] text-sm leading-[1.6]">{m.desc}</p>
                </div>
                <div className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#161b25] z-10 hidden md:block ${m.dotColor}`} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ TEAM ════════════════════════ */}
      <section className="py-20" id="team">
        <div className="max-w-[1200px] mx-auto px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/8 text-blue-300 text-xs font-medium tracking-widest">The People Behind It</span>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-[#f0f4ff] leading-[1.15] mb-4">Meet the <span className="text-blue-400">Team</span></h2>
            <p className="text-[#8a96b0] text-sm max-w-[560px] mx-auto leading-[1.7]">A passionate group of builders, dreamers, and former students who know exactly what you need.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((member, i) => (
              <Reveal key={member.name} className={`rounded-[20px] p-8 text-center border ${member.colorClasses} hover:-translate-y-1.5 transition-all duration-300`} delay={i * 90}>
                <div className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[34px] mx-auto mb-4 border ${member.avatarBg}`}>{member.emoji}</div>
                <h3 className="font-display text-[1.05rem] font-extrabold text-[#f0f4ff] mb-1">{member.name}</h3>
                <p className={`text-xs font-medium mb-3.5 tracking-[0.04em] ${member.roleColor}`}>{member.role}</p>
                <p className="text-[#8a96b0] text-sm leading-[1.65]">{member.bio}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ PARTNERS ════════════════════════ */}
      <section className="py-20 bg-[#161b25] border-t border-b border-white/7">
        <div className="max-w-[1200px] mx-auto px-8">
          <Reveal className="text-center">
            <span className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/8 text-blue-300 text-xs font-medium tracking-widest">Our University Partners</span>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-[#f0f4ff] leading-[1.15]">Trusted by <span className="text-blue-400">Top Universities</span></h2>
          </Reveal>
          <div className="overflow-hidden mt-10 marquee-mask">
            <div className="flex gap-4 w-max animate-marquee">
              {[...partners, ...partners].map((p, i) => (
                <div key={i} className="px-7 py-3 rounded-full bg-[#1a2030] border border-white/7 text-[#8a96b0] text-sm font-medium whitespace-nowrap hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/6 transition-all duration-300">{p}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ TESTIMONIALS ════════════════════════ */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/8 text-blue-300 text-xs font-medium tracking-widest">Real Students, Real Stories</span>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-[#f0f4ff] leading-[1.15]">What <span className="text-blue-400">Students</span> Say</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} className={`rounded-[20px] p-8 border relative overflow-hidden ${t.colorClasses} hover:-translate-y-1.5 transition-all duration-300`} delay={i * 120}>
                <div className={`text-[5rem] font-display font-extrabold leading-none mb-[-10px] opacity-15 ${t.quoteColor}`}>"</div>
                <p className="text-[#8a96b0] text-sm leading-[1.75] mb-6">{t.text}</p>
                <div className="flex items-center gap-3 border-t border-white/7 pt-4">
                  <span className="text-3xl">{t.emoji}</span>
                  <div>
                    <p className="font-display font-bold text-[#f0f4ff] text-sm">{t.name}</p>
                    <p className="text-[#5a6478] text-xs mt-0.5">{t.uni}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ CTA BANNER ════════════════════════ */}
      <section className="py-24 px-8 text-center relative overflow-hidden bg-[#161b25] border-t border-b border-white/7">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] cta-glow-orb animate-pulse-glow pointer-events-none" />
        <Reveal className="relative z-10">
          <h2 className="font-display text-[clamp(2rem,4vw,2.8rem)] font-extrabold text-[#f0f4ff] mb-3.5">Ready to Find Your <span className="text-blue-400">Perfect Home?</span></h2>
          <p className="text-[#8a96b0] text-base mb-9">Join 10,000+ students already living safely and comfortably with AnnexFinder.</p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <button onClick={() => navigate('/')}        className="px-9 py-3.5 rounded-[14px] bg-blue-500 text-white text-base font-semibold cursor-pointer hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300">Browse Listings</button>
            <button onClick={() => navigate('/support')} className="px-9 py-3.5 rounded-[14px] border border-white/10 text-[#8a96b0] text-base font-medium cursor-pointer hover:border-blue-500/40 hover:text-[#f0f4ff] hover:-translate-y-0.5 transition-all duration-300">Talk to Support</button>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer className="bg-[#161b25] px-8 pt-[60px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-12 pb-12 border-b border-white/7">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-500 rounded-[10px] flex items-center justify-content-center text-lg">🏠</div>
              <span className="font-display text-[1.3rem] font-extrabold text-[#f0f4ff]">Annex<span className="text-blue-400">Finder</span></span>
            </div>
            <p className="text-[#5a6478] text-sm leading-[1.6] mb-5 max-w-[280px]">The ultimate destination for student housing across the country.</p>
            <div className="flex gap-2.5">
              {['f', '@'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 rounded-[10px] bg-white/6 border border-white/7 text-[#8a96b0] flex items-center justify-center text-sm font-bold hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all duration-300">{s}</a>
              ))}
            </div>
          </div>
          {[
            { title: 'Explore', links: [['/', 'Find a Room'], ['#timeline', 'Our Story'], ['#team', 'Meet the Team'], ['#mission', 'Mission']] },
            { title: 'For Owners', links: [['#list', 'List your property'], ['#dashboard', 'Owner Dashboard'], ['#safety', 'Safety Standards'], ['#pricing', 'Pricing Plans']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-display text-sm font-bold text-[#f0f4ff] mb-4">{title}</h4>
              <ul className="flex flex-col gap-3">
                {links.map(([href, label]) => (
                  <li key={label}><a href={href} className="text-[#5a6478] text-sm hover:text-blue-300 hover:pl-1 transition-all duration-300">{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-display text-sm font-bold text-[#f0f4ff] mb-4">Newsletter</h4>
            <p className="text-[#5a6478] text-sm mb-3.5 leading-[1.5]">Get the latest housing deals delivered to your inbox.</p>
            <div className="flex overflow-hidden rounded-lg border border-white/7">
              <input type="email" placeholder="Email address" className="flex-1 px-3.5 py-2.5 bg-white/4 text-[#f0f4ff] text-sm placeholder:text-[#5a6478] outline-none" />
              <button className="px-4 py-2.5 bg-blue-500 text-white text-base hover:bg-blue-400 transition-all duration-300 cursor-pointer">→</button>
            </div>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto py-5 text-center text-[#5a6478] text-xs">© 2024 AnnexFinder. All rights reserved.</div>
      </footer>
    </div>
  );
}