var gl; //global variable for the WebGL context
var currentlyPressedKeys = {};
var MountainVert = [];
var MountainIndex = [];
var perspectiveMatrix;
var currentlyPressedKeys = {};
var UpDown = 0;
var LeftRight = 0;
var Fly = -0.05;
var x = 10;
var y = 30;
var z = 0;
var currenttime = 0;
var lasttime = 0;
var data;

function onresize(){
	var canvas = document.getElementById("glcanvas");
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	gl.viewportWidth = canvas.clientWidth;
	gl.viewportHeight = canvas.clientHeight;
	gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
	perspectiveMatrix = makePerspective(45, canvas.clientWidth/canvas.clientHeight, 0.1, 100.0);
	setMatrixUniforms();
}


function start(){
	var canvas = document.getElementById("glcanvas");

	currentlyPressedKeys[37]=false;
	currentlyPressedKeys[38]=false;
	currentlyPressedKeys[39]=false;
	currentlyPressedKeys[40]=false;
	currentlyPressedKeys[50]=false;
	currentlyPressedKeys[49]=false;
	currentlyPressedKeys[48]=false;
	currentlyPressedKeys[73]=false;

	gl = initWebGL(canvas); //initialize the GL context

	window.onresize=onresize.bind();

	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	gl.viewportWidth = canvas.clientWidth;
	gl.viewportHeight = canvas.clientHeight
	gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);

	if(gl){
		gl.clearColor(0.5, 0.75, 1.0, 1.0); //set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST);	//enable depth testing
		gl.depthFunc(gl.LEQUAL);	//Near things obscure far things
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);	//clear tho color as well as the depth buffer.
		createImage();
		//setGrid();
		initShaders();
		initBuffers();
		document.onkeydown = handleKeyDown;
		document.onkeyup = handleKeyUp
		drawScene();
	}
}

function handleKeyDown(event){
	//up - 38 	down - 40	left - 37 	right - 39
	if(currentlyPressedKeys[event.keyCode] == false)
			currentlyPressedKeys[event.keyCode] = true;
	//console.log(event.keyCode);
}

function handleKeyUp(event){
	if(currentlyPressedKeys[event.keyCode] == true)
			currentlyPressedKeys[event.keyCode] = false;
	//console.log(event.keyCode);
}

function getData(x, z){
	//returns a scaled value to set the vertical position of the mountains based on the color value of the height map
	return data[(1024*z)+(4*x)]/10
}

function setGrid(){
	//sets up the grid of vertices as mountains
	var Xidx = 0;
	var Zidx = 0;
  	var increasing = true;
  	MountainVert.push(0);
  	MountainVert.push(0);
  	MountainVert.push(0);
  	while(Zidx <= 255){
  		if(increasing == true){
  			if(Xidx == 255){
  				MountainVert.push(Xidx+1);
  				MountainVert.push(getData(Xidx+1, Zidx));
  				MountainVert.push(Zidx);
  				MountainVert.push(Xidx);
  				MountainVert.push(getData(Xidx, Zidx+1));
  				MountainVert.push(Zidx+1);

  				increasing = false;
  				Xidx++;
  				Zidx++;
  				MountainVert.push(Xidx);
  				MountainVert.push(getData(Xidx, Zidx));
  				MountainVert.push(Zidx);
  			} else{
  				MountainVert.push(Xidx);
  				MountainVert.push(getData(Xidx, Zidx+1));
  				MountainVert.push(Zidx+1);
  				MountainVert.push(Xidx+1);
  				MountainVert.push(getData(Xidx+1, Zidx));
  				MountainVert.push(Zidx);
  				Xidx++;
  			}

  		}
  		else{
  			if(Xidx == 1){
  				MountainVert.push(Xidx-1);
  				MountainVert.push(getData(Xidx-1, Zidx));
  				MountainVert.push(Zidx);
  				MountainVert.push(Xidx);
  				MountainVert.push(getData(Xidx, Zidx+1));
  				MountainVert.push(Zidx+1);

				increasing = true;
				Xidx--;
  				Zidx++;
  				MountainVert.push(Xidx);
  				MountainVert.push(getData(Xidx, Zidx));
  				MountainVert.push(Zidx);
  			} else{
  				MountainVert.push(Xidx);
  				MountainVert.push(getData(Xidx, Zidx+1));
  				MountainVert.push(Zidx+1);
  				MountainVert.push(Xidx-1);
  				MountainVert.push(getData(Xidx-1, Zidx));
  				MountainVert.push(Zidx)
  				Xidx--;
  			}
  		}
  	}
}

