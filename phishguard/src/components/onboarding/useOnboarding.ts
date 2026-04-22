import { useState, useCallback, useEffect } from 'react'

export interface CompanyData {
  name: string
  domain: string
  size: string
  industry: string
}

export interface UserImport {
  email: string
  name: string
  role: string
  department: string
}

export interface DomainConfig {
  domain: string
  verified: boolean
  spf: boolean
  dkim: boolean
  dmarc: boolean
}

export interface OnboardingState {
  currentStep: number
  completedSteps: number[]
  company: CompanyData
  users: UserImport[]
  domains: DomainConfig[]
  skipped: boolean
  savedAt: string | null
}

const STORAGE_KEY = 'phishguard_onboarding_draft'

const initialState: OnboardingState = {
  currentStep: 0,
  completedSteps: [],
  company: {
    name: '',
    domain: '',
    size: '',
    industry: '',
  },
  users: [],
  domains: [],
  skipped: false,
  savedAt: null,
}

function loadFromStorage(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as OnboardingState
      return { ...initialState, ...parsed }
    }
  } catch {
    // Ignore storage errors
  }
  return initialState
}

function saveToStorage(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    }))
  } catch {
    // Ignore storage errors
  }
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(loadFromStorage)

  // Auto-save on state change
  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const completeStep = useCallback((step: number) => {
    setState(prev => {
      const completedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step]
      return { ...prev, completedSteps }
    })
  }, [])

  const updateCompany = useCallback((company: Partial<CompanyData>) => {
    setState(prev => ({ ...prev, company: { ...prev.company, ...company } }))
  }, [])

  const updateUsers = useCallback((users: UserImport[]) => {
    setState(prev => ({ ...prev, users }))
  }, [])

  const updateDomains = useCallback((domains: DomainConfig[]) => {
    setState(prev => ({ ...prev, domains }))
  }, [])

  const addDomain = useCallback((domain: string) => {
    setState(prev => ({
      ...prev,
      domains: [...prev.domains, { domain, verified: false, spf: false, dkim: false, dmarc: false }]
    }))
  }, [])

  const removeDomain = useCallback((domain: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.filter(d => d.domain !== domain)
    }))
  }, [])

  const verifyDomain = useCallback((domain: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(d =>
        d.domain === domain ? { ...d, verified: true } : d
      )
    }))
  }, [])

  const skipStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, skipped: true }))
    completeStep(step)
  }, [completeStep])

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
  }, [])

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(initialState)
  }, [])

  const canProceed = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Company info
        return !!state.company.name && !!state.company.domain && !!state.company.size && !!state.company.industry
      case 1: // Users - can skip
        return true
      case 2: // Domains - must be verified if added
        if (state.domains.length === 0) return true
        return state.domains.every(d => d.verified)
      case 3: // Review - can always proceed
        return true
      default:
        return false
    }
  }, [state])

  return {
    state,
    setStep,
    completeStep,
    updateCompany,
    updateUsers,
    updateDomains,
    addDomain,
    removeDomain,
    verifyDomain,
    skipStep,
    nextStep,
    prevStep,
    reset,
    canProceed,
  }
}

export type UseOnboardingReturn = ReturnType<typeof useOnboarding>