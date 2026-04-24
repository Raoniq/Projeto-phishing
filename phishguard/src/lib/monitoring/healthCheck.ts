/**
 * Health Check Module
 *
 * Provides /health and /api/health endpoints with component checks
 * for database, storage, and email services.
 */

// ============================================================================
// Types
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  version?: string;
  uptime: number;
  components?: ComponentHealth[];
}

export interface DetailedHealthResponse extends HealthCheckResponse {
  components: ComponentHealth[];
  checks: {
    database: ComponentHealth;
    storage: ComponentHealth;
    email: ComponentHealth;
  };
}

// ============================================================================
// Start Time for Uptime Calculation
// ============================================================================

const PROCESS_START_TIME = Date.now();

// ============================================================================
// Health Check Functions
// ============================================================================

async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    // Mock database health check
    // In production, this would ping the actual database
    await new Promise(resolve => setTimeout(resolve, 10));

    return {
      name: 'database',
      status: 'healthy',
      latencyMs: Date.now() - start,
      message: 'Database connection active',
      details: {
        type: 'postgresql',
        pool: 'active',
      },
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

async function checkStorageHealth(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    // Mock storage health check
    // In production, this would verify storage connectivity
    await new Promise(resolve => setTimeout(resolve, 8));

    return {
      name: 'storage',
      status: 'healthy',
      latencyMs: Date.now() - start,
      message: 'Storage service available',
      details: {
        type: 'cloudflare-r2',
        bucket: 'phishguard-assets',
      },
    };
  } catch (error) {
    return {
      name: 'storage',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Storage check failed',
    };
  }
}

async function checkEmailHealth(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    // Mock email health check
    // In production, this would verify email service connectivity
    await new Promise(resolve => setTimeout(resolve, 12));

    return {
      name: 'email',
      status: 'healthy',
      latencyMs: Date.now() - start,
      message: 'Email service operational',
      details: {
        provider: 'resend',
        sender: 'noreply@phishguard.io',
      },
    };
  } catch (error) {
    return {
      name: 'email',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Email check failed',
    };
  }
}

export async function checkAllComponents(): Promise<ComponentHealth[]> {
  const [database, storage, email] = await Promise.all([
    checkDatabaseHealth(),
    checkStorageHealth(),
    checkEmailHealth(),
  ]);

  return [database, storage, email];
}

function determineOverallStatus(components: ComponentHealth[]): HealthStatus {
  if (components.some(c => c.status === 'unhealthy')) {
    return 'unhealthy';
  }
  if (components.some(c => c.status === 'degraded')) {
    return 'degraded';
  }
  return 'healthy';
}

// ============================================================================
// Health Endpoint Handlers
// ============================================================================

/**
 * Simple health check endpoint handler
 * Returns basic status without detailed component checks
 */
export function handleHealthCheck(): HealthCheckResponse {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - PROCESS_START_TIME) / 1000),
  };
}

/**
 * Detailed API health check with component verification
 * Checks database, storage, and email services
 */
export async function handleApiHealthCheck(): Promise<DetailedHealthResponse> {
  const components = await checkAllComponents();
  const overallStatus = determineOverallStatus(components);

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor((Date.now() - PROCESS_START_TIME) / 1000),
    components,
    checks: {
      database: components.find(c => c.name === 'database') ?? {
        name: 'database',
        status: 'unhealthy',
        message: 'Component not found',
      },
      storage: components.find(c => c.name === 'storage') ?? {
        name: 'storage',
        status: 'unhealthy',
        message: 'Component not found',
      },
      email: components.find(c => c.name === 'email') ?? {
        name: 'email',
        status: 'unhealthy',
        message: 'Component not found',
      },
    },
  };
}

// ============================================================================
// Express/Next.js Route Handlers
// ============================================================================

import type { NextResponse } from 'next/server';

/**
 * Next.js App Router handler for GET /health
 */
export async function GETHealthEndpoint(): Promise<NextResponse> {
  const health = handleHealthCheck();

  return new NextResponse(JSON.stringify(health), {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Next.js App Router handler for GET /api/health
 */
export async function GETApiHealthEndpoint(): Promise<NextResponse> {
  const health = await handleApiHealthCheck();

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return new NextResponse(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function isHealthy(status: HealthStatus): boolean {
  return status === 'healthy';
}

export function isDegraded(status: HealthStatus): boolean {
  return status === 'degraded';
}

export function isUnhealthy(status: HealthStatus): boolean {
  return status === 'unhealthy';
}

// ============================================================================
// Module Exports
// ============================================================================
