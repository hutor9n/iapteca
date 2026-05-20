type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event?: string;
  [key: string]: unknown;
}

class Logger {
  private maskPII(data: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...data };

    // PII-01: Password masking
    if (masked.password) masked.password = '***';


    // PII-02: Email masking
    if (typeof masked.email === 'string') {
      const parts = masked.email.split('@');
      if (parts.length === 2)
        masked.email = `${parts[0].charAt(0)}***@${parts[1]}`;
    }

    // PII-03: Phone masking
    if (typeof masked.phone === 'string') {
      if (masked.phone.length >= 10)
        masked.phone = `${masked.phone.substring(0, 5)}****${masked.phone.substring(masked.phone.length - 3)}`;
    }

    return masked;
  }

  private log(level: LogLevel, event: string, data: Record<string, unknown> = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...this.maskPII(data),
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'DEBUG':
        console.debug(output);
        break;
      case 'INFO':
        console.info(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        break;
    }
  }

  debug(event: string, data?: Record<string, unknown>) {
    this.log('DEBUG', event, data);
  }

  info(event: string, data?: Record<string, unknown>) {
    this.log('INFO', event, data);
  }

  warn(event: string, data?: Record<string, unknown>) {
    this.log('WARN', event, data);
  }

  error(event: string, data?: Record<string, unknown>) {
    this.log('ERROR', event, data);
  }
}

export const logger = new Logger();
