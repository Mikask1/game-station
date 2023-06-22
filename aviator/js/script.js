// import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// const controls = new OrbitControls( camera, renderer.domElement );
// const loader = new GLTFLoader();
var WIDTH=window.innerWidth;
var HEIGHT=window.innerHeight;
var scene, fov, aspectRatio, near, far, renderer, container, camera, controls;
var hemisphereLight, shadowLight, ambientLight;
var sea;
var sky;
var airplane;
var mousePos={x:0,y:0};
var now, old, dt=0;
var played=true;

var angle;
var dist
var ennemy;
var ennemiesHolder;
var flag=false;

var replayMessage;

// game variable
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

window.addEventListener('load',init,false);

// sea mesh
var Sea = function(){
	// create the geometry (shape) of the cylinder
	var geom = new THREE.CylinderGeometry(600,600,800,40,10);
    console.log(geom);
	// rotate the geometry on the x axis
	geom=geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    console.log(geom);

    var position = geom.getAttribute('position');
    var l = position.count;
    console.log(l);
    this.waves=[];

    for (var i=0; i<l; i++){
		// get each vertex
		// var v = geom.vertices[i];
        // console.log(position.getY(i), position.getX(i), position.getZ(i));
        position.setX(i,position.getX(i)+Math.cos(Math.random()*Math.PI*2)*(5 + Math.random()*15));
        position.setY(i,position.getY(i)+Math.sin(Math.random()*Math.PI*2)*(5 + Math.random()*15));

		// store some data associated to it
		this.waves.push({y:position.getY(i), x:position.getX(i), z:position.getZ(i),
						 // a random angle
						 ang:Math.random()*Math.PI*2,
						 // a random distance
						 amp:5 + Math.random()*15,
						 // a random speed between 0.016 and 0.048 radians / frame
						 speed:0.016 + Math.random()*0.032
						});
	};
	
	// create the material 
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.blue,
		transparent:true,
		opacity:0.8
	});

	// To create an object in Three.js, we have to create a mesh 
	// which is a combination of a geometry and some material
	this.mesh = new THREE.Mesh(geom, mat);

	// Allow the sea to receive shadows
	this.mesh.receiveShadow = true; 
}

// cloud mesh, combine some of cube
var Cloud = function(){
    // container to hold different part of cloud 
    this.mesh = new THREE.Object3D();

    // cube that structured the cloud
    var geom = new THREE.BoxGeometry(20,20,20);

    // material
    var mat = new THREE.MeshPhongMaterial({color: Colors.white});

    // make n cubes to structured cloud
    var n = 3 + Math.floor(Math.random()*3);
    for(var i=0; i<n; i++){
        // create mesh
        var mesh= new THREE.Mesh(geom, mat);

        // set position
        var x=i*15;
        var y=Math.random()*10;
        var z=Math.random()*10;
        mesh.position.set(x,y,z);

        // set rotation
        mesh.rotation.x=Math.random()*Math.PI*2;
        mesh.rotation.y=Math.random()*Math.PI*2;

        // set size
        var size = 0.1+Math.random()*0.9;
        mesh.scale.set(size, size, size);

        // allow cast and receive shadow
        mesh.castShadow=true;
        mesh.receiveShadow=true;

        // add cube to container
        this.mesh.add(mesh);
    }
}

// sky, contain some of clouds
var Sky = function (){
    // create container
    this.mesh = new THREE.Object3D();

    // number of clouds
    this.nClouds = 20;

    // create clouds
    for(var i=0; i<this.nClouds; i++){
        var cloud = new Cloud();

        // angle and distance from center of the axis
        var angle = Math.PI*2*i/this.nClouds;
        var dist = 750 + Math.random()*200;

        // convert angle to polar coordinates
        cloud.mesh.position.x = Math.cos(angle)*dist;
        cloud.mesh.position.y = Math.sin(angle)*dist;

        cloud.mesh.rotation.z = angle + Math.PI/2;

        // cloud in random depth
        cloud.mesh.position.z = -400-Math.random()*400;

        // scale cloud randomly
        var size = 1 + Math.random()*2;
        cloud.mesh.scale.set(size, size, size);

        this.mesh.add(cloud.mesh);
    }
}

