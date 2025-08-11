# 🌿 Git Workflow & Branching Strategy

## 🎯 **Overview**

This document outlines the Git branching strategy and workflow for the Sci-Paper RAG system development. Our strategy follows the **Git Flow** methodology, adapted for a modern development team with continuous integration and deployment.

## 🏗️ **Branch Structure**

```
main (production)
├── develop (integration)
│   ├── feature/pdf-processing-pipeline
│   ├── feature/user-authentication
│   ├── feature/rag-chat-implementation
│   ├── feature/real-time-updates
│   ├── feature/widget-system
│   └── hotfix/critical-bug-fixes
```

## 📋 **Branch Types & Purposes**

### **1. Main Branch (`main`)**
- **Purpose**: Production-ready, stable code
- **Protection Level**: Maximum protection
- **Merging**: Only from `develop` or `hotfix/*` branches
- **Deployment**: Automatic production deployment
- **Naming**: `main` (or `master`)

### **2. Development Branch (`develop`)**
- **Purpose**: Integration branch for completed features
- **Protection Level**: High protection
- **Merging**: Features are merged here when complete
- **Deployment**: Staging environment (optional)
- **Naming**: `develop`

### **3. Feature Branches (`feature/*`)**
- **Purpose**: Develop specific features in isolation
- **Creation**: Always from `develop`
- **Merging**: Back to `develop` when complete
- **Lifecycle**: Short-lived (1-2 weeks maximum)
- **Naming Convention**: `feature/descriptive-name`

### **4. Hotfix Branches (`hotfix/*`)**
- **Purpose**: Fix critical production bugs
- **Creation**: From `main` (when production has issues)
- **Merging**: To both `main` and `develop`
- **Lifecycle**: Very short-lived (hours to 1 day)
- **Naming Convention**: `hotfix/critical-issue-description`

## 🚀 **Development Workflow**

### **Feature Development Cycle**

#### **Step 1: Create Feature Branch**
```bash
# Ensure we're on develop and up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/feature-name

# Push the new branch to remote
git push -u origin feature/feature-name
```

#### **Step 2: Daily Development Workflow**
```bash
# Morning: Start work
git checkout feature/feature-name
git pull origin feature/feature-name

# During development: Regular commits
git add .
git commit -m "feat: Add specific functionality

- Implement core feature
- Add error handling
- Include unit tests"

git push origin feature/feature-name
```

#### **Step 3: Feature Completion & Merge**
```bash
# When feature is complete, merge to develop
git checkout develop
git pull origin develop
git merge feature/feature-name

# Push updated develop
git push origin develop

# Delete feature branch (optional)
git branch -d feature/feature-name
git push origin --delete feature/feature-name
```

### **Production Release Cycle**

#### **Step 1: Prepare Release**
```bash
# Ensure develop is stable and tested
git checkout develop
git pull origin develop

# Create release branch (if needed for complex releases)
git checkout -b release/v1.0.0
```

#### **Step 2: Merge to Main**
```bash
# Merge to main for production
git checkout main
git pull origin main
git merge develop

# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main
git push origin --tags
```

#### **Step 3: Update Develop**
```bash
# Merge back to develop to include any hotfixes
git checkout develop
git merge main
git push origin develop
```

### **Hotfix Workflow**

#### **Step 1: Create Hotfix Branch**
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix
```

#### **Step 2: Fix and Deploy**
```bash
# Make the fix
git add .
git commit -m "fix: Critical security vulnerability

- Patch authentication bypass
- Add input validation
- Update dependencies"

# Merge to main and deploy
git checkout main
git merge hotfix/critical-security-fix
git push origin main
```

#### **Step 3: Update Develop**
```bash
# Merge hotfix to develop
git checkout develop
git merge hotfix/critical-security-fix
git push origin develop

# Clean up
git branch -d hotfix/critical-security-fix
```

## 📝 **Commit Message Standards**

### **Conventional Commits Format**
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### **Commit Types**
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### **Examples**
```bash
git commit -m "feat(auth): Add JWT token validation

- Implement token verification middleware
- Add refresh token functionality
- Include comprehensive error handling

Closes #123"

git commit -m "fix(api): Resolve PDF upload timeout issue

- Increase timeout limits
- Add progress indicators
- Improve error messages"

git commit -m "docs(api): Update API endpoint documentation

