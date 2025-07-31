module.exports = {
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'docs', section: '📚 Documentation' },
    { type: 'style', section: '💄 Styles' },
    { type: 'refactor', section: '♻️ Code Refactoring' },
    { type: 'perf', section: '⚡ Performance Improvements' },
    { type: 'test', section: '✅ Tests' },
    { type: 'build', section: '🔧 Build System' },
    { type: 'ci', section: '👷 CI Configuration' },
    { type: 'chore', section: '🔨 Chores' },
  ],
  releaseCommitMessageFormat:
    'chore(release): 📦 {{currentTag}} - {{releaseName}}',
  issuePrefixes: ['#'],
  commitUrlFormat:
    'https://github.com-alexandervtr/AlexanderVTr/aipartner/commit/{{hash}}',
  compareUrlFormat:
    'https://github.com-alexandervtr/AlexanderVTr/aipartner/compare/{{previousTag}}...{{currentTag}}',
  issueUrlFormat:
    'https://github.com-alexandervtr/AlexanderVTr/aipartner/issues/{{id}}',
}
