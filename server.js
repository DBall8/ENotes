var http = require('http')
	, fs = require('fs')
	, qs = require('querystring')
	, url = require('url')
	, sql = require('sqlite3')
	, port = 8080

var db = new sql.Database('./data.db', sql.OPEN_READWRITE, function(err){
	if(err){
		console.log("Could not open database.");
		console.log(err);
	}
	else{
		console.log("Database opned successfully.");
	}
})

var server = http.createServer(function (req, res){
	var uri = url.parse(req.url)

	switch(uri.pathname){
		case '/style.css':
			sendFile(res, 'app/style.css', 'text/css');
			break;
		default:
			res.end('404 Page Not Found');
	}
})

server.listen(port);
console.log('Listening on :' + port);

function sendFile(res, filename, type){
	type = type || 'text/html'
	fs.readFile(filename, function (error, content){
		if(error){
			console.log(error);
		}
		res.writeHead(200, {'Content-type': type});
		res.end(content, 'utf-8');

	})
}
