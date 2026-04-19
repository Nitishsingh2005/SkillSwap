# Contributing to SkillSwap

Thank you for your interest in contributing to SkillSwap! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git
- Basic knowledge of React and Node.js

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/skillswap.git`
3. Install dependencies for both frontend and backend
4. Set up environment variables
5. Start development servers

## 📋 How to Contribute

### Reporting Bugs
- Use the GitHub issue tracker
- Include detailed steps to reproduce
- Provide system information (OS, browser, Node.js version)
- Include screenshots if applicable

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its benefits
- Consider implementation complexity
- Discuss with maintainers before starting work

### Code Contributions
1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Follow the coding standards
3. **Test thoroughly**: Ensure your changes work correctly
4. **Commit changes**: Use clear, descriptive commit messages
5. **Push to your fork**: `git push origin feature/your-feature-name`
6. **Create a Pull Request**: Provide a detailed description

## 🎨 Coding Standards

### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety
- Follow the existing component structure
- Use Tailwind CSS for styling
- Keep components small and focused

### Backend (Node.js)
- Use async/await for asynchronous operations
- Follow RESTful API conventions
- Include proper error handling
- Validate all inputs
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### General
- Use meaningful commit messages
- Keep functions small and focused
- Add comments for complex logic
- Follow the existing code style
- Test your changes thoroughly

## 📁 Project Structure

```
SkillSwap/
├── Frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # State management
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
├── Backend/                 # Node.js API
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   └── server.js            # Main server file
└── docs/                    # Documentation
```

## 🧪 Testing

### Frontend Testing
- Test components with React Testing Library
- Test user interactions and state changes
- Ensure responsive design works
- Test accessibility features

### Backend Testing
- Test API endpoints with proper inputs
- Test error handling scenarios
- Test authentication and authorization
- Test database operations

## 📝 Commit Message Format

Use the following format for commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add JWT token refresh functionality
fix(api): resolve user search filtering issue
docs(readme): update installation instructions
```

## 🔄 Pull Request Process

1. **Update your branch**: Rebase on the latest main branch
2. **Test thoroughly**: Ensure all tests pass
3. **Update documentation**: If needed, update relevant docs
4. **Create PR**: Provide a clear title and description
5. **Link issues**: Reference any related issues
6. **Request review**: Ask for code review from maintainers

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear title**: Brief description of the issue
2. **Steps to reproduce**: Detailed steps to recreate the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: OS, browser, Node.js version
6. **Screenshots**: If applicable
7. **Error messages**: Any console errors or logs

## 💡 Feature Requests

When suggesting features:

1. **Clear description**: What the feature should do
2. **Use case**: Why this feature is needed
3. **Implementation ideas**: How it might be implemented
4. **Alternatives**: Other ways to solve the problem
5. **Additional context**: Any other relevant information

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested
- `wontfix`: This will not be worked on

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general questions and ideas
- **Discord**: For real-time chat and support
- **Email**: For private matters

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation
- Community highlights

## 📜 Code of Conduct

Please note that this project follows a Code of Conduct. By participating, you agree to uphold this code.

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 📄 License

By contributing to SkillSwap, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to SkillSwap! 🚀
