var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");

var mouseX; // current X position of mouse, currently unused
var mouseY; // current Y position of mouse

var collisionRadius = 100;
var collisionDistance = 33;

var poroName = "";
var poroSize = 20; //size of poro in pixels
var poroSpeed = 200.1; //horizontal speed of poro
var maxSpeed = 666.666; // max horizontal speed of poro
var maxScroll = 420.42; // max vertical speed of poro
var poroX = 10; //X location of poro
var poroY = 300; //Y location of poro
var stillAlive = true; //if poro is alive
var hasBanshees = false; // if banshees upgrade is active
var hasIceBeam = false; // if ice beam active is acquired
var poroInvulnTime = 0; // time of poro invulnerability
var firingIceBeam = 0; // time of ice beam
var poroImage = document.getElementById("poro"); //image of poro
var bansheesPoroImage = document.getElementById("bansheesPoro"); // image of poro with banshees upgrade
var asteroidSize = 20; //size of asteroids
var asteroidArray = new Array(); //array of asteroid objects
var numAsteroids = 5; //number of asteroids in play
var asteroidImage = document.getElementById("asteroid"); //image of asteroid
var bansheesVeilSize = 20; //size of banshees veil
var bansheesX = 500; // X location of banshees upgrade
var bansheesY = 100; // Y location of banshees upgrade
var bansheesVeilImage = document.getElementById("banshees"); // image of banshees veil
var iceBeamCharge = -600; // Y position of frost queens claim
var frostQueenImage = document.getElementById("frostQueensClaim"); // image of frost queens claim
var iceBeamImage = document.getElementById("iceBeam"); // image of ice beam
var initialTime = (new Date()).getTime(); // time of start for score-keeping
var score = 0; // score
var lastUpdateTime = (new Date()).getTime();

var connection;


function erase() {
	ctx.fillStyle="#ffffff";
	ctx.fillRect(0,0,c.width,c.height);
}

function drawEverything() {
	ctx.fillStyle="#000000";
	ctx.fillRect(0,0,c.width,c.height); //black background
	drawIceBeam();
	drawPoro();
	drawBanshees();
	drawAsteroids();
	if (stillAlive) {
		drawScore();
	}
	if (!stillAlive) {
		ctx.fillStyle="#ff0000";
		ctx.font = "30px Arial";
		ctx.fillText("Score:",300,300);
		ctx.fillText(""+score,300,350);
		ctx.fillText("Click to try again!",200,400);
	}
}

function drawPoro() {
	if (poroInvulnTime<1 || Math.floor(poroInvulnTime/100)%2==1) {
		ctx.drawImage(poroImage,poroX,poroY,c.width/30,c.width/30);
	}
	if (hasBanshees) {
		ctx.drawImage(bansheesPoroImage,poroX,poroY,c.width/30,c.width/30);
	}
}

function drawAsteroids() {
	for (var i=0;i<numAsteroids;i++) {
		ctx.drawImage(asteroidImage,asteroidArray[i].x,asteroidArray[i].y,c.width/30,c.width/30);
	}
}

function drawBanshees() {
	ctx.drawImage(bansheesVeilImage,bansheesX,bansheesY,c.width/30,c.width/30);
}

function drawIceBeam() {
	if (!hasIceBeam) {
		ctx.drawImage(frostQueenImage,poroX,iceBeamCharge,c.width/30,c.width/30);
	}
	if (hasIceBeam) {
		ctx.drawImage(frostQueenImage,580,580,20,20);
	}
	if (firingIceBeam>0 && Math.floor(firingIceBeam/50)%2==1) {
		ctx.drawImage(iceBeamImage,poroX,poroY-c.height/30,c.width,c.width/10);
	}
}

function drawScore() {
	ctx.font = "15px Arial";
	ctx.fillStyle="#ff0000";
	ctx.fillText("Poro Snax Earrned: "+score,300,20);
}

function setupAsteroidArray() { //testing purposes, start with 5 asteroids
	var asteroid0 = {x:0,y:0};
	asteroid0.x=100;
	asteroid0.y=100;
	asteroidArray[0]=asteroid0;
	var asteroid1 = {x:0,y:0};
	asteroid1.x=200;
	asteroid1.y=200;
	asteroidArray[1]=asteroid1;
	var asteroid2 = {x:0,y:0};
	asteroid2.x=300;
	asteroid2.y=300;
	asteroidArray[2]=asteroid2;
	var asteroid3 = {x:0,y:0};
	asteroid3.x=400;
	asteroid3.y=400;
	asteroidArray[3]=asteroid3;
	var asteroid4 = {x:0,y:0};
	asteroid4.x=500;
	asteroid4.y=500;
	asteroidArray[4]=asteroid4;
}

function mouseMoved(evt) {
	mouseX=evt.offsetX?evt.offsetX-10:evt.clientX-20;
	mouseY=evt.offsetY?evt.offsetY-10:evt.clientY-20;
}

