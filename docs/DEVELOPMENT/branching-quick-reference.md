# 🚀 Branching Strategy Quick Reference

## 📋 **Quick Commands**

### **Create Feature Branch**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/feature-name
git push -u origin feature/feature-name
```

### **Daily Workflow**
```bash
git checkout feature/feature-name
git pull origin feature/feature-name
# ... work on feature ...
git add .
git commit -m "feat: Add functionality"
git push origin feature/feature-name
```

### **Complete Feature**
```bash
git checkout develop
git pull origin develop
git merge feature/feature-name
git push origin develop
git branch -d feature/feature-name
```

## 🌿 **Branch Types**

| Branch | Purpose | Protection | Lifecycle |
|--------|---------|------------|-----------|
| `main` | Production | Maximum | Stable releases |
| `develop` | Integration | High | Feature integration |
| `feature/*` | Features | None | 1-2 weeks |
| `hotfix/*` | Critical fixes | None | Hours to 1 day |

## 📝 **Commit Message Format**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🛡️ **Branch Protection Rules**

### **Develop Branch**
- ✅ Required status checks
- ✅ 1 review required
- ✅ No force pushes
- ✅ No deletions

### **Main Branch**
- ✅ Required status checks
- ✅ 2 reviews required
- ✅ Admin enforcement
- ✅ No force pushes
- ✅ No deletions

## 📊 **Current Features**

1. **`feature/pdf-processing-pipeline`** - PDF upload → processing → embeddings
2. **`feature/user-authentication`** - User management system
3. **`feature/rag-chat-implementation`** - RAG chat functionality

## 🚨 **Emergency Procedures**

### **Critical Bug**
```bash
git checkout main
git checkout -b hotfix/critical-fix
# ... fix the issue ...
git checkout main
git merge hotfix/critical-fix
git checkout develop
git merge hotfix/critical-fix
```

### **Broken Develop**
```bash
git checkout develop
git revert <commit-hash>
# ... fix in feature branch ...
# ... merge back to develop ...
```

---

**📚 Full Documentation**: [Git Workflow](./git-workflow.md)  
**📅 Last Updated**: December 2024
