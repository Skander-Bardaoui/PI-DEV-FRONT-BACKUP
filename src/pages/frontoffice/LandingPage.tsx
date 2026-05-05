import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2,
  FileText,
  Receipt,
  Users,
  BarChart3,
  Shield,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Play,
  Star,
  TrendingUp,
  Clock,
  CreditCard,
  LayoutDashboard,
  Video,
  Award,
  Briefcase,
  UserCheck,
  Layers,
  Quote
} from 'lucide-react';
import { plansApi } from '../../api/plans.api';

// --- Custom hook for scroll-triggered animations ---
const useScrollReveal = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasRevealed) {
            setHasRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -100px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, hasRevealed]);

  return { ref, hasRevealed };
};

// --- CountUp Hook ---
const useCountUp = (targetValue: number, duration: number = 2000, suffix: string = '') => {
  const [count, setCount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!elementRef.current || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setIsCounting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isCounting) return;

    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = Math.floor(progress * targetValue);
      setCount(currentCount);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [isCounting, targetValue, duration]);

  const formattedValue = suffix === '%' ? `${count}%` : count.toLocaleString() + (suffix === '+' ? '+' : '');
  return { count: formattedValue, elementRef };
};

// --- Service Cards Data (No changes, just removed gradient colors) ---
const services = [
  {
    icon: LayoutDashboard,
    title: 'Smart Management System',
    description: 'Centralized dashboard for real-time business insights, task automation, and workflow optimization across all departments.',
    color: 'bg-purple-600'
  },
  {
    icon: TrendingUp,
    title: 'Real-time Tracking',
    description: 'Live updates on orders, deliveries, and inventory. Get instant notifications and GPS-based tracking for logistics.',
    color: 'bg-cyan-600'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'PCI-DSS compliant payment gateway with fraud detection, multiple currencies, and seamless checkout integration.',
    color: 'bg-emerald-600'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Customizable reports, predictive analytics, and AI-driven insights to maximize revenue and customer retention.',
    color: 'bg-orange-600'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'End-to-end encryption, role-based access, and real-time threat monitoring to keep your data 100% safe.',
    color: 'bg-rose-600'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Built-in chat, file sharing, and project management tools to keep your team aligned and productive.',
    color: 'bg-blue-600'
  }
];

