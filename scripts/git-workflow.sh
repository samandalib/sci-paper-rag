#!/bin/bash

# 🌿 Git Workflow Helper Script
# This script provides common Git workflow commands for the Sci-Paper RAG project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show current branch status
show_status() {
    print_status "Current branch: $(git branch --show-current)"
    print_status "Remote tracking: $(git branch -vv | grep '*' | awk '{print $4}')"
    print_status "Last commit: $(git log -1 --oneline)"
}

# Function to create a new feature branch
create_feature() {
    if [ -z "$1" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 create-feature <feature-name>"
        exit 1
    fi
    
    FEATURE_NAME=$1
    print_status "Creating feature branch: feature/$FEATURE_NAME"
    
    # Ensure we're on develop and up to date
    git checkout develop
    git pull origin develop
    
    # Create and push feature branch
    git checkout -b "feature/$FEATURE_NAME"
    git push -u origin "feature/$FEATURE_NAME"
    
    print_success "Feature branch 'feature/$FEATURE_NAME' created and pushed"
}

# Function to complete a feature
complete_feature() {
    if [ -z "$1" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 complete-feature <feature-name>"
        exit 1
    fi
    
    FEATURE_NAME=$1
    print_status "Completing feature: feature/$FEATURE_NAME"
    
    # Ensure we're on the feature branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "feature/$FEATURE_NAME" ]; then
        print_warning "Switching to feature/$FEATURE_NAME"
        git checkout "feature/$FEATURE_NAME"
    fi
    
    # Push any pending changes
    git push origin "feature/$FEATURE_NAME"
    
    # Switch to develop and merge
    git checkout develop
    git pull origin develop
    git merge "feature/$FEATURE_NAME"
    
    # Push updated develop
    git push origin develop
    
    # Clean up feature branch
    git branch -d "feature/$FEATURE_NAME"
    git push origin --delete "feature/$FEATURE_NAME"
    
    print_success "Feature 'feature/$FEATURE_NAME' completed and merged to develop"
}

# Function to create a hotfix
create_hotfix() {
    if [ -z "$1" ]; then
        print_error "Hotfix description is required"
        echo "Usage: $0 create-hotfix <hotfix-description>"
        exit 1
    fi
    
    HOTFIX_DESC=$1
    HOTFIX_NAME=$(echo "$HOTFIX_DESC" | tr ' ' '-')
    
    print_status "Creating hotfix: hotfix/$HOTFIX_NAME"
    
    # Create hotfix from main
    git checkout main
    git pull origin main
    git checkout -b "hotfix/$HOTFIX_NAME"
    git push -u origin "hotfix/$HOTFIX_NAME"
    
    print_success "Hotfix branch 'hotfix/$HOTFIX_NAME' created"
}

# Function to complete a hotfix
complete_hotfix() {
    if [ -z "$1" ]; then
        print_error "Hotfix name is required"
        echo "Usage: $0 complete-hotfix <hotfix-name>"
        exit 1
    fi
    
    HOTFIX_NAME=$1
    print_status "Completing hotfix: hotfix/$HOTFIX_NAME"
    
    # Ensure we're on the hotfix branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "hotfix/$HOTFIX_NAME" ]; then
        print_warning "Switching to hotfix/$HOTFIX_NAME"
        git checkout "hotfix/$HOTFIX_NAME"
    fi
    
    # Push any pending changes
    git push origin "hotfix/$HOTFIX_NAME"
    
    # Merge to main
    git checkout main
    git pull origin main
    git merge "hotfix/$HOTFIX_NAME"
    git push origin main
    
    # Merge to develop
    git checkout develop
    git pull origin develop
    git merge "hotfix/$HOTFIX_NAME"
    git push origin develop
    
    # Clean up hotfix branch
    git branch -d "hotfix/$HOTFIX_NAME"
    git push origin --delete "hotfix/$HOTFIX_NAME"
    
    print_success "Hotfix '$HOTFIX_NAME' completed and merged to main and develop"
}

# Function to show branch tree
show_tree() {
    print_status "Branch structure:"
    git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --all
}

# Function to cleanup merged branches
cleanup_branches() {
    print_status "Cleaning up merged branches..."
    
    # Clean local branches
    MERGED_BRANCHES=$(git branch --merged | grep -v '\*\|main\|develop')
    if [ -n "$MERGED_BRANCHES" ]; then
        echo "$MERGED_BRANCHES" | xargs -n 1 git branch -d
        print_success "Local merged branches cleaned up"
    else
        print_status "No local merged branches to clean up"
    fi
    
    # Show remote branches that might need cleanup
    print_status "Remote branches:"
    git branch -r
}

# Function to show help
show_help() {
    echo "🌿 Git Workflow Helper Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status                    Show current branch status"
    echo "  create-feature <name>     Create a new feature branch"
    echo "  complete-feature <name>   Complete and merge a feature branch"
    echo "  create-hotfix <desc>      Create a new hotfix branch"
    echo "  complete-hotfix <name>    Complete and merge a hotfix branch"
    echo "  tree                      Show branch tree structure"
    echo "  cleanup                   Clean up merged branches"
    echo "  help                      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 create-feature user-authentication"
    echo "  $0 complete-feature pdf-processing-pipeline"
    echo "  $0 create-hotfix critical-security-fix"
    echo "  $0 status"
}

# Main script logic
case "$1" in
    "status")
        show_status
        ;;
    "create-feature")
        create_feature "$2"
        ;;
    "complete-feature")
        complete_feature "$2"
        ;;
    "create-hotfix")
        create_hotfix "$2"
        ;;
    "complete-hotfix")
        complete_hotfix "$2"
        ;;
    "tree")
        show_tree
        ;;
    "cleanup")
        cleanup_branches
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
