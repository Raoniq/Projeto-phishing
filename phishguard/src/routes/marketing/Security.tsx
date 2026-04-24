import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Shield, 
  Lock, 
  Key, 
  Server, 
  Database,
  Globe,
  CheckCircle,
  FileCheck,
  Eye,
  Bell,
  UserCheck,
  FileText,
  Award,
  Link2,
} from "lucide-react";

// Hook for scroll-triggered animations
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const currentRef = ref.current;
    if (currentRef) {
      const revealElements = currentRef.querySelectorAll(".reveal, .stagger-children");
      revealElements.forEach((el) => observer.observe(el));
    }

    return () => {
      if (currentRef) {
        const revealElements = currentRef.querySelectorAll(".reveal, .stagger-children");
        revealElements.forEach((el) => observer.unobserve(el));
      }
    };
  }, []);

  return ref;
}

// Security feature card
function SecurityFeatureCard({
  icon: Icon,
  title,
  description,
  details,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
  details: string[];
}) {
  return (
    <Card className="p-6 hover:border-amber-500/30 transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fg-primary mb-1">{title}</h3>
            <p className="text-noir-400 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
        <ul className="space-y-2 ml-4">
          {details.map((detail, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-noir-300">
              <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Compliance badge
function ComplianceBadge({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-noir-900/50 border border-noir-700">
      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
        <Award className="w-5 h-5 text-amber-500" />
      </div>
      <div>
        <div className="font-semibold text-fg-primary">{title}</div>
        <div className="text-sm text-noir-400">{description}</div>
      </div>
    </div>
  );
}

// Technical spec row
function TechSpecRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-noir-800 last:border-0">
      <span className="text-noir-400">{label}</span>
      <span className="text-fg-primary font-medium">{value}</span>
    </div>
  );
}

// Main SecurityPage component
export default function SecurityPage() {
  return (
    <main className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900/30 via-transparent to-noir-950" />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8">
            <Shield className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-400 font-medium">Segurança em primeiro lugar</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight reveal">
            Segurança de{' '}
            <span className="text-amber-500">nível enterprise</span>
          </h1>
          <p className="text-xl text-noir-300 max-w-4xl mx-auto leading-relaxed reveal">
            Levamos segurança tão a sério quanto você. Nossa infraestrutura foi 
            construída para proteger seus dados com os mais altos padrões do mercado.
          </p>
        </div>
      </section>
      
      {/* Security Features Grid */}
      <section className="relative py-16" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4 w-full">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Infraestrutura
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Proteção em múltiplas camadas
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            <SecurityFeatureCard
              icon={Lock}
              title="Criptografia de dados"
              description="Proteção robusta para dados em repouso e em trânsito."
              details={[
                "AES-256 para dados em repouso",
                "TLS 1.3 para dados em trânsito",
                "Cifras modernas (ChaCha20-Poly1305)",
                "Rotação de chaves automática",
              ]}
            />
            <SecurityFeatureCard
              icon={Key}
              title="Gerenciamento de chaves"
              description="Práticas rígidas de segurança para chaves criptográficas."
              details={[
                "HSM (Hardware Security Module) dedicado",
                "Segregação de chaves por cliente",
                "Audit trail completo de acesso",
                "Procedimentos de rotação documentados",
              ]}
            />
            <SecurityFeatureCard
              icon={Server}
              title="Infraestrutura segura"
              description="Infraestrutura projetada com segurança em mente."
              details={[
                "Datacenters SOC 2 Type II",
                "Redundância geográfica",
                "Firewalls de próxima geração",
                "Detecção de intrusão 24/7",
              ]}
            />
            <SecurityFeatureCard
              icon={Database}
              title="Proteção de dados"
              description="Safeguarding para suas informações sensíveis."
              details={[
                "Segmentação de dados por tenant",
                "Backup criptografado diário",
                "Teste de recuperação de desastres",
                "Retenção de dados configurável",
              ]}
            />
            <SecurityFeatureCard
              icon={Globe}
              title="Conformidade de rede"
              description="Comunicações seguras e proteção de rede."
              details={[
                "VPN para acessos administrativos",
                "WAF (Web Application Firewall)",
                "DDoS protection",
                "Monitoramento de anomalias",
              ]}
            />
            <SecurityFeatureCard
              icon={UserCheck}
              title="Controle de acesso"
              description="Gestão rigorosa de identidades e acessos."
              details={[
                "Autenticação multifator (MFA)",
                "SSO/SAML integrado",
                "Princípio do menor privilégio",
                "Revisão periódica de acessos",
              ]}
            />
          </div>
        </div>
      </section>
      
      {/* Technical Specifications */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />

        <div className="relative mx-auto max-w-4xl px-4 w-full">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Especificações técnicas
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Detalhes da nossa infraestrutura
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 stagger-children">
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-500" />
                Infraestrutura
              </h3>
              <div className="space-y-0">
                <TechSpecRow label="Provedor de nuvem" value="AWS São Paulo + Virgínia" />
                <TechSpecRow label="Tipo de instância" value="Reserved + On-demand" />
                <TechSpecRow label="CDN" value="Cloudflare" />
                <TechSpecRow label="Load balancer" value="ALB com WAF integrado" />
                <TechSpecRow label="Database" value="PostgreSQL RDS + Aurora" />
                <TechSpecRow label="Cache" value="ElastiCache Redis" />
                <TechSpecRow label="Storage" value="S3 com versioning" />
              </div>
            </Card>
            
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Segurança
              </h3>
              <div className="space-y-0">
                <TechSpecRow label="Criptografia" value="AES-256 + TLS 1.3" />
                <TechSpecRow label="Autenticação" value="MFA + SSO (SAML/OIDC)" />
                <TechSpecRow label="SIEM" value="Splunk Cloud" />
                <TechSpecRow label="Monitoramento" value="Datadog + CloudWatch" />
                <TechSpecRow label="Backup" value="Diário + Point-in-time" />
                <TechSpecRow label="RPO/RTO" value="15 min / 1 hora" />
                <TechSpecRow label="Uptime SLA" value="99.9%" />
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Compliance Section */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4 w-full">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Certificações
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Conformidade e certificações
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              Estamos em total conformidade com as principais regulamentações e
              mantemos certificações de segurança reconhecidas globalmente.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 stagger-children">
            <ComplianceBadge
              title="ISO 27001"
              description="Gestão de segurança da informação"
            />
            <ComplianceBadge
              title="SOC 2 Type II"
              description="Controles de segurança e disponibilidade"
            />
            <ComplianceBadge
              title="LGPD"
              description="Lei Geral de Proteção de Dados"
            />
            <ComplianceBadge
              title="PCI DSS"
              description="Padrão de segurança de dados de cartões"
            />
          </div>
          
          <Card className="p-8">
            <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-500" />
              Auditorias e relatórios
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-noir-400 leading-relaxed">
                  Realizamos auditorias de segurança anuais com empresas independentes 
                 renomadas. Os relatórios de auditoria estão disponíveis para clientes 
                 Enterprise sob solicitação.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-noir-300">Penetration testing anual</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-noir-300">Revisão de código por terceiros</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-noir-300">Bug bounty program</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-noir-300">Security advisories publicas</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
      
      {/* Access Control Section */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-6xl px-4 w-full">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="reveal">
              <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
                Acesso e controle
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Quem tem acesso aos{' '}
                <span className="text-amber-500">seus dados?</span>
              </h2>
              <p className="text-lg text-noir-300 leading-relaxed mb-6 max-w-4xl">
                Implementamos rigorosos controles de acesso para garantir que apenas
                pessoas autorizadas possam acessar dados sensíveis, e apenas quando
                necessário.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Acesso Least privilege: Funcionários têm apenas permissões necessárias para suas funções",
                  "Revisão trimestral: A cada 90 dias revisamos acessos e removemos permissões desnecessárias",
                  "Autenticação forte: MFA obrigatório para todos os acessos administrativos",
                  "Separation of duties: Nenhuma pessoa tem controle total sobre sistemas críticos",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                Monitoramento contínuo
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">
                    Log de auditoria
                  </h4>
                  <p className="text-sm text-noir-400 leading-relaxed">
                    Todos os acessos e operações são registrados em logs imutáveis 
                    por 7 anos. Logs incluem: quem acessou, quando, de onde, e qual ação.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">
                    Alertas em tempo real
                  </h4>
                  <p className="text-sm text-noir-400 leading-relaxed">
                    Sistema de alertas автоматически detecta comportamentos suspeitos 
                    e notifica nossa equipe de segurança 24/7.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-3">
                    Revisão de acesso
                  </h4>
                  <p className="text-sm text-noir-400 leading-relaxed">
                    Clientes Enterprise podem solicitar relatórios de acesso mensais 
                    detalhados para seus ambientes.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Privacy Section */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4 w-full">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Privacidade
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Seus dados são seus
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              Nunca vendemos dados. Nunca. Suas informações são usadas apenas para
              fornecer o serviço que você contratou.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-fg-primary mb-2">
                Dados criptografados
              </h3>
              <p className="text-sm text-noir-400 leading-relaxed">
                Seus dados são criptografados e nunca compartilhados com terceiros.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-fg-primary mb-2">
                Exportação de dados
              </h3>
              <p className="text-sm text-noir-400 leading-relaxed">
                Você pode exportar ou excluir seus dados a qualquer momento.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-fg-primary mb-2">
                Notificações
              </h3>
              <p className="text-sm text-noir-400 leading-relaxed">
                Alertas sobre incidentes em até 72 horas conforme LGPD.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Incident Response Section */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-4xl px-4 w-full">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Resposta a incidentes
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              O que acontece se houver uma violação?
            </h2>
          </div>
          
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-noir-950 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-primary mb-2">
                    Detecção e contenção
                  </h3>
                  <p className="text-noir-400 leading-relaxed">
                    Nossa equipe de segurança detecta incidentes em média em 15 minutos 
                    e inicia contenção imediata.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-noir-950 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-primary mb-2">
                    Avaliação de impacto
                  </h3>
                  <p className="text-noir-400 leading-relaxed">
                    Identificamos escopo, dados afetados e usuários impactados em até 2 horas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-noir-950 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-primary mb-2">
                    Comunicação
                  </h3>
                  <p className="text-noir-400 leading-relaxed">
                    Notificamos clientes afetados em até 72 horas conforme exigido pela LGPD.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-noir-950 flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-primary mb-2">
                    Remediação e análise
                  </h3>
                  <p className="text-noir-400 leading-relaxed">
                    Eliminamos a causa raiz, fortalecemosdefesas e documentamos lessons learned.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-gradient-to-t from-noir-900 to-noir-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 w-full text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 reveal">
            Tem dúvidas específicas sobre segurança?
          </h2>
          <p className="text-xl text-noir-400 mb-10 max-w-4xl mx-auto reveal">
            Nossa equipe de segurança está disponível para responder suas perguntas
            e fornecer documentação técnica detalhada.
          </p>
          <div className="flex flex-wrap justify-center gap-4 reveal">
            <Button asChild>
              <a href="/contact">Falar com segurança</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/lgpd">Ver política de privacidade</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}