// make pilot
var Pilot = function () {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";

    this.angleHairs=0;

    // body of the pilot
    var geomBody = new THREE.BoxGeometry(15,15,15);
    var matBody = new THREE.MeshPhongMaterial({color: Colors.brown});
    var body = new THREE.Mesh(geomBody, matBody);
    body.position.set(2,-12,0);
    this.mesh.add(body);

    // face of the pilot
    var geomFace = new THREE.BoxGeometry(10,10,10);
    var matFace = new THREE.MeshPhongMaterial({color: Colors.pink});
    var face = new THREE.Mesh(geomFace, matFace);
    this.mesh.add(face);

    // hair element
    var hairGeom = new THREE.BoxGeometry(4,4,4);
	var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
	var hair = new THREE.Mesh(hairGeom, hairMat);
	hair.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0,2,0));

    // hair container
    var hairs = new THREE.Object3D();

    // hairs at top
    this.hairsTop = new THREE.Object3D();
    for (var i=0; i<12; i++){
        var h = hair.clone();
		var col = i%3;
		var row = Math.floor(i/3);
		var startPosZ = -4;
		var startPosX = -4;
		h.position.set(startPosX + row*4, 0, startPosZ + col*4);
		this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    // hairs at side
    var geomHairSide = new THREE.BoxGeometry(12,4,2);
    geomHairSide.applyMatrix4(new THREE.Matrix4().makeTranslation(-6,0,0));
	var hairSideR = new THREE.Mesh(geomHairSide, hairMat);
	var hairSideL = hairSideR.clone();
	hairSideR.position.set(8,-2,6);
	hairSideL.position.set(8,-2,-6);
	hairs.add(hairSideR);
	hairs.add(hairSideL);

    // hair at back
    var hairBackGeom = new THREE.BoxGeometry(2,8,10);
	var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
	hairBack.position.set(-1,-4,0)
	hairs.add(hairBack);
	hairs.position.set(-5,5,0);
	this.mesh.add(hairs);

    // glasses
    var glassGeom = new THREE.BoxGeometry(5,5,5);
	var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
	var glassR = new THREE.Mesh(glassGeom,glassMat);
	glassR.position.set(6,0,3);
	var glassL = glassR.clone();
	glassL.position.z = -glassR.position.z

	var glassAGeom = new THREE.BoxGeometry(11,1,11);
	var glassA = new THREE.Mesh(glassAGeom, glassMat);
	this.mesh.add(glassR);
	this.mesh.add(glassL);
	this.mesh.add(glassA);

	var earGeom = new THREE.BoxGeometry(2,3,2);
	var earL = new THREE.Mesh(earGeom,matFace);
	earL.position.set(0,0,-6);
	var earR = earL.clone();
	earR.position.set(0,0,6);
	this.mesh.add(earL);
	this.mesh.add(earR);
}

