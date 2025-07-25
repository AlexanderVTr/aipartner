# 🚀 Release Process

## Overview

This document describes the release process for the AISHA project.

## Versioning Strategy

We use [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

## Release Types

### 🔥 Patch Release (Bug fixes)

```bash
pnpm release:patch
```

### ✨ Minor Release (New features)

```bash
pnpm release:minor
```

### 💥 Major Release (Breaking changes)

```bash
pnpm release:major
```

### 🎯 Automatic Release (Conventional Commits)

```bash
pnpm release
```

## Release Process

### 1. Prepare Release

1. **Create release branch**:

   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Update dependencies** (if needed):

   ```bash
   pnpm update --latest
   ```

3. **Run tests**:
   ```bash
   pnpm lint
   pnpm build
   ```

### 2. Generate Release

1. **Dry run** to preview changes:

   ```bash
   pnpm release:dry
   ```

2. **Create release**:

   ```bash
   pnpm release
   ```

   This will:

   - Update version in `package.json`
   - Generate `CHANGELOG.md`
   - Create git tag
   - Commit changes

### 3. Push and Deploy

1. **Push to repository**:

   ```bash
   git push --follow-tags origin main
   ```

2. **Automated processes**:
   - **Vercel**: Deploys to production automatically
   - **GitHub Actions**: Creates GitHub release with notes

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semi colons, etc
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding tests
- `build`: Build system changes
- `ci`: CI/CD changes

### Examples

```bash
feat(chat): add voice input functionality
fix(auth): resolve token refresh issue
docs: update API documentation
refactor(ui): improve button component structure
```

## Database Migrations

### Supabase Migrations

1. **Create migration**:

   ```bash
   supabase migration new feature_name
   ```

2. **Test locally**:

   ```bash
   supabase db reset
   ```

3. **Deploy to production**:
   ```bash
   supabase db push
   ```

### Migration Versioning

Migrations are versioned by timestamp:

- `20250109120000_feature_name.sql`
- Include in release notes
- Document breaking changes

## Hotfix Process

For critical bug fixes in production:

1. **Create hotfix branch** from main:

   ```bash
   git checkout -b hotfix/v1.2.1 main
   ```

2. **Fix the issue**:

   ```bash
   git commit -m "fix: critical security vulnerability"
   ```

3. **Create patch release**:

   ```bash
   pnpm release:patch
   ```

4. **Push and deploy**:
   ```bash
   git push --follow-tags origin main
   ```

## Release Checklist

### Pre-release

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Database migrations tested
- [ ] Security review completed

### Release

- [ ] Version bumped correctly
- [ ] CHANGELOG.md updated
- [ ] Git tag created
- [ ] GitHub release created

### Post-release

- [ ] Production deployment verified
- [ ] Monitoring dashboards checked
- [ ] User communication sent (if needed)
- [ ] Team notified

## Rollback Strategy

If issues are discovered after release:

1. **Quick fix**: Deploy hotfix
2. **Major issues**: Rollback to previous version
3. **Database issues**: Restore from backup

```bash
# Rollback example
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0
git revert --mainline 1 <merge-commit>
```

## Communication

### Internal

- Release announcements in team chat
- Technical details in engineering channel

### External

- Release notes on GitHub
- User-facing changelog on website
- Email notifications for breaking changes

## Monitoring

Post-release monitoring includes:

- Error rates
- Performance metrics
- User feedback
- Database health
- API response times

Monitor for 24-48 hours after major releases.
