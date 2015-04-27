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
                ],
                dest: 'distancemetrics.js',
            }
        },

        uglify: {
            build: {
                src: 'distancemetrics.js',
                dest: 'distancemetrics.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['concat', 'uglify']);
};
