import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export interface DepartmentData {
  id: string;
  name: string;
  clickRate: number; // 0-100
  failureRate: number; // 0-100
  trainingCompletion: number; // 0-100
  employeeCount: number;
}

export interface DepartmentRiskHeatmapProps {
  departments: DepartmentData[];
  onDepartmentClick?: (department: DepartmentData) => void;
}

interface TooltipState {
  department: DepartmentData;
  dimension: string;
  x: number;
  y: number;
}

function getRiskColor(value: number): string {
  // For click rate and failure rate: higher = worse (red)
  // For training completion: higher = better (green)
  // But task says "green (low) → yellow → red (high)" for all
  // So we use the same scale for all dimensions
  if (value <= 25) return 'var(--color-success)';
  if (value <= 50) return 'var(--color-amber-500)';
  if (value <= 75) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function getRiskGradient(value: number): string {
  if (value <= 25) return 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.4) 100%)';
  if (value <= 50) return 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.4) 100%)';
  if (value <= 75) return 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.4) 100%)';
  return 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.5) 100%)';
}

const DIMENSIONS = [
  { key: 'clickRate', label: 'Click Rate', description: 'Percentage of simulated phishing emails clicked by employees' },
  { key: 'failureRate', label: 'Failure Rate', description: 'Rate of employees who failed phishing tests' },
  { key: 'trainingCompletion', label: 'Training', description: 'Overall training completion rate across all tracks' },
] as const;

const MOCK_DEPARTMENTS: DepartmentData[] = [
  { id: 'dept-1', name: 'Engineering', clickRate: 12, failureRate: 8, trainingCompletion: 94, employeeCount: 45 },
  { id: 'dept-2', name: 'Marketing', clickRate: 28, failureRate: 22, trainingCompletion: 78, employeeCount: 32 },
  { id: 'dept-3', name: 'Finance', clickRate: 8, failureRate: 5, trainingCompletion: 98, employeeCount: 28 },
  { id: 'dept-4', name: 'Sales', clickRate: 35, failureRate: 31, trainingCompletion: 65, employeeCount: 67 },
  { id: 'dept-5', name: 'HR', clickRate: 15, failureRate: 12, trainingCompletion: 88, employeeCount: 18 },
  { id: 'dept-6', name: 'Operations', clickRate: 42, failureRate: 38, trainingCompletion: 52, employeeCount: 54 },
  { id: 'dept-7', name: 'Legal', clickRate: 6, failureRate: 4, trainingCompletion: 91, employeeCount: 12 },
];

