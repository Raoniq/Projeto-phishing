import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  VideoPlayer,
  ArticleViewer,
  ProgressTracker,
  QuizButton,
  CertificateGenerator,
  ModuleProgressBar,
  type ArticleContent,
  type QuizQuestion,
  type ModuleProgress,
} from '@/components/learning';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  ISO_27001_CONTROLS,
  SOC2_CONTROLS,
  LGPD_CONTROLS,
  FRAMEWORK_COLORS,
} from '@/lib/compliance';
import type { NormControl } from '@/lib/compliance';

// Compliance meta-tags interface
interface ComplianceMetaTags {
  norms: NormControl[];
}

// Mock data types
interface Module {
  id: string;
  title: string;
  description: string;
  videoPlaybackId: string;
  articleContent: ArticleContent;
  quizQuestions: QuizQuestion[];
  estimatedMinutes: number;
  compliance?: ComplianceMetaTags;
}

interface Trilha {
  id: string;
  title: string;
  modules: Module[];
}

// Mock data - in production this would come from API/Supabase
const mockTrilha: Trilha = {
  id: '1',
  title: 'Fundamentos de Segurança',
  modules: [
    {
      id: '1-1',
      title: 'Introdução ao Phishing',
      description: 'Aprenda a identificar os diferentes tipos de ataques de phishing',
      videoPlaybackId: 'VZ00X0001Example',
      estimatedMinutes: 15,
      articleContent: {
        title: 'Phishing: O Que É e Como Se Proteger',
        estimatedReadTime: 8,
        sections: [
          {
            id: 'intro',
            type: 'text',
            title: 'O que é Phishing?',
            content:
              'Phishing é uma técnica de ataque onde criminosos se passam por organizações confiáveis para roubar informações sensíveis como credenciais, dados financeiros ou informações pessoais. O termo vem da palavra em inglês "fishing" (pescando), referência à ideia de "pescar" vítimas através de iscas诱惑.',
          },
          {
            id: 'types',
            type: 'callout',
            title: 'Tipos comuns de Phishing',
            content:
              'Os tipos mais comuns incluem: email phishing (e-mails fraudulentos), spear phishing (alvo específico), whaling (contra executivos), smishing (via SMS) e vishing (via telefone).',
          },
          {
            id: 'signs',
            type: 'tip',
            title: 'Sinais de alerta',
            content:
              'Fique atento a: urgência excessiva, pedidos de informações sensíveis, links suspeitos, erros ortográficos, remetentes desconhecidos e ofertas muito vantajosas para serem verdadeiras.',
          },
          {
            id: 'interactive',
            type: 'interactive',
            title: 'Pratique identificar phishing',
            content: 'Teste seus conhecimentos identificando e-mails suspeita.',
            action: {
              label: 'Iniciar exercício',
              onClick: () => console.log('Starting phishing exercise'),
            },
          },
          {
            id: 'quiz-section',
            type: 'quiz',
            quiz: {
              question: 'Você recebe um e-mail do "Banco Central" pedindo para atualizar seus dados. O que você faz?',
              options: [
                { label: 'Clico no link e atualizo os dados', correct: false },
                { label: 'Verifico o remetente e consulto o banco diretamente', correct: true },
                { label: 'Encaminho para todos os colegas', correct: false },
                { label: 'Respondo pedindo mais informações', correct: false },
              ],
              explanation:
                'Nunca clique em links de e-mails suspeitos. Sempre verifique a autenticidade entrando em contato diretamente com a instituição pelos canais oficiais.',
            },
          },
        ],
      },
      quizQuestions: [
        {
          id: 'q1',
          question: 'Qual é a principal característica de um e-mail de phishing?',
          options: [
            { label: 'Vem de remetentes desconhecidos', correct: false },
            { label: 'Cria senso de urgência e pede informações sensíveis', correct: true },
            { label: 'Contém anexos grandes', correct: false },
            { label: 'Tem formatação profissional', correct: false },
          ],
          explanation: 'E-mails de phishing frequentemente criam urgência e solicitam informações sensíveis que organizações legítimas nunca pediriam por email.',
        },
        {
          id: 'q2',
          question: 'O que significa "spear phishing"?',
          options: [
            { label: 'Phishing através de spear (arpa)', correct: false },
            { label: 'Phishing direcionado a pessoas específicas', correct: true },
            { label: 'Phishing em grande escala', correct: false },
            { label: 'Phishing via redes sociais', correct: false },
          ],
          explanation: 'Spear phishing é um tipo de ataque direcionado onde o agressor pesquisa e personaliza a abordagem para vítimas específicas.',
        },
      ],
      // Compliance meta-tags: ISO-27001, SOC2, LGPD controls
      compliance: {
        norms: [
          ISO_27001_CONTROLS[1], // A.7.2.2 awareness training
          SOC2_CONTROLS[0], // CC2.1 information and communication
          LGPD_CONTROLS[0], // Art.7 legal basis
        ],
      },
    },
    {
      id: '1-2',
      title: 'Senhas Seguras',
      description: 'Como criar e gerenciar senhas fortes',
      videoPlaybackId: 'VZ00X0002Example',
      estimatedMinutes: 12,
      articleContent: {
        title: 'Gerenciamento de Senhas',
        estimatedReadTime: 6,
        sections: [
          {
            id: 'password-basics',
            type: 'text',
            content: 'Senhas fortes são sua primeira linha de defesa. Uma boa senha deve ter pelo menos 12 caracteres, misturando letras maiúsculas, minúsculas, números e símbolos.',
          },
          {
            id: 'password-tips',
            type: 'tip',
            title: 'Dicas para senhas memoráveis',
            content: 'Use frases ao invés de palavras: "Cachorro&2Gatos!" é mais seguro e fácil de lembrar que "P@ssw0rd123".',
          },
          {
            id: 'password-tools',
            type: 'callout',
            title: 'Use um gerenciador de senhas',
            content: 'Gerenciadores como 1Password, Bitwarden ou LastPass podem gerar e armazenar senhas complexas com segurança.',
          },
        ],
      },
      quizQuestions: [
        {
          id: 'q1',
          question: 'Qual é a característica de uma senha forte?',
          options: [
            { label: 'Seu nome seguido de números', correct: false },
            { label: '123456', correct: false },
            { label: 'Mínimo 12 caracteres com mistura de tipos', correct: true },
            { label: 'Sua data de nascimento', correct: false },
          ],
          explanation: 'Senhas fortes devem ter pelo menos 12 caracteres e incluir uma combinação de letras maiúsculas, minúsculas, números e símbolos.',
        },
      ],
      // Compliance meta-tags: ISO-27001, SOC2, LGPD controls
      compliance: {
        norms: [
          ISO_27001_CONTROLS[0], // A.5.1.1 policies
          SOC2_CONTROLS[1], // CC6.6 confidential info protection
          LGPD_CONTROLS[4], // Art.46 security measures
        ],
      },
    },
  ],
};

