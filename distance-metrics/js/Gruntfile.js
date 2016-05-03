module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: [
                    'src/preloaded_data.js',
                    'src/autocomplete.js',
                    'src/similarartistlist.js',
                    'src/cosinegraph.js',
                    'src/weightgraph.js',
                    'src/slopegraph.js',
                    'src/distancemetrics.js'
                ],
                dest: 'distancemetrics.js',
            },
            mf: {
                src: [
                    'src/preloaded_data_mf.js',
                    'src/autocomplete.js',
                    'src/similarartistlist.js',
                    'src/slopegraph.js',
                    'src/matrixfactorization.js'
                ],
                dest: 'matrixfactorization.js',
            }
        },

        uglify: {
            build: {
                src: 'distancemetrics.js',
                dest: 'distancemetrics.min.js'
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('mf', ['concat:mf']);
};
