import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Shield, 
  Lock, 
  FileText,
  User,
  Database,
  Mail,
  Eye,
  CheckCircle,
  AlertTriangle,
  Globe,
  Scale,
  RefreshCw,
  Bell,
} from "lucide-react";

// Legal basis card
function LegalBasisCard({
  article,
  title,
  description,
  icon: Icon,
}: {
  article: string;
  title: string;
  description: string;
  icon: typeof FileText;
}) {
  return (
    <Card className="p-6 hover:border-amber-500/30 transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="text-xs font-mono text-amber-500 uppercase tracking-wide">
              Art. {article}
            </span>
            <h3 className="text-lg font-semibold text-fg-primary mt-1 mb-2">{title}</h3>
            <p className="text-noir-400 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Data category row
function DataCategoryRow({
  category,
  data,
  purpose,
  retention,
}: {
  category: string;
  data: string;
  purpose: string;
  retention: string;
}) {
  return (
    <tr className="border-b border-noir-800 last:border-0">
      <td className="py-4 px-4 font-medium text-fg-primary">{category}</td>
      <td className="py-4 px-4 text-noir-400">{data}</td>
      <td className="py-4 px-4 text-noir-400">{purpose}</td>
      <td className="py-4 px-4 text-noir-400">{retention}</td>
    </tr>
  );
}

// Right card
function RightCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 hover:border-amber-500/30 transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-fg-primary">{title}</h3>
        </div>
        <p className="text-noir-400 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// Main LgpdPage component
export default function LgpdPage() {
  return (
    <main className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900/30 via-transparent to-noir-950" />
      
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8">
            <Scale className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-400 font-medium">Conformidade total</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Proteção de dados{' '}
            <span className="text-amber-500">LGPD</span>
          </h1>
          <p className="text-xl text-noir-300 max-w-4xl mx-auto leading-relaxed">
            Estamos comprometidos com a proteção dos seus dados pessoais.
            Esta página explica como coletamos, usamos e protegemos suas informações
            em conformidade com a Lei Geral de Proteção de Dados.
          </p>
          <p className="text-sm text-noir-500 mt-4">
            Última atualização: 21 de abril de 2026
          </p>
        </div>
      </section>
      
      {/* Quick Summary */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "Dados protegidos", desc: "Criptografia AES-256" },
              { icon: Lock, title: "Seus direitos", desc: "Acesso, correção, exclusão" },
              { icon: Globe, title: "Base legal", desc: "Art. 7º e 9º LGPD" },
              { icon: Bell, title: "Transparência", desc: "Comunicação em 72h" },
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center bg-noir-900/50">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-fg-primary">{item.title}</h3>
                <p className="text-sm text-noir-400 mt-1">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Legal Basis Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Base legal
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Fundamentos legais do tratamento
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              Processamos seus dados com base em fundamentos legais previstos na LGPD,
              garantindo transparência econformidade legal.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <LegalBasisCard
              article="7º"
              title="Consentimento"
              description="Você nos dá consentimento explícito para coletar e processar seus dados. Você pode revogar a qualquer momento."
              icon={User}
            />
            <LegalBasisCard
              article="7º, II"
              title="Execução de contrato"
              description="Processamos dados para prestar os serviços contratados, como treinamento desegurança e relatórios."
              icon={FileText}
            />
            <LegalBasisCard
              article="7º, IX"
              title="Interesse legítimo"
              description="Podemos processar dados para prevenir fraudes, garantir segurança e melhorar nossos serviços."
              icon={Shield}
            />
            <LegalBasisCard
              article="9º, II"
              title="Exercício regular de direitos"
              description="Processamos dados para exercício de direitos em processos judiciais, administrativos ou arbitrais."
              icon={Scale}
            />
          </div>
        </div>
      </section>
      
      {/* Data We Collect */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Dados coletados
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Que dados coletamos?
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              Coletamos apenas dados necessários para prestar nossos serviços.
              Nunca vendemos dados pessoais.
            </p>
          </div>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-noir-900">
                  <tr>
                    <th className="py-4 px-4 text-left text-xs font-semibold text-amber-500 uppercase tracking-wide">
                      Categoria
                    </th>
                    <th className="py-4 px-4 text-left text-xs font-semibold text-amber-500 uppercase tracking-wide">
                      Dados específicos
                    </th>
                    <th className="py-4 px-4 text-left text-xs font-semibold text-amber-500 uppercase tracking-wide">
                      Finalidade
                    </th>
                    <th className="py-4 px-4 text-left text-xs font-semibold text-amber-500 uppercase tracking-wide">
                      Retenção
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-noir-800">
                  <DataCategoryRow
                    category="Identificação"
                    data="Nome, email, CPF, cargo"
                    purpose="Conta de usuário, relatórios"
                    retention="Durante contrato + 5 anos"
                  />
                  <DataCategoryRow
                    category="Contato"
                    data="Telefone, empresa, departamento"
                    purpose="Comunicação, suporte"
                    retention="Durante contrato + 3 anos"
                  />
                  <DataCategoryRow
                    category="Comportamento"
                    data="Ações em campanhas, scores"
                    purpose="Métricas de treinamento, ROI"
                    retention="Durante contrato + 2 anos"
                  />
                  <DataCategoryRow
                    category="Técnicos"
                    data="IP, navegador, device"
                    purpose="Segurança, debugging"
                    retention="90 dias (anonimizado)"
                  />
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>
      
      {/* Data Processing */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
                Processamento
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Como usamos{' '}
                <span className="text-amber-500">seus dados</span>
              </h2>
              <p className="text-lg text-noir-300 leading-relaxed mb-6 max-w-4xl">
                Seus dados são usados exclusivamente para fornecer e melhorar nossos
                serviços de treinamento contra phishing. Não vendemos, não compartilhamos
                com terceiros para marketing.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Fornecer acesso à plataforma de treinamento",
                  "Gerar relatórios de desempenho para sua empresa",
                  "Enviar notificações sobre campanhas e resultados",
                  "Melhorar nossos algoritmos de detecção de phishing",
                  "Cumprir obrigações legais e regulatórias",
                  "Proteção contra fraudes e incidentes de segurança",
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
                <Database className="w-5 h-5 text-amber-500" />
                Compartilhamento de dados
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-noir-900/50">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-fg-primary">Operadoras de pagamento</h4>
                    <p className="text-sm text-noir-400">
                      Processadores de pagamento (Stripe) para cobrança. Dados de cartão não são armazenados por nós.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-noir-900/50">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-fg-primary">Autoridades legais</h4>
                    <p className="text-sm text-noir-400">
                      Compartilhamos dados quando exigido por lei, ordem judicial ou solicitação governamental.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-noir-900/50">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-fg-primary">Nunca vendemos dados</h4>
                    <p className="text-sm text-noir-400">
                      Seus dados nunca são vendidos ou compartilhados com terceiros para fins de marketing.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Your Rights */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Seus direitos
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Você controla seus dados
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              A LGPD garante direitos sobre seus dados pessoais. Você pode exercer
              cualquiera a qualquer momento, sem custo.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RightCard
              icon={Eye}
              title="Acesso"
              description="Solicite uma cópia de todos os dados pessoais que temos sobre você."
            />
            <RightCard
              icon={FileText}
              title="Correção"
              description="Solicite correção de dados incompletos, desatualizados ou incorretos."
            />
            <RightCard
              icon={RefreshCw}
              title="Portabilidade"
              description="Receba seus dados em formato estruturado e legível, ou solicite transferência."
            />
            <RightCard
              icon={Lock}
              title="Exclusão"
              description="Solicite exclusão de dados pessoais, sujeito a obrigações legais de retenção."
            />
            <RightCard
              icon={AlertTriangle}
              title="Oposição"
              description="Oppose-se ao processamento de dados是基于 interesse legítimo."
            />
            <RightCard
              icon={Bell}
              title="Revogação"
              description="Revoke consentimento a qualquer momento para processamentos baseados em consentimento."
            />
          </div>
          
          <div className="mt-12 text-center">
            <Card className="inline-block p-8 bg-noir-900/50">
              <h3 className="text-xl font-semibold text-fg-primary mb-4">
                Como exercer seus direitos?
              </h3>
              <p className="text-noir-400 mb-6 max-w-none">
                Envie um email para privacy@phishguard.com.br com sua solicitação. 
                Responderemos em até 15 dias úteis.
              </p>
              <Button asChild>
                <a href="mailto:privacy@phishguard.com.br">
                  <Mail className="w-4 h-4 mr-2" />
                  privacy@phishguard.com.br
                </a>
              </Button>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Security Measures */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-950" />
        
        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Segurança
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Como protegemos seus dados
            </h2>
          </div>
          
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-fg-primary mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  Medidas técnicas
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Criptografia AES-256 em repouso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">TLS 1.3 em trânsito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Autenticação multifator (MFA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Segmentação de dados por tenant</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg-primary mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  Medidas administrativas
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Política de segurança documentada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Treinamento de equipe em LGPD</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Auditoria anual de segurança</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-noir-300 text-sm">Processo de resposta a incidentes</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>
      
      {/* Cookies Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-900/50" />
        
        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Cookies
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Uso de cookies
            </h2>
          </div>
          
          <Card className="p-8">
            <p className="text-noir-300 leading-relaxed mb-6">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência 
              na plataforma, lembrar suas preferências e analisar o uso do serviço.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-noir-900/50">
                <h3 className="font-medium text-fg-primary mb-2">Cookies essenciais</h3>
                <p className="text-sm text-noir-400">
                  Necessários para o funcionamento da plataforma. Não podem ser desativados.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-noir-900/50">
                <h3 className="font-medium text-fg-primary mb-2">Cookies de análise</h3>
                <p className="text-sm text-noir-400">
                  Nos ajudam a entender como você usa a plataforma para melhorar nossos serviços.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-noir-900/50">
                <h3 className="font-medium text-fg-primary mb-2">Cookies de funcionalidade</h3>
                <p className="text-sm text-noir-400">
                  Permitem lembrar suas preferências e oferecer recursos personalizados.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-noir-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Fale com nosso DPO
          </h2>
          <p className="text-xl text-noir-400 mb-10 max-w-4xl mx-auto">
            Para questões relacionadas a proteção de dados, você pode entrar em contato
            diretamente com nosso Encarregado de Proteção de Dados.
          </p>
          
          <Card className="inline-block p-8 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg-primary">Encarregado de Proteção de Dados (DPO)</h3>
                <p className="text-noir-400 mt-1">privacy@phishguard.com.br</p>
                <p className="text-sm text-noir-500 mt-1">Resposta em até 15 dias úteis</p>
              </div>
            </div>
          </Card>
          
          <div className="mt-12">
            <Button variant="secondary" asChild>
              <a href="/contact">Fale conosco</a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Updates Section */}
      <section className="relative py-16 border-t border-noir-800">
        <div className="absolute inset-0 bg-noir-900/30" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h3 className="text-lg font-semibold text-fg-primary mb-4">
            Atualizações desta política
          </h3>
<p className="text-noir-400 text-sm leading-relaxed max-w-4xl mx-auto">
              Esta política de privacidade pode ser atualizada periodicamente.
              Notificaremos sobre mudanças significativas através do email cadastrado
              ou aviso na plataforma. Recomendamos revisar esta página regularmente.
            </p>
        </div>
      </section>
    </main>
  );
}