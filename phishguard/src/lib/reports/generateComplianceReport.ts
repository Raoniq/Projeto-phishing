/**
 * Compliance Report Generation Module
 *
 * Generates PDF compliance reports for phishing simulation campaigns.
 * Supports: Monthly summary, Quarterly compliance, Annual security awareness,
 * and Incident response documentation.
 *
 * Uses pdfkit for PDF generation with chart support.
 */

import PDFDocument from 'pdfkit';

// =============================================================================
// TYPES
// =============================================================================

export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'incident_response';

export interface PhishingMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReported: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  reportRate: number;
  failRate: number;
}

export interface TrainingMetrics {
  totalEmployees: number;
  completedTraining: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
}

export interface DepartmentBreakdown {
  name: string;
  metrics: PhishingMetrics;
  trainingMetrics: TrainingMetrics;
}

export interface ReportChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
  position: { x: number; y: number; width: number; height: number };
}

export interface ComplianceReportData {
  reportType: ReportType;
  companyName: string;
  companyId: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  phishingMetrics: PhishingMetrics;
  trainingMetrics: TrainingMetrics;
  departmentBreakdown: DepartmentBreakdown[];
  topRisks: { category: string; count: number; riskLevel: 'high' | 'medium' | 'low' }[];
  recommendations: { priority: number; text: string; category: string }[];
  frameworkCoverage?: {
    framework: string;
    coveragePercentage: number;
    controls: string[];
  }[];
}

export interface ComplianceReportResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

// =============================================================================
// METRICS AGGREGATION
// =============================================================================

/**
 * Aggregate phishing campaign metrics from raw data.
 * STUB: In production, this would query the database.
 */
export function aggregatePhishingMetrics(
  campaigns: Array<{
    sent: number;
    opened: number;
    clicked: number;
    reported: number;
  }>
): PhishingMetrics {
  const totals = campaigns.reduce(
    (acc, c) => ({
      totalSent: acc.totalSent + c.sent,
      totalOpened: acc.totalOpened + c.opened,
      totalClicked: acc.totalClicked + c.clicked,
      totalReported: acc.totalReported + c.reported,
    }),
    { totalSent: 0, totalOpened: 0, totalClicked: 0, totalReported: 0 }
  );

  const totalFailed = totals.totalSent - totals.totalOpened;

  return {
    ...totals,
    totalFailed,
    openRate: totals.totalSent > 0 ? (totals.totalOpened / totals.totalSent) * 100 : 0,
    clickRate: totals.totalSent > 0 ? (totals.totalClicked / totals.totalSent) * 100 : 0,
    reportRate: totals.totalSent > 0 ? (totals.totalReported / totals.totalSent) * 100 : 0,
    failRate: totals.totalSent > 0 ? (totalFailed / totals.totalSent) * 100 : 0,
  };
}

/**
 * Aggregate training metrics from raw data.
 * STUB: In production, this would query the database.
 */
export function aggregateTrainingMetrics(
  employees: Array<{ completed: boolean; score: number | null }>
): TrainingMetrics {
  const totalEmployees = employees.length;
  const completedTraining = employees.filter((e) => e.completed).length;
  const scores = employees.filter((e) => e.score !== null).map((e) => e.score as number);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const passedCount = scores.filter((s) => s >= 70).length;

  return {
    totalEmployees,
    completedTraining,
    completionRate: totalEmployees > 0 ? (completedTraining / totalEmployees) * 100 : 0,
    averageScore,
    passRate: scores.length > 0 ? (passedCount / scores.length) * 100 : 0,
  };
}

/**
 * Aggregate department breakdown.
 * STUB: In production, this would query the database.
 */
export function aggregateDepartmentBreakdown(
  departments: Array<{
    name: string;
    campaigns: Array<{ sent: number; opened: number; clicked: number; reported: number }>;
    employees: Array<{ completed: boolean; score: number | null }>;
  }>
): DepartmentBreakdown[] {
  return departments.map((dept) => ({
    name: dept.name,
    metrics: aggregatePhishingMetrics(dept.campaigns),
    trainingMetrics: aggregateTrainingMetrics(dept.employees),
  }));
}

