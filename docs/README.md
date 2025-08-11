# 📚 Sci-Paper RAG - Documentation Hub

Welcome to the centralized documentation for the Sci-Paper RAG project. This hub organizes all documentation, decisions, and guides in one place for easy navigation and maintenance.

## 🎯 **Documentation Philosophy**

- **Single Source of Truth**: All documentation lives here
- **Decision Tracking**: Document why we made specific choices
- **Living Documents**: Update as we build and learn
- **Clear Navigation**: Easy to find what you need
- **Developer Friendly**: Practical, actionable information

## 📁 **Documentation Structure**

```
docs/
├── 📖 README.md                    # This hub (you are here)
├── 🏗️ ARCHITECTURE/                # System design & architecture
├── 🚀 SETUP/                       # Installation & configuration
├── 🔧 DEVELOPMENT/                 # Development guides & workflows
├── 📋 DECISIONS/                   # Decision records & rationale
├── 📚 API/                         # API documentation & examples
├── 🧪 TESTING/                     # Testing strategies & guides
└── 🚀 DEPLOYMENT/                  # Production deployment guides
```

## 🏗️ **Architecture Documentation**

### **System Overview**
- [**High-Level Architecture**](./ARCHITECTURE/overview.md) - System components and flow
- [**Database Design**](./ARCHITECTURE/database.md) - Schema, relationships, and security
- [**API Design**](./ARCHITECTURE/api.md) - Endpoint structure and patterns
- [**Security Model**](./ARCHITECTURE/security.md) - Authentication, authorization, and data isolation

### **Component Details**
- [**Frontend Architecture**](./ARCHITECTURE/frontend.md) - React components and state management
- [**Backend Services**](./ARCHITECTURE/backend.md) - API services and business logic
- [**Vector Search**](./ARCHITECTURE/vector-search.md) - Embedding and similarity search
- [**Multi-Tenancy**](./ARCHITECTURE/multi-tenancy.md) - User isolation and data separation

## 🚀 **Setup & Configuration**

### **Getting Started**
- [**Quick Start Guide**](./SETUP/quick-start.md) - Get running in 5 minutes
- [**Environment Setup**](./SETUP/environment.md) - Configuration and environment variables
- [**Database Setup**](./SETUP/database.md) - Database initialization and schema
- [**Development Environment**](./SETUP/development.md) - Local development setup

### **Configuration**
- [**Supabase Configuration**](./SETUP/supabase.md) - Project setup and configuration
- [**OpenAI Integration**](./SETUP/openai.md) - API keys and model configuration
- [**Deployment Configuration**](./SETUP/deployment.md) - Production environment setup

## 🔧 **Development Guides**

### **Development Workflow**
- [**Development Setup**](./DEVELOPMENT/setup.md) - Local development environment
- [**Code Standards**](./DEVELOPMENT/standards.md) - Coding conventions and best practices
- [**Git Workflow**](./DEVELOPMENT/git-workflow.md) - Branching strategy and commit conventions
- [**Testing Strategy**](./DEVELOPMENT/testing.md) - Testing approaches and tools

### **Feature Development**
- [**Adding New Features**](./DEVELOPMENT/features.md) - How to implement new functionality
- [**Database Migrations**](./DEVELOPMENT/migrations.md) - Schema changes and updates
- [**API Development**](./DEVELOPMENT/api-development.md) - Building new endpoints
- [**Frontend Development**](./DEVELOPMENT/frontend.md) - React component development

## 📋 **Decision Records**

### **Architecture Decisions**
- [**Multi-Tenant vs Single-Tenant**](./DECISIONS/multi-tenancy.md) - Why we chose multi-tenancy
- [**Database Technology**](./DECISIONS/database-choice.md) - Supabase + pgvector rationale
- [**Authentication Strategy**](./DECISIONS/authentication.md) - Auth approach and reasoning
- [**Vector Search Implementation**](./DECISIONS/vector-search.md) - Embedding and search choices

### **Technology Choices**
- [**Frontend Framework**](./DECISIONS/frontend-framework.md) - Next.js vs alternatives
- [**Styling Solution**](./DECISIONS/styling.md) - Tailwind CSS rationale
- [**API Architecture**](./DECISIONS/api-architecture.md) - REST vs GraphQL decision
- [**Deployment Strategy**](./DECISIONS/deployment.md) - Hosting and deployment choices

