import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, 
  X, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Compass, 
  ShieldCheck, 
  Headphones, 
  PlaneTakeoff,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  RotateCcw
} from 'lucide-react';

const ASSET_BASE_PATH = "/";
const SCROLL_VIDEO_SRC = `${ASSET_BASE_PATH}scroll-video.mp4`;
const BACKGROUND_VIDEO_SOURCES = [
  `${ASSET_BASE_PATH}main-zone-background.mp4`,
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('All');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Interactive Mouse Scroll Takeoff Sequence from the beginning
  const [firstVideoFinished, setFirstVideoFinished] = useState(false);
  const [elementsDescended, setElementsDescended] = useState(false);
  const [introVideoUnavailable, setIntroVideoUnavailable] = useState(false);

  const video1Ref = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef<number>(0);
  const targetScrubProgress = useRef<number>(0);
  const currentScrubProgress = useRef<number>(0);
  const rafId = useRef<number | null>(null);
  const lastSeekAt = useRef<number>(0);
  const transitionStarted = useRef(false);
  const backgroundSourceIndex = useRef(0);


  // Form state for exploration / trip planner modal
  const [destination, setDestination] = useState('Kyoto, Japan');
  const [travelDate, setTravelDate] = useState('2026-09-15');
  const [travelers, setTravelers] = useState('2 Travelers');

  const menuItems = ['About', 'Services', 'Locations', 'Reviews', 'Support'];

  // Complete takeoff and transition to full site
  const completeTakeoffTransition = useCallback(() => {
    if (transitionStarted.current) return;

    transitionStarted.current = true;
    setFirstVideoFinished(true);
    targetScrubProgress.current = 1;
    currentScrubProgress.current = 1;

    const backgroundVideo = backgroundVideoRef.current;
    if (backgroundVideo) {
      void backgroundVideo.play().catch(() => undefined);
    }

    window.setTimeout(() => {
      setElementsDescended(true);
    }, 200);
  }, []);

  // Replay the interactive scroll entrance from the beginning
  const replayTakeoff = () => {
    transitionStarted.current = false;
    setFirstVideoFinished(false);
    setElementsDescended(false);
    setIntroVideoUnavailable(false);
    targetScrubProgress.current = 0;
    currentScrubProgress.current = 0;
    lastSeekAt.current = 0;

    if (video1Ref.current) {
      video1Ref.current.pause();
      video1Ref.current.currentTime = 0;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Skip intro sequence directly to main content
  const skipIntro = () => {
    completeTakeoffTransition();
  };

  const resumeBackgroundVideo = useCallback(() => {
    const backgroundVideo = backgroundVideoRef.current;
    if (backgroundVideo && backgroundVideo.paused) {
      void backgroundVideo.play().catch(() => undefined);
    }
  }, []);

  const handleBackgroundVideoError = useCallback(() => {
    const backgroundVideo = backgroundVideoRef.current;
    const nextSourceIndex = backgroundSourceIndex.current + 1;

    if (!backgroundVideo || nextSourceIndex >= BACKGROUND_VIDEO_SOURCES.length) return;

    backgroundSourceIndex.current = nextSourceIndex;
    backgroundVideo.src = BACKGROUND_VIDEO_SOURCES[nextSourceIndex];
    backgroundVideo.load();
    void backgroundVideo.play().catch(() => undefined);
  }, []);

  const handleIntroVideoError = useCallback(() => {
    setIntroVideoUnavailable(true);
    completeTakeoffTransition();
  }, [completeTakeoffTransition]);

  // Smooth scrub loop. Progress is interpolated every animation frame, while
  // seeks are throttled and gated so the browser never decodes overlapping jumps.
  useEffect(() => {
    if (firstVideoFinished || introVideoUnavailable) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      return;
    }

    let lastFrameTime = performance.now();

    const smoothVideoPlayback = (now: number) => {
      const elapsed = Math.min(now - lastFrameTime, 64);
      lastFrameTime = now;

      const diff = targetScrubProgress.current - currentScrubProgress.current;
      if (Math.abs(diff) > 0.0001) {
        const easing = 1 - Math.exp(-8.5 * (elapsed / 1000));
        currentScrubProgress.current += diff * easing;
      }

      const video = video1Ref.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        const targetTime = Math.min(
          Math.max(0, currentScrubProgress.current * video.duration),
          Math.max(0, video.duration - 0.02),
        );
        const timeDifference = Math.abs(targetTime - video.currentTime);
        const canSeek = now - lastSeekAt.current >= 50;

        if (canSeek && timeDifference >= 0.012) {
          lastSeekAt.current = now;
          video.currentTime = targetTime;
        }
      }

      if (currentScrubProgress.current >= 0.985 && targetScrubProgress.current >= 0.99) {
        completeTakeoffTransition();
        return;
      }

      rafId.current = requestAnimationFrame(smoothVideoPlayback);
    };

    rafId.current = requestAnimationFrame(smoothVideoPlayback);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [firstVideoFinished, introVideoUnavailable, completeTakeoffTransition]);

  // Handle Mouse Wheel and Touch Scroll during Takeoff entrance
  useEffect(() => {
    if (firstVideoFinished) return;

    const handleWheel = (e: WheelEvent) => {
      if (firstVideoFinished) return;

      e.preventDefault();

      const delta = e.deltaMode === 1
        ? e.deltaY * 16
        : e.deltaMode === 2
          ? e.deltaY * window.innerHeight
          : e.deltaY;
      const sensitivity = 0.0008;
      targetScrubProgress.current = Math.min(
        Math.max(0, targetScrubProgress.current + delta * sensitivity),
        1,
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (firstVideoFinished) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY;
      touchStartY.current = touchY;

      if (Math.abs(deltaY) > 0.1) {
        e.preventDefault();
        const sensitivity = 0.0022;
        targetScrubProgress.current = Math.min(
          Math.max(0, targetScrubProgress.current + deltaY * sensitivity),
          1,
        );
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [firstVideoFinished]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveModal(null);
    }, 2200);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterSubscribed(false);
      setNewsletterEmail('');
    }, 3000);
  };

  const popularDestinations = [
    { 
      name: 'Kyoto & Tokyo, Japan', 
      tag: 'Cultural Harmony', 
      time: '10 Days', 
      price: '$2,450', 
      code: 'HND • ITM',
      desc: 'Private tea ceremonies, serene bamboo groves, and bullet train first-class transfers.'
    },
    { 
      name: 'Amalfi Coast, Italy', 
      tag: 'Coastal Bliss', 
      time: '7 Days', 
      price: '$3,100', 
      code: 'FCO • NAP',
      desc: 'Cliffside boutique villas, private Riva yacht charters, and sunset lemon grove dining.'
    },
    { 
      name: 'Swiss Alps, Switzerland', 
      tag: 'Alpine Serenity', 
      time: '8 Days', 
      price: '$2,890', 
      code: 'ZRH • GVA',
      desc: 'Panoramic glacier express suites, private chalet firesides, and alpine helicopter tours.'
    },
    { 
      name: 'Santorini, Greece', 
      tag: 'Aegean Sunset', 
      time: '6 Days', 
      price: '$2,200', 
      code: 'ATH • JTR',
      desc: 'Private infinity pools over the caldera, catamaran cruises, and cliffside wine tastings.'
    },
    { 
      name: 'Reykjavik & Fjords, Iceland', 
      tag: 'Aurora Escape', 
      time: '5 Days', 
      price: '$2,750', 
      code: 'KEF • RKV',
      desc: 'Geothermal lagoon retreats, private glacier snowmobiling, and northern lights flights.'
    },
    { 
      name: 'Bora Bora, French Polynesia', 
      tag: 'Lagoon Paradise', 
      time: '9 Days', 
      price: '$4,300', 
      code: 'PPT • BOB',
      desc: 'Overwater bungalows, private reef diving, and sunset champagne canoe breakfasts.'
    },
  ];

  const travelerReviews = [
    {
      author: 'Eleanor Vance',
      role: 'Private Charter Member',
      location: 'New York ➔ Zurich',
      rating: 5,
      avatar: 'EV',
      comment: 'The smoothest flight experience of my life. From the tarmac chauffeur to the private sky suite, Airlines delivered effortless elegance without a single point of friction.',
      flightTag: 'First Class Suite'
    },
    {
      author: 'Marcus Sterling',
      role: 'Frequent Global Flyer',
      location: 'London ➔ Tokyo Haneda',
      rating: 5,
      avatar: 'MS',
      comment: 'The in-flight dining was Michelin quality and the cabin silence was extraordinary. I arrived in Tokyo refreshed, rested, and ahead of schedule.',
      flightTag: 'Signature Long-Haul'
    },
    {
      author: 'Sophia Chen-Laurent',
      role: 'Architectural Director',
      location: 'Paris ➔ Kyoto',
      rating: 5,
      avatar: 'SC',
      comment: 'Booking with Airlines redefined luxury travel for our family. Every transfer was synchronized down to the minute. The sunset view from 38,000 feet was unforgettable.',
      flightTag: 'Private Family Itinerary'
    },
  ];

  const flightRoutes = [
    { from: 'London Heathrow (LHR)', to: 'Tokyo Haneda (HND)', duration: '12h 40m', status: 'Daily On-Time', category: 'Asia', price: '$2,450' },
    { from: 'New York (JFK)', to: 'Zurich Kloten (ZRH)', duration: '7h 35m', status: 'Direct Daily', category: 'Europe', price: '$2,890' },
    { from: 'Los Angeles (LAX)', to: 'Bora Bora (BOB)', duration: '8h 15m', status: 'Non-Stop Priority', category: 'Pacific', price: '$4,300' },
    { from: 'Paris (CDG)', to: 'Santorini (JTR)', duration: '3h 25m', status: 'Private Charter', category: 'Europe', price: '$2,200' },
    { from: 'Dubai (DXB)', to: 'Reykjavik (KEF)', duration: '9h 10m', status: 'Exclusive Express', category: 'Europe', price: '$2,750' },
    { from: 'Singapore (SIN)', to: 'Milan Malpensa (MXP)', duration: '12h 15m', status: 'Overnight Suite', category: 'Europe', price: '$3,100' },
  ];

  const faqs = [
    {
      q: 'How does Airlines ensure a stress-free travel experience?',
      a: 'We provide end-to-end itinerary orchestration including private tarmac transfers, expedited biometric clearance, dedicated 24/7 travel architects, and flexible rebooking with zero penalties.'
    },
    {
      q: 'What is included in the Handcrafted Travel packages?',
      a: 'All packages include roundtrip premium flights, luxury boutique accommodations, private ground transportation, verified local guides, and 24/7 on-call concierge assistance.'
    },
    {
      q: 'Can I customize my flight routes and departure times?',
      a: 'Yes, our travel architects specialize in bespoke itineraries. Whether booking private charters or scheduled suites, we align flight times precisely with your schedule.'
    },
    {
      q: 'What are the baggage and in-cabin allowances?',
      a: 'Guests enjoy complimentary allowances for up to 3 checked bags (32kg each) plus priority handling, dedicated fragile item transport, and door-to-door luggage courier services.'
    },
  ];

  const filteredRoutes = selectedRouteFilter === 'All' 
    ? flightRoutes 
    : flightRoutes.filter(r => r.category === selectedRouteFilter);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full min-h-screen text-white font-['Inter',sans-serif] select-none bg-black">
      
      {/* 
        ========================================================================
        1. FULL-PAGE DUAL BACKGROUND VIDEO SYSTEM
        - Video 1: Takeoff & zoom through airplane window (controlled by mouse scroll)
        - Video 2: Looping 1080p airplane window sunset footage
        ========================================================================
      */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        
        {/* VIDEO 1: Interactive Takeoff (Scrubbed with mouse scroll) */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            firstVideoFinished ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <video
            ref={video1Ref}
            className="w-full h-full object-cover scale-105"
            muted
            playsInline
            preload="auto"
            onError={handleIntroVideoError}
          >
            <source src={SCROLL_VIDEO_SRC} type="video/mp4" />
          </video>
        </div>

        {/* VIDEO 2: Uploaded 1080p Airplane Window Sunset Video (Fixed loop across full page) */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            firstVideoFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <video
            ref={backgroundVideoRef}
            className="w-full h-full object-cover scale-100"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src={BACKGROUND_VIDEO_SOURCES[0]}
            onCanPlay={resumeBackgroundVideo}
            onLoadedData={resumeBackgroundVideo}
            onError={handleBackgroundVideoError}
          />
        </div>

        {/* Cinematic translucent atmospheric gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: firstVideoFinished 
              ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.45) 50%, rgba(0, 0, 0, 0.78) 100%)'
              : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.40) 100%)'
          }}
        />
      </div>

      {/* 
        ========================================================================
        TAKEOFF INTRO (100% Pure Unobstructed Fullscreen Video Experience)
        ========================================================================
      */}

      {/* 
        ========================================================================
        2. HEADER & NAVIGATION BAR (Descends after takeoff transition)
        ========================================================================
      */}
      {firstVideoFinished && (
        <header 
          className={`sticky top-0 z-40 w-full px-6 md:px-12 lg:px-16 pt-6 pb-4 bg-black/30 backdrop-blur-md border-b border-white/10 transition-all duration-1000 ease-out transform ${
            elementsDescended 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-12 pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-white font-semibold text-xl tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
            >
              Airlines
            </a>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center space-x-7 lg:space-x-9">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'Locations') scrollToSection('destinations-section');
                    else if (item === 'Reviews') scrollToSection('reviews-section');
                    else if (item === 'Fleet') scrollToSection('fleet-section');
                    else setActiveModal(item);
                  }}
                  className="text-[14px] font-normal text-white/90 hover:text-white transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white rounded px-1.5 py-1 whitespace-nowrap"
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={replayTakeoff}
                className="text-xs text-white/80 hover:text-white border border-white/20 bg-black/30 hover:bg-black/60 backdrop-blur-sm px-3.5 py-2 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Replay Mouse Scroll Takeoff"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Takeoff</span>
              </button>

              <button
                onClick={() => setActiveModal('planner')}
                className="border border-white bg-transparent text-[14px] font-normal text-white px-5 py-2 rounded-full transition-all duration-300 hover:bg-white hover:text-black cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap shadow-sm"
              >
                Start Travel
              </button>
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Drawer */}
      {firstVideoFinished && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-fade-in-up">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <span className="text-white font-semibold text-xl">Airlines</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-white focus:outline-none rounded-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col space-y-5 pt-8">
            {menuItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item === 'Locations') scrollToSection('destinations-section');
                  else if (item === 'Reviews') scrollToSection('reviews-section');
                  else if (item === 'Fleet') scrollToSection('fleet-section');
                  else setActiveModal(item);
                }}
                className="text-left text-[17px] font-normal text-white/90 hover:text-white py-1 transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}

            <div className="pt-6 space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  replayTakeoff();
                }}
                className="w-full border border-white/30 bg-black/40 text-[14px] font-normal text-white py-2.5 rounded-full text-center flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Takeoff</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal('planner');
                }}
                className="w-full border border-white bg-white text-black text-[14px] font-medium py-3 rounded-full text-center transition-all cursor-pointer"
              >
                Start Travel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        3. HERO SECTION (Clean, Uncluttered Central Headline & CTA)
        ========================================================================
      */}
      {firstVideoFinished && (
        <section id="home" className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col justify-between px-6 md:px-12 lg:px-16 py-12 md:py-16 overflow-hidden">
          
          {/* Main Central Content Area */}
          <main className="relative z-20 w-full flex-1 flex items-center justify-center my-auto">
            
            {/* CENTER HEADLINE & CTA (Animates in smoothly from the BOTTOM) */}
            <div className="max-w-[800px] w-full text-center mx-auto flex flex-col items-center px-4">
              
              {/* Tagline Badge */}
              <div 
                className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-white/90 mb-6 shadow-lg transition-all duration-1000 ease-out transform ${
                  elementsDescended
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-16 scale-95'
                }`}
                style={{ transitionDelay: elementsDescended ? '150ms' : '0ms' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Effortless Aviation & Handcrafted Itineraries</span>
              </div>

              {/* Main Headline (From Bottom) */}
              <h1 
                className={`text-[40px] sm:text-[52px] md:text-[66px] lg:text-[72px] font-medium leading-[1.08] text-white tracking-tight drop-shadow-md transition-all duration-1000 ease-out transform ${
                  elementsDescended
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-20 scale-95'
                }`}
                style={{ transitionDelay: elementsDescended ? '300ms' : '0ms' }}
              >
                Travel the World<br />Without Any Stress
              </h1>

              {/* Secondary Text (From Bottom) */}
              <p 
                className={`mt-6 text-[16px] sm:text-[18px] md:text-[20px] text-white/90 max-w-[640px] font-normal leading-relaxed drop-shadow transition-all duration-1000 ease-out transform ${
                  elementsDescended
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-16'
                }`}
                style={{ transitionDelay: elementsDescended ? '500ms' : '0ms' }}
              >
                Let us take care of the planning while you enjoy meaningful travel experiences crafted just for you.
              </p>

              {/* Hero CTA Buttons (From Bottom) */}
              <div 
                className={`mt-10 flex flex-col sm:flex-row items-center gap-4 transition-all duration-1000 ease-out transform ${
                  elementsDescended
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-90 pointer-events-none'
                }`}
                style={{ transitionDelay: elementsDescended ? '700ms' : '0ms' }}
              >
                <button
                  onClick={() => setActiveModal('planner')}
                  className="bg-white text-black text-[15px] font-medium px-[32px] py-[14px] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 inline-flex items-center justify-center whitespace-nowrap"
                >
                  Start Exploring
                </button>

                <button
                  onClick={() => scrollToSection('destinations-section')}
                  className="border border-white/30 bg-black/30 backdrop-blur-md text-white text-[15px] font-normal px-[28px] py-[13px] rounded-full hover:bg-black/50 hover:border-white/60 transition-all duration-300 cursor-pointer inline-flex items-center justify-center space-x-2"
                >
                  <span>View Destinations</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

          </main>

          {/* Scroll Indicator (Animates in smoothly from the BOTTOM) */}
          <div 
            onClick={() => scrollToSection('destinations-section')}
            className={`relative z-20 flex flex-col items-center cursor-pointer group transition-all duration-1000 ease-out pt-4 ${
              elementsDescended
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12 pointer-events-none'
            }`}
            style={{ transitionDelay: elementsDescended ? '850ms' : '0ms' }}
            role="button"
            aria-label="Scroll for more"
          >
            <span className="text-[12px] md:text-[13px] font-normal tracking-wide text-white/80 group-hover:text-white transition-colors duration-300 whitespace-nowrap">
              Scroll for more
            </span>
            <div className="mt-1 text-white/70 group-hover:text-white transition-all duration-300 animate-gentle-float">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </section>
      )}

      {/* 
        ========================================================================
        4. HANDCRAFTED DESTINATIONS (CARDS WITH BLACK TRANSLUCENT BACKGROUNDS)
        Video is visible behind the cards!
        ========================================================================
      */}
      {firstVideoFinished && (
        <section id="destinations-section" className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-28">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Curated Expeditions</div>
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white">Handcrafted Destinations</h2>
              </div>
              <p className="text-sm md:text-base text-white/80 max-w-md leading-relaxed">
                From secluded Mediterranean shores to serene alpine peaks, immerse in journeys designed with unrivaled precision.
              </p>
            </div>

            {/* Cards with BLACK background so the video behind remains visible! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularDestinations.map((dest) => (
                <div 
                  key={dest.name}
                  onClick={() => {
                    setDestination(dest.name);
                    setActiveModal('planner');
                  }}
                  className="group relative bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-white/40 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col justify-between shadow-2xl overflow-hidden"
                >
                  {/* Subtle top subtle rim highlight */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{dest.tag}</span>
                      <span className="text-[11px] font-mono text-white/50 px-2 py-0.5 rounded bg-white/10">{dest.code}</span>
                    </div>
                    <h3 className="text-xl font-medium text-white group-hover:text-white mb-2">{dest.name}</h3>
                    <p className="text-xs md:text-sm text-white/70 leading-relaxed">{dest.desc}</p>
                  </div>

                  <div className="pt-8 flex items-center justify-between border-t border-white/10 mt-6">
                    <div>
                      <span className="text-[11px] text-white/50 block">Starting from</span>
                      <span className="text-lg md:text-xl font-semibold text-white tracking-tight">{dest.price}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-all duration-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4 Signature Pillars of Travel (Moved here for clean hierarchy) */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 border-t border-white/15">
              <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white">Global Reach</h4>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                  180+ Handcrafted routes and direct connections across Europe, Asia, and Pacific destinations.
                </p>
              </div>

              <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white">Guaranteed Comfort</h4>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                  Zero-stress planning, 24/7 dedicated travel concierge, and flexible zero-penalty rebooking.
                </p>
              </div>

              <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-400/20 text-sky-300 flex items-center justify-center">
                  <PlaneTakeoff className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white">Sky Cruise</h4>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                  Cruising at 38,000 FT with private lie-flat sky suites and panoramic oversized horizon windows.
                </p>
              </div>

              <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-400/20 text-purple-300 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-purple-300" />
                </div>
                <h4 className="text-base font-semibold text-white">Cabin Serenity</h4>
                <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                  Ultra-quiet 42dB acoustic dampening, Starlink SkyFi, and Michelin-partnered in-flight gastronomy.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 
        ========================================================================
        6. CUSTOMER REVIEWS & TESTIMONIALS SECTION
        ========================================================================
      */}
      {firstVideoFinished && (
        <section id="reviews-section" className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-28 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Verified Experiences</div>
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white">Guest Testimonials</h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <div className="flex text-amber-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-300" />
                  ))}
                </div>
                <span className="font-medium text-white">4.98 / 5.0</span>
                <span className="text-white/60">(Over 12,400 voyages)</span>
              </div>
            </div>

            {/* Review Cards with Black Background */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {travelerReviews.map((rev, index) => (
                <div 
                  key={index}
                  className="bg-black/65 backdrop-blur-md border border-white/15 rounded-3xl p-8 flex flex-col justify-between hover:border-white/35 transition-all duration-300 shadow-2xl"
                >
                  <div>
                    {/* Rating Stars & Quote Icon */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex space-x-1 text-amber-300">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-300" />
                        ))}
                      </div>
                      <Quote className="w-5 h-5 text-white/30" />
                    </div>

                    <p className="text-sm md:text-base text-white/90 leading-relaxed mb-6 font-normal">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-medium text-xs text-white">
                        {rev.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{rev.author}</div>
                        <div className="text-xs text-white/60">{rev.location}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-white/60 bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {rev.flightTag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 
        ========================================================================
        7. LIVE FLIGHT ROUTES & STATUS
        ========================================================================
      */}
      {firstVideoFinished && (
        <section className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-28 bg-black/40 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Global Network</div>
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white">Popular Flight Routes</h2>
              </div>
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'Europe', 'Asia', 'Pacific'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedRouteFilter(cat)}
                    className={`text-xs px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                      selectedRouteFilter === cat
                        ? 'bg-white text-black font-medium shadow-md'
                        : 'bg-black/50 border border-white/15 text-white/80 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/65 backdrop-blur-md border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
              <div className="divide-y divide-white/10">
                {filteredRoutes.map((route, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setDestination(route.to);
                      setActiveModal('planner');
                    }}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
                        <PlaneTakeoff className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-medium text-white flex items-center space-x-2">
                          <span>{route.from}</span>
                          <ArrowRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
                          <span>{route.to}</span>
                        </div>
                        <div className="text-xs text-white/60 mt-0.5">
                          Flight Duration: {route.duration} • <span className="text-emerald-400">{route.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-5">
                      <div className="text-right">
                        <div className="text-[11px] text-white/50">Suite from</div>
                        <div className="text-base font-semibold text-white">{route.price}</div>
                      </div>
                      <button className="text-xs font-medium bg-white/10 group-hover:bg-white group-hover:text-black text-white px-4 py-2 rounded-full transition-all">
                        Book Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 
        ========================================================================
        8. FREQUENTLY ASKED QUESTIONS (ACCORDION)
        ========================================================================
      */}
      {firstVideoFinished && (
        <section className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-28 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-16">
              <div className="text-xs uppercase tracking-widest text-white/60 mb-2 font-medium">Clear Answers</div>
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                Everything you need to know about our signature voyages, baggage, and flexible travel policies.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div 
                    key={index}
                    className="bg-black/65 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between space-x-4 cursor-pointer focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base md:text-lg font-medium text-white">{faq.q}</span>
                      <div className={`p-1.5 rounded-full bg-white/10 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-sm md:text-base text-white/80 leading-relaxed border-t border-white/10 pt-4 animate-fade-in-up">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 
        ========================================================================
        9. BOTTOM CALL TO ACTION & NEWSLETTER
        ========================================================================
      */}
      {firstVideoFinished && (
        <section className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-20 bg-black/60 backdrop-blur-md border-t border-white/15">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/75 border border-white/20 rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left shadow-2xl">
              <div className="max-w-xl">
                <h3 className="text-2xl sm:text-4xl font-medium text-white mb-3 tracking-tight">
                  Ready to embark on your voyage?
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  Subscribe to our private departure bulletins or speak directly with our aviation concierge.
                </p>

                {/* Newsletter subscription form */}
                <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full sm:w-auto flex-1 bg-black/80 border border-white/20 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-white text-black font-medium text-sm px-6 py-3 rounded-full hover:bg-white/90 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {newsletterSubscribed ? 'Subscribed ✓' : 'Get Invitations'}
                  </button>
                </form>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="border border-white/20 bg-black/40 text-sm font-normal text-white px-5 py-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Back to Top</span>
                </button>
                <button
                  onClick={() => setActiveModal('planner')}
                  className="bg-white text-black text-sm font-medium px-7 py-3 rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                >
                  Plan Itinerary
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 
        ========================================================================
        10. FOOTER
        ========================================================================
      */}
      {firstVideoFinished && (
        <footer className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-12 bg-black/85 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-semibold text-white tracking-tight">Airlines</span>
              <span className="text-white/40 text-sm">|</span>
              <span className="text-xs text-white/60">Bespoke Aviation & Journeys</span>
            </div>

            <div className="flex items-center space-x-6 text-xs text-white/70">
              <button onClick={() => setActiveModal('About')} className="hover:text-white cursor-pointer transition-colors">About</button>
              <button onClick={() => setActiveModal('Services')} className="hover:text-white cursor-pointer transition-colors">Services</button>
              <button onClick={() => setActiveModal('Support')} className="hover:text-white cursor-pointer transition-colors">Concierge</button>
              <span className="text-white/40">•</span>
              <span>© 2026 Mina Medhat Fawzy. All rights reserved. Designed by Mina Medhat Fawzy.</span>
            </div>
          </div>
        </footer>
      )}

      {/* 
        ========================================================================
        11. INTERACTIVE MODALS (PLANNER, ABOUT, SERVICES, SUPPORT)
        ========================================================================
      */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up"
          style={{ animationDuration: '200ms' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="relative w-full max-w-xl bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-white/60 hover:text-white p-1 rounded-lg focus:outline-none transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Travel Planner Modal */}
            {activeModal === 'planner' && (
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <PlaneTakeoff className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-medium text-white">Plan Your Next Escape</h3>
                </div>
                <p className="text-sm text-white/70 mb-6">
                  Tell us your dream journey and our flight curators will handcraft every detail.
                </p>

                {bookingSuccess ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-medium text-white">Itinerary Created!</h4>
                    <p className="text-sm text-white/70 max-w-xs">
                      Your travel advisor will contact you within 2 hours with customized options.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
                        Destination
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full bg-neutral-800 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          placeholder="Where do you want to fly?"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
                          Departure Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                          <input
                            type="date"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                            className="w-full bg-neutral-800 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/80 uppercase tracking-wider mb-1.5">
                          Travelers
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                          <select
                            value={travelers}
                            onChange={(e) => setTravelers(e.target.value)}
                            className="w-full bg-neutral-800 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          >
                            <option>1 Traveler (Solo)</option>
                            <option>2 Travelers (Couple)</option>
                            <option>3-5 Travelers (Small Group)</option>
                            <option>6+ Travelers (Private Charter)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        className="w-full bg-white text-black font-medium text-sm py-3 rounded-xl hover:bg-white/90 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <span>Request Custom Itinerary</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* About Modal */}
            {activeModal === 'About' && (
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <Globe className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-medium text-white">About Airlines</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-4">
                  Founded with a vision of seamless luxury aviation, Airlines connects discerning travelers to over 180 global destinations with effortless elegance, zero stress, and bespoke planning.
                </p>
                <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 mt-4 text-center">
                  <div className="p-3 bg-neutral-800/60 rounded-xl">
                    <div className="text-lg font-semibold text-white">180+</div>
                    <div className="text-xs text-white/60">Destinations</div>
                  </div>
                  <div className="p-3 bg-neutral-800/60 rounded-xl">
                    <div className="text-lg font-semibold text-white">99.8%</div>
                    <div className="text-xs text-white/60">On-Time Flight</div>
                  </div>
                  <div className="p-3 bg-neutral-800/60 rounded-xl">
                    <div className="text-lg font-semibold text-white">24/7</div>
                    <div className="text-xs text-white/60">Concierge</div>
                  </div>
                </div>
              </div>
            )}

            {/* Services Modal */}
            {activeModal === 'Services' && (
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-medium text-white">Our Premium Services</h3>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  Every step of your flight is managed with exceptional precision.
                </p>
                <div className="space-y-3">
                  <div className="p-3.5 bg-neutral-800/60 rounded-xl flex items-start space-x-3">
                    <PlaneTakeoff className="w-5 h-5 text-white mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-white">Bespoke Flight Curation</div>
                      <div className="text-xs text-white/70">Personalized private and commercial charter routes.</div>
                    </div>
                  </div>
                  <div className="p-3.5 bg-neutral-800/60 rounded-xl flex items-start space-x-3">
                    <ShieldCheck className="w-5 h-5 text-white mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-white">Seamless Chauffeur & Transfers</div>
                      <div className="text-xs text-white/70">Direct tarmac transfers and VIP lounge privileges worldwide.</div>
                    </div>
                  </div>
                  <div className="p-3.5 bg-neutral-800/60 rounded-xl flex items-start space-x-3">
                    <Compass className="w-5 h-5 text-white mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-white">Curated Local Experiences</div>
                      <div className="text-xs text-white/70">Private guides, boutique retreats, and exclusive reservations.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Support Modal */}
            {activeModal === 'Support' && (
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <Headphones className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-medium text-white">Concierge Support</h3>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  We are on standby around the clock to assist with bookings, seat adjustments, and private aviation inquiries.
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-neutral-800/60 rounded-xl border border-white/10">
                    <div className="text-xs uppercase text-white/60 font-medium tracking-wider mb-1">Direct Priority Hotline</div>
                    <div className="text-base font-semibold text-white">+1 (800) 555-AIRLINE</div>
                  </div>
                  <div className="p-4 bg-neutral-800/60 rounded-xl border border-white/10">
                    <div className="text-xs uppercase text-white/60 font-medium tracking-wider mb-1">Concierge Email</div>
                    <div className="text-base font-semibold text-white">concierge@airlines.travel</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
