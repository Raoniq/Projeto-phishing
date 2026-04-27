import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Target, ChevronDown, Mail, Phone, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const articles = [
  {
    icon: BookOpen,
    title: 'Guia de início rápido',
    description: 'Configure sua conta em 5 minutos',
    steps: [
      { title: 'Complete seu perfil', description: 'Adicione nome, cargo, foto' },
      { title: 'Invite sua equipe', description: 'Convide colegas via email' },
      { title: 'Crie sua primeira campanha', description: 'Escolha um template' },
      { title: 'Analise os resultados', description: 'Veja métricas no dashboard' },
    ],
  },
  {
    icon: Target,
    title: 'Como criar campanhas',
    description: 'Passo a passo para sua primeira campanha',
    steps: [
      { title: 'Escolha o template', description: 'Navegue na biblioteca' },
      { title: 'Defina os alvos', description: 'Selecione usuários ou importe CSV' },
      { title: 'Agende ou envie', description: 'Agora ou agendado' },
      { title: 'Monitore em tempo real', description: 'Acompanhe clicks e reports' },
    ],
  },
];

const faqs = [
  {
    question: 'Como funciona o período de teste?',
    answer: 'Você tem 14 dias gratuitos com acesso completo a todas as funcionalidades da plataforma. Não é necessário cartão de crédito para começar.',
  },
  {
    question: 'Posso personalizar os templates de phishing?',
    answer: 'Sim, use o Editor de Templates para criar simulações personalizadas ou modifique os templates existentes com seu branding e cenários específicos.',
  },
  {
    question: 'Como importar usuários em massa?',
    answer: 'Via CSV ou integração direta com Active Directory e Azure AD. A importação pode ser feita em segundos com nossa ferramenta de mapeamento de campos.',
  },
  {
    question: 'Os dados dos funcionários estão seguros?',
    answer: 'Sim, utilizamos criptografia de ponta-a-ponta, hospedagem em data centers certificados SOC 2 Type II e cumprimos rigorosamente a LGPD.',
  },
  {
    question: 'Como funciona o score de risco?',
    answer: 'O score é calculado com base em múltiplos fatores: comportamento do usuário, resposta a simulações, tempo de reporting e histórico de interações suspeitas.',
  },
  {
    question: 'Posso integrar com Microsoft 365?',
    answer: 'Sim, oferecemos integração nativa com Microsoft 365, Google Workspace e Slack. A integração é feita em minutos via OAuth.',
  },
];

export default function SuportePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [openArticleIndex, setOpenArticleIndex] = useState<number | null>(null);

  return (
    <div className="text-white p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Suporte</h1>
          <p className="mt-2 text-[var(--color-fg-secondary)]">
            Central de ajuda e recursos
          </p>
        </div>

        {/* Documentação */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Documentação</h2>
          <div className="space-y-3">
            {articles.map((article, index) => (
              <div
                key={article.title}
                className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenArticleIndex(openArticleIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <article.icon className="w-5 h-5 text-[var(--color-accent)]" />
                    <div>
                      <h3 className="font-medium text-[var(--color-fg-primary)]">
                        {article.title}
                      </h3>
                      <p className="text-sm text-[var(--color-fg-secondary)]">
                        {article.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-[var(--color-fg-secondary)] transition-transform duration-200',
                      openArticleIndex === index && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openArticleIndex === index && article.steps && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2">
                        <div className="space-y-3 ml-8">
                          {article.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center">
                                {stepIndex + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                                  {step.title}
                                </p>
                                <p className="text-xs text-[var(--color-fg-secondary)]">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Perguntas Frequentes */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-[var(--color-fg-secondary)] transition-transform duration-200',
                      openFaqIndex === index && 'rotate-180'
                    )}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-4 pb-4 text-[var(--color-fg-secondary)] text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contato */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Contato</h2>
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-xs text-[var(--color-fg-secondary)]">Email</p>
                    <p className="text-sm font-medium">suporte@phishguard.com.br</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-xs text-[var(--color-fg-secondary)]">Telefone</p>
                    <p className="text-sm font-medium">0800 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-xs text-[var(--color-fg-secondary)]">Horário</p>
                    <p className="text-sm font-medium">Seg-Sex 9h-18h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status do Sistema */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              Todos os sistemas operacionais
            </span>
          </div>
        </section>

        {/* Versão */}
        <section>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            PhishGuard v1.0.0
          </p>
        </section>
      </div>
    </div>
  );
}