import { motion, useReducedMotion } from 'motion/react';

interface RiskUser {
  id: string;
  name: string;
  email: string;
  riskScore: number;
  department?: string;
  lastActivity?: string;
}

type RiskLevel = 'low' | 'medium' | 'high';

interface UserRiskTableProps {
  users: RiskUser[];
  onUserClick?: (user: RiskUser) => void;
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

const RISK_COLORS = {
  low: 'var(--color-success)',
  medium: 'var(--color-warning)',
  high: 'var(--color-danger)',
} as const;

const RISK_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const;

const ANIMATION_DURATION = 0.5;

export function UserRiskTable({ users, onUserClick }: UserRiskTableProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="user-risk-table"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-noir-700)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderBottom: '1px solid var(--color-noir-700)',
              }}
            >
              {['User', 'Department', 'Risk Score', 'Last Activity'].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-fg-muted)',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const riskLevel = getRiskLevel(user.riskScore);

              return (
                <motion.tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--color-noir-700)',
                    cursor: onUserClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                  }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: ANIMATION_DURATION,
                          delay: index * 0.05,
                          ease: 'easeOut',
                        }
                  }
                  onClick={() => onUserClick?.(user)}
                  onMouseEnter={(e) => {
                    if (onUserClick) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        'var(--color-surface-3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'transparent';
                  }}
                >
                  {/* User info */}
                  <td
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ color: 'var(--color-fg-primary)', fontWeight: 500 }}>
                      {user.name}
                    </span>
                    <span
                      style={{
                        color: 'var(--color-fg-muted)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {user.email}
                    </span>
                  </td>

                  {/* Department */}
                  <td
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      color: 'var(--color-fg-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {user.department ?? '—'}
                  </td>

                  {/* Risk Badge */}
                  <td
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: RISK_COLORS[riskLevel],
                          fontSize: '1rem',
                        }}
                      >
                        {user.riskScore}
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: `color-mix(in srgb, ${RISK_COLORS[riskLevel]} 20%, transparent)`,
                          color: RISK_COLORS[riskLevel],
                        }}
                      >
                        {RISK_LABELS[riskLevel]}
                      </span>
                    </div>
                  </td>

                  {/* Last Activity */}
                  <td
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      color: 'var(--color-fg-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {user.lastActivity ?? '—'}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div
          style={{
            padding: 'var(--spacing-2xl)',
            textAlign: 'center',
            color: 'var(--color-fg-muted)',
          }}
        >
          No users to display
        </div>
      )}
    </div>
  );
}
