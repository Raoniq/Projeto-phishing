import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ROICalculatorProps {
  className?: string;
}

export function ROICalculator({ className }: ROICalculatorProps) {
  const shouldReduceMotion = useReducedMotion();

  // Input state with realistic defaults based on IBM/Ponemon studies
  const [avgSalary, setAvgSalary] = useState(75000);
  const [hoursPerIncident, setHoursPerIncident] = useState(16);
  const [riskReduction, setRiskReduction] = useState(70);
  const [employeesTrained, setEmployeesTrained] = useState(100);
  const [baselineIncidentsPerYear, setBaselineIncidentsPerYear] = useState(4);
  const [trainingCostPerEmployee, setTrainingCostPerEmployee] = useState(100);

  // Derived calculations
  const calculations = useMemo(() => {
    // Hourly rate from annual salary (2080 working hours/year)
    const hourlyRate = avgSalary / 2080;

    // Average incident cost: time spent × hourly rate + remediation costs
    // Remediation costs typically 10-20x the direct incident cost
    const laborCostPerIncident = hoursPerIncident * hourlyRate;
    const directIncidentCost = 5000; // Conservative baseline
    const totalIncidentCost = laborCostPerIncident + directIncidentCost;

    // Training costs
    const totalTrainingCost = employeesTrained * trainingCostPerEmployee;

    // Incidents avoided after training
    const incidentsAvoided = baselineIncidentsPerYear * (riskReduction / 100);

    // Annual savings
    const annualSavings = incidentsAvoided * totalIncidentCost;

    // Net cost saved (positive = money saved, negative = money lost)
    const netSavings = annualSavings - totalTrainingCost;

    // ROI percentage: (net savings / training costs) × 100
    const roiPercentage = totalTrainingCost > 0
      ? ((annualSavings - totalTrainingCost) / totalTrainingCost) * 100
      : 0;

    // Breakeven timeline in months
    const monthlySavings = annualSavings / 12;
    const breakevenMonths = monthlySavings > 0
      ? totalTrainingCost / monthlySavings
      : Infinity;

    // Breakeven timeline in years (for display)
    const breakevenYears = breakevenMonths / 12;

    return {
      hourlyRate,
      totalIncidentCost,
      totalTrainingCost,
      incidentsAvoided,
      annualSavings,
      netSavings,
      roiPercentage,
      breakevenMonths,
      breakevenYears,
      isPositiveROI: netSavings > 0,
    };
  }, [
    avgSalary,
    hoursPerIncident,
    riskReduction,
    employeesTrained,
    baselineIncidentsPerYear,
    trainingCostPerEmployee,
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatMonths = (months: number) => {
    if (!isFinite(months)) return 'Never';
    if (months < 1) return '< 1 month';
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = Math.round(months % 12);
      if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
      return `${years}y ${remainingMonths}m`;
    }
    return `${Math.round(months)} months`;
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-noir-700)',
        padding: 'var(--spacing-xl)',
        maxWidth: '800px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          ROI Calculator
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-fg-muted)',
          }}
        >
          Estimate your organization's phishing training return on investment
        </p>
      </div>

      {/* Two column layout: Inputs | Results */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        {/* Input Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <h3
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Organization Parameters
          </h3>

          {/* Average Salary */}
          <div>
            <label
              htmlFor="avgSalary"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--color-fg-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Average Employee Salary
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-fg-muted)',
                  fontSize: '0.875rem',
                }}
              >
                $
              </span>
              <input
                id="avgSalary"
                type="number"
                value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value) || 0)}
                style={{
                  width: '100%',
                  paddingLeft: '28px',
                  height: '40px',
                  backgroundColor: 'var(--color-noir-800)',
                  border: '1px solid var(--color-noir-700)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-fg-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent)';
                  e.target.style.boxShadow = '0 0 0 2px var(--color-accent-subtle)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-noir-700)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Hours per Incident */}
          <div>
            <label
              htmlFor="hoursPerIncident"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--color-fg-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Hours Spent per Phishing Incident
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="hoursPerIncident"
                type="number"
                value={hoursPerIncident}
                onChange={(e) => setHoursPerIncident(Number(e.target.value) || 0)}
                style={{
                  width: '100%',
                  paddingLeft: '12px',
                  paddingRight: '50px',
                  height: '40px',
                  backgroundColor: 'var(--color-noir-800)',
                  border: '1px solid var(--color-noir-700)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-fg-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent)';
                  e.target.style.boxShadow = '0 0 0 2px var(--color-accent-subtle)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-noir-700)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-fg-muted)',
                  fontSize: '0.75rem',
                }}
              >
                hrs
              </span>
            </div>
          </div>

          {/* Baseline Incidents */}
          <div>
            <label
              htmlFor="baselineIncidents"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--color-fg-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Baseline Phishing Incidents per Year
            </label>
            <input
              id="baselineIncidents"
              type="number"
              value={baselineIncidentsPerYear}
              onChange={(e) => setBaselineIncidentsPerYear(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                paddingLeft: '12px',
                paddingRight: '12px',
                height: '40px',
                backgroundColor: 'var(--color-noir-800)',
                border: '1px solid var(--color-noir-700)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-fg-primary)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent)';
                e.target.style.boxShadow = '0 0 0 2px var(--color-accent-subtle)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-noir-700)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Risk Reduction */}
          <div>
            <label
              htmlFor="riskReduction"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--color-fg-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Expected Risk Reduction: {riskReduction}%
            </label>
            <input
              id="riskReduction"
              type="range"
              min="0"
              max="95"
              value={riskReduction}
              onChange={(e) => setRiskReduction(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--color-noir-700)',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--color-fg-muted)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              <span>0%</span>
              <span>50%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Employees Trained */}
          <div>
            <label
              htmlFor="employeesTrained"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--color-fg-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Number of Employees Trained
            </label>
            <input
              id="employeesTrained"
              type="number"
              value={employeesTrained}
              onChange={(e) => setEmployeesTrained(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                paddingLeft: '12px',
                paddingRight: '12px',
                height: '40px',
                backgroundColor: 'var(--color-noir-800)',
                border: '1px solid var(--color-noir-700)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-fg-primary)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent)';
                e.target.style.boxShadow = '0 0 0 2px var(--color-accent-subtle)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-noir-700)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Training Cost per Employee */}
          <div>
            <label
              htmlFor="trainingCost"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--color-fg-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Training Cost per Employee
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-fg-muted)',
                  fontSize: '0.875rem',
                }}
              >
                $
              </span>
              <input
                id="trainingCost"
                type="number"
                value={trainingCostPerEmployee}
                onChange={(e) => setTrainingCostPerEmployee(Number(e.target.value) || 0)}
                style={{
                  width: '100%',
                  paddingLeft: '28px',
                  height: '40px',
                  backgroundColor: 'var(--color-noir-800)',
                  border: '1px solid var(--color-noir-700)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-fg-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent)';
                  e.target.style.boxShadow = '0 0 0 2px var(--color-accent-subtle)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-noir-700)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-lg)',
            backgroundColor: 'var(--color-noir-900)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            border: '1px solid var(--color-noir-700)',
          }}
        >
          <h3
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Projected Returns
          </h3>

          {/* Main Metric: Net Savings */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-fg-muted)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Annual Net Savings
            </div>
            <motion.div
              key={calculations.netSavings > 0 ? 'positive' : 'negative'}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: calculations.isPositiveROI ? 'var(--color-success)' : 'var(--color-danger)',
                lineHeight: 1,
              }}
            >
              {calculations.netSavings >= 0 ? '+' : ''}
              {formatCurrency(calculations.netSavings)}
            </motion.div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-fg-muted)',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              after training costs
            </div>
          </div>

          {/* Secondary Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-md)',
            }}
          >
            {/* ROI */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-noir-700)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-fg-muted)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                ROI
              </div>
              <motion.div
                key={calculations.roiPercentage}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: calculations.isPositiveROI ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                }}
              >
                {calculations.isPositiveROI ? '+' : ''}
                {formatPercent(calculations.roiPercentage)}
              </motion.div>
            </div>

            {/* Breakeven */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-noir-700)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-fg-muted)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                Breakeven
              </div>
              <motion.div
                key={calculations.breakevenMonths}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: calculations.isPositiveROI ? 'var(--color-fg-primary)' : 'var(--color-fg-muted)',
                }}
              >
                {formatMonths(calculations.breakevenMonths)}
              </motion.div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-noir-700)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-fg-muted)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              Calculation Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-secondary)' }}>
                  Avg. incident cost
                </span>
                <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-fg-primary)' }}>
                  {formatCurrency(calculations.totalIncidentCost)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-secondary)' }}>
                  Incidents avoided/year
                </span>
                <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-fg-primary)' }}>
                  {calculations.incidentsAvoided.toFixed(1)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-secondary)' }}>
                  Annual savings
                </span>
                <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  {formatCurrency(calculations.annualSavings)}
                </span>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--color-noir-700)',
                  paddingTop: 'var(--spacing-sm)',
                  marginTop: 'var(--spacing-xs)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-secondary)' }}>
                  Training investment
                </span>
                <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-danger)' }}>
                  -{formatCurrency(calculations.totalTrainingCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-fg-muted)',
              lineHeight: 1.5,
            }}
          >
            Estimates based on industry benchmarks. Actual results may vary based on organization size, industry, and implementation effectiveness.
          </p>
        </div>
      </div>
    </div>
  );
}
