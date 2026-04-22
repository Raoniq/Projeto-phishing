import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Shield, Users, Trophy, Zap, Lock, TrendingUp, Globe, Award } from "lucide-react";

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-noir-950 via-noir-900 to-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
      
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-400 font-medium">Plataforma líder em proteção contra phishing</span>
        </div>
        
        {/* Main headline with Fraunces display typography */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="text-fg-primary">Transforme sua equipe em</span>
          <br />
          <span className="text-amber-500">humano à prova de phishing</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-noir-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          Treinamento gamificado que modifica comportamentos e cria uma cultura de segurança robusta. 
          Sem módulos cansativos. Com resultados mensuráveis.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button size="lg" asChild>
            <a href="/register" className="group">
              Começar gratuitamente
              <Zap className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="/demo">Ver demonstração</a>
          </Button>
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "500+", label: "Empresas protegidas" },
            { value: "2.5M", label: "Treinamentos realizados" },
            { value: "98%", label: "Redução em clics em phishing" },
            { value: "4.9", label: "Avaliação média" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-amber-500">{stat.value}</div>
              <div className="text-sm text-noir-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-noir-500">
        <span className="text-xs tracking-widest uppercase">Role para descobrir</span>
        <div className="w-px h-12 bg-gradient-to-b from-noir-500 to-transparent" />
      </div>
    </section>
  );
}

// Problem Section
function ProblemSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-6xl px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
            O problema que você talvez ignore
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Phishing é o crime que mais{' '}
            <span className="text-amber-500">prejudica empresas</span>
          </h2>
        </div>
        
        {/* Problem grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              stat: "R$ 2.7M",
              title: "Custo médio de um ataque bem-sucedido",
              desc: "Inclui recuperação, perda de dados, danos à reputação e multas regulatórias."
            },
            {
              stat: "89%",
              title: "Dos ataques começam com phishing",
              desc: "E quase metade das empresas brasileiras já sofreu um ataque nos últimos 12 meses."
            },
            {
              stat: "6 min",
              title: "Tempo médio para um Funcionário clicar",
              desc: "Depois que o email malicioso chega, a janela de atuação é extremely curta."
            },
          ].map((item, i) => (
            <Card key={i} className="relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-4xl md:text-5xl font-display font-bold text-amber-500 mb-4">
                  {item.stat}
                </div>
                <h3 className="text-xl font-semibold text-fg-primary mb-3">{item.title}</h3>
                <p className="text-noir-400 leading-relaxed">{item.desc}</p>
              </CardContent>
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))}
        </div>
        
        {/* Quote */}
        <blockquote className="mt-16 text-center p-8 rounded-2xl bg-noir-900/50 border border-noir-700 max-w-3xl mx-auto">
          <p className="text-xl md:text-2xl text-noir-200 italic leading-relaxed">
            "Não é questão de SE sua empresa será alvo, mas de QUANDO."
          </p>
          <footer className="mt-4 text-noir-400 text-sm">
            — Verizon DBIR 2025, Relatório de Investigação de Violações de Dados
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Simulação realista",
      desc: "Emails, SMS e sites que imitam ataques reais do Brasil. Nenhum treinamento genérico.",
      icon: Globe,
    },
    {
      number: "02",
      title: "Feedback imediato",
      desc: "Quando erra, aprende na hora com microtraining de 2 minutos. Quando acerta, parabéns.",
      icon: Zap,
    },
    {
      number: "03",
      title: "Gamificação",
      desc: "Ranking, badges, pontos e recompensas. Segurança que seus funcionários vão querer fazer.",
      icon: Trophy,
    },
    {
      number: "04",
      title: "Métricas claras",
      desc: "Dashboard com redução de riscos, comportamento por equipe e ROI do treinamento.",
      icon: TrendingUp,
    },
  ];
  
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-noir-900" />
      
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - text */}
          <div>
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Como funciona
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Treinamento que{' '}
              <span className="text-amber-500">funciona de verdade</span>
            </h2>
            <p className="text-lg text-noir-300 mb-8 leading-relaxed">
              Baseado em ciência comportamental e psicología da aprendizagem, 
              criamos experiências que geram mudança real de comportamento.
            </p>
            <Button variant="secondary" asChild>
              <a href="/pricing">Ver planos disponíveis</a>
            </Button>
          </div>
          
          {/* Right column - steps */}
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="relative pl-16 group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-7 top-14 w-px h-[calc(100%-3rem)] bg-noir-700" />
                )}
                
                {/* Number badge */}
                <div className="absolute left-0 top-0 w-14 h-14 rounded-xl bg-noir-800 border border-noir-700 flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-noir-700 transition-all">
                  <span className="font-display text-lg font-bold text-amber-500">{step.number}</span>
                </div>
                
                {/* Content */}
                <div className="pb-8">
                  <h3 className="text-xl font-semibold text-fg-primary mb-2 flex items-center gap-2">
                    <step.icon className="w-5 h-5 text-amber-500" />
                    {step.title}
                  </h3>
                  <p className="text-noir-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Proof Section - Testimonials and Social Proof
