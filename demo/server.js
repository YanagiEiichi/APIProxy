//nodejs
var Promise = require('es6-promise').Promise;
var mime = require('mime');
var fs = require('fs');
require('http').createServer(function(req,res) {
  new Promise(function(resolve, reject) {
    // Try to load static resources.
    if(req.method == 'GET')
      return fs.readFile(req.url.slice(1), function(error, data) {
        if(error) return reject();
        res.setHeader('Content-Type',mime.lookup(req.url));
        resolve(data);
      });
     // Otherwise
    reject();
  }).then(function(data) {
    // site controller.
    res.end(data);
  }).catch(function() {
    // API controller.
    res.setHeader('Content-Type','text/plain');
    res.end('You sent a ' + req.method + ' request to ' + '//<APIHOST>' + req.url + '.');

  });
}).listen(1234);
