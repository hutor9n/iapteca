import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

describe('Observability - Logging & Metrics', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear mocks before each test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    metrics.clear();
  });

  // Тест рівня логування - подія ERROR логується з рівнем ERROR, а не INFO
  it('should log ERROR level to console.error', () => {
    logger.error('db.connection_failed', { error_message: 'timeout' });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();

    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logOutput.level).toBe('ERROR');
    expect(logOutput.event).toBe('db.connection_failed');
  });

  // Тест PII - в лог не потрапляє пароль або повний email користувача
  it('should mask PII data in logs', () => {
    logger.info('user.register', {
      email: 'john.doe@gmail.com',
      password: 'MySecretPassword123!',
      phone: '+380501234567'
    });

    const logOutput = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

    expect(logOutput.password).toBe('***');
    expect(logOutput.password).not.toContain('MySecretPassword123!');

    expect(logOutput.email).toBe('j***@gmail.com');
    expect(logOutput.email).not.toContain('john.doe');

    expect(logOutput.phone).toBe('+3805****567');
    expect(logOutput.phone).not.toContain('123');
  });

  // Тест лічильника - після N запитів лічильник запитів дорівнює N
  it('should increment counter correctly', () => {
    const N = 5;
    for (let i = 0; i < N; i++) {
      metrics.incrementCounter('http_requests_total', { method: 'GET' });
    }

    expect(metrics.getCounter('http_requests_total', { method: 'GET' })).toBe(N);
  });

  // Тест gauge - після відкриття сесії значення зростає, після закриття - спадає
  it('should update gauge correctly for active sessions', () => {
    // Open 3 sessions
    metrics.incrementGauge('active_user_sessions');
    metrics.incrementGauge('active_user_sessions');
    metrics.incrementGauge('active_user_sessions');

    expect(metrics.getGauge('active_user_sessions')).toBe(3);

    // Close 1 session
    metrics.decrementGauge('active_user_sessions');

    expect(metrics.getGauge('active_user_sessions')).toBe(2);
  });

  // Тест формату логу - лог містить обов'язкові поля: timestamp, level, event
  it('should include required fields in log format', () => {
    logger.info('user.login');

    // Get the last call to console.info since we share it across tests
    const lastCallArgs = consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
    const logOutput = JSON.parse(lastCallArgs[0]);

    expect(logOutput).toHaveProperty('timestamp');
    expect(new Date(logOutput.timestamp).getTime()).not.toBeNaN(); // Valid date

    expect(logOutput).toHaveProperty('level', 'INFO');
    expect(logOutput).toHaveProperty('event', 'user.login');
  });

  // Тест LOG-10: Пошук медикаментів
  it('should log medications.searched event', () => {
    logger.info('medications.searched', { query: 'paracetamol' });

    const lastCallArgs = consoleInfoSpy.mock.calls[consoleInfoSpy.mock.calls.length - 1];
    const logOutput = JSON.parse(lastCallArgs[0]);

    expect(logOutput.event).toBe('medications.searched');
    expect(logOutput.query).toBe('paracetamol');
  });
});
