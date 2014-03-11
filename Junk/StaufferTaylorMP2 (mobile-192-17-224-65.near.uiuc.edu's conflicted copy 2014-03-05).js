var gl; //global variable for the WebGL context
var currentlyPressedKeys = {};
var MountainVert = [];


function onresize(){
	// var canvas = document.getElementById("glcanvas");
	// canvas.style.height = String(window.innerHeight) + "px";
	// canvas.style.width = String(window.innerWidth) + "px";
	// gl.viewportWidth = canvas.clientWidth;
	// gl.viewportHeight = canvas.clientHeight;
}


function start(){
	var canvas = document.getElementById("glcanvas");
	// canvas.style.height = String(window.innerHeight) + "px";
	// canvas.style.width = String(window.innerWidth) + "px";


	gl = initWebGL(canvas); //initialize the GL context

	if(gl){
		gl.clearColor(0.0, 0.0, 0.0, 0.5); //set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST);	//enable depth testing
		gl.depthFunc(gl.LEQUAL);	//Near things obscure far things
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);	//clear tho color as well as the depth buffer.
		mountain(0.0,0.0,0.0, 1.0,0.0,0.0, 0.0,1.0,0.0, 1.0);
		mountain(1.0,1.0,0.0, 0.0,1.0,0.0, 1.0,0.0,0.0, 1.0);
		initShaders();
		initBuffers();
		document.onkeydown = handleKey;
		drawScene();
	}
}

function handleKey(event){
	
}

function mountain(x0, y0, z0, x1, y1, z1, x2, y2, z2, s){
	var x01,y01,z01,x12,y12,z12,x20,y20,z20;

	if (s < 0.01) {
		x01 = x1 - x0;
		y01 = y1 - y0;
		z01 = z1 - z0;

		x12 = x2 - x1;
		y12 = y2 - y1;
		z12 = z2 - z1;

		x20 = x0 - x2;
		y20 = y0 - y2;
		z20 = z0 - z2;

		var nx = y01*(-z20) - (-y20)*z01;
		var ny = z01*(-x20) - (-z20)*x01;
		var nz = x01*(-y20) - (-x20)*y01;

		var den = Math.sqrt(nx*nx + ny*ny + nz*nz);

		if (den > 0.0) {
			nx /= den;
			ny /= den;
			nz /= den;
		}

		MountainVert.push(x0);
		MountainVert.push(y0);
		MountainVert.push(z0);
		MountainVert.push(x1);
		MountainVert.push(y1);
		MountainVert.push(z1);
		MountainVert.push(x2);
		MountainVert.push(y2);
		MountainVert.push(z2);


		//console.log(" " +x0+ " " +y0+ " " +z0+ " " +x1+ " " +y1+ " " +z1+ " " +x2+ " " +y2+ " " +z2);
		return;
	}

	x01 = 0.5*(x0 + x1);
	y01 = 0.5*(y0 + y1);
	z01 = 0.5*(z0 + z1);

	x12 = 0.5*(x1 + x2);
	y12 = 0.5*(y1 + y2);
	z12 = 0.5*(z1 + z2);

	x20 = 0.5*(x2 + x0);
	y20 = 0.5*(y2 + y0);
	z20 = 0.5*(z2 + z0);

	s *= 0.5;

	z01 += 0.3*s*(2.0*(Math.random()) - 1.0);
	z12 += 0.3*s*(2.0*(Math.random()) - 1.0);
	z20 += 0.3*s*(2.0*(Math.random()) - 1.0);

	mountain(x0,y0,z0,x01,y01,z01,x20,y20,z20,s);
	mountain(x1,y1,z1,x12,y12,z12,x01,y01,z01,s);
	mountain(x2,y2,z2,x20,y20,z20,x12,y12,z12,s);
	mountain(x01,y01,z01,x12,y12,z12,x20,y20,z20,s);
}

function initWebGL(canvas){
	gl = null;


	try{
		//try to grab the standard context. If it fails, fallback to experimental.
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch(e){}

	// var canvas = document.getElementById("glcanvas");
	// gl.viewportWidth = canvas.clientWidth;
	// gl.viewportHeight = canvas.ClientHeight
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
	// var time = Math.PI;
	// if(currentlyPressedKeys[68]==true) time = (((new Date).getTime())%720)*(Math.PI/180.0); //make dance if key pressed
	// var timeUniform = gl.getUniformLocation(shaderProgram, "time");
 //  	gl.uniform1f(timeUniform, time);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, VerticesColorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	// gl.bindBuffer(gl.ARRAY_BUFFER, PaperVertBuff);
	// gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PaperFaceBuff);
	// setMatrixUniforms();
	// gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, MountainBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, MountainIndexBuffer);
	gl.drawElements(gl.TRIANGLES, (MountainVert.length/3), gl.UNSIGNED_SHORT, 0);

	requestAnimFrame(drawScene);
}


function initBuffers(){
	var canvas = document.getElementById("glcanvas");
	perspectiveMatrix = makePerspective(45, 640/480, 0.1, 100.0);
	loadIdentity();
	mvTranslate([-0.5, 0.0, 0.0]);
	setMatrixUniforms();

	//Triangle vertices

	// var PaperVertMat = [
	// 	-0.0625,	0.125,		0,
	// 	0.0625,		0.125,		0,
	// 	-0.25,		0,			0,
	// 	0,			0,			0,
	// 	0.25,		0,			0,
	// 	0,			0,			-1
	// ];

	// PaperVertBuff = gl.createBuffer();
	// gl.bindBuffer(gl.ARRAY_BUFFER, PaperVertBuff);
	// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(PaperVertMat), gl.STATIC_DRAW);


	// var PaperFaceMat = [
	// 	0, 2, 5,
	// 	0, 3, 5,
	// 	1, 3, 5,
	// 	1, 4, 5
	// ];

	// PaperFaceBuff = gl.createBuffer();
 //  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PaperFaceBuff);
 //  	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(PaperFaceMat), gl.STATIC_DRAW);

	MountainBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, MountainBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(MountainVert), gl.STATIC_DRAW);

	var TransformMatrix = Matrix.I(4);

	var M = $M([
		[1, 0, 0, 0],
		[0, 0, 1, 0],
		[0,-1, 0, 0],
		[0, 0, 0, 1]
		]);
	TransformMatrix = TransformMatrix.multiply(M);

	var tranUniform = gl.getUniformLocation(shaderProgram, "uTransformMatrix");
 	gl.uniformMatrix4fv(tranUniform, false, new Float32Array(TransformMatrix.flatten()));

	//colors
  	var colors = [];

  	// for(var i=0; i<13; i++){
  	// 	colors.push(1.0);
  	// 	colors.push(1.0);
  	// 	colors.push(1.0);
  	// 	colors.push(1.0);

  	// }


  	for(var i =0; i<(MountainVert.length)/3; i++){
  		colors.push(MountainVert[(i*3)+2]);
  		colors.push(MountainVert[(i*3)+1]);
  		colors.push(MountainVert[(i*3)]);
  		colors.push(1.0);
  	}
  

  	VerticesColorBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, VerticesColorBuffer);
  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  	

  	var MountainIndexArr = [];

  	for(var i =0; i<(MountainVert.length)/3; i++){
  		MountainIndexArr.push(i);
  	}

  	MountainIndexBuffer = gl.createBuffer();
  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, MountainIndexBuffer);
  	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(MountainIndexArr), gl.STATIC_DRAW);
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