function ProofSection() {
  const testimonials = [
    {
      quote: "Reduzimos em 94% os clics em emails phishing em apenas 3 meses. O ROI foi imediato.",
      author: "Marina Santos",
      role: "CISO",
      company: "Banco Vertente",
      avatar: "MS",
    },
    {
      quote: "Os funcionários agora reportam emails suspeitos ativamente. Criamos uma cultura de segurança.",
      author: "Ricardo Oliveira",
      role: "Diretor de TI",
      company: "Grupo Expansão",
      avatar: "RO",
    },
    {
      quote: "A gamificação fez toda diferença. Treinamento que os funcionários realmente querem fazer.",
      author: "Carla Mendes",
      role: "RH",
      company: "TechFlow",
      avatar: "CM",
    },
  ];
  
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-noir-950" />
      
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
            Resultados reais
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Empresas que confiam no{' '}
            <span className="text-amber-500">PhishGuard</span>
          </h2>
          <p className="text-lg text-noir-400 max-w-2xl mx-auto">
            Dos nossos clientes, 89% relatam redução significativa em clics em tentativas de phishing após 6 meses.
          </p>
        </div>
        
        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-8 hover:border-amber-500/30 transition-all duration-300">
              {/* Quote mark */}
              <div className="text-6xl text-amber-500/20 font-display leading-none mb-4">"</div>
              
              <p className="text-lg text-noir-200 leading-relaxed mb-6">{t.quote}</p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-noir-700 flex items-center justify-center font-semibold text-amber-500">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-fg-primary">{t.author}</div>
                  <div className="text-sm text-noir-400">{t.role}, {t.company}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 items-center opacity-60">
          {[
            "ISO 27001",
            "LGPD Compliant",
            "SOC 2 Type II",
            "PCI DSS",
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-noir-400">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium tracking-wide">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Simulações realistas",
      desc: "Mais de 200 templates de ataques brasileiros: bancos, entregadoras, redes sociais, RH.",
    },
    {
      icon: Lock,
      title: "Phishing personalizado",
      desc: "Crie campanhas com sua marca e contexto de negócio para máxima eficácia.",
    },
    {
      icon: Users,
      title: "Gestão de equipes",
      desc: "Grupos, permissões, delegation e relatórios por departamento ou cargo.",
    },
    {
      icon: TrendingUp,
      title: "Métricas avançadas",
      desc: "Dashboard executivo com KPIs de segurança, evolução comportamental e ROI.",
    },
    {
      icon: Zap,
      title: "Microlearning",
      desc: "Treinamentos de 2 minutos integrados ao feedback. Sem tempo perdido.",
    },
    {
      icon: Globe,
      title: "Suporte multilíngue",
      desc: "Interface e conteúdo em português, inglês e espanhol. Expansion internacional.",
    },
  ];
  
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900 via-noir-950 to-noir-900" />
      
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
            Funcionalidades
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para{' '}
            <span className="text-amber-500">proteger sua empresa</span>
          </h2>
        </div>
        
        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="p-6 hover:border-amber-500/30 transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <f.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-fg-primary mb-2">{f.title}</h3>
                <p className="text-noir-400 leading-relaxed text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CtaSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-noir-950 to-noir-950" />
      
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]" />
      
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Comece a proteger sua empresa{' '}
          <span className="text-amber-500">hoje</span>
        </h2>
        <p className="text-xl text-noir-300 mb-10 max-w-2xl mx-auto">
          Teste gratuito por 14 dias. Sem cartão de crédito. 
          Configuração em menos de 5 minutos.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" asChild className="group">
            <a href="/register">
              Criar conta gratuita
              <Zap className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="/contact">Falar com vendas</a>
          </Button>
        </div>
        
        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-noir-500">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Dados criptografados
          </span>
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Conformidade LGPD
          </span>
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Suporte em português
          </span>
        </div>
      </div>
    </section>
  );
}

// Main HomePage component
export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <ProofSection />
      <FeaturesSection />
      <CtaSection />
    </main>
  );
}