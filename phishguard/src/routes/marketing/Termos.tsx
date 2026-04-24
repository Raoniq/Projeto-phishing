import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Shield,
  Lock,
  FileText,
  User,
  Database,
  Mail,
  CheckCircle,
  AlertTriangle,
  Globe,
  Copyright,
  Scale,
  Ban,
  Gavel,
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

// Section card component
function SectionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 hover:border-amber-500/30 transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fg-primary mt-1 mb-2">{title}</h3>
            <p className="text-noir-400 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Terms list item
function TermsItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-xl bg-noir-900/50 border border-noir-800 hover:border-amber-500/30 transition-all duration-300">
      <h3 className="text-lg font-semibold text-fg-primary mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-amber-500" />
        {title}
      </h3>
      <div className="text-noir-300 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

// Main Terms Page component
export default function TermosPage() {
  return (
    <main className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900/30 via-transparent to-noir-950" />

      {/* Hero Section */}
      <section
        className="relative py-32 overflow-hidden"
        ref={useScrollReveal()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8">
            <Scale className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-400 font-medium">
              Compliance total
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight reveal">
            Termos de Uso e{' '}
            <span className="text-amber-500">Política de Privacidade</span>
          </h1>
          <p className="text-xl text-noir-300 max-w-4xl mx-auto leading-relaxed reveal">
            Estes termos regem o uso da plataforma PhishGuard. Ao criar uma conta
            ou utilizar nossos serviços, você concorda com estes termos.
          </p>
          <p className="text-sm text-noir-500 mt-4 reveal">
            Última atualização: 24 de abril de 2026
          </p>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="relative py-16" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-4 stagger-children">
            {[
              {
                icon: Shield,
                title: "Seus dados",
                desc: "Protegidos com criptografia",
              },
              {
                icon: Lock,
                title: "Conta",
                desc: "Você controla seu acesso",
              },
              {
                icon: Globe,
                title: "Uso",
                desc: "Apenas para treinamento",
              },
              {
                icon: Scale,
                title: "Seus direitos",
                desc: "LGPD garantida",
              },
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center bg-noir-900/50">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-fg-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-noir-400 mt-1">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1: Aceitação dos Termos */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              1. Contrato
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Aceitação dos Termos
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              Ao acessar ou utilizar a plataforma PhishGuard, você concorda em
              cumprir estes termos.
            </p>
          </div>

          <div className="space-y-6">
            <TermsItem title="1.1 Aceitação">
              <p>
                Ao criar uma conta, acessar ou utilizar qualquer parte da
                plataforma PhishGuard, você confirma que leu, compreendeu e
                concorda em ficar vinculado a estes Termos de Uso e à nossa
                Política de Privacidade.
              </p>
              <p>
                Se você não concorda com qualquer parte destes termos, não deve
                utilizar nossa plataforma.
              </p>
            </TermsItem>

            <TermsItem title="1.2 Capacidade Legal">
              <p>
                Você declara que tem pelo menos 18 anos de idade e capacidade
                legal para celebrar este contrato. Se você está utilizando a
                plataforma em nome de uma empresa, você declara que tem
                autoridade para vinculá-la a estes termos.
              </p>
            </TermsItem>

            <TermsItem title="1.3 Alterações">
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer
                momento. Notificaremos sobre mudanças significativas através do
                email cadastrado ou aviso na plataforma. O uso continuado após
                as alterações constitui aceitação dos novos termos.
              </p>
            </TermsItem>
          </div>
        </div>
      </section>

      {/* Section 2: Serviços */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              2. Serviços
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Descrição da Plataforma
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard
              icon={Shield}
              title="Treinamento Gamificado"
              description="Simulações de phishing realistas para treinar sua equipe em segurança digital."
            />
            <SectionCard
              icon={CheckCircle}
              title="Métricas Claras"
              description="Dashboard com resultados de treinamento, redução de riscos e ROI."
            />
            <SectionCard
              icon={Globe}
              title="Conteúdo Local"
              description="Simulações adaptadas ao contexto brasileiro e latino-americano."
            />
            <SectionCard
              icon={Database}
              title="Relatórios Detalhados"
              description="Relatórios executivos e técnicos sobre o desempenho da sua equipe."
            />
          </div>
        </div>
      </section>

      {/* Section 3: Conta */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              3. Conta
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Suas Credenciais
            </h2>
          </div>

          <div className="space-y-6">
            <TermsItem title="3.1 Cadastro">
              <p>
                Para utilizar nossos serviços, você deve criar uma conta com
                informações precisas e completas. Você é responsável por
                manter suas credenciais de acesso confidenciais.
              </p>
              <p>
                Cada conta é destinada a uma única organização. Não é permitido
                compartilhar credenciais entre múltiplas empresas.
              </p>
            </TermsItem>

            <TermsItem title="3.2 Segurança">
              <p>
                Você deve notificar imediatamente sobre qualquer uso não
                autorizado da sua conta. Somos responsáveis por manter seus
                dados de login seguros, mas você é responsável por protegê-los.
              </p>
              <p>
                Recomendamos o uso de senhas fortes e autenticação em dois
                fatores (2FA) para proteção adicional.
              </p>
            </TermsItem>

            <TermsItem title="3.3 Encerramento">
              <p>
                Você pode encerrar sua conta a qualquer momento através das
                configurações. Podemos suspender ou encerrar contas que violem
                estes termos ou que estejam inativas por período prolongado.
              </p>
            </TermsItem>
          </div>
        </div>
      </section>

      {/* Section 4: Conduta */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              4. Conduta
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Uso Aceitável
            </h2>
          </div>

          <Card className="p-8 mb-8">
            <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-amber-500" />
              O que você pode fazer
            </h3>
            <ul className="space-y-3">
              {[
                "Utilizar a plataforma para treinar sua equipe",
                "Acessar relatórios e métricas da sua organização",
                "Configurar campanhas de simulação dentro dos limites do plano",
                "Compartilhar credenciais apenas com membros autorizados da sua equipe",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-noir-300">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
              <Ban className="w-6 h-6 text-red-500" />
              O que você não pode fazer
            </h3>
            <ul className="space-y-3">
              {[
                "Utilizar a plataforma para atacar ou enganar pessoas fora da sua organização",
                "Tentar acessar dados de outras organizações",
                "Realizar engenharia social fora do contexto autorizado",
                "Compartilhar conteúdo da plataforma com terceiros não autorizados",
                "Tentar contornar medidas de segurança",
                "Utilizar bots ou automação não autorizada",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-noir-300">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Section 5: Propriedade Intelectual */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              5. Propriedade
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Propriedade Intelectual
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <TermsItem title="5.1 Nossa Propriedade">
              <p>
                A plataforma PhishGuard, incluindo textos, gráficos, logos,
                imagens, software e demais conteúdos, são propriedade da
                PhishGuard ou seus licenciantes.
              </p>
              <p>
                Você não pode copiar, modificar ou distribuir nossos materiais
                sem autorização prévia.
              </p>
            </TermsItem>

            <TermsItem title="5.2 Seu Conteúdo">
              <p>
                Você mantém propriedade sobre os dados que insere na plataforma,
                incluindo listas de usuários e configurações de campanhas.
              </p>
              <p>
                Ao utilizar nossa plataforma, você nos concede licença para
                processar seus dados conforme necessário para prestar os
                serviços.
              </p>
            </TermsItem>

            <TermsItem title="5.3 Feedback">
              <p>
                Se você fornecer sugestões ou feedback sobre a plataforma,
                podemos utilizá-los sem obrigação de pagamento.
              </p>
            </TermsItem>

            <TermsItem title="5.4 Marcas">
              <p>
                PhishGuard e seus logos são marcas registradas. Você não pode
                utilizá-los sem autorização prévia.
              </p>
            </TermsItem>
          </div>
        </div>
      </section>

      {/* Section 6: Privacidade */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              6. Privacidade
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Proteção de Dados
            </h2>
            <p className="text-noir-400 max-w-4xl mx-auto">
              Estamos comprometidos com a proteção dos seus dados pessoais em
              conformidade com a LGPD.
            </p>
          </div>

          <Card className="p-8 mb-8">
            <h3 className="text-xl font-semibold text-fg-primary mb-6 flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-500" />
              Dados que coletamos
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-noir-900/50">
                <User className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-fg-primary">
                    Dados de Identificação
                  </h4>
                  <p className="text-sm text-noir-400">
                    Nome, email, cargo, empresa para criação de contas e
                    relatórios.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-noir-900/50">
                <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-fg-primary">
                    Dados de Comportamento
                  </h4>
                  <p className="text-sm text-noir-400">
                    Ações em campanhas de simulação para gerar métricas de
                    treinamento.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-noir-900/50">
                <Globe className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-fg-primary">Dados Técnicos</h4>
                  <p className="text-sm text-noir-400">
                    IP, navegador e dispositivo para segurança e debugging.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <TermsItem title="6.1 Seus Direitos (LGPD)">
            <p>
              Você tem direito a: acesso aos seus dados, correção de dados
              incorretos, exclusão de dados, portabilidade, informação sobre
              compartilhamento, e revogação de consentimento.
            </p>
            <p>
              Para exercer qualquer direito, envie email para
              privacy@phishguard.com.br.
            </p>
          </TermsItem>

          <TermsItem title="6.2 Compartilhamento">
            <p>
              Não vendemos seus dados. Compartilhamos apenas com: processadores
              de pagamento (Stripe), autoridades legais quando exigido por lei,
              e prestadores de serviço que auxiliam na operação da plataforma.
            </p>
          </TermsItem>
        </div>
      </section>

      {/* Section 7: Limitação de Responsabilidade */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              7. Responsabilidade
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Limitação de Responsabilidade
            </h2>
          </div>

          <Card className="p-8">
            <div className="space-y-6 text-noir-300">
              <p>
                Na extensão máxima permitida por lei, a PhishGuard não será
                responsável por quaisquer danos indiretos, incidentais,
                especiais, consequenciais ou punitivos.
              </p>
              <p>
                Nossa responsabilidade total não excederá o valor que você
                pagou à PhishGuard nos 12 meses anteriores ao evento
                gerador da reclamação.
              </p>
              <p>
                Não garantimos que a plataforma estará livre de erros ou que
                seu uso será ininterrupto. Você utiliza a plataforma por sua
                conta e risco.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Section 8: Disposições Gerais */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-900/50" />

        <div className="relative mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              8. Geral
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Disposições Finais
            </h2>
          </div>

          <div className="space-y-6">
            <TermsItem title="8.1 Lei Aplicável">
              <p>
                Estes termos são regidos pelas leis brasileiras. Qualquer
                disputa será resolvida no foro da comarca de São Paulo, SP.
              </p>
            </TermsItem>

            <TermsItem title="8.2 Separabilidade">
              <p>
                Se qualquer disposição destes termos for considerada inválida,
                as demais disposições permanecerão em pleno vigor.
              </p>
            </TermsItem>

            <TermsItem title="8.3 Acordo Completo">
              <p>
                Estes termos constituem o acordo completo entre você e a
                PhishGuard regarding uso da plataforma e substituem quaisquer
                acordos anteriores.
              </p>
            </TermsItem>

            <TermsItem title="8.4 Contato">
              <p>
                Para questões sobre estes termos, entre em contato:
              </p>
              <p className="mt-2">
                <strong className="text-fg-primary">Email:</strong>{" "}
                <a
                  href="mailto:legal@phishguard.com.br"
                  className="text-amber-500 hover:text-amber-400"
                >
                  legal@phishguard.com.br
                </a>
              </p>
              <p>
                <strong className="text-fg-primary">DPO:</strong>{" "}
                <a
                  href="mailto:privacy@phishguard.com.br"
                  className="text-amber-500 hover:text-amber-400"
                >
                  privacy@phishguard.com.br
                </a>
              </p>
            </TermsItem>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24" ref={useScrollReveal()}>
        <div className="absolute inset-0 bg-noir-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 reveal">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-noir-400 mb-10 max-w-4xl mx-auto reveal">
            Nossa equipe está pronta para ajudar você a proteger sua empresa
            contra phishing.
          </p>

          <Card className="inline-block p-8 text-left reveal">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg-primary">
                  Contato
                </h3>
                <p className="text-noir-400 mt-1">
                  legal@phishguard.com.br
                </p>
                <p className="text-sm text-noir-500 mt-1">
                  Resposta em até 48 horas úteis
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
