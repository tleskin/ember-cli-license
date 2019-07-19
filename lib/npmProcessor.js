var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var configProcessor = require('./configProcessor');
var licenseLinkMap = {
    'Apache-2.0': 'http://www.apache.org/licenses/LICENSE-2.0',
    'BSD': 'https://spdx.org/licenses/BSD-4-Clause.html',
    'BSD-2-Clause': 'https://opensource.org/licenses/BSD-2-Clause',
    'BSD-3-Clause': 'https://opensource.org/licenses/BSD-3-Clause',
    'ISC': 'https://opensource.org/licenses/ISC',
    'MIT': 'https://opensource.org/licenses/MIT',
    'Public Domain': '#',
    'WTFPL': 'http://unlicense.org/',
    'Unlicense': 'http://unlicense.org/'
};
// return a list of {npm-module} info sorted by license
module.exports = function(output, args) {
    var reference = [];
    if (args.config) {
        reference = configProcessor.getReference(args.config);
    }

    var totalMissingCopyrights = 0
    var missingCopyrights = []
    var totalMissingLicenses = 0
    var missingLicenses = []

    var licenseMap = _.chain(output)
        .pairs(output)
        .map(function(obj) {
            var package = obj[0];
            var details = obj[1];
            if(package.startsWith('@')){
                package = package.substring(1)
            }
            var name = package.split('@')[0];
            var version = package.split('@')[1];
            var repository = details.repository;
            var licenseFile = details.licenseFile;
            if (details.licenses && _.isArray(details.licenses)){
                var license = details.licenses;
            }
            else {
                var license = []
                license.push(details.licenses)
            }
            var licenseLink = '#';
            var copyright = []
            var licenseContent = 'Only license name was specified in original component';

            LICENSE_REFERENCES = [
                /released under the ([\s\w]*) license/gmi,
                /same license as ([\s\w]*)/gmi,
                /^([\w]*) license$/gmi,
                /^the[\s\w]*\s([\s\w]*)\slicense/gmi,
                /^license: ([\s\w]*)/gmi,
                /^released under the ([\s\w]*) license/gmi,
                /Licensed under the ([\s\w]*) [L|l]icense/gmi,
                /license: ([\s\w]*)$/gmi,
                /^same as ([\s\w]*)/gmi,
                /license of ([\s\w]*)/gmi
            ]

            COPYRIGHT_REFERENCES = [
                /^Copyright\s(?!(?:notice|owner|license|of|holders|holder|on|and|protection|\[|\{|\([C|c]\)))(.*)/gmi,
                /^Copyright\s\([C|c]\)\s(.*)/gmi
            ]

            if (licenseFile) {
                licenseContent = fs.readFileSync(licenseFile, 'utf-8');
                COPYRIGHT_REFERENCES.forEach( function (regex) {
                    var res
                    while( res = regex.exec(licenseContent) ) {
                        if (!copyright.includes(res[1])) {
                            copyright.push(res[1])
                        }
                    }
                })
                if (copyright.length == 0) {
                    totalMissingCopyrights++
                    missingCopyrights.push(name)
                }
                licenseFile = path.basename(details.licenseFile);
            }

            if (!licenseFile && details.licenses) {
                licenseFile = 'package.json';
                totalMissingCopyrights++
                missingCopyrights.push(name)
            }
            if (license && _.isArray(license)) {
                LICENSE_REFERENCES.forEach( function (regex) {
                    var res
                    while( res = regex.exec(licenseContent) ) {
                        if (res[1] !== "following" && !license.includes(res[1])) {
                            license.push(res[1])
                        }
                    }
                })
                license = license.join(', ');
            }
            if (!_.isNull(license) && !_.isUndefined(license)) {
                license = license.replace(/\*/g, '');
            } else {
                missingLicenses.push(name)
                totalMissingLicenses++
            }

            // use records in config obj if available
            var record = _.findWhere(reference, {
                name
            });

            if (!_.isUndefined(record)) {
                if (record.license) {
                    license = record.license;
                }
                if (record.name) {
                    name = record.name;
                }
                if (record.repository) {
                    repository = record.repository;
                }
                if (record.version) {
                    version = record.version;
                }
                if (record.licenseFile) {
                    licenseFile = record.licenseFile;
                }
                if (record.licenseContent) {
                    licenseContent = record.licenseContent;
                } else {
                    licenseContent = licenseContent || '';
                }
            }
            licenseLink = licenseLinkMap[license];
            if (_.isUndefined(licenseLink)) {
                licenseLink = '#';
            }

            return {
                license,
                copyright,
                licenseLink,
                name,
                version,
                repository,
                licenseFile,
                licenseContent
            }
        }).value();

    // push additional info if any
    if (args.config) {
        licenseMap = _.union(licenseMap, configProcessor.parse(args.config, 'npm'));
    }

    return [
        _.sortBy(licenseMap, 'name'),
        totalMissingLicenses,
        missingLicenses,
        totalMissingCopyrights,
        missingCopyrights
    ]
}