- Add request/response examples
- Include error code descriptions
- Update authentication requirements"
```

## 🛡️ **Branch Protection Rules**

### **Develop Branch Protection**
```yaml
# GitHub branch protection settings
develop:
  required_status_checks:
    strict: true
    contexts: ['ci/tests', 'ci/build']
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: false
  enforce_admins: false
  restrictions: null
  allow_force_pushes: false
  allow_deletions: false
```

### **Main Branch Protection**
```yaml
main:
  required_status_checks:
    strict: true
    contexts: ['ci/tests', 'ci/build', 'ci/deploy']
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  enforce_admins: true
  restrictions: null
  allow_force_pushes: false
  allow_deletions: false
```

## 🧹 **Branch Management**

### **Cleanup Commands**
```bash
# View branch structure
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

# Clean up merged branches
git branch --merged | grep -v '\*\|main\|develop' | xargs -n 1 git branch -d

# Show remote branches
git branch -r

# Delete remote branch
git push origin --delete feature/old-feature
```

### **Useful Git Aliases**
```bash
# Add to .gitconfig
[alias]
  # View branch structure
  tree = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
  
  # Clean up merged branches
  cleanup = "!git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d"
  
  # Show current branch status
  status-branch = "!git for-each-ref --format='%(refname:short) %(upstream:short)' refs/heads | grep -v 'main develop'"
  
  # Show recent commits
  recent = log --oneline -10
  
  # Show staged changes
  staged = diff --cached
```

## 📊 **Feature Development Timeline**

### **Current Features in Development**
1. **PDF Processing Pipeline** (`feature/pdf-processing-pipeline`)
   - **Scope**: Complete PDF upload → processing → embedding → storage
   - **Estimated Duration**: 2-3 weeks
   - **Status**: Planning phase

2. **User Authentication** (`feature/user-authentication`)
   - **Scope**: Complete user management system
   - **Estimated Duration**: 1-2 weeks
   - **Status**: Not started

3. **RAG Chat Implementation** (`feature/rag-chat-implementation`)
   - **Scope**: Complete RAG chat functionality
   - **Estimated Duration**: 2 weeks
   - **Status**: Not started

### **Future Features**
4. **Real-time Updates** (`feature/real-time-updates`)
5. **Widget System** (`feature/widget-system`)
6. **Analytics Dashboard** (`feature/analytics-dashboard`)
7. **Multi-language Support** (`feature/multi-language`)

## 🚨 **Emergency Procedures**

### **Critical Bug in Production**
1. Create hotfix branch from main
2. Fix the issue
3. Test thoroughly
4. Merge to main and deploy
5. Merge to develop
6. Document the incident

### **Broken Develop Branch**
1. Identify the problematic commit
2. Revert the commit on develop
3. Fix the issue in a new feature branch
4. Test the fix
5. Merge back to develop

### **Data Loss Prevention**
1. Regular backups of main branch
2. Tag all releases
3. Document all hotfixes
4. Maintain changelog

## 📚 **Best Practices**

### **Do's**
- ✅ Create feature branches for all new work
- ✅ Use descriptive branch names
- ✅ Write clear commit messages
- ✅ Pull latest changes before starting work
- ✅ Test features before merging to develop
- ✅ Keep feature branches short-lived
- ✅ Use pull requests for code review

### **Don'ts**
- ❌ Commit directly to main or develop
- ❌ Work on multiple features in one branch
- ❌ Merge incomplete features
- ❌ Force push to protected branches
- ❌ Delete branches without merging
- ❌ Ignore merge conflicts

## 🔄 **Integration with CI/CD**

### **Automated Checks**
- **Tests**: All tests must pass
- **Build**: Application must build successfully
- **Linting**: Code must pass style checks
- **Security**: Security scans must pass
- **Coverage**: Test coverage requirements met

### **Deployment Pipeline**
1. **Feature Branch**: Automated testing
2. **Develop**: Staging deployment
3. **Main**: Production deployment

## 📞 **Getting Help**

### **Common Issues**
- **Merge Conflicts**: Use `git status` and resolve manually
- **Branch Protection**: Contact repository administrators
- **Permission Issues**: Check GitHub organization settings

### **Resources**
- [Git Flow Documentation](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)

---

**📅 Last Updated**: December 2024  
**👥 Maintained By**: Development Team  
**📚 Version**: 1.0.0  
**🎯 Status**: Active Implementation
