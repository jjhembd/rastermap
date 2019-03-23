const http = require('http');
const url = require('url');
const fs = require('fs');

http.createServer( requestListener ).listen(8080);

function requestListener(request, response) {
  var filename = '.' + url.parse(request.url, true).pathname;
  if (filename === './') filename = './index.html';
  console.log(filename);
  fs.readFile(filename, fileHandler);

  function fileHandler(error, data) {
    if (error) {
      response.writeHead(404, {'Content-Type': 'text/html'});
      return response.end("404 Not Found");
    }
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(data);
    return response.end();
  };
}