function update() {
	var currentMillis = (new Date()).getTime();
	var delayMillis = currentMillis - lastUpdateTime;
	poroInvulnTime -= delayMillis;
	firingIceBeam -= delayMillis;
	poroSpeed=poroSpeed+delayMillis/50;
	if (poroSpeed>maxSpeed) {
		poroSpeed = maxSpeed;
	}
	for (var i=0;i<numAsteroids;i++) { // per asteroid things inside this for loop
		if (poroSpeed*delayMillis/1000<poroSize) {
			asteroidArray[i].x-=poroSpeed*delayMillis/1000; // move asteroids
		} else {
			asteroidArray[i].x-=poroSize/2; // if the asteroids would frameskip over the poro
											// don't let them
											// this is a temporary fix
											// TODO: allow frameskip but calculate if the poro is where they'd skip over
		}
		if (asteroidArray[i].x<-poroSpeed) { // recycle offscreen asteroids
			if (Math.random()<0.33) {
				asteroidArray[i].x=c.width+c.width*Math.random()/3;
				asteroidArray[i].y=c.height*Math.random();
				if (Math.random()<5/numAsteroids) { // chance for extra asteroid and increase poro speed
					addAsteroid();
				}
			}
		}
		if ((asteroidArray[i].x-poroX)*(asteroidArray[i].x-poroX)+(asteroidArray[i].y-poroY)*(asteroidArray[i].y-poroY)<collisionRadius) { // check collision with poro
			takeHit();
			asteroidArray[i].x = 700;
		}
		if (firingIceBeam>0 && Math.abs(asteroidArray[i].y-poroY)<collisionDistance) { // if ice beam hits fireball
			asteroidArray[i].x=5000+4000*Math.random(); // eradicate it
		}
	}
	if (poroSpeed*delayMillis/1000<poroSize) {
		bansheesX-=poroSpeed*delayMillis/1000; // move banshees veil
	} else {
		bansheesX-=poroSize/2; // if the banshees would frameskip over the poro
										// don't let them
										// this is a temporary fix
										// TODO: allow frameskip but calculate if the poro is where they'd skip over
	}
	if ((bansheesX-poroX)*(bansheesX-poroX)+(bansheesY-poroY)*(bansheesY-poroY)<collisionRadius) { // check if poro gets a banshees veil
			getBansheesVeil();
	}
	if (bansheesX<0) { // when banshees goes offscreen, put another one ahead
		bansheesX = 3000 + Math.random()*1200;
		bansheesY = 600 * Math.random();
	}
	iceBeamCharge+=delayMillis*c.width/3000; // move frost queens claim item down
	if (poroY<=iceBeamCharge) { // check if poro gets frost queens claim
		getIceBeam();
	}
	if (mouseY>poroY) { // move poro towards mouse
		poroY+=maxScroll*delayMillis/1000;
		if (poroY>=mouseY) {
			poroY=mouseY;
		}
	}
	if (mouseY<poroY) { // move poro towards mouse
		poroY-=maxScroll*delayMillis/1000;
		if (poroY<=mouseY) {
			poroY=mouseY;
		}
	}
	drawEverything();
	if (stillAlive) {
		setTimeout(function(){update()},5);
		lastUpdateTime = currentMillis;
		score = currentMillis - initialTime;
	}
}

function addAsteroid() {
	var asteroidN = {x:0,y:0};
	asteroidN.x=c.width+c.width*Math.random()/3;
	asteroidN.y=c.height*Math.random();
	asteroidArray[numAsteroids]=asteroidN;
	numAsteroids++;
}

function takeHit() {
	console.log("boom!");
	if (!hasBanshees && poroInvulnTime<=0) {
		stillAlive=false;
		score = (new Date()).getTime()-initialTime;
		sendScoreToServer();
	}
	if (hasBanshees) {
		hasBanshees = false;
		poroInvulnTime = 1000;
	}
}

function getBansheesVeil() {
	hasBanshees = true;
}

function getIceBeam() {
	hasIceBeam = true;
}

function fireIceBeam() {
	if (hasIceBeam) {
		firingIceBeam = 1000;
		hasIceBeam = false;
		iceBeamCharge = -3*c.width;
	}
}

function mouseClicked() {
	if (!stillAlive) {
		poroSpeed = 200.1;
		poroX=10;
		poroY=300;
		stillAlive=true;
		asteroidArray = new Array();
		numAsteroids = 5;
		bansheesX = 500;
		bansheesY = 100;
		initialTime = (new Date()).getTime();
		score = 0;
		lastUpdateTime = initialTime;
		setupAsteroidArray();
		update();
		hasBanshees = false;
		hasIceBeam = false;
		firingIceBeam = 0;
		iceBeamCharge = -c.height;
	}
}

function keyPressed(evt) {
	fireIceBeam();
}

function setUpWebSocket() {
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	if (!window.WebSocket) {
		console.log("No WebSocket available");
		return;
	}
	connection = new WebSocket('ws://localhost:13379');
	connection.onopen = function () {};
	connection.onmessage = function(message) {
		console.log(message);
		try {
			var json = JSON.parse(message.data || message.utf8Data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}
		var i,hss="";
		hss+="LEADERBOARD:<br>";
		for (i=0;i<json.length;i++) {
			hss+=json[i].name+":"+json[i].score+"<br>";
		}
		document.getElementById("highscores").innerHTML=hss;
	};
}

function sendScoreToServer() {
	var packet = {};
	packet.score = score;
	packet.name = poroName;
	try {
	connection.send(JSON.stringify(packet));
	} catch(e) {}
}

function changePoroName() {
	localStorage.poroName = prompt("Please rename your poro.") || poroName;
	poroName = localStorage.poroName;
	writePoroName();
}

function writePoroName() {
	var pns = "";
	pns+="<b>";
	pns+=poroName;
	pns+="</b><br>(Click to rename your poro)"
	document.getElementById("poroName").innerHTML = pns;
}

c.onmousemove=mouseMoved;
c.onclick=mouseClicked;
c.tabIndex=1;
c.addEventListener("keydown",keyPressed,false);
c.addEventListener("onkeydown",keyPressed,false);
document.getElementById("poroName").onclick = changePoroName;
setupAsteroidArray();
setUpWebSocket();
if (!localStorage.poroName) {
	localStorage.poroName = "Poro";
}
poroName = localStorage.poroName;
writePoroName();
update();
