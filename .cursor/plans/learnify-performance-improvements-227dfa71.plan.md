<!-- 227dfa71-055e-4029-9231-e2d2a9719ed8 b64b7ade-552a-43d5-92e7-0b9eaf838fc5 -->
# Learnify Platform Improvements Plan

## Problem: Streams Don't Update Without Manual Refresh

**Root Cause:** Homepage uses static revalidation (`revalidate = 30`) and SSE is only connected for viewer counts, not for stream list updates. When new streams go live, they don't appear until page refresh.

## Core Goals

1. **Lightning-fast performance** - Sub-second page loads
2. **Infinite scalability** - Handle thousands of concurrent streams and millions of users
3. **Zero lag** - Real-time updates with no perceived latency
4. **Best-in-class UX** - Smooth, responsive, professional experience

## Implementation Plan - Optimized for Speed & Scale

### Phase 1: Fix Real-Time Stream Updates (Critical - Do First!)

#### 1.1 Add Real-Time Stream List Updates

- Convert homepage stream results from static to real-time using SSE
- Create `useStreamList` hook to subscribe to stream list changes via SSE
- Update `home-results.tsx` to use the real-time hook
- Broadcast `stream.started` and `stream.ended` events to homepage SSE connections
- Files to modify:
  - `src/hooks/use-stream-list.ts` (new)
  - `src/features/stream/components/home-results.tsx`
  - `src/lib/sse.ts` (add broadcast methods)
  - `src/app/(browse)/(home)/page.tsx` (change revalidation strategy)

#### 1.2 Improve SSE Event Broadcasting

- Add category-specific SSE channels for efficient updates
- Broadcast to "all" channel when streams change
- Add debouncing to prevent excessive SSE messages
- Update SSE manager to support wildcard subscriptions

### Phase 2: Database Optimization

#### 2.1 Add Critical Database Indexes

Add to `prisma/schema.prisma`:

```prisma
@@index([category])
@@index([category, isLive, viewerCount])
@@index([category, isLive, updatedAt])
```

#### 2.2 Optimize Follow/Block Indexes

Add composite indexes:

```prisma
@@index([شfollowerId, followingId])
@@index([blockerId, blockedId])
```

#### 2.3 Database Migration Setup

- Create migration script for new indexes
- Add migration documentation
- Test migration rollback strategy

#### 2.4 Connection Pooling Configuration

- Configure Prisma connection pool size
- Add connection timeout settings
- Monitor connection pool metrics

### Phase 3: Scale SSE with Redis Pub/Sub

#### 3.1 Replace In-Memory EventEmitter

- Implement Redis Pub/Sub for SSE events
- Create `RedisSSEAdapter` class
- Support multi-instance deployment
- Files to modify:
  - `src/lib/sse.ts` (add Redis pub/sub)
  - `src/lib/redis.ts` (add pub/sub methods)

#### 3.2 SSE Connection Cleanup

- Add connection timeout detection (5 min idle)
- Implement heartbeat monitoring
- Clean up stale connections automatically
- Add connection metrics tracking

#### 3.3 SSE Memory Leak Prevention

- Implement max connections per stream limit
- Add connection age tracking
- Force reconnection for long-lived connections (>1 hour)

### Phase 4: Cache Strategy Improvements

#### 4.1 Implement Cache Metrics Tracking

Replace placeholder in `redis.ts`:

- Track cache hits/misses with Redis counters
- Calculate hit rate in real-time
- Expose metrics via `/api/performance` endpoint
- Add cache performance dashboard data

#### 4.2 Fix Redis Anti-patterns

- Replace `redisClient.keys()` with `SCAN` in `delPattern`
- Add batch deletion for large keysets
- Implement cursor-based iteration

#### 4.3 Add Cache Warming Strategy

- Warm cache on deployment/restart
- Pre-populate top streams by category
- Schedule background cache refresh jobs

#### 4.4 Configurable TTL Values

- Move TTL to environment variables
- Add different TTL for dev vs production
- Document cache configuration

#### 4.5 Stale-While-Revalidate Pattern

- Return stale cache while fetching fresh data
- Background refresh for frequently accessed data
- Reduce perceived latency

### Phase 5: Input Validation & Type Safety

#### 5.1 Add Zod Schemas

Create validation schemas:

- `src/lib/validations/stream.validation.ts`
- `src/lib/validations/user.validation.ts`
- `src/lib/validations/auth.validation.ts`

#### 5.2 Validate Server Actions

Add Zod validation to:

- `src/server/actions/stream.ts`
- `src/server/actions/follow.ts`
- `src/server/actions/block.ts`
- `src/server/actions/ingress.ts`

#### 5.3 Validate API Endpoints

Add validation middleware for:

- `/api/stream-updates` (POST)
- `/api/webhooks/clerk`
- `/api/webhooks/livekit`

### Phase 6: Security Enhancements

#### 6.1 API Rate Limiting

- Install `@upstash/ratelimit` or implement custom Redis rate limiter
- Add rate limiting middleware
- Protect endpoints: `/api/stream-updates`, `/api/health`, `/api/performance`
- Different limits for authenticated vs anonymous users

#### 6.2 Encrypt Stream Keys

