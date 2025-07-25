# 🚀 Vercel + Release Integration

## Overview

This document explains how our release system integrates with Vercel deployment.

## 🔄 Deployment Flow

### Development

```bash
feature-branch → PR → Vercel Preview Deploy
```

### Production Release

```bash
main branch → Vercel Production Deploy
release tag → GitHub Release (no additional deploy)
```

## 🎯 Why This Setup?

### ✅ Advantages

- **Single source of truth**: Vercel handles all deployments
- **No conflicts**: GitHub Actions only creates releases
- **Faster deployments**: Vercel's optimized build pipeline
- **Better caching**: Vercel's global CDN and caching
- **Automatic previews**: Every PR gets a preview URL

### ❌ Alternative (Not recommended)

- GitHub Actions deploys → Conflicts with Vercel
- Double deployments → Waste of resources
- Slower build times → No Vercel optimizations

## 📋 Configuration

### Vercel Settings (vercel.json)

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true // Only deploy main branch to production
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": true // Automatic custom domains
  }
}
```

### GitHub Actions (release.yml)

- ✅ Creates GitHub releases
- ✅ Runs tests and builds
- ❌ Does NOT deploy to production
- 🎯 Vercel handles deployment automatically

## 🚦 Release Process

### 1. Development

```bash
git checkout -b feature/new-chat-ui
# ... development work ...
git commit -m "feat(chat): add new UI components"
git push origin feature/new-chat-ui
```

**Result**: Vercel creates preview deployment

### 2. Code Review & Merge

```bash
# After PR approval
git checkout main
git merge feature/new-chat-ui
git push origin main
```

**Result**: Vercel deploys to production

### 3. Release Creation

```bash
pnpm release:minor
git push --follow-tags origin main
```

**Result**:

- GitHub Actions creates release
- Vercel deploys release commit to production
- GitHub release gets created with notes

## 🔧 Vercel Project Settings

### Branch Settings

- **Production Branch**: `main`
- **Preview Branches**: All other branches
- **Ignore Build Step**: Empty (let Vercel handle everything)

### Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Output Directory**: `.next` (automatic)

### Environment Variables

Required in Vercel Dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=xxx
CLERK_SECRET_KEY=xxx
```

## 🚨 Troubleshooting

### Problem: Double Deployments

**Symptoms**: Two deployments for each release
**Solution**: Remove deployment from GitHub Actions

### Problem: Failed Builds

**Symptoms**: Vercel builds fail after release
**Solution**: Check environment variables and dependencies

### Problem: Stale Previews

**Symptoms**: PR previews show old code
**Solution**:

```bash
# Force push to update preview
git push --force-with-lease origin feature-branch
```

## 🔍 Monitoring Deployments

### Vercel Dashboard

- Production deployments: Every main branch push
- Preview deployments: Every PR
- Function logs: Real-time monitoring

### GitHub Actions

- Release creation: Every tag push
- Test results: Every release
- Build artifacts: Stored for debugging

## 📊 Performance Benefits

### Vercel Optimizations

- **Edge Functions**: Faster serverless functions
- **Image Optimization**: Automatic WebP/AVIF conversion
- **CDN**: Global content delivery
- **Caching**: Intelligent cache invalidation

### Build Speed Comparison

- Vercel: ~2-3 minutes (optimized)
- GitHub Actions: ~5-7 minutes (generic)

## 🔄 Migration from GitHub Actions Deploy

If you were using GitHub Actions for deployment:

1. **Remove deployment steps** from `.github/workflows/release.yml`
2. **Add vercel.json** configuration
3. **Configure Vercel project** settings
4. **Test release process** with dry run

## 🎯 Best Practices

### Commit Messages

```bash
# Will trigger minor release
feat(chat): add voice input functionality

# Will trigger patch release
fix(ui): resolve button alignment issue

# Will trigger major release
feat!: migrate to new authentication system

BREAKING CHANGE: old auth tokens are no longer valid
```

### Branch Protection

- Require PR reviews before merging to main
- Require status checks (GitHub Actions tests)
- Require branches to be up to date

### Release Schedule

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Weekly feature releases
- **Major releases**: Monthly with breaking changes

## 🔐 Security Considerations

### Environment Variables

- Never commit secrets to git
- Use Vercel environment variables
- Separate staging/production configs

### Branch Protection

- Protect main branch from direct pushes
- Require signed commits for releases
- Use branch protection rules
