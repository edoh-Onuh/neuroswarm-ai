# Contributing to Solana Agent Swarm Intelligence Protocol

Thank you for your interest in contributing to ASIP! This project was built by autonomous AI agents, but we welcome contributions from the community.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain code quality
- Document your contributions

## How to Contribute

### Reporting Issues

1. Check if the issue already exists
2. Use issue templates when available
3. Provide detailed reproduction steps
4. Include relevant logs and environment info

### Feature Requests

1. Describe the feature and its use case
2. Explain why it's valuable to the swarm
3. Consider backward compatibility
4. Discuss potential implementation approaches

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Update documentation
6. Run tests: `pytest tests/ && anchor test`
7. Commit with clear messages: `git commit -m "Add amazing feature"`
8. Push: `git push origin feature/amazing-feature`
9. Open a Pull Request

## Development Guidelines

### Rust (Solana Program)

- Follow Rust style guide
- Use `cargo fmt` for formatting
- Add comments for complex logic
- Write unit tests
- Document public APIs

```rust
/// Brief description
///
/// # Arguments
/// * `param` - Parameter description
///
/// # Returns
/// Return value description
pub fn function_name(param: Type) -> Result<()> {
    // Implementation
}
```

### Python (Agents)

- Follow PEP 8 style guide
- Use type hints
- Add docstrings
- Write async code properly
- Handle errors gracefully

```python
async def function_name(param: Type) -> ReturnType:
    """
    Brief description.
    
    Args:
        param: Parameter description
        
    Returns:
        Return value description
        
    Raises:
        ErrorType: When error occurs
    """
    # Implementation
```

### Testing

- Write tests for new features
- Maintain >80% code coverage
- Test edge cases
- Use fixtures for common setups

```python
import pytest

@pytest.mark.asyncio
async def test_agent_registration():
    agent = TestAgent(...)
    await agent.register()
    assert agent.is_active
```

### Documentation

- Update README for major changes
- Add inline comments for complex logic
- Document new configurations
- Include usage examples

## Project Structure

```
solana-agent-swarm/
├── programs/           # Solana program (Rust)
│   └── agent_swarm/
│       └── src/
├── agents/            # Python agents
│   ├── base_agent.py
│   ├── consensus_agent.py
│   └── ...
├── tests/            # Test suites
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Adding a New Agent Type

1. Create new agent class inheriting from `BaseAgent`
2. Implement required methods:
   - `analyze_and_decide()`
   - `evaluate_proposal()`
   - `_generate_vote_reasoning()`
3. Add to `AgentType` enum in Solana program
4. Update `run_swarm.py` to include new agent
5. Add tests
6. Update documentation

## Code Review Process

1. Automated checks must pass
2. At least one maintainer approval
3. All discussions resolved
4. Documentation updated
5. Tests passing

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Tag release
6. Deploy to devnet first
7. Announce release

## Community

- **Discord**: Join our community server
- **Twitter**: Follow @SolanaAgentSwarm
- **GitHub Discussions**: Ask questions

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or ask in Discord!

---

**Built by AI, improved by community** 🤖💜
