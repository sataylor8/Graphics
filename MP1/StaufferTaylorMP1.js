var gl; //global variable for the WebGL context
var horizAspect = 480.0/640.0;
var currentlyPressedKeys = {};


function start(){
	var canvas = document.getElementById("glcanvas");
	currentlyPressedKeys[70]=false;
	currentlyPressedKeys[87]=false;

	gl = initWebGL(canvas); //initialize the GL context

	if(gl){
		gl.clearColor(0.0, 0.0, 0.0, 1.0); //set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST);	//enable depth testing
		gl.depthFunc(gl.LEQUAL);	//Near things obscure far things
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);	//clear tho color as well as the depth buffer.
		initShaders();
		initBuffers();
		document.onkeydown = handleKey;
		drawScene();
	}
}

function handleKey(event){
	if(currentlyPressedKeys[event.keyCode]== true)
		currentlyPressedKeys[event.keyCode] = false;
	
	else currentlyPressedKeys[event.keyCode] = true;
	//console.log(event.keyCode);
}

function initWebGL(canvas){
	gl = null;

	try{
		//try to grab the standard context. If it fails, fallback to experimental.
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch(e){}

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
	var time = Math.PI;
	if(currentlyPressedKeys[68]==true) time = (((new Date).getTime())%720)*(Math.PI/180.0);
	var timeUniform = gl.getUniformLocation(shaderProgram, "time");
  	gl.uniform1f(timeUniform, time);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, VerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	//gl.bindBuffer(gl.ARRAY_BUFFER, BackgroundBuffer);
	//gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);

	if(currentlyPressedKeys[70]==false){
		gl.bindBuffer(gl.ARRAY_BUFFER, TriangleStripOne);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);

		gl.bindBuffer(gl.ARRAY_BUFFER, TriangleStripTwo);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);

		gl.bindBuffer(gl.ARRAY_BUFFER, TriangleFanOne);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	}

	if(currentlyPressedKeys[87] == false){
		gl.bindBuffer(gl.ARRAY_BUFFER, LineColorBuffer);
		gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, LineStrip);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.LINE_STRIP, 0, 24); 
	};
	requestAnimFrame(drawScene);
}


function initBuffers(){
	perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
	loadIdentity();
	mvTranslate([-0.0, 0.0, -6.0]);
	setMatrixUniforms();

	//Triangle vertices

	TriangleStripOne = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, TriangleStripOne);
	var vertices = [
		-0.6,	0.6,	0.0,
		-0.6,	1.0,	0.0,
		-0.2,	0.6,	0.0,
		0.6,	1.0,	0.0,
		0.2,	0.6,	0.0,
		0.6,	0.6,	0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	

	TriangleStripTwo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, TriangleStripTwo);
	vertices = [
		-0.2,	0.6,	0.0,
		0.2,	0.6,	0.0,
		-0.2,	-0.6,	0.0,
		0.2,	-0.6,	0.0,
		0.6,	-1.0,	0.0,
		0.6,	-0.6,	0.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	

	TriangleFanOne = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, TriangleFanOne);
	vertices = [
		-0.2,	-0.6,	0.0,
		-0.6,	-0.6,	0.0,
		-0.6,	-1.0,	0.0,
		0.6,	-1.0,	0.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


	BackgroundBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, BackgroundBuffer);
	vertices = [
			-5.0,	-5.0,	0.0,
			-5.0,	5.0,	0.0,
			5.0,	5.0,	0.0,
			5.0,	-5.0,	0.0,
			-5.0,	-5.0,	0.0
			];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	//colors
  	var colors = [
  			1.0,	0.5,	0.0,	1.0,
  			1.0,	0.5,	0.0,	1.0,
  			1.0,	0.5,	0.0,	1.0,
  			1.0,	0.5,	0.0,	1.0,
  			1.0,	0.5,	0.0,	1.0,
  			1.0,	0.5,	0.0,	1.0
  			];
  
  	VerticesColorBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, VerticesColorBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  	colors = [
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0,
  			0.0,	0.0,	1.0,	1.0
  		];
  	LineColorBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, LineColorBuffer);
 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  	//wireframe vertices
  	LineStrip = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, LineStrip);
	vertices = [
  			-0.2,	0.6,	0.0,
  			-0.6, 	0.6,	0.0,
  			-0.6,	1.0,	0.0,
  			-0.2,	0.6,	0.0,
  			0.6,	1.0,	0.0,
  			-0.6,	1.0,	0.0,
  			-0.2,	0.6,	0.0,
  			0.2,	0.6,	0.0,
  			0.6,	0.6,	0.0,
  			0.6,	1.0,	0.0,
  			0.2,	0.6,	0.0,
  			0.2,	-0.6,	0.0,
  			-0.2,	-0.6,	0.0,
  			-0.2,	0.6,	0.0,
  			0.2,	0.6,	0.0,
  			-0.2,	-0.6,	0.0,
  			-0.6,	-0.6,	0.0,
  			-0.6,	-1.0,	0.0,
  			-0.2,	-0.6,	0.0,
  			0.6,	-1.0,	0.0,
  			0.6,	-0.6,	0.0,
  			0.2,	-0.6,	0.0,
  			0.6,	-1.0,	0.0,
  			-0.6,	-1.0,	0.0
  		];
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
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