export function DepartmentRiskHeatmap({
  departments = MOCK_DEPARTMENTS,
  onDepartmentClick,
}: DepartmentRiskHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentData | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleCellHover = useCallback(
    (department: DepartmentData, dimension: string, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        department,
        dimension,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    []
  );

  const handleCellLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleDepartmentClick = useCallback(
    (department: DepartmentData) => {
      setSelectedDepartment(department);
      onDepartmentClick?.(department);
    },
    [onDepartmentClick]
  );

  const getOverallRisk = (dept: DepartmentData) => {
    // Weighted average: click and failure are bad, training is good
    const riskScore = (dept.clickRate * 0.4 + dept.failureRate * 0.4 + (100 - dept.trainingCompletion) * 0.2);
    return riskScore;
  };

  return (
    <div
      className="department-risk-heatmap"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-noir-700)',
        padding: 'var(--spacing-lg)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            margin: 0,
          }}
        >
          Department Risk Heatmap
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-fg-muted)',
            margin: '4px 0 0 0',
          }}
        >
          Risk assessment across departments and training metrics
        </p>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-fg-muted)' }}>Risk Level:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-success)',
                opacity: 0.7,
              }}
            />
            <span style={{ fontSize: '0.625rem', color: 'var(--color-fg-muted)' }}>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-amber-500)',
                opacity: 0.7,
              }}
            />
            <span style={{ fontSize: '0.625rem', color: 'var(--color-fg-muted)' }}>Med</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-warning)',
                opacity: 0.7,
              }}
            />
            <span style={{ fontSize: '0.625rem', color: 'var(--color-fg-muted)' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-danger)',
                opacity: 0.7,
              }}
            />
            <span style={{ fontSize: '0.625rem', color: 'var(--color-fg-muted)' }}>Critical</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px repeat(3, 1fr)',
          gap: '2px',
          minWidth: '500px',
        }}
      >
        {/* Header Row */}
        <div />
        {DIMENSIONS.map((dim) => (
          <div
            key={dim.key}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              textAlign: 'center',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--color-fg-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {dim.label}
          </div>
        ))}

        {/* Department Rows */}
        {departments.map((dept, index) => {
          const overallRisk = getOverallRisk(dept);
          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                delay: shouldReduceMotion ? 0 : index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                display: 'contents',
              }}
            >
              {/* Department Label */}
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onClick={() => handleDepartmentClick(dept)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--color-fg-primary)',
                    }}
                  >
                    {dept.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--color-fg-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {dept.employeeCount} employees
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getRiskColor(overallRisk),
                    boxShadow: `0 0 6px ${getRiskColor(overallRisk)}`,
                  }}
                />
              </div>

              {/* Risk Dimension Cells */}
              {DIMENSIONS.map((dim) => {
                const value = dept[dim.key];
                return (
                  <div
                    key={dim.key}
                    onMouseEnter={(e) => handleCellHover(dept, dim.label, e)}
                    onMouseLeave={handleCellLeave}
                    onClick={() => handleDepartmentClick(dept)}
                    style={{
                      padding: 'var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: getRiskGradient(value),
                      border: `1px solid ${getRiskColor(value)}33`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = getRiskColor(value);
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = `${getRiskColor(value)}33`;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--color-fg-primary)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {value}
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: 'var(--color-fg-muted)',
                        marginLeft: '4px',
                      }}
                    >
                      %
                    </span>
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              left: tooltip.x,
              top: tooltip.y - 10,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--color-surface-0)',
              border: `1px solid var(--color-noir-600)`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              pointerEvents: 'none',
              minWidth: '200px',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-fg-primary)',
                marginBottom: '4px',
                borderBottom: '1px solid var(--color-noir-700)',
                paddingBottom: 'var(--spacing-sm)',
              }}
            >
              {tooltip.department.name}
            </div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>
                {DIMENSIONS.find((d) => d.label === tooltip.dimension)?.description}
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-sm)',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-fg-muted)' }}>Value</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: getRiskColor(tooltip.department[DIMENSIONS.find((d) => d.label === tooltip.dimension)?.key as keyof DepartmentData] ?? 0),
                    fontSize: '1.125rem',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {DIMENSIONS.find((d) => d.label === tooltip.dimension) && tooltip.department[DIMENSIONS.find((d) => d.label === tooltip.dimension)?.key as keyof DepartmentData]}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-fg-muted)' }}>Risk Level</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: getRiskColor(tooltip.department[DIMENSIONS.find((d) => d.label === tooltip.dimension)?.key as keyof DepartmentData] ?? 0),
                  }}
                >
                  {(() => {
                    const val = tooltip.department[DIMENSIONS.find((d) => d.label === tooltip.dimension)?.key as keyof DepartmentData] as number ?? 0;
                    if (val <= 25) return 'Low';
                    if (val <= 50) return 'Medium';
                    if (val <= 75) return 'High';
                    return 'Critical';
                  })()}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 'var(--spacing-sm)',
                paddingTop: 'var(--spacing-sm)',
                borderTop: '1px solid var(--color-noir-700)',
                fontSize: '0.6875rem',
                color: 'var(--color-fg-muted)',
              }}
            >
              Click to view employees
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drill-down Modal */}
      <AnimatePresence>
        {selectedDepartment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setSelectedDepartment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backgroundColor: 'var(--color-surface-1)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-noir-600)',
                padding: 'var(--spacing-xl)',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--color-fg-primary)',
                      margin: 0,
                    }}
                  >
                    {selectedDepartment.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-fg-muted)',
                      margin: '4px 0 0 0',
                    }}
                  >
                    Employee breakdown
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDepartment(null)}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-noir-600)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    color: 'var(--color-fg-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
                    e.currentTarget.style.borderColor = 'var(--color-noir-500)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
                    e.currentTarget.style.borderColor = 'var(--color-noir-600)';
                  }}
                >
                  Close
                </button>
              </div>

              {/* Department Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-xl)',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-fg-muted)', marginBottom: '4px' }}>
                    Employees
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-fg-primary)' }}>
                    {selectedDepartment.employeeCount}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-fg-muted)', marginBottom: '4px' }}>
                    Risk Score
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: getRiskColor(getOverallRisk(selectedDepartment)),
                    }}
                  >
                    {getOverallRisk(selectedDepartment).toFixed(0)}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-fg-muted)', marginBottom: '4px' }}>
                    Training
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'var(--color-success)',
                    }}
                  >
                    {selectedDepartment.trainingCompletion}%
                  </div>
                </div>
              </div>

              {/* Stub Employee List */}
              <div>
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-fg-secondary)',
                    marginBottom: 'var(--spacing-md)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  High-Risk Employees
                </h4>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                    color: 'var(--color-fg-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  Employee drill-down view
                  <div
                    style={{
                      marginTop: 'var(--spacing-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--color-noir-500)',
                    }}
                  >
                    (Backend integration required)
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DepartmentRiskHeatmap;
