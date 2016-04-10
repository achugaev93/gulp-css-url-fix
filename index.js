var rework = require('rework');
var path = require('path');
var through = require('through2');
var validator = require('validator');

var isAbsolute = function(p) {
    var normal = path.normalize(p);
    var absolute = path.resolve(p);
    return normal == absolute;
};

var rebaseUrls = function(css, options) {
    return rework(css).use(rework.url(function (url) {
        
        // Skip absolute addresses
        
        if (isAbsolute(url) && validator.isURL(url)) {
            return url;
        }
        
        // Do not modify data-uri
        
        if (url.indexOf('data:') === 0) {
            return url;
        }
        
        // Make absolute path
        
        var absolutePath = path.join(options.currentDir, url)
        
        // Get path relative to the root dir
        
        var p = path.relative(options.root, absolutePath);

        // Fix delimiters on Windows

        if (process.platform === 'win32') {
            p = p.replace(/\\/g, '/');
        }

        return p;
    }))
    .toString();
};

module.exports = function(options) {
    options = options || {};
    var root = options.root || '.';

    return through.obj(function(file, enc, cb) {
        
        // Fix paths in current CSS file
        
        var css = rebaseUrls(file.contents.toString(), {
            currentDir: path.dirname(file.path),
            root: path.join(file.cwd, root)
        });

        // Replace original file contents with fixed one
        
        file.contents = new Buffer(css);

        this.push(file);
        cb();
    });
};
