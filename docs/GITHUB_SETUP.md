# GitHub Integration Setup Guide

This guide will help you set up GitHub integration for your SkillSwap project.

## 🚀 Step 1: Create GitHub Repository

### Option A: Create Repository via GitHub Website
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `skillswap` or `skillswap-platform`
   - **Description**: `A modern skill exchange platform built with React and Node.js`
   - **Visibility**: Choose Public or Private
   - **Initialize**: Do NOT check "Add a README file" (we already have one)
   - **Add .gitignore**: Do NOT check this (we already have one)
   - **Choose a license**: Do NOT check this (we already have one)
5. Click "Create repository"

### Option B: Create Repository via GitHub CLI (if installed)
```bash
gh repo create skillswap --public --description "A modern skill exchange platform built with React and Node.js"
```

## 🔗 Step 2: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Run these commands in your project directory:

```bash
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/skillswap.git

# Rename the default branch to main (if not already)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## 📋 Step 3: Repository Settings

### Enable Issues and Projects
1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Features" section
4. Enable:
   - ✅ Issues
   - ✅ Projects
   - ✅ Wiki (optional)
   - ✅ Discussions (optional)

### Set Up Branch Protection
1. In repository Settings, go to "Branches"
2. Click "Add rule"
3. Configure:
   - **Branch name pattern**: `main`
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

## 🏷️ Step 4: Create Issue Templates

Create `.github/ISSUE_TEMPLATE/` directory and add templates:

### Bug Report Template
Create `.github/ISSUE_TEMPLATE/bug_report.md`:
```markdown
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows, macOS, Linux]
 - Browser: [e.g. Chrome, Firefox, Safari]
 - Version: [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

### Feature Request Template
Create `.github/ISSUE_TEMPLATE/feature_request.md`:
```markdown
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 🔄 Step 5: Set Up GitHub Actions (CI/CD)

Create `.github/workflows/` directory and add workflow files:

### Frontend CI/CD
Create `.github/workflows/frontend.yml`:
```yaml
name: Frontend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths: [ 'Frontend/**' ]
  pull_request:
    branches: [ main ]
    paths: [ 'Frontend/**' ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: Frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd Frontend
        npm ci
    
    - name: Run tests
      run: |
        cd Frontend
        npm test -- --coverage --watchAll=false
    
    - name: Build
      run: |
        cd Frontend
        npm run build
    
    - name: Deploy to Vercel
      if: github.ref == 'refs/heads/main'
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./Frontend
```

### Backend CI/CD
Create `.github/workflows/backend.yml`:
```yaml
name: Backend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths: [ 'Backend/**' ]
  pull_request:
    branches: [ main ]
    paths: [ 'Backend/**' ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: Backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd Backend
        npm ci
    
    - name: Run tests
      run: |
        cd Backend
        npm test
      env:
        MONGO_URI: mongodb://localhost:27017/skillswap_test
        JWT_SECRET: test_secret
    
    - name: Deploy to Railway
      if: github.ref == 'refs/heads/main'
      uses: railway-app/railway-deploy@v1
      with:
        railway-token: ${{ secrets.RAILWAY_TOKEN }}
        service: backend
```

## 📊 Step 6: Set Up Project Management

### Create Project Board
1. Go to your repository on GitHub
2. Click on "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name it "SkillSwap Development"
6. Add columns:
   - 📋 Backlog
   - 🔄 In Progress
   - 👀 Review
   - ✅ Done

### Create Milestones
1. Go to "Issues" → "Milestones"
2. Create milestones:
   - **v1.0.0 - MVP** (Core features)
   - **v1.1.0 - Enhanced UX** (UI improvements)
   - **v1.2.0 - Advanced Features** (Video calls, etc.)

## 🔐 Step 7: Set Up Secrets

Go to repository Settings → Secrets and variables → Actions, and add:

### Frontend Secrets
- `VERCEL_TOKEN`: Your Vercel API token
- `ORG_ID`: Vercel organization ID
- `PROJECT_ID`: Vercel project ID

### Backend Secrets
- `RAILWAY_TOKEN`: Railway deployment token
- `MONGO_URI`: Production MongoDB URI
- `JWT_SECRET`: Production JWT secret

## 📝 Step 8: Create Pull Request Template

Create `.github/pull_request_template.md`:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Add any additional notes about the changes here.
```

## 🚀 Step 9: Initial Repository Setup Commands

Run these commands to complete the setup:

```bash
# Create issue templates directory
mkdir -p .github/ISSUE_TEMPLATE

# Create workflows directory
mkdir -p .github/workflows

# Add and commit the new files
git add .github/
git commit -m "feat: add GitHub templates and workflows"

# Push to GitHub
git push origin main
```

## 📚 Step 10: Documentation

### Update README
Make sure your README.md includes:
- ✅ Project description
- ✅ Installation instructions
- ✅ Usage examples
- ✅ Contributing guidelines
- ✅ License information

### Add Badges
Add these badges to your README.md:
```markdown
![GitHub last commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/skillswap)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/skillswap)
![GitHub pull requests](https://img.shields.io/github/issues-pr/YOUR_USERNAME/skillswap)
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/skillswap)
```

## 🎉 You're All Set!

Your SkillSwap project is now fully integrated with GitHub! You can:

- ✅ Track issues and feature requests
- ✅ Manage development with project boards
- ✅ Automate testing and deployment
- ✅ Collaborate with other developers
- ✅ Maintain code quality with PR reviews

## 🔄 Daily Workflow

### For New Features:
1. Create a new branch: `git checkout -b feature/feature-name`
2. Make your changes
3. Commit: `git commit -m "feat: add feature-name"`
4. Push: `git push origin feature/feature-name`
5. Create a Pull Request on GitHub
6. Request reviews and merge when approved

### For Bug Fixes:
1. Create a new branch: `git checkout -b fix/bug-description`
2. Fix the bug
3. Commit: `git commit -m "fix: resolve bug-description"`
4. Push and create PR

## 📞 Need Help?

- Check GitHub documentation: https://docs.github.com/
- Join GitHub Community: https://github.community/
- SkillSwap Discussions: Use the Discussions tab in your repository

---

**Happy coding! 🚀**