// make plane object
var Plane = function(){
    this.mesh = new THREE.Object3D();

    // create cabin
    var geomCockpit = new THREE.BoxGeometry(80,50,50,1,1,1);
    var matCockpit = new THREE.MeshPhongMaterial({
        color: Colors.red,
        // shader: THREE.FlatShading
    });

    // make back part smaller
    console.log(geomCockpit);
    var position = geomCockpit.getAttribute('position');
    position.setUsage(THREE.DynamicDrawUsage);
    var vertex = new THREE.Vector3();

    for ( let i = 0; i < position.count; i ++ ) {
        vertex.fromBufferAttribute( position, i );
        console.log(i,position.getX(i),position.getY(i),position.getZ(i));
        
        if(i==0 || i==11 || i==17)
            vertex.set(position.getX(i),position.getY(i),position.getZ(i));
        else if(i==1 || i==9 || i==20)
            vertex.set(position.getX(i),position.getY(i),position.getZ(i));
        else if(i==2 || i==13 || i==19)
            vertex.set(position.getX(i),position.getY(i),position.getZ(i));
        else if(i==3 || i==15 || i==22)
            vertex.set(position.getX(i),position.getY(i),position.getZ(i));
        else if(i==4 || i==8 || i==21)
            vertex.set(position.getX(i),position.getY(i)-10,position.getZ(i)+20);
        else if(i==5 || i==10 || i==16)
            vertex.set(position.getX(i),position.getY(i)-10,position.getZ(i)-20);
        else if(i==6 || i==14 || i==23)
            vertex.set(position.getX(i),position.getY(i)+20,position.getZ(i)+20);
        else if(i==7 || i==12 || i==18)
            vertex.set(position.getX(i),position.getY(i)+20,position.getZ(i)-20);
    
        position.setXYZ( i, vertex.x, vertex.y, vertex.z );
    }

    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow=true;
    cockpit.receiveShadow=true;
    this.mesh.add(cockpit);

    // create engine
    var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        // shader: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x=40;
    engine.castShadow=true;
    engine.receiveShadow=true;
    this.mesh.add(engine);

    // create back part
    var geomBack = new THREE.BoxGeometry(15,20,5,1,1,1);
    var matBack = new THREE.MeshPhongMaterial({
        color: Colors.red
    });
    var back = new THREE.Mesh(geomBack, matBack);
    back.position.x=-35;
    back.position.y=25;
    back.castShadow=true;
    back.receiveShadow=true;
    this.mesh.add(back);

    // create wing
    var geomWing = new THREE.BoxGeometry(40,8,150,1,1,1);
    var matWing = new THREE.MeshPhongMaterial({
        color: Colors.brown
    })
    var wing = new THREE.Mesh(geomWing, matWing);
    wing.castShadow=true;
    wing.receiveShadow=true;
    this.mesh.add(wing);

    // create propeller
    var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow=true;
    this.propeller.receiveShadow=true;

    // create blades
    var geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.white
    });
    var blade = new THREE.Mesh(geomBlade,matBlade);
    blade.castShadow=true;
    blade.receiveShadow=true;
    blade.position.set(8,0,0);
    
    this.propeller.add(blade);
    this.propeller.position.set(50,0,0);
    this.mesh.add(this.propeller);

    // add pilot
    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10,30,0);
    this.mesh.add(this.pilot.mesh);
}

// ennemy
var Ennemy = function(){
    var geom = new THREE.TetrahedronGeometry(8,2);
    var mat = new THREE.MeshPhongMaterial({
      color:Colors.red,
      shininess:0,
      specular:0xffffff,
    });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.castShadow = true;
    // this.mesh.position.set(100,50,50);
    this.angle = 0;
    this.dist = 0;

    // scene.add(this.mesh);
}
  
var EnnemiesHolder = function (){
    this.mesh = new THREE.Object3D();
    this.ennemiesInUse = [];
}

// function to handle the window resize
function handleWindowResize() {
    // update width, height, renderer, and camer
    WIDTH=window.innerWidth;
    HEIGHT=window.innerHeight;
    renderer.setSize(WIDTH,HEIGHT);
    camera.aspect=WIDTH/HEIGHT;
    camera.updateProjectionMatrix();
}

// function to handle mouse move
function mouseMoveHandler(event){
    // normalize coordinate
    // webgl -> -1 to 1
    var tx=-1+(event.clientX/WIDTH)*2;
    var ty=1-(event.clientY/HEIGHT)*2;
    mousePos={x:tx,y:ty};
}

// function to handle click
function keyHandler(event){
    console.log("oidoasiso");
    if(!played && event.keyCode==32){
        // reset
        scene.remove(ennemy.mesh);
        airplane.mesh.position.y=100;
        ennemy.mesh.position.x = 250;
        ennemy.mesh.position.y = 0;

        // replay message hided
        replayMessage.style.display="none";
        old = new Date().getTime();
        played=true;
    }
}