function createImage(){
	var imageObj = new Image();
	imageObj.onload = function(){
		drawImage(this);
	}
	imageObj.src = './HeightMap1.jpg';
}

function drawImage(imageObj){
	var canvas = document.getElementById("heightmap");
	var context = canvas.getContext('2d');
	var imageX = 0;
	var imageY = 0;
	var imageWidth = imageObj.width;
	var imageHeight = imageObj.height;

	context.drawImage(imageObj, imageX, imageY);

	var imageData = context.getImageData(imageX, imageY, imageWidth, imageHeight);
	data = imageData.data;
	
	setGrid();
	initBuffers();

}

function initWebGL(canvas){
	gl = null;


	try{
		//try to grab the standard context. If it fails, fallback to experimental.
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch(e){}

	// var canvas = document.getElementById("glcanvas");
	
	//if we don't have a GL context, give up now
	if(!gl){
		alert("Unable to initialize WebGL. Your browser may not support it.");
		gl = null;
	}

	return gl;
}

function initShaders(){
	var fragmentShader = getShader(gl, "shader-fs");
	var vertextShader = getShader(gl, "shader-vs");

	//create the shader program

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertextShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	//If creating the shader program failed, alert

	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		alert("Unable to initialize the sahder program.");
	}

	gl.useProgram(shaderProgram);

	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);

	vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  	gl.enableVertexAttribArray(vertexColorAttribute);
}

