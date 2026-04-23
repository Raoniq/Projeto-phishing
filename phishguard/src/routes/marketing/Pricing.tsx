import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Check, ChevronDown, ChevronUp, Zap, Shield, Users, Building2, Star } from "lucide-react";

// FAQ Item component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-noir-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-amber-500 transition-colors"
      >
        <span className="text-lg font-medium text-fg-primary pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-amber-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-noir-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 text-noir-400 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

// Plan card component
function PlanCard({
  name,
  price,
  period,
  description,
  features,
  featured,
  icon: Icon,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  featured?: boolean;
  icon: typeof Zap;
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-2 border-amber-500 shadow-[0_0_30px_rgba(217,119,87,0.3)]"
          : "hover:border-amber-500/30"
      }`}
    >
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
      )}
      
      <CardHeader className="p-8 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            featured ? "bg-amber-500 text-noir-950" : "bg-noir-700 text-amber-500"
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          {featured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold">
              <Star className="w-3 h-3" />
              Mais popular
            </span>
          )}
        </div>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-8 pt-4">
        <div className="mb-6">
          <span className="font-display text-4xl font-bold text-fg-primary">{price}</span>
          {period && (
            <span className="text-noir-400 ml-2">{period}</span>
          )}
        </div>
        
        <Button
          variant={featured ? "primary" : "secondary"}
          className="w-full mb-8"
          asChild
        >
          <a href="/register">Começar grátis</a>
        </Button>
        
        <ul className="space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-noir-300">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Main PricingPage component
export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "R$ 29",
      period: "/mês",
      description: "Para times pequenos que estão começando com segurança.",
      icon: Zap,
      features: [
        "Até 50 usuários",
        "10 campanhas/mês",
        "5 templates de phishing",
        "Relatórios básicos",
        "Suporte por email",
        "Dashboard de métricas",
      ],
    },
    {
      name: "Business",
      price: "R$ 99",
      period: "/mês",
      description: "Para empresas que levam segurança a sério.",
      icon: Users,
      featured: true,
      features: [
        "Até 500 usuários",
        "Campanhas ilimitadas",
        "50+ templates de phishing",
        "Relatórios avançados",
        "Suporte prioritário",
        "API completa",
        "Gamificação completa",
        "Relatórios executivos",
      ],
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      description: "Para organizações que precisam de escala e controle total.",
      icon: Building2,
      features: [
        "Usuários ilimitados",
        "Campanhas ilimitadas",
        "Templates personalizados",
        "Integração SSO/SAML",
        "SLA 99.9% garantido",
        "Suporte 24/7 dedicado",
        "Manager de conta",
        "Training customizado",
      ],
    },
    {
      name: "White Label",
      price: "Sob consulta",
      description: "Para parceiros que querem oferecer sob sua marca.",
      icon: Shield,
      features: [
        "Tudo do Enterprise",
        "Marca personalizada",
        "Domínio customizado",
        "API de revenda",
        "Revenue sharing",
        "Support multilabel",
        "Onboarding dedicado",
      ],
    },
  ];
  
  const faqs = [
    {
      question: "Posso mudar de plano depois?",
      answer: "Sim, você pode fazer upgrade ou downgrade a qualquer momento. Se você fizer downgrade, manterá os recursos do plano atual até o fim do período de cobrança.",
    },
    {
      question: "O que acontece se eu exceder o limite de usuários?",
      answer: "Você será notificado quando atingir 80% do limite. Podemos adicionar usuários extras por uma taxa proporcional, ou você pode fazer upgrade para o próximo plano.",
    },
    {
      question: "Existe um período de teste gratuito?",
      answer: "Sim! Oferecemos 14 dias de teste gratuito em todos os planos. Você terá acesso completo a todas as funcionalidades do plano escolhido, sem necessidade de cartão de crédito.",
    },
    {
      question: "Como funciona a cobrança?",
      answer: "A cobrança é feita mensalmente ou anualmente (com 20% de desconto para pagamento anual). Aceitamos cartão de crédito, PIX e transferência bancária para planos anuais.",
    },
    {
      question: "Vocês oferecem desconto para organizações sem fins lucrativos?",
      answer: "Sim, oferecemos 50% de desconto para organizações sem fins lucrativos. Entre em contato com nosso time de vendas para verificar elegibilidade.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento. Não há multa ou taxa de cancelamento. Você continuará tendo acesso até o fim do período pago.",
    },
    {
      question: "Como funciona o suporte?",
      answer: "Todos os planos incluem suporte por email. Planos Business têm suporte prioritário com tempo de resposta em até 4 horas. Planos Enterprise e White Label têm suporte 24/7 dedicado.",
    },
    {
      question: "Vocês oferecem treinamento para minha equipe?",
      answer: "Sim, oferecemos sessões de treinamento onboarding gratuitas para todos os planos. Para planos Enterprise e White Label, oferecemos training customizado presencial ou remoto.",
    },
  ];
  
  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900/50 via-transparent to-noir-950" />
      
      <div className="relative">
        {/* Hero section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
          
          <div className="relative mx-auto max-w-4xl px-4 text-center w-full">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Planos e Preços
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Invista em segurança pelo{' '}
              <span className="text-amber-500">preço de um café</span>{' '}
              por dia
            </h1>
            <p className="text-xl text-noir-300 max-w-prose md:max-w-3xl mx-auto">
              Escolha o plano ideal para sua empresa. Comece com 14 dias grátis
              e cancele quando quiser.
            </p>
          </div>
        </section>
        
        {/* Pricing cards */}
        <section className="relative py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, i) => (
                <PlanCard key={i} {...plan} />
              ))}
            </div>
          </div>
        </section>
        
        {/* Comparison note */}
        <section className="relative py-16">
          <div className="mx-auto max-w-4xl px-4 w-full">
            <Card className="p-8 text-center bg-noir-900/50 border-noir-700">
              <h3 className="font-display text-2xl font-bold mb-4">
                Não sabe qual plano escolher?
              </h3>
              <p className="text-noir-400 mb-6 max-w-prose md:max-w-3xl mx-auto">
                Nossa equipe pode ajudar você a encontrar a melhor solução
                para as necessidades da sua organização.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/contact">Falar com vendas</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="/demo">Ver demonstração</a>
                </Button>
              </div>
            </Card>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="relative py-24">
          <div className="absolute inset-0 bg-noir-900/50" />
          
          <div className="relative mx-auto max-w-4xl px-4 w-full">
            <div className="text-center mb-16">
              <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
                Perguntas Frequentes
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Tiramos suas dúvidas
              </h2>
              <p className="text-noir-400 max-w-prose md:max-w-3xl mx-auto">
                Não encontrou o que procurava?{' '}
                <a href="/contact" className="text-amber-500 hover:underline">
                  Entre em contato
                </a>
              </p>
            </div>
            
            <Card className="p-0">
              <div className="p-8">
                {faqs.map((faq, i) => (
                  <FaqItem key={i} {...faq} />
                ))}
              </div>
            </Card>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="relative py-24">
          <div className="absolute inset-0 bg-noir-950" />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent" />
          
          <div className="relative mx-auto max-w-4xl px-4 text-center w-full">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-noir-400 mb-10 max-w-prose md:max-w-3xl mx-auto">
              Teste gratuito por 14 dias. Sem cartão de crédito.
              Configuração em menos de 5 minutos.
            </p>
            <Button size="lg" asChild className="group">
              <a href="/register">
                Criar conta gratuita
                <Zap className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}