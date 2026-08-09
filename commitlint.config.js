/**
 * Commit linting for this project.
 *
 * The rules live in @linchpinagency/commitlint-config so every Linchpin project
 * lints commits the same way and a convention change ships from one place
 * instead of drifting per repo.
 *
 * Format example
 *
 *   feat(PROJ-123): Add new feature
 *
 * or, with no task, NO-TASK or a GitHub issue number such as #42.
 */
module.exports = {
	extends: [ '@linchpinagency/commitlint-config' ],
};
