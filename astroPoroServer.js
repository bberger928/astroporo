var WebSocketServer = require('websocket').server;
var http = require('http');

var topScores = [{"name":"Poro","score":99999999},{"name":"Jayce","score":111542},{"name":"Bunny","score":63044},{"name":"Apples","score":33379},{"name":"Veigar","score":33315},{"name":"Kramillion","score":30321},{"name":"Cod","score":10135},{"name":"Wawa","score":7863},{"name":"Test","score":5097},{"name":"Kramillion the Meme Master","score":1630}];
// get this from the log file before each run
cleanupHighscores();

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
console.log("Server running");
server.listen(13379, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
	console.log("New connection");
    var connection = request.accept(null, request.origin);
	
	connection.send(JSON.stringify(topScores));
	
    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
		console.log(message);
		try {
			var json = JSON.parse(message.data || message.utf8Data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}
		console.log(json.name+":"+json.score);
		addToScores(json.name,json.score);
		console.log(JSON.stringify(topScores));
		connection.send(JSON.stringify(topScores));
	});

    connection.on('close', function(connection) {
        // close user connection
    });
});

function addToScores(n,s) {
	var i,added=false;
	for (i=0;i<topScores.length;i++) {
		if (s>topScores[i].score) {
			var j;
			for (j=topScores.length;j>i;j--) {
				topScores[j]={name:topScores[j-1].name,score:topScores[j-1].score};
			}
			topScores[i] = {name:n,score:s};
			added = true;
			i=topScores.length;
		}
	}
	if (topScores.length<=20 && !added) {
		topScores[topScores.length]={name:n,score:s};
	}
	while (topScores.length>20) {
		topScores.pop();
	}
	cleanupHighscores();
}

function cleanupHighscores() {
	var i,j;
	for (i=0;i<topScores.length;i++) {
		for (j=i+1;j<topScores.length;j++) {
			if (topScores[i].name==topScores[j].name) {
				topScores.splice(j,1);
			}
		}
	}
}