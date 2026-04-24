import { motion } from 'motion/react';

interface MFAStatus {
  status: 'sent' | 'approved' | 'rejected' | 'ignored' | 'timeout';
  count: number;
}

interface ResponseTimeData {
  bucket: string;
  count: number;
  percentage: number;
}

interface MFASimulationResultsProps {
  results: {
    campaign_id: string;
    sent_count: number;
    approved_count: number;
    rejected_count: number;
    ignored_count: number;
    timeout_count: number;
    avg_response_time_ms: number | null;
    response_times_ms: number[];
  };
  className?: string;
}

function categorizeResponseTime(timeMs: number): string {
  if (timeMs < 10000) return '< 10s';
  if (timeMs < 30000) return '10-30s';
  if (timeMs < 60000) return '30-60s';
  if (timeMs < 120000) return '1-2m';
  return '> 2m';
}

function buildHistogramData(responseTimes: number[]): ResponseTimeData[] {
  const buckets: Record<string, number> = {
    '< 10s': 0,
    '10-30s': 0,
    '30-60s': 0,
    '1-2m': 0,
    '> 2m': 0,
  };

  responseTimes.forEach((time) => {
    const bucket = categorizeResponseTime(time);
    buckets[bucket]++;
  });

  const total = responseTimes.length || 1;
  return Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

export function MFASimulationResults({ results, className }: MFASimulationResultsProps) {
  const total = results.sent_count || 1;
  const approvalRate = results.approved_count > 0
    ? ((results.approved_count / total) * 100).toFixed(1)
    : '0.0';

  const statusBreakdown: MFAStatus[] = [
    { status: 'approved', count: results.approved_count },
    { status: 'rejected', count: results.rejected_count },
    { status: 'ignored', count: results.ignored_count },
    { status: 'timeout', count: results.timeout_count },
  ];

  const histogramData = buildHistogramData(results.response_times_ms || []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'var(--color-success)';
      case 'rejected': return 'var(--color-danger)';
      case 'ignored': return 'var(--color-warning)';
      case 'timeout': return 'var(--color-fg-muted)';
      default: return 'var(--color-fg-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'ignored': return 'Ignored';
      case 'timeout': return 'Timed Out';
      default: return status;
    }
  };

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-noir-700)',
        padding: 'var(--spacing-xl)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          MFA Push Simulation Results
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-fg-muted)',
          }}
        >
          Tracks user responses to simulated authentication push notifications
        </p>
      </div>

      {/* Main Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        {/* Total Sent */}
        <div
          style={{
            backgroundColor: 'var(--color-noir-900)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: '1px solid var(--color-noir-700)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-fg-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Pushes Sent
          </div>
          <motion.div
            key={results.sent_count}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-fg-primary)',
            }}
          >
            {results.sent_count}
          </motion.div>
        </div>

        {/* Approval Rate */}
        <div
          style={{
            backgroundColor: 'var(--color-noir-900)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: '1px solid var(--color-noir-700)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-fg-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Approval Rate
          </div>
          <motion.div
            key={approvalRate}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: parseFloat(approvalRate) > 50 ? 'var(--color-success)' : 'var(--color-warning)',
            }}
          >
            {approvalRate}%
          </motion.div>
        </div>

        {/* Avg Response Time */}
        <div
          style={{
            backgroundColor: 'var(--color-noir-900)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            border: '1px solid var(--color-noir-700)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-fg-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Avg Response Time
          </div>
          <motion.div
            key={results.avg_response_time_ms}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-accent)',
            }}
          >
            {formatResponseTime(results.avg_response_time_ms)}
          </motion.div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Status Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {statusBreakdown.map(({ status, count }) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-fg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(status),
                      }}
                    />
                    {getStatusLabel(status)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-fg-primary)',
                    }}
                  >
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '4px',
                    backgroundColor: 'var(--color-noir-800)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      backgroundColor: getStatusColor(status),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Time Histogram */}
      {histogramData.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Response Time Distribution
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'var(--spacing-sm)',
              height: '120px',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-noir-900)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-noir-700)',
            }}
          >
            {histogramData.map((item, index) => {
              const maxCount = Math.max(...histogramData.map(d => d.count), 1);
              const heightPercent = (item.count / maxCount) * 100;
              return (
                <div
                  key={item.bucket}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                  }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    style={{
                      width: '100%',
                      maxWidth: '40px',
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: 'var(--radius-sm)',
                      minHeight: '4px',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-fg-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {item.bucket}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-fg-secondary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <p
        style={{
          fontSize: '0.6875rem',
          color: 'var(--color-fg-muted)',
          marginTop: 'var(--spacing-lg)',
          lineHeight: 1.5,
        }}
      >
        MFA fatigue simulation tests user susceptibility to repeated push notifications.
        High approval rates may indicate insufficient user awareness training.
      </p>
    </div>
  );
}