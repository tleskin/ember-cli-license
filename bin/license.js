var licenseScanner = require('../lib/licenseScanner');

var availableOptions = [{
    name: 'path',
    type: String,
    default: process.cwd(),
    aliases: ['path'],
    description: 'specifies which paths to explore'
}, {name: 'production',
    type: Boolean,
    default: false,
    aliases: ['prod'],
    description: 'if true, ignore devDependencies'
}, {
    name: 'config',
    type: String,
    aliases: ['c'],
    description: 'supply additional info to override scanning result'
}, {
    name: 'npm',
    type: Boolean,
    default: true,
    aliases: ['npm'],
    description: 'if false, ignore npm dependencies'
}, {
    name: 'bower',
    type: Boolean,
    default: true,
    aliases: ['bower'],
    description: 'if false, ignore bower dependencies'
}, {
    name: 'directory',
    type: String,
    default: '../licenses',
    aliases: ['directory'],
    description: 'supply directory for saving license file'
}, {
    name: 'csv',
    type: Boolean,
    default: true,
    aliases: ['csv'],
    description: 'if false, do not generate a csv file'
}, {
    name: 'html',
    type: Boolean,
    default: true,
    aliases: ['html'],
    description: 'if false, do not generate a html file'
}];

module.exports = {
    name: 'license',
    description: 'scans npm and bower dependencies and outputs license info in a csv',
    works: 'insideProject',
    init: function () {
        this._super.init && this._super.init.apply(this, arguments);

        this.registerOptions({
            availableOptions
        });
    },
    run: function (options, rawArgs) {
        const startTime = Date.now();
        return licenseScanner.init({
            start: options.path,
            production: options.production,
            config: options.config,
            npm: options.npm,
            bower: options.bower,
            directory: options.directory,
            csv: options.csv,
            html: options.html
        }).then(function () {
            var diff = Date.now() - startTime;
            console.log(`Task finished in ${diff} milliseconds.`);
        });
    }
}
