# Contributing to ToolHive Cloud UI

<!-- omit from toc -->

First off, thank you for taking the time to contribute to ToolHive Cloud UI! :+1: :tada:

ToolHive Cloud UI is released under the Apache 2.0 license. If you would like to contribute something or want to hack on the code, this document should help you get started. You can find development guidelines in the [README.md](./README.md).

## Table of contents

<!-- omit from toc -->

- [Code of conduct](#code-of-conduct)
- [Reporting security vulnerabilities](#reporting-security-vulnerabilities)
- [How to contribute](#how-to-contribute)
  - [Using GitHub Issues](#using-github-issues)
  - [Not sure how to start contributing?](#not-sure-how-to-start-contributing)
  - [Pull request process](#pull-request-process)
- [Commit message guidelines](#commit-message-guidelines)

## Code of conduct

This project adheres to the [Contributor Covenant](./CODE_OF_CONDUCT.md) code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [code-of-conduct@stacklok.com](mailto:code-of-conduct@stacklok.com).

## Reporting security vulnerabilities

If you think you have found a security vulnerability in ToolHive Cloud UI please DO NOT disclose it publicly until we've had a chance to fix it. Please don't report security vulnerabilities using GitHub issues; instead, please follow this [process](./SECURITY.md)

## How to contribute

### Using GitHub Issues

We use GitHub issues to track bugs and enhancements. If you have a general usage question, please ask in [ToolHive's discussion forum](https://discord.gg/stacklok).

If you are reporting a bug, please help to speed up problem diagnosis by providing as much information as possible. Ideally, that would include:

- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser, etc.)

### Not sure how to start contributing?

PRs to resolve existing issues are greatly appreciated, and issues labeled as ["good first issue"](https://github.com/stacklok/toolhive-cloud-ui/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) are a great place to start!

### Pull request process

- All commits must include a Signed-off-by trailer at the end of each commit message to indicate that the contributor agrees to the Developer Certificate of Origin (DCO). Use `git commit -s` to add this automatically.

- Create an issue outlining the fix or feature.

- Fork the ToolHive Cloud UI repository to your own GitHub account and clone it locally:

  ```bash
  git clone https://github.com/YOUR_USERNAME/toolhive-cloud-ui.git
  cd toolhive-cloud-ui
  pnpm install
  ```

- Hack on your changes.

- Ensure code quality before committing:

  ```bash
  pnpm lint          # Run linter
  pnpm format        # Format code
  pnpm test          # Run tests
  pnpm type-check    # TypeScript validation
  ```

- Follow the project guidelines:

  - Use Server Components by default, Client Components only when necessary
  - Always use the generated hey-api client for API calls
  - Use `async/await` (never `.then()` promise chains)
  - **Never use `any` type** - use proper types or `unknown` with type guards
  - Use shadcn/ui components (don't create custom UI components)
  - Follow existing patterns in the codebase

  See [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md) for detailed guidelines.

- Correctly format your commit messages, see [Commit message guidelines](#commit-message-guidelines) below.

- Open a PR with a title that follows the conventional commit format (e.g., `feat: add new feature` or `fix: resolve issue`). The PR title will be validated to ensure it follows the conventional commit specification. Ensure the description reflects the content of the PR.

- Ensure that CI passes, if it fails, fix the failures.

- **Keep PRs small for efficient reviews**: For better review quality and faster turnaround, keep your PRs under **1000 lines of changes**. Smaller PRs are easier to review, less likely to introduce bugs, and get merged faster. Our [PR Size Labeler](./.github/workflows/pr-size-labeler.yml) automatically labels PRs based on size:

  - `size/XS`: < 100 lines
  - `size/S`: 100-299 lines
  - `size/M`: 300-599 lines
  - `size/L`: 600-999 lines
  - `size/XL`: ≥ 1000 lines (requires justification)

  If your PR exceeds 1000 lines, you'll be asked to provide a justification explaining why it cannot be split into smaller PRs.

- Every pull request requires a review from the core ToolHive team before merging.

- Once approved, all of your commits will be squashed into a single commit with your PR title.

## Commit message guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Examples:**

- `feat: add server URL copy functionality`
- `fix(ui): resolve button alignment issue in dark mode`
- `docs: update installation instructions`
- `test: add unit tests for authentication flow`
- `chore: update dependencies`

**Signed-off-by:**

All commits must include a Signed-off-by line:

```bash
git commit -s -m "feat: add new feature"
```

This certifies that you agree to the [Developer Certificate of Origin (DCO)](https://developercertificate.org/).
