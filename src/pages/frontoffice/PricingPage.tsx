import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, X, Menu, ArrowRight, HelpCircle } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Parfait pour les freelances et auto-entrepreneurs',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      { name: 'Jusqu\'à 50 factures/mois', included: true },
      { name: 'Gestion des dépenses', included: true },
      { name: '1 utilisateur', included: true },
      { name: 'Support par email', included: true },
      { name: 'Rapports basiques', included: true },
      { name: 'Export PDF', included: true },
      { name: 'API Access', included: false },
      { name: 'Multi-entreprises', included: false },
      { name: 'Intégrations avancées', included: false },
    ],
    cta: 'Commencer l\'essai',
    popular: false
  },
  {
    name: 'Pro',
    description: 'Pour les PME en croissance',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      { name: 'Factures illimitées', included: true },
      { name: 'Gestion des dépenses', included: true },
      { name: 'Jusqu\'à 10 utilisateurs', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Rapports avancés', included: true },
      { name: 'Export PDF/Excel', included: true },
      { name: 'API Access', included: true },
      { name: 'Multi-entreprises (3)', included: true },
      { name: 'Intégrations avancées', included: false },
    ],
    cta: 'Commencer l\'essai',
    popular: true
  },
  {
    name: 'Enterprise',
    description: 'Pour les grandes entreprises',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      { name: 'Factures illimitées', included: true },
      { name: 'Gestion des dépenses', included: true },
      { name: 'Utilisateurs illimités', included: true },
      { name: 'Support dédié 24/7', included: true },
      { name: 'Rapports personnalisés', included: true },
      { name: 'Export tous formats', included: true },
      { name: 'API Access complet', included: true },
      { name: 'Multi-entreprises illimitées', included: true },
      { name: 'Intégrations avancées', included: true },
    ],
    cta: 'Contacter ventes',
    popular: false
  }
];

const faqs = [
  {
    question: 'Puis-je changer de forfait à tout moment ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader votre forfait à tout moment. Les changements prennent effet immédiatement et sont proratisés.'
  },
  {
    question: 'Y a-t-il un engagement minimum ?',
    answer: 'Non, tous nos forfaits sont sans engagement. Vous pouvez annuler à tout moment.'
  },
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer: 'L\'essai gratuit de 14 jours vous donne accès à toutes les fonctionnalités du forfait Pro, sans carte bancaire requise.'
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Oui, vos données sont stockées sur des serveurs en Tunisie, conformément aux réglementations locales. Nous utilisons un chiffrement de bout en bout.'
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: 'Nous acceptons les cartes bancaires tunisiennes, les virements et le paiement par D17.'
  }
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">NovaEntra</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900">Accueil</Link>
              <Link to="/pricing" className="text-indigo-600 font-medium">Tarifs</Link>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Connexion</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Essai Gratuit
              </Link>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Des tarifs simples et transparents
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Choisissez le forfait adapté à vos besoins. Essai gratuit de 14 jours, sans carte bancaire.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                !annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border-2 p-8 ${
                  plan.popular ? 'border-indigo-600 shadow-xl' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Le plus populaire
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {annual ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-500">TND/{annual ? 'an' : 'mois'}</span>
                  </div>
                  {annual && (
                    <p className="text-sm text-gray-500 mt-2">
                      soit {Math.round(plan.yearlyPrice / 12)} TND/mois
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.name === 'Enterprise' ? '#contact' : '/register'}
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Comparaison détaillée
          </h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-6 text-gray-500 font-medium">Fonctionnalité</th>
                  <th className="p-6 text-center font-semibold text-gray-900">Starter</th>
                  <th className="p-6 text-center font-semibold text-indigo-600 bg-indigo-50">Pro</th>
                  <th className="p-6 text-center font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Factures', '50/mois', 'Illimitées', 'Illimitées'],
                  ['Utilisateurs', '1', '10', 'Illimités'],
                  ['Entreprises', '1', '3', 'Illimitées'],
                  ['Stockage', '1 Go', '10 Go', 'Illimité'],
                  ['Support', 'Email', 'Prioritaire', 'Dédié 24/7'],
                  ['API', '-', 'Oui', 'Complet'],
                  ['SSO', '-', '-', 'Oui'],
                  ['Audit logs', '-', 'Oui', 'Avancé'],
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-6 text-gray-700 font-medium">{row[0]}</td>
                    <td className="p-6 text-center text-gray-600">{row[1]}</td>
                    <td className="p-6 text-center text-gray-600 bg-indigo-50">{row[2]}</td>
                    <td className="p-6 text-center text-gray-600">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <HelpCircle className={`h-5 w-5 text-gray-400 transition-transform ${
                    openFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            Essayez NovaEntra gratuitement pendant 14 jours. Sans engagement.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Commencer l'essai gratuit
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-indigo-400" />
            <span className="text-xl font-bold text-white">NovaEntra</span>
          </div>
          <p className="text-sm">&copy; 2024 NovaEntra. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