// function to set up scene, camera, and renderer
function createScene(){
    // create scene
    scene=new THREE.Scene();

    // add fog effect to scene
    scene.fog=new THREE.Fog(0xf7d9aa, 100, 950);

    // create camera
    aspectRatio=WIDTH/HEIGHT;
    fov=60;
    near=1;
    far=10000;
    camera = new THREE.PerspectiveCamera(
        fov,
        aspectRatio,
        near,
        far
    );

    // position the camera
    camera.position.x=0;
    camera.position.y=100;
    camera.position.z=200;

    // create renderer
    renderer=new THREE.WebGLRenderer({
        // Allow transparency to show the gradient background
		// we defined in the CSS
		alpha: true, 

		// Activate the anti-aliasing; this is less performant,
		// but, as our project is low-poly based, it should be fine :)
		antialias: true 
    });

    // set size of the renderer
    renderer.setSize(WIDTH,HEIGHT);

    // enable shadow rendering
    renderer.shadowMap.enabled=true;

    // create orbit
    // controls = new OrbitControls(camera, renderer.domElement);

    // add the DOM element of the renderer to the
    // container in html
    container=document.getElementById("world");
    container.appendChild(renderer.domElement);

    // listen to the screen: if the user resizes it
	// we have to update the camera and the renderer size
    window.addEventListener('resize',handleWindowResize,false);
}

// function to add lights
function createLights() {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, 0.9);
    shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
    ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);

    shadowLight.position.set(150,350,350);

    shadowLight.castShadow=true;

    shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;

    shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;

    scene.add(hemisphereLight);
	scene.add(shadowLight);
    scene.add(ambientLight);
}

// function to make sea and add to scene
function createSea(){
	sea = new Sea();

	// push it a little bit at the bottom of the scene
	sea.mesh.position.y = -600;

	// add the mesh of the sea to the scene
	scene.add(sea.mesh);
}

// function to create sky
function createSky(){
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
} 

// function to create airplane 
function createPlane(){
    airplane = new Plane();
    airplane.mesh.scale.set(0.25,0.25,0.25);
    airplane.mesh.position.y = 100;
    // airplane.pilot = new Pilot();
    scene.add(airplane.mesh);
    // scene.add(airplane.pilot.mesh);
}

// function to create ennemies
function createEnnemies(){
    // ennemiesHolder = new EnnemiesHolder();
    for (var i=0; i<10; i++){
      var ennemy = new Ennemy();
      ennemiesPool.push(ennemy);
    //   ennemiesHolder.mesh.add(ennemy.mesh);
    }
    ennemiesHolder = new EnnemiesHolder();
    // ennemiesHolder.mesh.position.y = -game.seaRadius;
    scene.add(ennemiesHolder.mesh);
}
  

// normalize
function normalize(v,vmin,vmax,tmin,tmax) {
    var nv,dv,pc,dt,tv;
    nv = Math.max(Math.min(v,vmax), vmin);
    // if(v>=vmin && v<=vmax){
    //     nv=v;
    // }
    // else if(v<vmin){
    //     nv=vmin;
    // }
    // else{
    //     nv=vmax;
    // }
    dv=vmax-vmin;
    pc=(nv-vmin)/dv;
    dt=tmax-tmin;
    tv=tmin+(pc*dt);

    return tv;
}

// function to update plane position
function updatePlane(){
    var targetX = normalize(mousePos.x,-1,1,-100,100);
    var targetY = normalize(mousePos.y,-1,1,25,175);

    airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*0.1;

    airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*0.0128;
	airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*0.0064;
    
    airplane.propeller.rotation.x+=0.3;
}