// Mock user data - would come from auth context
const mockUser = {
  id: 'user-123',
  name: 'João Silva',
  email: 'joao.silva@empresa.com',
};

export default function ModuleViewerPage() {
  useParams<{ id: string; moduleId: string }>();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [articleProgress, setArticleProgress] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | undefined>();
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [, setProgress] = useState<ModuleProgress | null>(null);

  // Find current module
  const currentModule = mockTrilha.modules[currentModuleIndex];
  const completedModules = mockTrilha.modules
    .filter((_, index) => index < currentModuleIndex)
    .map((m) => parseInt(m.id.split('-')[1]));

  // Calculate module completion
  useEffect(() => {
    if (videoProgress >= 90 && articleProgress >= 100 && quizCompleted) {
      requestAnimationFrame(() => {
        setModuleCompleted(true);
      });
    }
  }, [videoProgress, articleProgress, quizCompleted]);

  const handleVideoProgress = useCallback((watchedSeconds: number, duration: number) => {
    const progressPct = duration > 0 ? (watchedSeconds / duration) * 100 : 0;
    setVideoProgress(progressPct);
  }, []);

  const handleVideoComplete = useCallback(() => {
    setVideoProgress(100);
  }, []);

  const handleArticleProgress = useCallback((progressPct: number) => {
    setArticleProgress(progressPct);
  }, []);

  const handleArticleComplete = useCallback(() => {
    setArticleProgress(100);
  }, []);

  const handleQuizComplete = useCallback((score: number) => {
    setQuizScore(score);
    setQuizCompleted(true);
  }, []);

  const handleNextModule = () => {
    if (currentModuleIndex < mockTrilha.modules.length - 1) {
      setCurrentModuleIndex((prev) => prev + 1);
      // Reset progress for new module
      setVideoProgress(0);
      setArticleProgress(0);
      setQuizCompleted(false);
      setQuizScore(undefined);
      setModuleCompleted(false);
    }
  };

  // Update progress tracking
  const handleProgressUpdate = useCallback((newProgress: ModuleProgress) => {
    setProgress(newProgress);
  }, []);

  if (!currentModule) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noir-950">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-white">Módulo não encontrado</h1>
          <Link to="/learner/trilhas" className="mt-4 text-amber-500 hover:underline">
            Voltar para trilhas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir-950 pb-20">
      {/* Header with navigation */}
      <div className="sticky top-0 z-40 border-b border-noir-800 bg-noir-950/95 backdrop-blur supports-[backdrop-filter]:bg-noir-950/80">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/learner/trilhas"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-noir-800 transition-colors"
                aria-label="Voltar para trilhas"
              >
                <svg className="h-5 w-5 text-noir-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <p className="text-xs text-noir-500">{mockTrilha.title}</p>
                <h1 className="font-display text-lg font-semibold text-white">{currentModule.title}</h1>
              </div>
            </div>

            {/* Module Progress */}
            <div className="hidden md:block">
              <ModuleProgressBar
                current={currentModuleIndex + 1}
                total={mockTrilha.modules.length}
                completedModules={completedModules}
              />
            </div>
          </div>

          {/* Compliance Meta-tags */}
          {currentModule.compliance?.norms && (
            <div className="flex items-center gap-2 mt-2">
              {currentModule.compliance.norms.map(norm => (
                <Badge
                  key={norm.id}
                  variant="outline"
                  className="font-mono text-xs"
                  style={{
                    borderColor: FRAMEWORK_COLORS[norm.framework],
                    color: FRAMEWORK_COLORS[norm.framework],
                  }}
                >
                  {norm.framework} {norm.controlCode}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - Module content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-white">Vídeo Aula</h2>
                <span className="text-sm text-noir-500">~{currentModule.estimatedMinutes} min</span>
              </div>

              <VideoPlayer
                playbackId={currentModule.videoPlaybackId}
                title={currentModule.title}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                className="w-full"
              />

              {/* Video progress indicator */}
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-noir-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${videoProgress}%` }}
                  />
                </div>
                <span className="text-sm text-noir-400">{Math.round(videoProgress)}% assistido</span>
              </div>
            </motion.section>

            {/* Article Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-white">Material de Apoio</h2>
              </div>

              <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-6">
                <ArticleViewer
                  content={currentModule.articleContent}
                  onProgress={handleArticleProgress}
                  onComplete={handleArticleComplete}
                />
              </div>
            </motion.section>

            {/* Quiz Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  quizCompleted ? 'bg-green-500/20 text-green-500' : 'bg-purple-500/20 text-purple-500'
                )}>
                  {quizCompleted ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
                <h2 className="font-display text-xl font-semibold text-white">Quiz do Módulo</h2>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-xl border border-noir-700 bg-noir-900/50 p-8">
                <QuizButton
                  moduleId={currentModule.id}
                  enabled={videoProgress >= 90}
                  videoProgress={videoProgress}
                  questions={currentModule.quizQuestions}
                  onComplete={handleQuizComplete}
                />

                {quizCompleted && quizScore !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      'rounded-lg px-4 py-2',
                      quizScore >= 70 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                    )}
                  >
                    <span className="font-semibold">Pontuação: {quizScore}%</span>
                    <span className="ml-2 text-sm opacity-70">
                      {quizScore >= 70 ? 'Aprovado!' : 'Tente alcançar 70%'}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* Completion Section */}
            <AnimatePresence>
              {moduleCompleted && !showCertificate && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
                    >
                      <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-white">Módulo Completo!</h2>
                    <p className="mt-2 text-noir-400">
                      Você completou todas as atividades deste módulo.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-4">
                      {currentModuleIndex < mockTrilha.modules.length - 1 ? (
                        <Button onClick={handleNextModule} variant="primary">
                          Próximo Módulo
                          <svg className="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Button>
                      ) : (
                        <Button onClick={() => setShowCertificate(true)} variant="primary">
                          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                          </svg>
                          Gerar Certificado
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Certificate Section */}
            <AnimatePresence>
              {showCertificate && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CertificateGenerator
                    data={{
                      userId: mockUser.id,
                      userName: mockUser.name,
                      userEmail: mockUser.email,
                      trilhaId: mockTrilha.id,
                      trilhaName: mockTrilha.title,
                      completedAt: new Date().toISOString(),
                    }}
                  />
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right column - Progress sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Progress Tracker */}
              <ProgressTracker
                moduleId={currentModule.id}
                trilhaId={mockTrilha.id}
                userId={mockUser.id}
                onProgressUpdate={handleProgressUpdate}
                autoSaveInterval={30000}
              />

              {/* Module navigation */}
              <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-4">
                <h4 className="mb-3 font-display text-sm font-semibold text-white">Outros Módulos</h4>
                <div className="space-y-2">
                  {mockTrilha.modules.map((module, index) => {
                    const isCurrent = index === currentModuleIndex;
                    const isCompleted = index < currentModuleIndex;

                    return (
                      <button
                        key={module.id}
                        onClick={() => {
                          setCurrentModuleIndex(index);
                          setVideoProgress(0);
                          setArticleProgress(0);
                          setQuizCompleted(false);
                          setQuizScore(undefined);
                          setModuleCompleted(false);
                          setShowCertificate(false);
                        }}
                        className={cn(
                          'w-full rounded-lg border p-3 text-left text-sm transition-all',
                          isCurrent && 'border-amber-500/50 bg-amber-500/5',
                          !isCurrent && 'border-noir-700 bg-noir-800/50 hover:border-noir-600'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                              isCompleted && 'bg-green-500 text-white',
                              isCurrent && 'bg-amber-500 text-noir-950',
                              !isCurrent && !isCompleted && 'bg-noir-700 text-noir-400'
                            )}
                          >
                            {isCompleted ? (
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              index + 1
                            )}
                          </span>
                          <span className={cn(isCurrent ? 'text-white' : 'text-noir-300')}>
                            {module.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}