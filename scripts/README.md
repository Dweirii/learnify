# Scripts Directory

This directory contains all shell scripts used for development, testing, and maintenance of the Learnify application.

## Script Categories

### 🧪 Testing Scripts
- `test-*.sh` - Various testing scripts for different components
- `test-db-updates.sh` - Database update testing
- `test-performance.sh` - Performance testing
- `test-production-features.sh` - Production feature testing
- `test-stream-*.sh` - Stream-related testing scripts

### 🔧 Development Scripts
- `debug-*.sh` - Debugging scripts for various components
- `check-streams.sh` - Stream health checking
- `local-inngest-status.sh` - Local Inngest service status
- `manual-testing-guide.sh` - Manual testing procedures

### 📊 Monitoring & Analytics
- `cache-intelligence-test.sh` - Cache performance testing
- `cache-metrics-test.sh` - Cache metrics collection
- `performance-optimization-summary.sh` - Performance analysis
- `redis-pubsub-test.sh` - Redis pub/sub testing

### 🚀 Production Scripts
- `database-production-check.sh` - Production database health check
- `production-ready-summary.sh` - Production readiness assessment
- `security-hardening-test.sh` - Security testing

### 🔄 Workflow Scripts
- `final-action-plan.sh` - Final deployment action plan
- `inngest-test-summary.sh` - Inngest testing summary
- `stream-test-guide.sh` - Stream testing guide

## Usage

All scripts are executable and can be run from the project root:

```bash
# Make scripts executable (if needed)
chmod +x scripts/*.sh

# Run a specific script
./scripts/test-performance.sh

# Or from the scripts directory
cd scripts
./test-performance.sh
```

## Script Dependencies

Most scripts require:
- Node.js and pnpm
- Docker (for some services)
- Redis (for cache-related scripts)
- Database access (for DB-related scripts)

## Notes

- Scripts are organized by functionality
- Each script includes error handling and logging
- Scripts are designed to be run in development and testing environments
- Production scripts should be reviewed before use in live environments
