/**
 * Compliance Dashboard Page
 * Shows norm coverage, generates compliance reports per framework/control
 * Includes TLI template download for DPO
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  FileText,
  Printer,
  CheckCircle,
  Clock,
  Target,
  ChevronDown,
  ChevronRight,
  Award,
  BarChart3,
  Download as DownloadIcon,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  TRAINING_NORM_MAPPINGS,
  ISO_27001_CONTROLS,
  SOC2_CONTROLS,
  LGPD_CONTROLS,
  ALL_CONTROLS,
  type NormFramework,
  type NormControl,
  type EmployeeCompliance,
  type NormCoverage,
  FRAMEWORK_LABELS,
  FRAMEWORK_COLORS,
  generateTLIHtml,
  generateTLIText,
} from '@/lib/compliance';
import { cn } from '@/lib/utils';

// Mock employee compliance data
const mockEmployees: EmployeeCompliance[] = [
  { userId: '1', name: 'Maria Silva', email: 'maria.silva@empresa.com', department: 'RH', completedAt: '2026-04-15', score: 92, certificateUrl: '/verify/abc123' },
  { userId: '2', name: 'João Santos', email: 'joao.santos@empresa.com', department: 'TI', completedAt: '2026-04-14', score: 88, certificateUrl: '/verify/def456' },
  { userId: '3', name: 'Pedro Oliveira', email: 'pedro.oliveira@empresa.com', department: 'Financeiro', completedAt: '2026-04-16', score: 95, certificateUrl: null },
  { userId: '4', name: 'Ana Costa', email: 'ana.costa@empresa.com', department: 'Vendas', completedAt: null, score: null, certificateUrl: null },
  { userId: '5', name: 'Carlos Mendes', email: 'carlos.mendes@empresa.com', department: 'Marketing', completedAt: '2026-04-12', score: 78, certificateUrl: '/verify/ghi789' },
  { userId: '6', name: 'Lucia Ferreira', email: 'lucia.ferreira@empresa.com', department: 'RH', completedAt: null, score: null, certificateUrl: null },
  { userId: '7', name: 'Roberto Almeida', email: 'roberto.almeida@empresa.com', department: 'Operações', completedAt: '2026-04-18', score: 91, certificateUrl: '/verify/jkl012' },
  { userId: '8', name: 'Fernanda Lima', email: 'fernanda.lima@empresa.com', department: 'TI', completedAt: '2026-04-17', score: 85, certificateUrl: null },
];

// Calculate norm coverage from mock data
function calculateNormCoverage(): NormCoverage[] {
  const coverages: NormCoverage[] = [];

  ALL_CONTROLS.forEach(control => {
    const mappedModules = TRAINING_NORM_MAPPINGS.filter(m =>
      m.norms.some(n => n.id === control.id)
    );

    const totalEmployees = mockEmployees.length;
    const compliantEmployees = mockEmployees.filter(e => e.completedAt !== null).length;

    coverages.push({
      framework: control.framework,
      controlCode: control.controlCode,
      description: control.description,
      modulesCount: mappedModules.length,
      coveredModules: mappedModules.map(m => m.moduleName),
      totalEmployees,
      compliantEmployees,
      coveragePercentage: Math.round((compliantEmployees / totalEmployees) * 100),
    });
  });

  return coverages;
}

function CoverageBar({ percentage, framework }: { percentage: number; framework: NormFramework }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-noir-800)]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: FRAMEWORK_COLORS[framework] }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <span className="font-mono text-sm font-bold" style={{ color: FRAMEWORK_COLORS[framework] }}>
        {percentage}%
      </span>
    </div>
  );
}

function NormBadge({ control }: { control: NormControl }) {
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs"
      style={{
        borderColor: FRAMEWORK_COLORS[control.framework],
        color: FRAMEWORK_COLORS[control.framework],
      }}
    >
      {control.controlCode}
    </Badge>
  );
}

function EmployeeRow({ employee }: { employee: EmployeeCompliance }) {
  const isCompliant = employee.completedAt !== null;

  return (
    <tr className="border-b border-[var(--color-noir-800)]">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
            isCompliant ? 'bg-green-500/20 text-green-500' : 'bg-[var(--color-noir-700)] text-[var(--color-noir-400)]'
          )}>
            {employee.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-[var(--color-fg-primary)]">{employee.name}</p>
            <p className="text-xs text-[var(--color-fg-tertiary)]">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-[var(--color-fg-secondary)]">{employee.department}</td>
      <td className="py-3 px-4">
        {isCompliant ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500">{employee.completedAt}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-noir-500)]" />
            <span className="text-sm text-[var(--color-noir-500)]">Pendente</span>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        {employee.score !== null ? (
          <span className={cn(
            'font-mono text-sm font-bold',
            employee.score >= 80 ? 'text-green-500' : employee.score >= 60 ? 'text-amber-500' : 'text-red-500'
          )}>
            {employee.score}%
          </span>
        ) : (
          <span className="text-sm text-[var(--color-noir-500)]">N/A</span>
        )}
      </td>
      <td className="py-3 px-4">
        {employee.certificateUrl ? (
          <a
            href={employee.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-amber-500 hover:underline"
          >
            <Award className="h-3 w-3" />
            Verificar
          </a>
        ) : (
          <span className="text-xs text-[var(--color-noir-500)]">Sem certificado</span>
        )}
      </td>
    </tr>
  );
}

function ComplianceReportSection({ control }: { control: NormControl }) {
  const compliantEmployees = mockEmployees.filter(e => e.completedAt !== null);
  const avgScore = compliantEmployees.length > 0
    ? Math.round(compliantEmployees.reduce((acc, e) => acc + (e.score || 0), 0) / compliantEmployees.length)
    : 0;

  return (
    <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${FRAMEWORK_COLORS[control.framework]}20` }}
            >
              <Shield className="h-5 w-5" style={{ color: FRAMEWORK_COLORS[control.framework] }} />
            </div>
            <div>
              <CardTitle className="font-mono text-lg">{control.controlCode}</CardTitle>
              <CardDescription className="mt-1">{control.description}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-[var(--color-surface-2)] p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{compliantEmployees.length}</p>
            <p className="text-xs text-[var(--color-fg-tertiary)]">Colaboradores em conformidade</p>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-2)] p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{mockEmployees.length - compliantEmployees.length}</p>
            <p className="text-xs text-[var(--color-fg-tertiary)]">Pendentes</p>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-2)] p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{avgScore}%</p>
            <p className="text-xs text-[var(--color-fg-tertiary)]">Pontuação média</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-noir-700)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-2)]">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-fg-tertiary)]">Colaborador</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-fg-tertiary)]">Departamento</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-fg-tertiary)]">Conclusão</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-fg-tertiary)]">Pontuação</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-fg-tertiary)]">Certificado</th>
              </tr>
            </thead>
            <tbody>
              {mockEmployees.map(emp => (
                <EmployeeRow key={emp.userId} employee={emp} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TLIDownloadCard() {
  const handleDownloadHtml = () => {
    const html = generateTLIHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TLI-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const text = generateTLIText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TLI-template.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <FileCode className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-amber-500">Template TLI</CardTitle>
            <CardDescription>Teste de Legítimo Interesse para DPO</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-[var(--color-fg-secondary)]">
          Template para documentar a base legal de legítimo interesse conforme LGPD Art. 10.
          Inclui seções para: finalidade, necessidade, medidas técnicas, direitos dos titulares.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleDownloadHtml}>
            <DownloadIcon className="h-4 w-4" />
            Baixar HTML
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadTxt}>
            <FileText className="h-4 w-4" />
            Baixar TXT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'tli'>('dashboard');
  const [selectedFramework, setSelectedFramework] = useState<NormFramework>('ISO-27001');
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());

  const coverageData = useMemo(() => calculateNormCoverage(), []);

  const frameworkControls = useMemo(() => {
    switch (selectedFramework) {
      case 'ISO-27001':
        return ISO_27001_CONTROLS;
      case 'SOC2':
        return SOC2_CONTROLS;
      case 'LGPD':
        return LGPD_CONTROLS;
      default:
        return [];
    }
  }, [selectedFramework]);

  const toggleControl = (controlId: string) => {
    setExpandedControls(prev => {
      const next = new Set(prev);
      if (next.has(controlId)) {
        next.delete(controlId);
      } else {
        next.add(controlId);
      }
      return next;
    });
  };

  // Coverage by framework
  const frameworkCoverage = useMemo(() => {
    const result = {
      'ISO-27001': { covered: 0, total: 0 },
      'SOC2': { covered: 0, total: 0 },
      'LGPD': { covered: 0, total: 0 },
    };

    coverageData.forEach(c => {
      result[c.framework].total++;
      if (c.coveragePercentage >= 75) {
        result[c.framework].covered++;
      }
    });

    return result;
  }, [coverageData]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
            Compliance
          </h1>
          <p className="mt-2 text-[var(--color-fg-secondary)]">
            Mapeamento de normas ISO 27001, SOC 2 e LGPD
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-8">
          <TabsList>
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios por Norma
            </TabsTrigger>
            <TabsTrigger value="tli">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Template TLI
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Framework Coverage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['ISO-27001', 'SOC2', 'LGPD'] as NormFramework[]).map(framework => {
                const stats = frameworkCoverage[framework];
                const percentage = stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0;

                return (
                  <Card
                    key={framework}
                    className={cn(
                      'cursor-pointer transition-all hover:scale-[1.02]',
                      selectedFramework === framework ? 'ring-2' : ''
                    )}
                    style={{
                      ...(selectedFramework === framework ? {
                        ringColor: FRAMEWORK_COLORS[framework]
                      } : {})
                    }}
                    onClick={() => setSelectedFramework(framework)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${FRAMEWORK_COLORS[framework]}20` }}
                        >
                          <Shield className="h-5 w-5" style={{ color: FRAMEWORK_COLORS[framework] }} />
                        </div>
                        <span className="text-2xl font-bold" style={{ color: FRAMEWORK_COLORS[framework] }}>
                          {percentage}%
                        </span>
                      </div>
                      <h3 className="font-semibold text-[var(--color-fg-primary)]">
                        {FRAMEWORK_LABELS[framework]}
                      </h3>
                      <p className="text-sm text-[var(--color-fg-tertiary)]">
                        {stats.covered}/{stats.total} controles cobertos
                      </p>
                      <div className="mt-3">
                        <CoverageBar percentage={percentage} framework={framework} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Norm Coverage Table */}
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle>Cobertura por Controle</CardTitle>
                <CardDescription>
                  Módulos de treinamento associados a cada controle normativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coverageData
                    .filter(c => c.framework === selectedFramework)
                    .map(control => {
                      const isExpanded = expandedControls.has(control.id);

                      return (
                        <div
                          key={control.id}
                          className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)]"
                        >
                          <button
                            className="flex w-full items-center justify-between p-4 text-left"
                            onClick={() => toggleControl(control.id)}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-noir-700)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleControl(control.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <NormBadge control={control} />
                              <span className="text-sm text-[var(--color-fg-primary)]">
                                {control.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-[var(--color-fg-tertiary)]">
                                {control.modulesCount} módulo(s)
                              </span>
                              <CoverageBar percentage={control.coveragePercentage} framework={control.framework} />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-[var(--color-noir-700)] px-4 py-3">
                              <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-fg-tertiary)]">
                                <Target className="h-3 w-3" />
                                <span>Módulos cobertos:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {control.coveredModules.map(moduleName => (
                                  <Badge key={moduleName} variant="secondary" className="text-xs">
                                    {moduleName}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="rounded bg-[var(--color-surface-1)] p-3 text-center">
                                  <p className="text-lg font-bold text-green-500">{control.compliantEmployees}</p>
                                  <p className="text-xs text-[var(--color-fg-tertiary)]">Em conformidade</p>
                                </div>
                                <div className="rounded bg-[var(--color-surface-1)] p-3 text-center">
                                  <p className="text-lg font-bold text-amber-500">
                                    {control.totalEmployees - control.compliantEmployees}
                                  </p>
                                  <p className="text-xs text-[var(--color-fg-tertiary)]">Pendentes</p>
                                </div>
                                <div className="rounded bg-[var(--color-surface-1)] p-3 text-center">
                                  <p className="text-lg font-bold text-blue-500">{control.coveragePercentage}%</p>
                                  <p className="text-xs text-[var(--color-fg-tertiary)]">Cobertura</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-fg-primary)]">
                  Relatórios de Compliance
                </h2>
                <p className="text-sm text-[var(--color-fg-secondary)]">
                  Selecione uma norma para gerar relatório com lista de colaboradores
                </p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimir Todos
              </Button>
            </div>

            {frameworkControls.map(control => (
              <ComplianceReportSection key={control.id} control={control} />
            ))}
          </motion.div>
        )}

        {/* TLI Tab */}
        {activeTab === 'tli' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-fg-primary)]">
                Teste de Legítimo Interesse (TLI)
              </h2>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Template para documentar base legal conforme LGPD Art. 10
              </p>
            </div>

            <TLIDownloadCard />

            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader>
                <CardTitle>Seções do Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: '1. Finalidade do Tratamento', desc: 'Descreva a finalidade específica e legítima' },
                    { title: '2. Necessidade e Minimização', desc: 'Dados estritamente necessários' },
                    { title: '3. Medidas Técnicas e Organizacionais', desc: 'Controles de segurança implementados' },
                    { title: '4. Avaliação de Impacto', desc: 'Análise e mitigação de riscos' },
                    { title: '5. Direitos dos Titulares', desc: 'Canais de atendimento e prazos' },
                    { title: '6. Responsáveis pelo Tratamento', desc: 'Controlador, DPO e operadores' },
                    { title: '7. Validade e Revisão', desc: 'Periodicidade de atualização' },
                  ].map(section => (
                    <div
                      key={section.title}
                      className="flex items-start gap-3 rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[var(--color-fg-primary)]">{section.title}</h4>
                        <p className="text-sm text-[var(--color-fg-tertiary)]">{section.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Print-only elements */}
        <div className="hidden print:block">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Relatório de Compliance</h1>
            <p className="text-sm text-gray-600">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}