## 📚 **API Documentation**

### **Core APIs**
- [**RAG Chat API**](./API/rag-chat.md) - Main chat endpoint documentation
- [**Document Management**](./API/documents.md) - PDF upload and management
- [**User Management**](./API/users.md) - User operations and authentication
- [**Widget Management**](./API/widgets.md) - Embeddable widget configuration

### **API Reference**
- [**Authentication**](./API/authentication.md) - Auth headers and tokens
- [**Error Handling**](./API/errors.md) - Error codes and responses
- [**Rate Limiting**](./API/rate-limiting.md) - API usage limits
- [**Webhooks**](./API/webhooks.md) - Event notifications

## 🧪 **Testing & Quality**

### **Testing Strategy**
- [**Testing Overview**](./TESTING/overview.md) - Testing philosophy and approach
- [**Unit Testing**](./TESTING/unit.md) - Component and function testing
- [**Integration Testing**](./TESTING/integration.md) - API and service testing
- [**End-to-End Testing**](./TESTING/e2e.md) - Full user journey testing

### **Quality Assurance**
- [**Code Review Process**](./TESTING/code-review.md) - Review guidelines and checklist
- [**Performance Testing**](./TESTING/performance.md) - Load and stress testing
- [**Security Testing**](./TESTING/security.md) - Security validation and testing

## 🚀 **Deployment & Operations**

### **Deployment**
- [**Production Deployment**](./DEPLOYMENT/production.md) - Live environment setup
- [**Environment Management**](./DEPLOYMENT/environments.md) - Dev, staging, and production
- [**CI/CD Pipeline**](./DEPLOYMENT/ci-cd.md) - Automated deployment workflow
- [**Monitoring & Logging**](./DEPLOYMENT/monitoring.md) - Production monitoring setup

### **Operations**
- [**Database Maintenance**](./DEPLOYMENT/database-maintenance.md) - Backup, optimization, and monitoring
- [**Performance Optimization**](./DEPLOYMENT/performance.md) - System optimization strategies
- [**Troubleshooting**](./DEPLOYMENT/troubleshooting.md) - Common issues and solutions
- [**Scaling Strategy**](./DEPLOYMENT/scaling.md) - Growth and scaling considerations

## 🔄 **Documentation Maintenance**

### **Update Process**
1. **Document Changes**: Update relevant docs when making changes
2. **Review Regularly**: Monthly review of documentation accuracy
3. **Version Control**: Track documentation changes in git
4. **Feedback Loop**: Collect and incorporate user feedback

### **Documentation Standards**
- **Clear Headings**: Use descriptive, hierarchical headings
- **Code Examples**: Include practical, runnable examples
- **Screenshots**: Visual aids for complex processes
- **Cross-References**: Link between related documents
- **Last Updated**: Include timestamps for freshness

## 📞 **Getting Help**

### **Documentation Issues**
- **Missing Information**: Create an issue with what you need
- **Outdated Content**: Report outdated sections
- **Confusing Sections**: Suggest improvements for clarity

### **Development Questions**
- **Architecture Questions**: Check the ARCHITECTURE section
- **Setup Issues**: Review the SETUP guides
- **API Questions**: Consult the API documentation
- **General Help**: Check the main project README

## 🎯 **Quick Navigation**

### **I'm New Here**
- Start with [**Quick Start Guide**](./SETUP/quick-start.md)
- Then read [**High-Level Architecture**](./ARCHITECTURE/overview.md)

### **I'm Setting Up Development**
- Follow [**Development Setup**](./DEVELOPMENT/setup.md)
- Configure [**Environment Variables**](./SETUP/environment.md)

### **I'm Building Features**
- Review [**Code Standards**](./DEVELOPMENT/standards.md)
- Check [**API Development**](./DEVELOPMENT/api-development.md)

### **I'm Deploying**
- Read [**Production Deployment**](./DEPLOYMENT/production.md)
- Set up [**Monitoring & Logging**](./DEPLOYMENT/monitoring.md)

---

**📝 Last Updated**: December 2024  
**🔗 Project**: [Sci-Paper RAG Repository](../README.md)  
**📚 Version**: 1.0.0  

---

*This documentation hub is maintained by the development team. For questions or suggestions, please create an issue in the project repository.*
