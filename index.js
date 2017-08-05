var request = require('request')
  , Url     = require('url');


// Public: Find the URL of a web site's favicon.
//
// url      - The String web site URL.
// callback - Receives `(err, favicon_url)`. `favicon_url` will be a
//            String if an icon is discovered, and `null` otherwise.
//
// Examples:
//
//   favicon("http://nodejs.org/", function(err, favicon_url) {
//
//   });
//
// Returns Nothing.
module.exports = function(url, options, callback) {
  if (typeof callback === 'undefined') {
    callback = options;
    options = {};
  }

  var p    = Url.parse(url)
    , root = p.protocol + "//" + p.host
    , ico  = root + "/favicon.ico";

  // Check the root of the web site.
  does_it_render(ico, options, function(err, renders, url) {
    if (err) return callback(err);
    if (renders) return callback(null, url);

    // Check for <link rel="icon" href="???"> tags to indicate
    // the location of the favicon.
    request(root, options, function(err, res, body) {
      var link_re = /<link (.*)>/gi
        , rel_re  = /rel=["'][^"]*icon[^"']*["']/i
        , href_re = /href=["']([^"']*)["']/i
        , match, ico_match;

      while (match = link_re.exec(body)) {
        if (rel_re.test(match[1]) && (ico_match = href_re.exec(match[1]))) {
          ico = Url.resolve(res.request.href, ico_match[1]);
          return callback(null, ico);
        }
      }

      // No favicon could be found.
      return callback(null, null);
    });
  });
};


// Internal: Check the status code.
function does_it_render(url, options, callback) {
  request(url, options, function(err, res, body) {
    if (err) return callback(err);
    var contentType = res.headers['content-type'];
    callback(
      null,
      res.statusCode === 200 && contentType.indexOf('image/') === 0,
      res.request.href
    );
  });
}