function getShader(gl, id){
	var shaderScript, theSource, currentChild, shader;

	shaderScript = document.getElementById(id);

	if(!shaderScript){
		return null;
	}

	theSource = "";
	currentChild = shaderScript.firstChild;

	while(currentChild){
		if(currentChild.nodeType == currentChild.TEXT_NODE){
			theSource += currentChild.textContent;
		}

		currentChild = currentChild.nextSibling;
	}

	if(shaderScript.type == "x-shader/x-fragment"){
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex"){
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		//unknown shader type
		return null;
	}

	gl.shaderSource(shader, theSource);

	//compile the shader program
	gl.compileShader(shader);

	//See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function drawScene(){

	//display logic for HUD
	var Instructions = document.getElementById("Instructions");
	var Instructions2 = document.getElementById("Instructions2");
	var Instructions3 = document.getElementById("Instructions3");
	if(currentlyPressedKeys[73]==true){
		Instructions.innerHTML = "Steer with Arrow Keys";
		Instructions2.innerHTML = "Press 1/2 to Decrease/Increase Speed";
		Instructions3.innerHTML = "Press 0 to Return to Start";
	} else {
		Instructions.innerHTML = "Press I for instructions";
		Instructions2.innerHTML = "";
		Instructions3.innerHTML = "";
	}

	//Time scale to ensure similar performance on all machines
	lasttime = currenttime;
	currenttime = (new Date().getTime());
	if(lasttime ==0){
		requestAnimFrame(drawScene)
		return;
	}
	var TimeScale = (currenttime-lasttime)/34;
 	

	//begin drawing setup/drawing
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

 	var RotationMatrix = Matrix.I(4);
	var TranslateMatrix = Matrix.I(4);
	var ScaleMatrix = Matrix.I(4);


	//background translate matrix
	TranslateMatrix = $M([
		[1, 0, 0, -128],
		[0, 1, 0, 0],
		[0, 0, 1, -128],
		[0, 0, 0, 1]]);

	//draw background
	var rotUniform = gl.getUniformLocation(shaderProgram, "uRotationMatrix");
 	gl.uniformMatrix4fv(rotUniform, false, new Float32Array(RotationMatrix.flatten()));

 	var translateUniform = gl.getUniformLocation(shaderProgram, "uTranslateMatrix");
 	gl.uniformMatrix4fv(translateUniform, false, new Float32Array(TranslateMatrix.flatten()));

	var scaleUniform = gl.getUniformLocation(shaderProgram, "uScaleMatrix");
 	gl.uniformMatrix4fv(scaleUniform, false, new Float32Array(ScaleMatrix.flatten())); 	

 	gl.bindBuffer(gl.ARRAY_BUFFER, VerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

 	gl.bindBuffer(gl.ARRAY_BUFFER, MountainBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, MountainFaceBuf);
	gl.drawElements(gl.TRIANGLES, MountainIndex.length, gl.UNSIGNED_SHORT, 0);
	


	//Plane
 	//up - 38 	down - 40	left - 37 	right - 39
 	if(currentlyPressedKeys[37] == true){
 			LeftRight += 1*TimeScale;
 	}

 	if(currentlyPressedKeys[38] == true){
 			UpDown -=.6*TimeScale;
 	}

 	if(currentlyPressedKeys[39] == true){
 			LeftRight -=1*TimeScale;
 	}

 	if(currentlyPressedKeys[40] == true){
 			UpDown +=.6*TimeScale;
 	}

 	if(currentlyPressedKeys[48]==true){
 		LeftRight =0;
 		UpDown=0;
 	}

	RotationMatrix = Matrix.I(4);
	TranslateMatrix = Matrix.I(4);
	ScaleMatrix = Matrix.I(4);
	var LookAtVector = Vector.create([0, 0, 1]);
	var UpVector = Vector.create([0, 1, 0]);
	var RVector = LookAtVector.cross(UpVector);

	var theta = UpDown*Math.PI/180;

	var Holder = Matrix.Rotation(theta, RVector);

	RotationMatrix = $M([
		[Holder.e(1,1),	Holder.e(1,2),	Holder.e(1,3),	0],
		[Holder.e(2,1),	Holder.e(2,2),	Holder.e(2,3),	0],
		[Holder.e(3,1),	Holder.e(3,2),	Holder.e(3,3),	0],
		[0,				0,				0,				1]])

	var RLine = Line.create([0,0,0], RVector);
	LookAtVector.rotate(UpDown, RLine);
	UpVector.rotate(UpDown, RLine);

	theta = LeftRight*Math.PI/180;
	Holder = Matrix.Rotation(theta, LookAtVector)

	M = $M([
		[Holder.e(1,1),	Holder.e(1,2),	Holder.e(1,3),	0],
		[Holder.e(2,1),	Holder.e(2,2),	Holder.e(2,3),	0],
		[Holder.e(3,1),	Holder.e(3,2),	Holder.e(3,3),	0],
		[0,				0,				0,				1]])

	RotationMatrix = M.multiply(RotationMatrix);


	if(currentlyPressedKeys[50] == true){
		Fly -= .01;
	}

	if(currentlyPressedKeys[49] == true){
		Fly += .01;
		if(Fly >= -0.05) Fly = -0.05;
	}

	if(currentlyPressedKeys[48]==true){
		x=10;
		y=20;
		z=0;
		Fly = -.05;
	}

	var Info = document.getElementById("Info");
	var Position = document.getElementById("Position");
	FlyInfo = (-Fly*100)+((Fly*100)%1);
	UpDownInfo = (-UpDown+(UpDown%1))%360;
	LeftRightInfo = (-LeftRight+(LeftRight%1))%360;
	var value;
	if(LeftRightInfo > 180){
		value = LeftRightInfo -180;
		LeftRightInfo = 180 - value;
		LeftRightInfo = -LeftRightInfo;
	}

	Info.innerHTML = "Speed: " + String(FlyInfo) + " Pitch: " + String(UpDownInfo) + " Roll: " + String(LeftRightInfo);

	var TranslateVector = $M([
		[0],
		[0],
		[Fly*TimeScale],
		[1]]);


	TranslateVector = RotationMatrix.multiply(TranslateVector);

	

	x += TranslateVector.e(1,1);
	y += TranslateVector.e(2,1);
	z += TranslateVector.e(3,1);

	Position.innerHTML = "X: " + String(x-(x%1)) + " Y: " + String(y-(y%1)) + " Z: " + String(z-(z%1));

	TranslateMatrix = $M([
		[1, 0, 0, x],
		[0, 1, 0, y],
		[0, 0, 1, z],
		[0, 0, 0, 1]]);

 	M = $M([
 		[.125,	0,		0,		0],
 		[0,		.125,	0,		0],
 		[0,		0,		.125,	0],
 		[0,		0,		0,		1]]);

 	ScaleMatrix = ScaleMatrix.multiply(M);

 	gl.uniformMatrix4fv(rotUniform, false, new Float32Array(RotationMatrix.flatten()));
 	gl.uniformMatrix4fv(translateUniform, false, new Float32Array(TranslateMatrix.flatten()));
 	gl.uniformMatrix4fv(scaleUniform, false, new Float32Array(ScaleMatrix.flatten())); 	
	

	mvPushMatrix();
	mvRotate(UpDown, [1, 0, 0]);
	mvRotate(LeftRight, [0, 0, -1]);
	mvTranslate([-x, -y, -z]);

	//draw plane
	gl.bindBuffer(gl.ARRAY_BUFFER, PaperColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, PaperVertBuff);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PaperFaceBuff);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);



	gl.bindBuffer(gl.ARRAY_BUFFER, PaperLineColorBuff);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, PaperLineBuff);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.LINE_LOOP, 0, 11);

	mvPopMatrix();
	requestAnimFrame(drawScene);


}


