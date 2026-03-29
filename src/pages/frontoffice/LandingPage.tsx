import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  CreditCard
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Facturation Intelligente',
    description: 'Créez des factures professionnelles en quelques clics avec suivi automatique des paiements.',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: Receipt,
    title: 'Gestion des Dépenses',
    description: 'Catégorisez vos dépenses, uploadez vos reçus et gardez le contrôle total.',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: Users,
    title: 'Gestion Clients',
    description: 'Base de données complète avec historique des transactions et communications.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancés',
    description: 'Tableaux de bord interactifs et rapports détaillés pour des décisions éclairées.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: Shield,
    title: 'Sécurité Maximale',
    description: 'Chiffrement de bout en bout, conformité RGPD et données hébergées en Tunisie.',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: Globe,
    title: 'Multi-tenant',
    description: 'Gérez plusieurs entreprises depuis un seul compte avec isolation complète.',
    color: 'from-indigo-500 to-blue-600'
  }
];

const testimonials = [
  {
    quote: "NovaEntra a transformé notre gestion financière. Nous économisons 10 heures par semaine.",
    author: "Ahmed Ben Ali",
    role: "Directeur Financier",
    company: "Tech Solutions Tunisia",
    avatar: "AB",
    rating: 5
  },
  {
    quote: "L'interface est magnifique et les rapports nous donnent une visibilité parfaite sur notre activité.",
    author: "Salma Mansouri",
    role: "Fondatrice",
    company: "Digital Agency Tunis",
    avatar: "SM",
    rating: 5
  },
  {
    quote: "Le support client est exceptionnel et la plateforme répond parfaitement à nos besoins.",
    author: "Mohamed Trabelsi",
    role: "Comptable",
    company: "Cabinet Expertise",
    avatar: "MT",
    rating: 5
  }
];

const stats = [
  { value: '2,500+', label: 'Entreprises actives', icon: Building2 },
  { value: '150K+', label: 'Factures générées', icon: FileText },
  { value: '99.9%', label: 'Disponibilité', icon: TrendingUp },
  { value: '24/7', label: 'Support client', icon: Clock }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute top-0 -right-40 w-[500px] h-[500px] bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/2 w-[500px] h-[500px] bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-lg shadow-purple-500/5' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-r from-violet-600 to-purple-600 p-2.5 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
               NovEntra
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Fonctionnalités</a>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Tarifs</Link>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Témoignages</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Connexion</Link>
              <Link to="/register" className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <span className="relative flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                  <Sparkles className="h-4 w-4" />
                  Essai Gratuit
                </span>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/20 animate-slide-up">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Fonctionnalités</a>
              <Link to="/pricing" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Tarifs</Link>
              <a href="#testimonials" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Témoignages</a>
              <Link to="/login" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Connexion</Link>
              <Link to="/register" className="block bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-full text-center font-medium">
                Essai Gratuit
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-700">Plateforme SaaS #1 en Tunisie</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight animate-slide-up">
              Gérez votre entreprise{' '}
              <span className="relative inline-block">
                <span className="text-gradient">en toute simplicité</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6"/>
                      <stop offset="100%" stopColor="#EC4899"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
              Une plateforme complète pour la facturation, la gestion des dépenses, le suivi client et la collaboration d'équipe.
              <span className="text-purple-600 font-medium"> Conforme aux réglementations tunisiennes.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/register" className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1">
                Commencer Gratuitement
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/app" className="group inline-flex items-center justify-center gap-3 glass text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white ml-0.5" />
                </div>
                Voir la Démo
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Données sécurisées</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <span>14 jours gratuits</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl blur-3xl opacity-20" />
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
                    app.NovEntra.tn
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Revenus', value: '45,200 TND', change: '+12.5%', color: 'from-violet-500 to-purple-600' },
                    { label: 'Dépenses', value: '12,800 TND', change: '-3.2%', color: 'from-pink-500 to-rose-600' },
                    { label: 'Clients', value: '127', change: '+8', color: 'from-blue-500 to-cyan-600' },
                    { label: 'Factures', value: '89', change: '+15', color: 'from-emerald-500 to-teal-600' }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm hover-lift cursor-pointer">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                      <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-32 md:h-40 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-400">Graphique des revenus</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={stat.label} className="glass rounded-3xl p-8 text-center hover-lift">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <p className="text-4xl font-bold text-gradient mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Fonctionnalités
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une suite complète d'outils pour gérer efficacement votre entreprise au quotidien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass rounded-3xl p-8 hover-lift group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/50 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Star className="h-4 w-4 text-amber-500" />
              Témoignages
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ils nous font confiance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="glass rounded-3xl p-8 hover-lift">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Prêt à transformer votre gestion d'entreprise ?
                </h2>
                <p className="text-xl text-white/80 mb-10">
                  Rejoignez plus de 2,500 entreprises tunisiennes qui font confiance à NovEntra.
                </p>
                <Link to="/register" className="group inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CheckCircle className="h-5 w-5" />
                  Essai Gratuit 14 Jours
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-2.5 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">NovEntra</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Plateforme SaaS de gestion d'entreprise. Facturation, dépenses, clients et équipe en un seul endroit.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Produit</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Intégrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Entreprise</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Légal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">RGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>© 2024 NovEntra. Tous droits réservés. Développé avec amour en Tunisie</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
