import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Shield, 
  Users, 
  Target, 
  Heart,
  Award,
  Clock,
  Globe,
  Mail,
  Linkedin,
  ArrowRight,
} from "lucide-react";

// Timeline event
function TimelineEvent({
  year,
  title,
  description,
}: {
  year: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-noir-700" />
      {/* Timeline dot */}
      <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-amber-500" />
      
      <div className="space-y-2">
        <span className="text-amber-500 font-mono text-sm">{year}</span>
        <h3 className="text-xl font-semibold text-fg-primary">{title}</h3>
        <p className="text-noir-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Team member card
function TeamMember({
  name,
  role,
  bio,
  initials,
}: {
  name: string;
  role: string;
  bio: string;
  initials: string;
}) {
  return (
    <Card className="overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-noir-700 flex items-center justify-center text-2xl font-bold text-amber-500 group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-fg-primary">{name}</h3>
            <p className="text-amber-500 text-sm mb-3">{role}</p>
            <p className="text-noir-400 text-sm leading-relaxed">{bio}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Value card
function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 hover:border-amber-500/30 transition-all duration-300 group">
      <CardContent className="p-0">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
          <Icon className="w-6 h-6 text-amber-500" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-fg-primary mb-2">{title}</h3>
        <p className="text-noir-400 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// Stats section
function StatsSection() {
  const stats = [
    { value: "2019", label: "Ano de fundação" },
    { value: "500+", label: "Clientes ativos" },
    { value: "2.5M+", label: "Treinamentos realizados" },
    { value: "98%", label: "Satisfação" },
  ];
  
  return (
    <section className="relative py-16 border-y border-noir-800">
      <div className="absolute inset-0 bg-noir-950" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-4xl md:text-5xl font-bold text-amber-500">{stat.value}</div>
              <div className="text-sm text-noir-400 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Main AboutPage component
export default function AboutPage() {
  const timeline = [
    {
      year: "2019",
      title: "Fundação",
      description: "PhishGuard naceu da experiência de fundadores que trabalharam em segurança corporativa por mais de 15 anos.",
    },
    {
      year: "2020",
      title: "Primeiro produto",
      description: "Lançamos nossa plataforma de simulação de phishing com 12 templates e 50 clientes pioneiros.",
    },
    {
      year: "2021",
      title: "Gamificação",
      description: "Introduzimos o sistema de ranking e badges, aumentando engajamento em 340%.",
    },
    {
      year: "2022",
      title: "Expansão regional",
      description: "Expandimos para Argentina, Chile e México. Mais de 200 empresasLATAM confiam no PhishGuard.",
    },
    {
      year: "2023",
      title: "White Label",
      description: "Lançamos programa de parceria para MSPs e distribuidores oferecerem PhishGuard sob sua marca.",
    },
    {
      year: "2024",
      title: "IA e automação",
      description: "Introduzimos detecção por IA e automação de campanhas, reduzindo trabalho operacional em 80%.",
    },
    {
      year: "2025",
      title: "Crescimento contínuo",
      description: "Mais de 500 empresas e 2.5 milhões de treinamentos realizados. Líder no Brasil.",
    },
  ];
  
  const team = [
    {
      name: "Ricardo Fernandes",
      role: "CEO & Co-fundador",
      initials: "RF",
      bio: "Ex-CISO do Banco Central com 20 anos em segurança corporativa. PhD em Cibersegurança pela USP.",
    },
    {
      name: "Marina Costa",
      role: "CTO & Co-fundadora",
      initials: "MC",
      bio: "Arquiteta de sistemas distribuídos. Ex-Google e Microsoft. Especialista em plataformas de escala.",
    },
    {
      name: "BrunoLima",
      role: "Head de Produto",
      initials: "BL",
      bio: "Produto por 12 anos, últimos 6 focados em segurança. Criou plataformas que impactaram 50M+ usuários.",
    },
    {
      name: "Ana Beatriz",
      role: "Head de Design",
      initials: "AB",
      bio: "Design de interfaces com especialização em UX comportamental. Ex-studio de design awards.",
    },
  ];
  
  const values = [
    {
      icon: Shield,
      title: "Segurança em primeiro lugar",
      description: "Cada decisão de produto passa pelo filtro de segurança. Não há atalhos quando se trata de proteger dados.",
    },
    {
      icon: Users,
      title: "Foco no humano",
      description: "Tecnologia existe para servir pessoas. Criamos experiências que geram mudança real de comportamento.",
    },
    {
      icon: Target,
      title: "Resultados mensuráveis",
      description: "Segurança que não pode ser medida não pode ser melhorada. Priorizamos métricas que importam.",
    },
    {
      icon: Heart,
      title: "Empatia com clientes",
      description: "Entendemos os desafios de implementar segurança em organizações reais. Escuchamos e adaptamos.",
    },
  ];
  
  return (
    <main className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900/30 via-transparent to-noir-950" />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
                Sobre nós
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Protegendo empresas{' '}
                <span className="text-amber-500">brasileiras</span>{' '}
                desde 2019
              </h1>
              <p className="text-xl text-noir-300 leading-relaxed mb-8">
                Somos uma equipe apasionada por segurança corporativa. Acreditamos 
                que treinamento eficaz pode transformar qualquer equipe em sua 
                primeira linha de defesa contra phishing.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <a href="/contact">
                    Fale conosco
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="/pricing">Ver planos</a>
                </Button>
              </div>
            </div>
            
            {/* Decorative element */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-3xl" />
              <div className="relative aspect-square rounded-3xl bg-noir-900 border border-noir-700 p-12 flex flex-col justify-center">
                <div className="text-8xl font-display font-bold text-amber-500/20 mb-4">2019</div>
                <div className="text-xl text-fg-primary font-semibold">Ano de fundação</div>
                <div className="text-noir-400 mt-2">Brasília, Brasil</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Mission Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
                Nossa missão
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Democratizar a segurança{' '}
                <span className="text-amber-500">no Brasil</span>
              </h2>
              <p className="text-lg text-noir-300 leading-relaxed mb-6">
                Acreditamos que proteção contra phishing não deve ser luxo de grandes 
                corporações. Pequenas e médias empresas precisam de ferramentas 
                acessíveis e eficazes.
              </p>
              <p className="text-lg text-noir-300 leading-relaxed">
                Nossa missão é reduzir o cybercrime causado por phishing em 50% 
                nas empresas brasileiras até 2030. Cada treinamento realizado é um 
                passo nessa direção.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-noir-900/50">
                <Award className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-fg-primary mb-2">Certificações</h3>
                <p className="text-sm text-noir-400">ISO 27001, LGPD compliant, SOC 2 Type II</p>
              </Card>
              <Card className="p-6 bg-noir-900/50">
                <Globe className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-fg-primary mb-2">Presença</h3>
                <p className="text-sm text-noir-400">Brasil, Argentina, Chile, México, Portugal</p>
              </Card>
              <Card className="p-6 bg-noir-900/50">
                <Clock className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-fg-primary mb-2">Resposta</h3>
                <p className="text-sm text-noir-400">Suporte em português 24/7 para todos os planos</p>
              </Card>
              <Card className="p-6 bg-noir-900/50">
                <Mail className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-fg-primary mb-2">Contato</h3>
                <p className="text-sm text-noir-400">contato@phishguard.com.br</p>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Nossos valores
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              O que nos move
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <ValueCard key={i} {...value} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Time
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Pessoas por trás do PhishGuard
            </h2>
            <p className="text-noir-400 max-w-2xl mx-auto">
              Uma equipe diversa com experiência em segurança, produto e design.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <TeamMember key={i} {...member} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Timeline Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
                Nossa história
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                De startup a líder{' '}
                <span className="text-amber-500">no Brasil</span>
              </h2>
              <p className="text-lg text-noir-300 leading-relaxed">
                Evoluímos de uma ideia em 2019 para a plataforma preferida de 
                empresas brasileiras que levam segurança a sério.
              </p>
            </div>
            
            <div>
              {timeline.map((event, i) => (
                <TimelineEvent key={i} {...event} />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-noir-900 to-noir-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Quer fazer parte da nossa história?
          </h2>
          <p className="text-xl text-noir-400 mb-10 max-w-2xl mx-auto">
            Estamos sempre buscando pessoas apasionadas por segurança e tecnologia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <a href="/careers">Ver vagas</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/contact">Falar conosco</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}