// --- Team Members Data ---
const teamMembers = [
  { name: 'Sophia Chen', role: 'CEO & Founder', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Marcus Rivera', role: 'CTO', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Olivia Dupont', role: 'Head of Product', img: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { name: 'James Okafor', role: 'Lead Engineer', img: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { name: 'Elena Martinez', role: 'Customer Success', img: 'https://randomuser.me/api/portraits/women/90.jpg' }
];

// --- Pricing Plans Data ---
// Plans will be fetched from API

// --- Statistics Data (for count-up) ---
const statsData = [
  { label: 'Active Users', value: 12450, suffix: '+', icon: Users, color: 'bg-purple-600' },
  { label: 'Transactions Processed', value: 37500, suffix: '+', icon: CreditCard, color: 'bg-cyan-600' },
  { label: 'Business Clients', value: 1840, suffix: '+', icon: Briefcase, color: 'bg-emerald-600' },
  { label: 'Satisfaction Rate', value: 98, suffix: '%', icon: Award, color: 'bg-orange-600' }
];

// --- Testimonials Data ---
const testimonials = [
  {
    quote: "NovEntra has completely revolutionized our workflow. We've cut operational costs by 30% and improved team efficiency dramatically.",
    author: "Dr. Emily Zhang",
    role: "COO, TechFlow Inc.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5
  },
  {
    quote: "The real-time analytics dashboard gives us insights we never had before. It's like having a crystal ball for our business metrics.",
    author: "Carlos Mendez",
    role: "Director of Operations, CloudScale",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 5
  },
  {
    quote: "Security and compliance were our top concerns, and NovEntra exceeded expectations. Their team is responsive and the platform is rock solid.",
    author: "Priya Kapoor",
    role: "CTO, FinSecure",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    rating: 5
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plansLoading, setPlansLoading] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plans = await plansApi.getPublicPlans();
        // Show ALL plans including free plan on landing page
        setPricingPlans(plans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Parallax effect for hero background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (heroRef.current) {
        const scrollY = window.scrollY;
        setParallaxOffset(scrollY * 0.4);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  // Count-up instances
  const { count: usersCount, elementRef: usersRef } = useCountUp(12450, 2000, '+');
  const { count: transactionsCount, elementRef: transactionsRef } = useCountUp(37500, 2000, '+');
  const { count: clientsCount, elementRef: clientsRef } = useCountUp(1840, 2000, '+');
  const { count: satisfactionCount, elementRef: satisfactionRef } = useCountUp(98, 1800, '%');

  // Scroll reveal hooks
  const { ref: servicesRef, hasRevealed: servicesRevealed } = useScrollReveal(0.2);
  const { ref: statsRef, hasRevealed: statsRevealed } = useScrollReveal(0.3);
  const { ref: demoRef, hasRevealed: demoRevealed } = useScrollReveal(0.2);
  const { ref: teamRef, hasRevealed: teamRevealed } = useScrollReveal(0.2);
  const { ref: pricingRef, hasRevealed: pricingRevealed } = useScrollReveal(0.2);
  const { ref: testimonialsRef, hasRevealed: testimonialsRevealed } = useScrollReveal(0.2);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Parallax Background Layer - Keep subtle, no gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        >
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div
          className="absolute top-0 right-0 w-full h-full transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
        >
          <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div
          className="absolute bottom-0 left-1/2 w-full h-full transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        >
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }} />
        </div>
      </div>

      {/* Navigation - Solid colors, no gradients */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-md shadow-purple-500/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-purple-600 p-2.5 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-600">NovEntra</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-purple-600 transition-colors font-medium">Services</button>
              <button onClick={() => scrollToSection('demo')} className="text-gray-600 hover:text-purple-600 transition-colors font-medium">Demo</button>
              <button onClick={() => scrollToSection('team')} className="text-gray-600 hover:text-purple-600 transition-colors font-medium">Team</button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-purple-600 transition-colors font-medium">Pricing</button>
              <Link to="/login" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">Sign In</Link>
              <Link to="/register" className="relative group">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <span className="relative flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </span>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/20 animate-slide-up">
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => scrollToSection('services')} className="block text-gray-700 hover:text-purple-600 font-medium py-2 w-full text-left">Services</button>
              <button onClick={() => scrollToSection('demo')} className="block text-gray-700 hover:text-purple-600 font-medium py-2 w-full text-left">Demo</button>
              <button onClick={() => scrollToSection('team')} className="block text-gray-700 hover:text-purple-600 font-medium py-2 w-full text-left">Team</button>
              <button onClick={() => scrollToSection('pricing')} className="block text-gray-700 hover:text-purple-600 font-medium py-2 w-full text-left">Pricing</button>
              <Link to="/login" className="block text-gray-700 hover:text-purple-600 font-medium py-2">Sign In</Link>
              <Link to="/register" className="block bg-purple-600 text-white px-6 py-3 rounded-full text-center font-medium">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Parallax - No gradients */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-700">Next-gen Business Platform</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Transform your business{' '}
              <span className="relative inline-block">
                <span className="text-purple-600">with intelligence</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              All-in-one platform for smart management, real-time tracking, secure payments, and actionable analytics. 
              Trusted by 1,800+ forward-thinking companies.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="group relative inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1">
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => scrollToSection('demo')} className="group inline-flex items-center justify-center gap-3 glass text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview - No gradients */}
          <div className="mt-20 relative animate-scale-in">
            <div className="absolute inset-0 bg-purple-200 rounded-3xl blur-3xl opacity-20" />
            <div className="relative glass rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden border border-white/50">
              <div className="bg-gray-100/80 px-4 py-3 flex items-center gap-3 border-b border-gray-200/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white/80 px-4 py-1 rounded-full text-sm text-gray-500 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    app.noventra.com
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover-lift cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center mb-3">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">$187,200</p>
                    <span className="text-sm font-medium text-green-500">+12.5%</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover-lift cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center mb-3">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">Transactions</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">37.5k</p>
                    <span className="text-sm font-medium text-green-500">+8%</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover-lift cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center mb-3">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">Active Users</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">12.4k</p>
                    <span className="text-sm font-medium text-green-500">+22%</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover-lift cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mb-3">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">Satisfaction</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">98%</p>
                    <span className="text-sm font-medium text-green-500">+4%</span>
                  </div>
                </div>
                <div className="h-32 md:h-40 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-purple-600 flex items-center justify-center animate-bounce-subtle">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-400">Real-time analytics dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div className="relative -mt-10">
        <svg className="w-full h-20 text-slate-50" preserveAspectRatio="none" viewBox="0 0 1440 120" fill="currentColor">
          <path d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
        </svg>
      </div>

      {/* Statistics Section (Animated Count-Up) with slide-in - No gradients */}
      <section ref={statsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 transform ${statsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Our Impact
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Trusted by thousands worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real results from real businesses using NovEntra.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {statsData.map((stat, idx) => {
              let countRef;
              if (stat.label === 'Active Users') countRef = usersRef;
              else if (stat.label === 'Transactions Processed') countRef = transactionsRef;
              else if (stat.label === 'Business Clients') countRef = clientsRef;
              else countRef = satisfactionRef;
              
              let countValue;
              if (stat.label === 'Active Users') countValue = usersCount;
              else if (stat.label === 'Transactions Processed') countValue = transactionsCount;
              else if (stat.label === 'Business Clients') countValue = clientsCount;
              else countValue = satisfactionCount;
              
              return (
                <div key={stat.label} ref={countRef} className={`glass rounded-3xl p-8 text-center hover-lift transition-all duration-500 delay-${idx * 100} ${statsRevealed ? 'translate-x-0 opacity-100' : idx % 2 === 0 ? '-translate-x-10 opacity-0' : 'translate-x-10 opacity-0'}`}>
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${stat.color} flex items-center justify-center animate-float-slow`}>
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{countValue}</p>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <svg className="w-full h-20 text-white" preserveAspectRatio="none" viewBox="0 0 1440 120" fill="currentColor">
        <path d="M0,96L80,90.7C160,85,320,75,480,80C640,85,800,107,960,112C1120,117,1280,107,1360,101.3L1440,96L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z" />
      </svg>

      {/* Services Section with slide animations - No gradients */}
      <section id="services" ref={servicesRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${servicesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Layers className="h-4 w-4 text-purple-500" />
              Core Services
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed to streamline operations and boost growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={service.title} className={`glass rounded-3xl p-8 hover-lift group transition-all duration-700 delay-${idx * 100} ${servicesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 animate-float-slow`}>
                  <service.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section with slide-in - No gradients */}
      <section id="demo" ref={demoRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${demoRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Video className="h-4 w-4 text-purple-500" />
              Interactive Demo
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              See how it works in 60 seconds
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Watch the platform in action and discover why thousands love NovEntra.
            </p>
          </div>

          <div className={`relative group cursor-pointer transition-all duration-1000 ${demoRevealed ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <div className="absolute inset-0 bg-purple-200 rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition-all duration-500"></div>
            <div className="relative glass rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse"></div>
                    <button className="relative w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-2xl">
                      <Play className="h-10 w-10 text-white ml-1" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-8 opacity-50">
                  <div className="h-20 bg-white/10 rounded-xl"></div>
                  <div className="h-20 bg-white/10 rounded-xl"></div>
                  <div className="h-20 bg-white/10 rounded-xl"></div>
                  <div className="h-20 bg-white/10 rounded-xl"></div>
                  <div className="h-20 bg-white/10 rounded-xl"></div>
                  <div className="h-20 bg-white/10 rounded-xl"></div>
                </div>
              </div>
              <div className="p-6 text-center border-t border-white/20">
                <p className="text-gray-600 font-medium">Quick tour: Manage invoices, track payments, and analyze performance in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (New) with slide animations - No gradients */}
      <section id="testimonials" ref={testimonialsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Quote className="h-4 w-4 text-purple-500" />
              Social Proof
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Loved by business leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers are saying about their experience with NovEntra.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className={`glass rounded-3xl p-8 hover-lift transition-all duration-700 delay-${idx * 150} ${testimonialsRevealed ? 'translate-x-0 opacity-100' : idx % 2 === 0 ? '-translate-x-10 opacity-0' : 'translate-x-10 opacity-0'}`}>
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-100" />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <svg className="w-full h-20 text-white" preserveAspectRatio="none" viewBox="0 0 1440 120" fill="currentColor">
        <path d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
      </svg>

      {/* Team Section with slide animations - No gradients */}
      <section id="team" ref={teamRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${teamRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Users className="h-4 w-4 text-purple-500" />
              Leadership
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Built by industry experts
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet the team behind the platform that's changing how businesses operate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {teamMembers.map((member, idx) => (
              <div key={idx} className={`glass rounded-2xl p-6 text-center hover-lift transition-all duration-500 delay-${idx * 100} ${teamRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <img src={member.img} alt={member.name} className="w-full h-full rounded-full object-cover ring-4 ring-purple-100 shadow-lg" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm text-purple-600 font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section with horizontal scroll */}
      <section id="pricing" ref={pricingRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${pricingRevealed ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <CreditCard className="h-4 w-4 text-purple-500" />
              Pricing Plans
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Choose the perfect plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Flexible pricing for businesses of all sizes. Start free, upgrade as you grow.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Save 17%</span>
              </button>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : pricingPlans.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No plans available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, idx) => {
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual;
                
                // Slug-based feature display
                const getPlanDisplay = (slug: string) => {
                  switch (slug) {
                    case 'free':
                      return {
                        badge: { text: 'Free', color: 'bg-gray-500' },
                        isPopular: false,
                        features: [
                          'Accès de base à la plateforme',
                          'Gestion limitée des factures',
                          'Tableau de bord basique',
                          'Support communautaire',
                          'Parfait pour démarrer'
                        ]
                      };
                    case 'standard':
                      return {
                        badge: { text: 'Standard', color: 'bg-blue-500' },
                        isPopular: false,
                        features: [
                          'Accès complet à la plateforme',
                          'Toutes les fonctionnalités',
                          'Gestion des factures et devis',
                          'Gestion des stocks',
                          'Tableau de bord et statistiques',
                          'Support par email'
                        ]
                      };
                    case 'premium':
                      return {
                        badge: { text: 'Premium', color: 'bg-purple-500' },
                        isPopular: true,
                        features: [
                          'Tout du plan Standard',
                          'IA illimitée incluse',
                          'Prévisions de ventes intelligentes',
                          'Analyse avancée des données',
                          'Recommandations automatiques',
                          'Support prioritaire'
                        ]
                      };
                    default:
                      return {
                        badge: { text: plan.name, color: 'bg-gray-500' },
                        isPopular: false,
                        features: Array.isArray(plan.features) ? plan.features : []
                      };
                  }
                };

                const planDisplay = getPlanDisplay(plan.slug);
                
                return (
                  <div 
                    key={plan.id} 
                    className={`relative glass rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 flex flex-col ${
                      planDisplay.isPopular ? 'ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20 scale-105' : 'hover:shadow-xl'
                    } ${pricingRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                    style={{ transitionDelay: `${idx * 150}ms` }}
                  >
                    {planDisplay.isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                        Recommandé
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <span className={`${planDisplay.badge.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                        {planDisplay.badge.text}
                      </span>
                    </div>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-purple-600">{Number(price).toFixed(0)}</span>
                      <span className="text-gray-500"> TND/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-grow">
                      {planDisplay.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-gray-600">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      to="/register" 
                      className={`w-full text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                        planDisplay.isPopular 
                          ? 'bg-purple-600 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-105' 
                          : 'glass text-gray-700 hover:bg-white/80'
                      }`}
                    >
                      Commencer
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - No gradients */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-200 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-purple-700 rounded-3xl p-12 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Ready to transform your business?
                </h2>
                <p className="text-xl text-white/80 mb-10">
                  Join 1,800+ companies already scaling with NovEntra.
                </p>
                <Link to="/register" className="group inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CheckCircle className="h-5 w-5" />
                  Start 14-Day Free Trial
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - No gradients */}
      <footer className="bg-slate-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-600 p-2.5 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">NovEntra</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-powered business management platform for modern enterprises.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Services</button></li>
                <li><button onClick={() => scrollToSection('demo')} className="hover:text-white transition-colors">Demo</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><Link to="/" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-3">
                <li><button onClick={() => scrollToSection('team')} className="hover:text-white transition-colors">Team</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>© 2025 NovEntra. All rights reserved. Built with ❤️ for modern businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}