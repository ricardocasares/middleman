var f           = 'responses';
var fs          = require('fs');
var url         = require('url');
var app         = require('express')();
var path        = require('path');
var body        = require('body-parser');
var request     = require('request');
var ReadStream  = fs.createReadStream;
var WriteStream = fs.createWriteStream;

app.use(body.json());

app.use(function(req, res, next) {
  req.file = path.join(f, encode(req));
  try {
    if (fs.lstatSync(req.file)) {
      return next();
    }
  } catch (e) {}

  var p      = url.parse(req.url).path;
  var schema = req.connection.encrypted ? 'https' : 'http';
  var dest   = schema + '://' + req.headers.host + p;

  var params = {
    url: dest,
    method: req.method,
    headers: {},
    json: req.body,
  };

  var exclude = ['proxy-connection'];
  for (var hname in req.headers) {
    if (!~exclude.indexOf(hname)) {
      params.headers[hname] = req.headers[hname];
    }
  }

  var rs = request(params);
  var stream = WriteStream(req.file);
  rs.pipe(stream);
  rs.pipe(res);
});

app.use(function(req, res) {
  var stream = ReadStream(req.file);
  res.set({'Content-Type': 'application/json'});
  stream.pipe(res);
});

function encode(req) {
  var r = [req.method, req.url].join(':');
  return new Buffer(r).toString('base64');
}

function decode(hash) {
  return new Buffer(hash, 'base64').toString('ascii');
}

app.listen(3000);