// =============================================================================
// CHART DATA GENERATION
// =============================================================================

/**
 * Generate chart data for the PDF report.
 * STUB: Returns static positions for visual placeholder.
 */
export function generateChartData(reportData: ComplianceReportData): ReportChartData[] {
  const charts: ReportChartData[] = [];

  // Phishing metrics pie chart
  charts.push({
    type: 'pie',
    title: 'Phishing Campaign Results',
    labels: ['Opened', 'Clicked', 'Reported', 'Failed'],
    datasets: [
      {
        label: 'Rate',
        data: [
          reportData.phishingMetrics.openRate,
          reportData.phishingMetrics.clickRate,
          reportData.phishingMetrics.reportRate,
          reportData.phishingMetrics.failRate,
        ],
        color: '#3B82F6',
      },
    ],
    position: { x: 50, y: 200, width: 250, height: 200 },
  });

  // Training completion bar chart
  charts.push({
    type: 'bar',
    title: 'Training Completion by Department',
    labels: reportData.departmentBreakdown.map((d) => d.name),
    datasets: [
      {
        label: 'Completion %',
        data: reportData.departmentBreakdown.map((d) => d.trainingMetrics.completionRate),
        color: '#10B981',
      },
    ],
    position: { x: 320, y: 200, width: 250, height: 200 },
  });

  // Monthly trend line chart (for quarterly/annual reports)
  if (reportData.reportType === 'quarterly' || reportData.reportType === 'annual') {
    const months = reportData.reportType === 'quarterly' ? ['Month 1', 'Month 2', 'Month 3'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    charts.push({
      type: 'line',
      title: 'Click Rate Trend',
      labels: months,
      datasets: [
        {
          label: 'Click Rate %',
          data: months.map(() => Math.random() * 15 + 5), // Stub data
          color: '#F59E0B',
        },
      ],
      position: { x: 50, y: 420, width: 520, height: 150 },
    });
  }

  return charts;
}

// =============================================================================
// PDF GENERATION
// =============================================================================

/**
 * Generate compliance report PDF as a Buffer.
 */
function generatePDFBuffer(data: ComplianceReportData, charts: ReportChartData[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100;

    // Helper to format date
    const formatDate = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    // Helper to draw section header
    const drawSectionHeader = (title: string, y: number) => {
      doc.rect(50, y, contentWidth, 1).fill('#3B82F6');
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a1a2e').text(title, 50, y + 10);
      return y + 35;
    };

    // Helper to draw metric card
    const drawMetricCard = (label: string, value: string, x: number, y: number, color: string) => {
      doc.rect(x, y, 110, 50).fill('#f8fafc');
      doc.rect(x, y, 3, 50).fill(color);
      doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(label, x + 10, y + 8);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a1a2e').text(value, x + 10, y + 25);
    };

    // =============================================================================
    // PAGE 1: HEADER & EXECUTIVE SUMMARY
    // =============================================================================

    // Background
    doc.rect(0, 0, pageWidth, doc.page.height).fill('#ffffff');

    // Header bar
    doc.rect(0, 0, pageWidth, 80).fill('#1a1a2e');

    // Company name
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#ffffff')
      .text('PHISHGUARD', 50, 25);

    // Report type badge
    const reportTypeLabels = {
      monthly: 'Relatório Mensal',
      quarterly: 'Relatório Trimestral',
      annual: 'Relatório Anual',
      incident_response: 'Documentação de Incidente',
    };
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#94a3b8')
      .text(reportTypeLabels[data.reportType], pageWidth - 200, 30);

    // Report title
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor('#1a1a2e')
      .text('Relatório de Compliance', 50, 110);

    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#64748b')
      .text(data.companyName, 50, 145);

    // Period
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#64748b')
      .text(
        `Período: ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`,
        50,
        170
      );

    // Generation date
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#94a3b8')
      .text(`Gerado em: ${formatDate(data.generatedAt)}`, 50, 190);

    // Executive Summary Section
    let currentY = drawSectionHeader('Resumo Executivo', 220);

    // Key metrics cards
    const metricsY = currentY;
    const metricsData = [
      { label: 'E-mails Enviados', value: data.phishingMetrics.totalSent.toString(), color: '#3B82F6' },
      { label: 'Taxa de Clique', value: `${data.phishingMetrics.clickRate.toFixed(1)}%`, color: '#F59E0B' },
      { label: 'Taxa de Reporte', value: `${data.phishingMetrics.reportRate.toFixed(1)}%`, color: '#10B981' },
      { label: 'Treinamento', value: `${data.trainingMetrics.completionRate.toFixed(0)}%`, color: '#8B5CF6' },
    ];

    metricsData.forEach((m, i) => {
      drawMetricCard(m.label, m.value, 50 + i * 125, metricsY, m.color);
    });

    currentY = metricsY + 70;

    // Phishing metrics summary
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b');

    const phishingSummary = [
      `Total de e-mails de phishing simulados: ${data.phishingMetrics.totalSent}`,
      `Aberturas: ${data.phishingMetrics.totalOpened} (${data.phishingMetrics.openRate.toFixed(1)}%)`,
      `Cliques: ${data.phishingMetrics.totalClicked} (${data.phishingMetrics.clickRate.toFixed(1)}%)`,
      `Reports válidos: ${data.phishingMetrics.totalReported} (${data.phishingMetrics.reportRate.toFixed(1)}%)`,
    ];

    phishingSummary.forEach((line) => {
      doc.text(line, 50, currentY);
      currentY += 14;
    });

    currentY += 10;

    // Training metrics summary
    const trainingSummary = [
      `Funcionários cadastrados: ${data.trainingMetrics.totalEmployees}`,
      `Treinamentos concluídos: ${data.trainingMetrics.completedTraining}`,
      `Pontuação média: ${data.trainingMetrics.averageScore.toFixed(1)}%`,
      `Taxa de aprovação: ${data.trainingMetrics.passRate.toFixed(1)}%`,
    ];

    trainingSummary.forEach((line) => {
      doc.text(line, 50, currentY);
      currentY += 14;
    });

    // =============================================================================
    // PAGE 2: DETAILED METRICS & CHARTS
    // =============================================================================

    doc.addPage();

    // Reset background
    doc.rect(0, 0, pageWidth, doc.page.height).fill('#ffffff');

    // Page header
    doc.rect(0, 0, pageWidth, 40).fill('#1a1a2e');
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#ffffff')
      .text('Análise Detalhada', 50, 12);

    currentY = 60;

    // Phishing Metrics Section
    currentY = drawSectionHeader('Métricas de Phishing', currentY);

    const phishingDetails = [
      ['Métrica', 'Valor', 'Status'],
      ['Taxa de Abertura', `${data.phishingMetrics.openRate.toFixed(1)}%`, data.phishingMetrics.openRate > 50 ? '⚠️ Alta' : '✅ Normal'],
      ['Taxa de Clique', `${data.phishingMetrics.clickRate.toFixed(1)}%`, data.phishingMetrics.clickRate > 20 ? '⚠️ Alta' : '✅ Normal'],
      ['Taxa de Reporte', `${data.phishingMetrics.reportRate.toFixed(1)}%`, data.phishingMetrics.reportRate < 30 ? '⚠️ Baixa' : '✅ Bom'],
      ['Funcionários que Falharam', `${data.phishingMetrics.totalFailed}`, data.phishingMetrics.failRate > 30 ? '⚠️ Crítico' : '✅ Controlado'],
    ];

    // Draw table header
    doc.rect(50, currentY, contentWidth, 20).fill('#f1f5f9');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b');
    doc.text('Métrica', 55, currentY + 5);
    doc.text('Valor', 250, currentY + 5);
    doc.text('Status', 400, currentY + 5);
    currentY += 22;

    // Draw table rows
    phishingDetails.slice(1).forEach((row, i) => {
      const rowY = currentY + i * 18;
      if (i % 2 === 0) doc.rect(50, rowY, contentWidth, 18).fill('#f8fafc');
      doc.font('Helvetica').fontSize(9).fillColor('#1a1a2e');
      doc.text(row[0], 55, rowY + 3);
      doc.text(row[1], 250, rowY + 3);
      doc.text(row[2], 400, rowY + 3);
    });

    currentY += phishingDetails.length * 18 + 20;

    // Training Metrics Section
    currentY = drawSectionHeader('Métricas de Treinamento', currentY);

    const trainingDetails = [
      ['Métrica', 'Valor', 'Status'],
      ['Taxa de Conclusão', `${data.trainingMetrics.completionRate.toFixed(1)}%`, data.trainingMetrics.completionRate < 80 ? '⚠️ Pendente' : '✅ Completo'],
      ['Pontuação Média', `${data.trainingMetrics.averageScore.toFixed(1)}%`, data.trainingMetrics.averageScore < 70 ? '⚠️ Abaixo' : '✅ Satisfatório'],
      ['Taxa de Aprovação', `${data.trainingMetrics.passRate.toFixed(1)}%`, data.trainingMetrics.passRate < 70 ? '⚠️ Crítico' : '✅ Aprovado'],
    ];

    // Draw table header
    doc.rect(50, currentY, contentWidth, 20).fill('#f1f5f9');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b');
    doc.text('Métrica', 55, currentY + 5);
    doc.text('Valor', 250, currentY + 5);
    doc.text('Status', 400, currentY + 5);
    currentY += 22;

    // Draw table rows
    trainingDetails.slice(1).forEach((row, i) => {
      const rowY = currentY + i * 18;
      if (i % 2 === 0) doc.rect(50, rowY, contentWidth, 18).fill('#f8fafc');
      doc.font('Helvetica').fontSize(9).fillColor('#1a1a2e');
      doc.text(row[0], 55, rowY + 3);
      doc.text(row[1], 250, rowY + 3);
      doc.text(row[2], 400, rowY + 3);
    });

    currentY += trainingDetails.length * 18 + 20;

    // Chart placeholder
    if (charts.length > 0) {
      currentY = drawSectionHeader('Visualizações', currentY);

      charts.forEach((chart) => {
        // Draw chart placeholder box
        doc.rect(chart.position.x, currentY + chart.position.y - 60, chart.position.width, chart.position.height).fill('#f8fafc');
        doc.rect(chart.position.x, currentY + chart.position.y - 60, chart.position.width, chart.position.height).lineWidth(1).stroke('#e2e8f0');

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#94a3b8')
          .text(chart.title, chart.position.x + 10, currentY + chart.position.y - 40, { width: chart.position.width - 20, align: 'center' });

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#cbd5e1')
          .text(`[Chart: ${chart.type.toUpperCase()}]`, chart.position.x + 10, currentY + chart.position.y + chart.position.height / 2, { width: chart.position.width - 20, align: 'center' });
      });
    }

    // =============================================================================
    // PAGE 3: RECOMMENDATIONS
    // =============================================================================

    doc.addPage();

    // Reset background
    doc.rect(0, 0, pageWidth, doc.page.height).fill('#ffffff');

    // Page header
    doc.rect(0, 0, pageWidth, 40).fill('#1a1a2e');
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#ffffff')
      .text('Recomendações', 50, 12);

    currentY = 60;

    // Top Risks Section
    if (data.topRisks.length > 0) {
      currentY = drawSectionHeader('Principais Riscos', currentY);

      data.topRisks.forEach((risk, i) => {
        const riskColor = risk.riskLevel === 'high' ? '#EF4444' : risk.riskLevel === 'medium' ? '#F59E0B' : '#10B981';
        const riskY = currentY + i * 45;

        doc.rect(50, riskY, contentWidth, 40).fill('#f8fafc');
        doc.rect(50, riskY, 3, 40).fill(riskColor);

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#1a1a2e')
          .text(`${i + 1}. ${risk.category}`, 60, riskY + 8);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748b')
          .text(`${risk.count} ocorrências`, 60, riskY + 25);

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(riskColor)
          .text(risk.riskLevel === 'high' ? 'ALTO' : risk.riskLevel === 'medium' ? 'MÉDIO' : 'BAIXO', 450, riskY + 15);
      });

      currentY += data.topRisks.length * 45 + 15;
    }

    // Recommendations Section
    currentY = drawSectionHeader('Recomendações de Melhoria', currentY);

    const priorityColors: Record<number, string> = {
      1: '#EF4444',
      2: '#F59E0B',
      3: '#3B82F6',
    };

    data.recommendations
      .sort((a, b) => a.priority - b.priority)
      .forEach((rec, i) => {
        const recY = currentY + i * 50;
        const priorityColor = priorityColors[rec.priority] || '#64748b';

        doc.rect(50, recY, contentWidth, 45).fill('#f8fafc');
        doc.rect(50, recY, 3, 45).fill(priorityColor);

        // Priority badge
        doc.rect(60, recY + 8, 20, 20).fill(priorityColor);
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#ffffff')
          .text(String(rec.priority), 65, recY + 13);

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#1a1a2e')
          .text(rec.category, 90, recY + 8);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748b')
          .text(rec.text, 90, recY + 25, { width: contentWidth - 60 });
      });

    currentY += data.recommendations.length * 50 + 20;

    // Framework Coverage (if available)
    if (data.frameworkCoverage && data.frameworkCoverage.length > 0) {
      currentY = drawSectionHeader('Cobertura de Frameworks', currentY);

      data.frameworkCoverage.forEach((fw) => {
        const fwY = currentY;

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#1a1a2e')
          .text(fw.framework, 50, fwY);

        // Progress bar background
        doc.rect(50, fwY + 15, contentWidth - 100, 10).fill('#e2e8f0');
        // Progress bar fill
        doc.rect(50, fwY + 15, (contentWidth - 100) * (fw.coveragePercentage / 100), 10).fill('#3B82F6');

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748b')
          .text(`${fw.coveragePercentage.toFixed(1)}%`, contentWidth - 40, fwY + 12);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(`Controles: ${fw.controls.join(', ')}`, 50, fwY + 30);

        currentY += 50;
      });
    }

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#cbd5e1')
      .text(
        'PhishGuard - Sistema de treinamento anti-phishing | Relatório confidencial',
        0,
        doc.page.height - 30,
        { align: 'center' }
      );

    doc.end();
  });
}

