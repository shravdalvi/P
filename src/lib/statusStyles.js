export const RISK_STYLES = {
  safe: {
    label: 'Safe',
    text: 'text-teal-600',
    bg: 'bg-teal-600',
    soft: 'bg-teal-50',
    border: 'border-teal-200',
    ring: 'ring-teal-200'
  },
  moderate: {
    label: 'Moderate',
    text: 'text-amber-500',
    bg: 'bg-amber-500',
    soft: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'ring-amber-200'
  },
  high: {
    label: 'High risk',
    text: 'text-red-500',
    bg: 'bg-red-500',
    soft: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-200'
  },
  critical: {
    label: 'Critical',
    text: 'text-red-600',
    bg: 'bg-red-600',
    soft: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-200'
  },
  overcapacity: {
    label: 'Overcapacity',
    text: 'text-red-600',
    bg: 'bg-red-600',
    soft: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-200'
  },
  info: {
    label: 'Info',
    text: 'text-blue-500',
    bg: 'bg-blue-500',
    soft: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'ring-blue-200'
  }
}

export const SEVERITY_STYLES = {
  critical: RISK_STYLES.critical,
  high: RISK_STYLES.high,
  medium: RISK_STYLES.moderate,
  info: RISK_STYLES.info
}
