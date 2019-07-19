var fs = require('fs');
var path = require('path');
var rsvp = require('rsvp');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var scanner = require('license-checker');
var format = require('./formatter');
var npmProcessor = require('./npmProcessor');
var bowerProcessor = require('./bowerProcessor');
var configProcessor = require('./configProcessor');

module.exports = {
    init: function(args) {
        return new rsvp.Promise(function(resolve, reject) {
            scanner.init(args, function(err, output) {
                if (err) {
                    reject(err);
                } else {
                    var npmHeader = []
                    var npmLicenses = []
                    var totalMissingLicenses
                    var totalMissingCopyrights
                    var bowerHeader = []
                    var bowerDeps = []
                    var bowerLicenses = []
                    var otherHeader = []
                    var otherLicenses = []
                    var missingLicenses = []
                    var missingCopyrights = []
                    var csv
                    var html

                    if (args.npm){
                        npmHeader = ['Library,Name,Version,License,Copyright,Homepage'];
                        results = npmProcessor(output, args)
                        npmLicenses = results[0]
                        totalMissingLicenses = results[1]
                        missingLicenses = results[2]
                        totalMissingCopyrights = results[3]
                        missingCopyrights = results[4]
                        console.log(`${npmLicenses.length} dependencies have been found`)
                        if (totalMissingLicenses > 0) {
                            console.log(`${totalMissingLicenses} licenses were missing`);
                            missingLicenses.forEach( function (name) {
                                console.log(`The license for ${name} was missing`);
                            })
                        }
                        if (totalMissingCopyrights > 0) {
                            console.log(`${totalMissingCopyrights} copyrights were missing`);
                            missingCopyrights.forEach( function (name) {
                                console.log(`The copyright for ${name} was missing`);
                            })
                        }
                    }

                    if (args.bower){
                        bowerHeader = ['Bower Components', 'Licenses,Name,Version,Repository,License File,License Content'];
                        bowerDeps = fs.readdirSync(path.resolve('./bower_components'));
                        bowerLicenses = bowerProcessor(bowerDeps, args);
                    }

                    if (args.config) {
                        otherHeader = ['Modified', 'Licenses,Name,Versions,Repository,License File,License Content'];
                        otherLicenses = configProcessor.parse(args.config, 'modified');
                    }

                    if (args.csv) {
                        var csv = _.union(npmHeader, format(npmLicenses), bowerHeader, format(bowerLicenses), otherHeader, format(otherLicenses)).join('\n');
                    }
                    if (args.html) {
                        var html = generateHTML(npmLicenses, bowerLicenses, otherLicenses);
                    }
                    mkdirp(`${args.directory}`, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            if (args.csv) {
                                var filePath
                                if(args.production){
                                    filePath = `${args.directory}/${args.start.replace(/\//g,"-")}-licenses-js-prod.csv`
                                }
                                else{
                                    filePath = `${args.directory}/${args.start.replace(/\//g,"-")}-licenses-js-dev.csv`
                                }
                                fs.writeFileSync(filePath, csv, 'utf8');
                            }
                            if (args.html) {
                                fs.writeFileSync(`${args.directory}/licenses-js.html`, html, 'utf8');
                            }
                            resolve();
                        }
                    });
                }
            });
        });
    }
}
var generateHTML = function(npm, bower, other) {
    var contentBuffer = '';
    var linkBuffer = '<h3>Third Party Component List</h3><hr>';

    _.each(npm, function(stuff) {
        linkBuffer += `<a class='license-link' linkTo=${stuff.name}${stuff.version}>${stuff.name} - v.${stuff.version}</a><br/>`;
        contentBuffer += `<div id='${stuff.name}${stuff.version}'><h4>${stuff.name} v.${stuff.version}</h4><h5>License</h5><a class='license-redirect' href=${stuff.licenseLink} target='_blank'>${stuff.license}</a><h5>Repository</h5><a class='repo-redirect' href='${stuff.repository}' target="_blank">${stuff.repository}</a><br/><br/><b>A ${stuff.licenseFile} file was found in component</b><br/><div>${stuff.licenseContent}</div></div><br/><hr>`;
    });
    _.each(bower, function(stuff) {
        linkBuffer += `<a class='license-link' linkTo=${stuff.name}${stuff.version}>${stuff.name} - v.${stuff.version}</a><br/>`;
        contentBuffer += `<div id='${stuff.name}${stuff.version}'><h4>${stuff.name} v.${stuff.version}</h4><h5>License</h5><a class='license-redirect' href=${stuff.licenseLink} target='_blank'>${stuff.license}</a><h5>Repository</h5><a class='repo-redirect' href='${stuff.repository}' target="_blank">${stuff.repository}</a><br/><br/><b>A ${stuff.licenseFile} file was found in component</b><br/><div>${stuff.licenseContent}</div></div><br/><hr>`;
    });
    _.each(other, function(stuff) {
        linkBuffer += `<a class='license-link' linkTo=${stuff.name}${stuff.version}>${stuff.name} - v.${stuff.version}</a><br/>`;
        contentBuffer += `<div id='${stuff.name}${stuff.version}'><h4>${stuff.name} v.${stuff.version}</h4><h5>License</h5><a class='license-redirect' href=${stuff.licenseLink} target='_blank'>${stuff.license}</a><h5>Repository</h5><a class='repo-redirect' href='${stuff.repository}' target="_blank">${stuff.repository}</a><br/><br/><b>A ${stuff.licenseFile} file was found in component</b><br/><div>${stuff.licenseContent}</div></div><br/><hr>`;
    });

    linkBuffer += '<hr>';

    return linkBuffer + contentBuffer;
}