function initBuffers(){
	var canvas = document.getElementById("glcanvas");
	perspectiveMatrix = makePerspective(45, canvas.clientWidth/canvas.clientHeight, 0.1, 100.0);
	loadIdentity();
	mvTranslate([0.0, -0.125, -0.3]);
	setMatrixUniforms();


	MountainBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, MountainBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(MountainVert), gl.STATIC_DRAW);

	var colors = [];

	//set colors for mountains based on coords
	for(var i =0; i<MountainVert.length; i +=3){
 		
 		if(MountainVert[i+1] >= 20){
 			colors.push(0.8);
 			colors.push(0.8);
 			colors.push(0.8);
 			colors.push(1.0);
 		} else{
 			colors.push(0.4 + .1*Math.sin(.25*MountainVert[i]) + .1*Math.sin(.25*MountainVert[i+2]));
 			colors.push(0.2 + .1*Math.sin(.25*MountainVert[i]) + .1*Math.sin(.25*MountainVert[i+2]));
 			colors.push(0.0 + .1*Math.sin(.25*MountainVert[i]) + .1*Math.sin(.25*MountainVert[i+2]));
 			colors.push(1.0);
 		}
 	}


  	VerticesColorBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, VerticesColorBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  	
  	for(var i =2; i<MountainVert.length/3; i++){
  		MountainIndex.push(i-2);
  		MountainIndex.push(i-1);
  		MountainIndex.push(i);
  	}

  	MountainFaceBuf = gl.createBuffer();
  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, MountainFaceBuf);
  	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(MountainIndex), gl.STATIC_DRAW);


	//Plane Verts
	var PaperVertMat = [
		-0.0625,	0.125,		0,
		0.0625,		0.125,		0,
		-0.25,		0,			0,
		0,			0,			0,
		0.25,		0,			0,
		0,			0,			-1
	];

	PaperVertBuff = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, PaperVertBuff);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PaperVertMat), gl.STATIC_DRAW);

	//face indexes for plane
	var PaperFaceMat = [
		0, 2, 5,
		0, 3, 5,
		1, 3, 5,
		1, 4, 5
	];

	PaperFaceBuff = gl.createBuffer();
  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PaperFaceBuff);
  	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(PaperFaceMat), gl.STATIC_DRAW);

  	//Plane outline verts
  	var PaperLineMat = [
  		-0.0625,	0.125,		0, 
  		-0.25,		0,			0,
  		0,			0,			-1,
  		-0.0625,	0.125,		0, 
  		0,			0,			0, 
  		0,			0,			-1, 
  		0.0625,		0.125,		0,
  		0.25,		0,			0, 
  		0,			0,			-1, 
  		0.0625,		0.125,		0, 
  		0,			0,			0  
  		]

  	PaperLineBuff = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, PaperLineBuff);
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PaperLineMat), gl.STATIC_DRAW);

	//colors for plane  	
  	colors=[
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		0.5, 0.5, 0.5, 1.0,
  		0.5, 0.5, 0.5, 1.0,
  		0.5, 0.5, 0.5, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0
  		];

	PaperColorBuffer = gl.createBuffer();
 	gl.bindBuffer(gl.ARRAY_BUFFER, PaperColorBuffer);
 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

 	//colors for outline
  	colors = [];
  	for(var i=0; i<12; i++){
  		colors.push(0.0);
  		colors.push(0.0);
  		colors.push(0.0);
  		colors.push(1.0);
  	}

  	PaperLineColorBuff = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, PaperLineColorBuff);
 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }
  
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;
  
  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}




