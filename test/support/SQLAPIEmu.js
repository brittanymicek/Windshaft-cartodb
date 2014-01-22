var http        = require('http');
var url         = require('url');

var o = function(port, cb) {

  this.queries = [];
  var that = this;

  this.sqlapi_server = http.createServer(function(req,res) {
      //console.log("server got request with method " + req.method);
      var query;
      if ( req.method == 'GET' ) {
        query = url.parse(req.url, true).query;
        that.handleQuery(query, res);
      }
      else if ( req.method == 'POST') {
        var data = '';
        req.on('data', function(chunk) {
          //console.log("GOT Chunk  " + chunk);
          data += chunk;
        });
        req.on('end', function() {
          //console.log("Data is: "); console.dir(data);
          query = JSON.parse(data);
          //console.log("Parsed is: "); console.dir(query);
          //console.log("handleQuery is " + that.handleQuery);
          that.handleQuery(query, res);
        });
      }
      else {
        that.handleQuery('SQLAPIEmu does not support method' + req.method, res);
      }
   }).listen(port, cb);
};

o.prototype.handleQuery = function(query, res) {
    this.queries.push(query);
    if ( query.q.match('SQLAPIERROR') ) {
      res.statusCode = 400;
      res.write(JSON.stringify({'error':'Some error occurred'}));
    } else if ( query.q.match('EPOCH.* as max') ) {
      // This is the structure of the known query sent by tiler
      var row = {
        'max': 1234567890.123
      };
      res.write(JSON.stringify({rows: [ row ]}));
    } else {
      var qs = JSON.stringify(query);
      var row = {
        // This is the structure of the known query sent by tiler
        'cdb_querytables': '{' + qs + '}',
        'max': qs
      };
      var out_obj = {rows: [ row ]};
      var out = JSON.stringify(out_obj);
      res.write(out);
    }
    res.end();
  };


o.prototype.close = function(cb) {
  this.sqlapi_server.close(cb);
};

module.exports = o;

