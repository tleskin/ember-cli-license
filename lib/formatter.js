var _ = require('underscore');

module.exports = function (array) {
    return _.chain(array)
        .map(function (args) {
            return `${args.name}-${args.version},${args.name},${args.version},"${args.license}","${args.copyright}",${args.repository}`;
        })
        .value();
}