// function to update hair
Pilot.prototype.updateHairs = function(){
	
	// get the hair
	var hairs = this.hairsTop.children;

	// update them according to the angle angleHairs
	var l = hairs.length;
	for (var i=0; i<l; i++){
		var h = hairs[i];
		// each hair element will scale on cyclical basis between 75% and 100% of its original size
		h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
	}
	// increment the angle for the next frame
	this.angleHairs += 0.16;
}

// move waves
Sea.prototype.moveWaves = function (){
	
	// get the vertices
	var verts = this.mesh.geometry.getAttribute('position');
	var l = verts.count;
	
	for (var i=0; i<l; i++){
		// var v = verts[i];
		
		// get the data associated to it
		var vprops = this.waves[i];
        // console.log(vprops.x, vprops.y);
		
		// update the position of the vertex
        verts.setX(i, vprops.x + Math.cos(vprops.ang)*vprops.amp);
        verts.setY(i, vprops.y + Math.sin(vprops.ang)*vprops.amp);

		// increment the angle for the next frame
		vprops.ang += vprops.speed;

	}
	this.mesh.geometry.needUpdate=true;

	sea.mesh.rotation.z += .005;
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
    var nEnnemies = game.level;
  
    for (var i=0; i<nEnnemies; i++){
        var ennemy;
        if (ennemiesPool.length) {
        ennemy = ennemiesPool.pop();
        }else{
        ennemy = new Ennemy();
        }

        ennemy.angle = - (i*0.1);
        ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
        ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
        ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

        this.mesh.add(ennemy.mesh);
        this.ennemiesInUse.push(ennemy);
    }
}

// loop function
function loop(){
    now = new Date().getTime();
    dt = now-old;
    // console.log(flag);
    // oldTime = newTime;

    if(played){
        if(Math.floor(dt/1000)%3==0 && !flag){
            angle = Math.PI*2;
            dist = 50 + Math.random()*100;
    
            ennemy.mesh.position.x = 250;
            ennemy.mesh.position.y = dist;
    
            scene.add(ennemy.mesh);
            // console.log(ennemy.mesh);
            // ennemiesHolder.mesh.add(ennemy.mesh);
    
            flag=true;
            old = new Date().getTime();
            // console.log(old);
        }
        else if(Math.floor(dt/1000)%3==2){
            // ennemiesHolder.mesh.remove(ennemy.mesh);
            // console.log(ennemy);
            scene.remove(ennemy.mesh);
            // ennemy.mesh.position.x = WIDTH-200;
            flag=false;
        }
        else if(flag){
            ennemy.mesh.position.x -= 5;
        }
        // update airplane
        updatePlane();

        // update pilot's hair
        airplane.pilot.updateHairs();

        // collision
        var distY = airplane.mesh.position.y-ennemy.mesh.position.y;
        var distX = airplane.mesh.position.x-ennemy.mesh.position.x;
        if((distX<=20 && distX>=-20) && (distY<=20 && distY>=-20)){
            console.log("gameover");
            played=false;
            replayMessage.style.display="block";
            // while(true){}
        }
    }
    
	// Rotate the sea and the sky
	sky.mesh.rotation.z += .01;
    // move the waves
    sea.moveWaves();

    // console.log(airplane.mesh.position.y,ennemy.mesh.position.y);

	// render the scene
	renderer.render(scene, camera);

	// call the loop function again
	requestAnimationFrame(loop);
}

function init(){
    replayMessage = document.getElementById("replayMessage");

    // set up scene, camera and renderer
    createScene();

    // add lights
    createLights();

    // create objects
    createPlane();
    createSea();
    createSky();
    // createEnnemies();
    ennemy = new Ennemy();

    // mouse event listener
    document.addEventListener('mousemove', mouseMoveHandler, false);
    // document.addEventListener('touchmove', handleTouchMove, false);
    // document.addEventListener('mouseup', handleMouseUp, false);
    // document.addEventListener('touchend', touchEndHandler, false);
    document.addEventListener('keydown', keyHandler, false);

    // main loop
    old = new Date().getTime();
    loop();
    // renderer.render(scene, camera);
}