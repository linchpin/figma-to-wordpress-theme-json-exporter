# Contributing and Maintaining

First, thank you for taking the time to contribute!

The following is a set of guidelines for contributors as well as information and instructions around our maintenance process.  The two are closely tied together in terms of how we all work together and set expectations, so while you may not need to know everything in here to submit an issue or pull request, it's best to keep them in the same document.

## Getting Started

Before contributing code, we recommend reading the **[DEVELOPER.md](wiki/DEVELOPER.md)** documentation which covers:
- Architecture overview and data flow
- Directory structure and key modules
- Collection processor system
- How to add new features and processors
- Testing guidelines

## Ways to contribute

Contributing isn't just writing code - it's anything that improves the project.  All contributions are managed right here on GitHub.  Here are some ways you can help:

### Reporting bugs

If you're running into an issue, please take a look through [existing issues](https://github.com/linchpin/figma-wordpress-theme-json-sync/issues) and [open a new one](https://github.com/linchpin/figma-wordpress-theme-json-sync/issues/new) if needed.  If you're able, include steps to reproduce, environment information, and screenshots/screencasts as relevant.

### Suggesting enhancements

New features and enhancements are also managed via [issues](https://github.com/linchpin/figma-wordpress-theme-json-sync/issues).

### Pull requests

Pull requests represent a proposed solution to a specified problem.  They should always reference an issue that describes the problem and contains discussion about the problem itself.  Discussion on pull requests should be limited to the pull request itself, i.e. code review.

### Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for version management. Commit messages are validated using [commitlint](https://commitlint.js.org/) via [husky](https://typicode.github.io/husky/) git hooks.

#### Commit Message Format

```
<type>(<scope>): <description>

[optional body]
[optional footer(s)]
```

#### Commit Types

| Type | Description | Version Bump |
| ---- | ----------- | ------------ |
| **feat** | New feature | Minor |
| **fix** | Bug fix | Patch |
| **docs** | Documentation only | None |
| **style** | Code style changes (formatting, etc.) | None |
| **refactor** | Code refactoring | None |
| **perf** | Performance improvements | Patch |
| **test** | Adding or updating tests | None |
| **build** | Build system or dependencies | None |
| **ci** | CI/CD configuration | None |
| **chore** | Other changes | None |
| **revert** | Revert a previous commit | Depends |

#### Breaking Changes

To indicate a breaking change, add `!` after the type/scope or include `BREAKING CHANGE:` in the footer:

```
feat!: remove deprecated API endpoint

BREAKING CHANGE: The /v1/users endpoint has been removed. Use /v2/users instead.
```

Breaking changes will trigger a major version bump.

### Testing

Helping to test an open source project and provide feedback on success or failure of those tests is also a helpful contribution. Submitting the results of testing as a comment on a Pull Request of a specific feature or as an Issue when testing the entire project is the best approach for providing testing results.

## Workflow

The `develop` branch is the development branch which means it contains the next version to be released.  `main` contains the stable development version.  Always work on the `develop` branch and open up PRs against `develop`.

## Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) for automated releases:

1. **Commit your changes** using conventional commit format
2. **Merge to develop** - When commits are merged to develop, Release Please automatically:
   - Analyzes commits since the last release
   - Creates/updates a Release PR with changelog and version bump
3. **Merge the Release PR** - When the Release PR is merged:
   - A new GitHub Release is created
   - The package is published to npm
   - Tags are created automatically

### Manual Release Steps (if needed)

1. Branch: Starting from `develop`, cut a release branch named `release/X.Y.Z` for your changes.
2. Version bump: Ensure `package.json` version is correct (usually handled by Release Please).
3. Changelog: Verify `CHANGELOG.md` is updated (usually handled by Release Please).
4. Props: Update `wiki/CREDITS.md` file with any new contributors, and confirm maintainers are accurate.
5. New files: Check to be sure any new files/paths that are unnecessary in the production version are included in `.gitattributes` or `.distignore`.
6. Readme updates: Make any other readme changes as necessary in the `README.md` file.
7. Merge: Make a non-fast-forward merge from your release branch to `develop` (or merge the pull request), then do the same for `develop` into `main`.
8. Push: Push your `main` branch to GitHub.
9. Compare `main` to `develop` to ensure no additional changes were missed.
10. Test the pre-release ZIP locally by downloading it from the **Build Plugin** action artifact.

### What to do if things go wrong

If you run into issues during the release process and things have NOT fully deployed to npm or other external locations, then the best thing to do will be to delete any Tag or Release that's been created, research what's wrong, and once things are resolved work on re-tagging and re-releasing.

If you run into issues during the release process and things HAVE deployed externally, then the best thing to do will be to research what's wrong and once things are resolved work on a patch release. At the top of the changelog / release notes it's best to note that it's a hotfix to resolve whatever issues were found after the previous release.
