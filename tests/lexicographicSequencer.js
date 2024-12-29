const DefaultSequencer = require('@jest/test-sequencer').default;

class LexicographicSequencer extends DefaultSequencer {
  sort(tests) {
    return tests.sort((a, b) => a.path.localeCompare(b.path));
  }
}

module.exports = LexicographicSequencer;
