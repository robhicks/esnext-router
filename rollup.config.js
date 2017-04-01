const buble = require('rollup-plugin-buble');

module.exports = {
	entry: 'src/Router.js',
	external: [],
	globals: {
	},
	plugins: [
		buble()
	],
	targets: [
		{
			dest: 'dist/esnext-router.es.js',
			format: 'es',
		},
		{
			dest: 'dist/esnext-router.iife.js',
			format: 'iife',
			moduleName: 'EsnextRouter'
		}
	]
};
