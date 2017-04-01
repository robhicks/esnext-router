var path = require('path');
var basePath = path.resolve(__dirname, './');
// var masterConf = require(join(basePath, 'node_modules/frontier-build-tools/test/karma.config'));

module.exports = function(config) {
  config.set({
    autoWatch: true,
    basePath: basePath,
    browsers: ['PhantomJS'],
    coverageReporter: {
      dir: 'reports/coverage/',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcovonly', subdir: '.', file: 'lcov.txt' },
        { type: 'text', subdir: '.', file: 'text.txt' },
        { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
        { type: 'text-summary' }
      ]
    },
    files: [
      // testing tools`
      'node_modules/babel-polyfill/dist/polyfill.js',
      'test.js'
    ],
    frameworks: ['mocha', 'chai'],
    logLevel: config.LOG_ERROR,
    preprocessors: {
      'assets/**/test/**/*.js': ['babel'],
      'dist/modules/**/*.js': 'coverage'
    },
    reporters: ['mocha', 'coverage']
  })
}
