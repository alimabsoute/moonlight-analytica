# Deployment Checklist & Validation Guide

## Pre-Deployment Validation (MUST COMPLETE BEFORE ANY DEPLOYMENT)

### ✅ Environment Setup Validation
- [ ] All required environment variables are set and valid
- [ ] API keys tested and have proper permissions  
- [ ] Database connections verified from target environment
- [ ] Domain and DNS configuration confirmed
- [ ] SSL certificates valid and properly configured

### ✅ Code Quality & Testing
- [ ] All unit tests passing (`npm run test`)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] Performance tests within acceptable limits (`npm run test:performance`)
- [ ] Security scans completed with no critical issues
- [ ] Code review completed and approved

### ✅ Dependency & Build Validation
- [ ] Package-lock.json committed and up to date
- [ ] Build succeeds in clean environment (`npm run build`)
- [ ] All dependencies have known good versions
- [ ] No conflicting peer dependencies
- [ ] Node.js version matches production environment

### ✅ Configuration Verification
- [ ] Environment-specific configuration files validated
- [ ] All feature flags properly configured
- [ ] Rate limiting and quotas configured appropriately
- [ ] Monitoring and alerting endpoints configured
- [ ] Backup systems tested and verified

## Staging Deployment Process

### Step 1: Deploy to Staging
```bash
# Run full validation suite
npm run validate:all

# Deploy to staging environment
npm run deploy:staging

# Verify staging deployment
npm run test:staging
```

### Step 2: Staging Validation
- [ ] All pages load correctly
- [ ] API endpoints responding properly
- [ ] Database operations working
- [ ] Content generation pipeline functional
- [ ] Social media integrations working
- [ ] Email systems operational

### Step 3: Performance Testing
- [ ] Page load times under 3 seconds
- [ ] API response times under 500ms
- [ ] Memory usage within acceptable limits
- [ ] No memory leaks detected
- [ ] Database queries optimized

## Production Deployment Process

### Pre-Production Checklist
- [ ] Staging environment fully validated
- [ ] Database backup completed
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboards prepared
- [ ] Team notified of deployment window

### Deployment Steps
```bash
# Final validation
npm run validate:production

# Create backup
npm run backup:all

# Deploy with zero-downtime strategy
npm run deploy:production

# Immediate post-deployment validation
npm run test:smoke:production
```

### Post-Deployment Monitoring
- [ ] Error rates remain below baseline
- [ ] Response times within acceptable limits
- [ ] All automation systems functioning
- [ ] User flows working correctly
- [ ] No critical alerts triggered

## Emergency Rollback Procedures

### Immediate Rollback (< 5 minutes)
```bash
# Revert to previous deployment
vercel rollback

# Or manual rollback
git revert HEAD
npm run deploy:production --force
```

### Full System Recovery (< 30 minutes)
```bash
# Restore database from backup
npm run restore:database --backup-id=latest

# Verify system integrity  
npm run validate:all

# Resume automation systems
npm run start:automation
```

## Common Deployment Issues & Solutions

### Issue: "Cannot connect to database"
**Symptoms**: Application fails to start, database errors in logs
**Solution**: 
1. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
2. Check Supabase project is active and not paused
3. Verify database hasn't exceeded resource limits
4. Test connection with `npm run test:db`

### Issue: "API key invalid or expired"  
**Symptoms**: 401/403 errors from external APIs
**Solution**:
1. Verify API keys in environment variables
2. Check API key permissions and quotas
3. Regenerate keys if necessary
4. Update environment configuration

### Issue: "Build fails with dependency errors"
**Symptoms**: npm install or build process fails
**Solution**:
1. Delete node_modules and package-lock.json
2. Run `npm install` with exact versions
3. Check for peer dependency conflicts
4. Verify Node.js version matches requirements

### Issue: "CORS errors in production"
**Symptoms**: Frontend can't access API endpoints
**Solution**:
1. Verify domain configuration in Vercel
2. Check CORS headers are properly set
3. Ensure API endpoints use correct domains
4. Test from multiple locations/browsers

### Issue: "Environment variables not loading"
**Symptoms**: undefined environment variables in production
**Solution**:
1. Verify variables are set in Vercel dashboard
2. Check variable names match exactly
3. Ensure secrets are properly encrypted
4. Test with simple endpoint that returns env vars

## Monitoring & Alert Setup

### Critical Alerts (Immediate Response Required)
- Application completely down (HTTP 5xx errors > 50%)
- Database connection failures
- Critical automation failures
- Security incidents or breaches

### Warning Alerts (Response Within 1 Hour)  
- Performance degradation (page load > 5 seconds)
- API rate limit warnings (> 80% quota used)
- High error rates (HTTP 4xx errors > 10%)
- Background job failures

### Info Alerts (Daily Review)
- Performance metrics summary
- Content generation statistics
- Social media engagement metrics
- Email campaign performance

## Success Criteria

### Deployment Considered Successful When:
- [ ] All critical user flows working
- [ ] Error rates below 1%
- [ ] Page load times under 3 seconds
- [ ] All automation systems running
- [ ] No critical alerts triggered
- [ ] 24 hours of stable operation

### Quality Gates (Must Pass Before Production)
- [ ] 99.9% test coverage for critical paths
- [ ] Zero critical security vulnerabilities
- [ ] Performance within 10% of baseline
- [ ] All external integrations validated
- [ ] Documentation updated and reviewed

## Post-Deployment Tasks

### Immediate (Within 1 Hour)
- [ ] Monitor error rates and performance
- [ ] Verify automation systems running
- [ ] Check social media posting working
- [ ] Test email system functionality
- [ ] Update team on deployment status

### Within 24 Hours
- [ ] Review performance metrics
- [ ] Analyze user feedback and issues
- [ ] Update monitoring thresholds if needed
- [ ] Document any lessons learned
- [ ] Plan next deployment improvements

### Within 1 Week  
- [ ] Conduct post-deployment review
- [ ] Update deployment documentation
- [ ] Optimize any performance issues found
- [ ] Plan next feature releases
- [ ] Update team processes based on experience

## Emergency Contacts & Resources

### Internal Team
- **Primary Developer**: Available 24/7 during deployment window
- **Backup Developer**: On-call for critical issues
- **Project Owner**: For business decision escalation

### External Services
- **Vercel Support**: For hosting and deployment issues
- **Supabase Support**: For database and backend issues  
- **Anthropic Support**: For Claude AI API issues
- **OpenAI Support**: For ChatGPT API issues

### Monitoring Dashboards
- **Application Health**: [Dashboard URL]
- **Database Metrics**: [Supabase Dashboard]
- **Performance Monitoring**: [Vercel Analytics]
- **Error Tracking**: [Sentry Dashboard]

## Deployment Approval Matrix

### Development → Staging
- **Required**: Code review, unit tests passing
- **Approver**: Lead developer or project owner

### Staging → Production  
- **Required**: All staging tests passing, performance validation
- **Approver**: Project owner + technical lead sign-off
- **Window**: Tuesday-Thursday, 9 AM - 3 PM EST (avoid Mondays/Fridays)

### Emergency Production Fixes
- **Required**: Critical issue documented, rollback plan ready
- **Approver**: Any senior developer + project owner notification
- **Window**: Any time, but immediate post-deployment monitoring required

---

*This checklist should be completed for every deployment. Keep this document updated as we learn from each deployment experience.*