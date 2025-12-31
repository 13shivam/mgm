# Contributing to macOS Gateway Monitor

Thank you for your interest in contributing! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/13shivam/ttas/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - macOS version and system info (use "📋 EXPORT" in app)
   - Screenshots if applicable

### Suggesting Features

1. Check existing [Issues](https://github.com/13shivam/ttas/issues) for similar requests
2. Create a new issue with:
   - Clear use case description
   - Why this feature would be useful
   - Proposed implementation (optional)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following our guidelines
4. Write/update tests if applicable
5. Ensure all tests pass: `npm test`
6. Run linter: `npm run lint:fix`
7. Commit with clear messages
8. Push and create a pull request

## Development Guidelines

### Code Style

- Use consistent formatting (run `npm run lint:fix`)
- Keep files under 300 lines
- Add comments for complex logic
- Use meaningful variable names

### Testing

- Maintain 50%+ test coverage
- Add tests for new features
- Run `npm run test:coverage` before submitting

### Commit Messages

- Use clear, descriptive messages
- Start with verb (Add, Fix, Update, Remove)
- Reference issue numbers when applicable

Example:
```
Add network bandwidth tracking feature (#123)
Fix modal flickering in light mode (#124)
Update README with new installation steps
```

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment

## Questions?

Open an issue or discussion for any questions about contributing.

Thank you for making macOS Gateway Monitor better! 🎉