// =============================================================================
// MAIN REPORT GENERATION FUNCTION
// =============================================================================

/**
 * Generate a compliance report PDF.
 *
 * @param data - Report data including metrics, period, and recommendations
 * @returns Result with PDF buffer or error
 */
export async function generateComplianceReport(
  data: ComplianceReportData
): Promise<ComplianceReportResult> {
  try {
    // Validate report type
    const validTypes: ReportType[] = ['monthly', 'quarterly', 'annual', 'incident_response'];
    if (!validTypes.includes(data.reportType)) {
      return {
        success: false,
        error: `Invalid report type: ${data.reportType}`,
      };
    }

    // Generate chart data
    const charts = generateChartData(data);

    // Generate PDF buffer
    const pdfBuffer = await generatePDFBuffer(data, charts);

    return {
      success: true,
      buffer: pdfBuffer,
    };
  } catch (error) {
    console.error('Compliance report generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// EXPORTED DATA STRUCTURES FOR TYPE USAGE
// =============================================================================

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  monthly: 'Relatório Mensal',
  quarterly: 'Relatório Trimestral',
  annual: 'Relatório Anual',
  incident_response: 'Documentação de Incidente',
};

export const RISK_LEVEL_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: 'Alto Risco',
  medium: 'Risco Médio',
  low: 'Baixo Risco',
};
