/**
 * CSV Export Utility for PhishGuard Reports
 * Generates downloadable CSV files from structured data
 */

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
  format?: (value: string | number | boolean | null | undefined) => string;
}

/**
 * Convert data array to CSV string
 */
export function toCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  options: {
    delimiter?: string;
    includeHeader?: boolean;
    filename?: string;
  } = {}
): string {
  const { delimiter = ';', includeHeader = true } = options;

  const rows: string[] = [];

  // Add BOM for Excel UTF-8 compatibility
  rows.push('\uFEFF');

  // Header row
  if (includeHeader) {
    rows.push(columns.map((col) => `"${col.header}"`).join(delimiter));
  }

  // Data rows
  for (const item of data) {
    const values = columns.map((col) => {
      const value = col.accessor(item);
      const formatted = col.format ? col.format(value) : String(value ?? '');
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`;
    });
    rows.push(values.join(delimiter));
  }

  return rows.join('\n');
}

/**
 * Trigger browser download of CSV content
 */
export function downloadCSV(
  csvContent: string,
  filename: string = 'export.csv'
): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string = 'export.csv'
): void {
  const csv = toCSV(data, columns, { filename });
  downloadCSV(csv, filename);
}

// ============================================
// CAMPAIGN REPORT CSV DEFINITIONS
// ============================================

export interface CampaignStatsCSV {
  campaignName: string;
  template: string;
  tier: number;
  status: string;
  scheduledAt: string;
  completedAt: string;
  sent: number;
  opened: number;
  clicked: number;
  reported: number;
  compromised: number;
  openRate: number;
  clickRate: number;
  reportRate: number;
  compromiseRate: number;
}

export const campaignStatsColumns: CSVColumn<CampaignStatsCSV>[] = [
  { header: 'Campanha', accessor: (r) => r.campaignName },
  { header: 'Template', accessor: (r) => r.template },
  { header: 'Tier', accessor: (r) => r.tier },
  { header: 'Status', accessor: (r) => r.status },
  { header: 'Data Agendamento', accessor: (r) => r.scheduledAt },
  { header: 'Data Conclusão', accessor: (r) => r.completedAt },
  { header: 'Enviados', accessor: (r) => r.sent },
  { header: 'Abertos', accessor: (r) => r.opened },
  { header: 'Clicados', accessor: (r) => r.clicked },
  { header: 'Reportados', accessor: (r) => r.reported },
  { header: 'Comprometidos', accessor: (r) => r.compromised },
  {
    header: 'Taxa Abertura (%)',
    accessor: (r) => r.openRate,
    format: (v) => (v as number).toFixed(1),
  },
  {
    header: 'Taxa Clique (%)',
    accessor: (r) => r.clickRate,
    format: (v) => (v as number).toFixed(1),
  },
  {
    header: 'Taxa Reporte (%)',
    accessor: (r) => r.reportRate,
    format: (v) => (v as number).toFixed(1),
  },
  {
    header: 'Taxa Comprometimento (%)',
    accessor: (r) => r.compromiseRate,
    format: (v) => (v as number).toFixed(1),
  },
];

export interface DepartmentClickCSV {
  department: string;
  clicks: number;
  rate: number;
}

export const departmentClickColumns: CSVColumn<DepartmentClickCSV>[] = [
  { header: 'Departamento', accessor: (r) => r.department },
  { header: 'Cliques', accessor: (r) => r.clicks },
  {
    header: 'Taxa (%)',
    accessor: (r) => r.rate,
    format: (v) => (v as number).toFixed(1),
  },
];

export interface TimelineEntryCSV {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  reported: number;
}

export const timelineColumns: CSVColumn<TimelineEntryCSV>[] = [
  { header: 'Data', accessor: (r) => r.date },
  { header: 'Enviados', accessor: (r) => r.sent },
  { header: 'Abertos', accessor: (r) => r.opened },
  { header: 'Clicados', accessor: (r) => r.clicked },
  { header: 'Reportados', accessor: (r) => r.reported },
];

/**
 * Export campaign report to CSV files
 */
export function exportCampaignReport(
  stats: CampaignStatsCSV,
  departmentClicks: DepartmentClickCSV[],
  timeline: TimelineEntryCSV[]
): void {
  // Export main stats
  const statsCSV = toCSV([stats], campaignStatsColumns);
  downloadCSV(statsCSV, `relatorio-${stats.campaignName.replace(/\s+/g, '-').toLowerCase()}-stats.csv`);

  // Export department clicks
  const deptCSV = toCSV(departmentClicks, departmentClickColumns);
  downloadCSV(deptCSV, `relatorio-${stats.campaignName.replace(/\s+/g, '-').toLowerCase()}-departamentos.csv`);

  // Export timeline
  const timelineCSV = toCSV(timeline, timelineColumns);
  downloadCSV(timelineCSV, `relatorio-${stats.campaignName.replace(/\s+/g, '-').toLowerCase()}-timeline.csv`);
}
