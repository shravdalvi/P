export const RISK_STYLES = {
  safe: {
    label: 'Safe',
    text: 'text-status-safe',
    bg: 'bg-status-safe',
    soft: 'bg-status-safe/10',
    border: 'border-status-safe/30',
    ring: 'ring-status-safe/40'
  },
  moderate: {
    label: 'Moderate',
    text: 'text-status-moderate',
    bg: 'bg-status-moderate',
    soft: 'bg-status-moderate/10',
    border: 'border-status-moderate/30',
    ring: 'ring-status-moderate/40'
  },
  high: {
    label: 'High risk',
    text: 'text-status-high',
    bg: 'bg-status-high',
    soft: 'bg-status-high/10',
    border: 'border-status-high/30',
    ring: 'ring-status-high/40'
  },
  critical: {
    label: 'Critical',
    text: 'text-status-critical',
    bg: 'bg-status-critical',
    soft: 'bg-status-critical/10',
    border: 'border-status-critical/30',
    ring: 'ring-status-critical/40'
  },
  overcapacity: {
    label: 'Overcapacity',
    text: 'text-status-critical',
    bg: 'bg-status-critical',
    soft: 'bg-status-critical/15',
    border: 'border-status-critical/40',
    ring: 'ring-status-critical/50'
  },
  info: {
    label: 'Info',
    text: 'text-status-info',
    bg: 'bg-status-info',
    soft: 'bg-status-info/10',
    border: 'border-status-info/30',
    ring: 'ring-status-info/40'
  }
}

export const SEVERITY_STYLES = {
  critical: RISK_STYLES.critical,
  high: RISK_STYLES.high,
  medium: RISK_STYLES.moderate,
  info: RISK_STYLES.info
}