- Add encryption utility using `crypto` module
- Migrate existing stream keys to encrypted format
- Update read/write operations in `stream.service.ts`

#### 6.3 Add Security Headers

Create `src/middleware/security.ts`:

- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

#### 6.4 Webhook Replay Attack Protection

- Store webhook event IDs in Redis with TTL
- Check for duplicate event IDs
- Reject replayed webhooks

#### 6.5 CSRF Protection

- Add CSRF tokens for state-changing operations
- Validate CSRF tokens in server actions

### Phase 7: Performance Optimizations

#### 7.1 Image Optimization

Convert to Next.js Image component:

- `src/components/shared/thumbnail.tsx`
- `src/components/shared/user-avatar.tsx`
- `src/features/stream/components/stream-card.tsx`
- Add responsive sizes and lazy loading

#### 7.2 Code Splitting

- Dynamic imports for feature modules
- Split chat components
- Split stream player components
- Lazy load dashboard features

#### 7.3 Bundle Analysis

- Add `@next/bundle-analyzer`
- Create bundle analysis script
- Document bundle optimization findings

### Phase 8: Testing Infrastructure

#### 8.1 Setup Testing Framework

- Install Vitest for unit tests
- Install Playwright for e2e tests
- Install React Testing Library
- Configure test environment

#### 8.2 Write Critical Tests

Unit tests for:

- `src/lib/redis.ts` (cache operations)
- `src/lib/sse.ts` (event publishing)
- `src/server/services/cache.service.ts`
- Server actions validation

Integration tests for:

- Stream creation and management
- Follow/unfollow flows
- Block functionality

E2E tests for:

- User authentication
- Stream watching
- Homepage stream list updates

#### 8.3 Add Test Coverage Reporting

- Setup coverage thresholds
- Add coverage to CI pipeline

### Phase 9: Documentation & DevOps

#### 9.1 Environment Configuration

Create `.env.example`:

```env
# Database
DATABASE_URL=
# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
# LiveKit
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_WS_URL=
# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
# UploadThing
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

#### 9.2 Update README

- Setup instructions
- Environment variables guide
- Development workflow
- Testing guide
- Deployment checklist

#### 9.3 CI/CD Pipeline

Create `.github/workflows/ci.yml`:

- Run tests on PR
- Lint check
- Type check
- Build verification
- Deploy to staging

#### 9.4 Docker Setup

Create `Dockerfile` and `docker-compose.yml`:

- Multi-stage build
- PostgreSQL container
- Redis container
- Development and production configs

### Phase 10: Monitoring & Observability

#### 10.1 Add Error Tracking

- Install Sentry or similar
- Configure error boundaries to report
- Add performance monitoring
- Track real-time connection failures

#### 10.2 Performance Dashboard

- Extend `/api/performance` with more metrics
- Add database query performance
- Add Redis connection pool stats
- Add SSE connection health

#### 10.3 Alerting

- Setup alerts for critical errors
- Alert on database connection failures
- Alert on Redis failures
- Alert on SSE connection drops

## Success Metrics

1. **Real-time Updates**: New streams appear within 2 seconds without refresh
2. **Performance**: Homepage loads in < 1.5s (p95)
3. **Cache Hit Rate**: > 85% for live streams
4. **Test Coverage**: > 70% for critical paths
5. **Security**: All high-priority vulnerabilities addressed
6. **SSE Scalability**: Support 10,000+ concurrent connections

## Files Summary

**New Files:**

- `src/hooks/use-stream-list.ts`
- `src/lib/validations/stream.validation.ts`
- `src/lib/validations/user.validation.ts`
- `src/lib/validations/auth.validation.ts`
- `src/middleware/security.ts`
- `src/middleware/rate-limit.ts`
- `.env.example`
- `Dockerfile`
- `docker-compose.yml`
- `.github/workflows/ci.yml`
- Test files (multiple)

**Modified Files:**

- `src/lib/sse.ts`
- `src/lib/redis.ts`
- `src/features/stream/components/home-results.tsx`
- `src/app/(browse)/(home)/page.tsx`
- `prisma/schema.prisma`
- `src/server/services/cache.service.ts`
- All server actions
- `next.config.ts`
- `package.json`
- `README.md`

### To-dos

- [ ] Fix real-time stream updates - add SSE hook for stream list and update homepage to show new streams without refresh
- [ ] Add critical database indexes for category, composite queries, and Follow/Block tables
- [ ] Scale SSE with Redis Pub/Sub for multi-instance deployment and add connection cleanup
- [ ] Implement cache metrics tracking, fix SCAN antipattern, add cache warming, and configurable TTL
- [ ] Add Zod validation schemas for all server actions and API endpoints
- [ ] Implement API rate limiting using Redis to prevent abuse
- [ ] Add security headers (CSP, X-Frame-Options, etc.) and encrypt stream keys
- [ ] Convert thumbnail and avatar components to use Next.js Image with lazy loading
- [ ] Setup Vitest, Playwright, and write tests for critical paths (cache, SSE, server actions)
- [ ] Create .env.example, update README with setup instructions, and add deployment guide
- [ ] Create CI/CD pipeline and Docker setup for automated testing and deployment
- [ ] Add error tracking (Sentry), performance monitoring, and alerting for critical failures