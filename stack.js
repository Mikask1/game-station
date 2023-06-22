window.focus();

let SPEED = 0.005;

let camera, scene, renderer;
let world; // CannonJs world
let lastTime; // Last timestamp of animation
let stack = []; // Parts that stay solid on top of each other
let overhangs = []; // Overhanging parts that fall down
const boxHeight = 1; // Height of each layer
const originalBoxSize = 3; // Original width and height of a box
let gameEnded = true;

// Sounds
let soundEffect;
let bgmSound;

// Camera
var angle = 0;
var radius = 10;

const scoreElement = document.getElementById("score");
const gameoverElement = document.getElementById("gameover");

const listener = new THREE.AudioListener();
let platform = true;

init();

function init() {
	gameEnded = false;
	lastTime = 0;
	stack = [];
	overhangs = [];

	// Initialize CannonJS
	world = new CANNON.World();
	world.gravity.set(0, -10, 0); // Gravity pulls things down
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 40;

	// Initialize ThreeJs
	const aspect = window.innerWidth / window.innerHeight;

	camera = new THREE.PerspectiveCamera(50, aspect, 1, 1000);

	camera.position.set(4, 4, 4);
	camera.lookAt(0, 0, 0);

	loadSound();
	camera.add(listener);

	scene = new THREE.Scene();

	// Platform
	platform = true;
	addLayer(0, 0, 10, 10);
	platform = false;

	// Foundation
	addLayer(0, 0, originalBoxSize, originalBoxSize);

	// Set up lights
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
	dirLight.position.set(10, 20, 0);
	scene.add(dirLight);

	// Set up renderer
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animation);
	renderer.setClearColor(0x000000, 0);
	document.body.appendChild(renderer.domElement);
}

function loadSound() {
	const audioLoader = new THREE.AudioLoader();

	audioLoader.load("./stack/bgm.mp3", function (buffer) {
		const bgmSound = new THREE.Audio(listener);
		bgmSound.setBuffer(buffer);
		bgmSound.setLoop(true);
		bgmSound.setVolume(0.5);
		bgmSound.play();
	});

	soundEffect = new THREE.Audio(listener);
	soundEffect.setVolume(0.5);
	audioLoader.load("./stack/beep.mp3", function (buffer) {
		soundEffect.setBuffer(buffer);
	});

	gameOverSound = new THREE.Audio(listener);
	gameOverSound.setVolume(0.2);
	audioLoader.load("./stack/gameover.mp3", function (buffer) {
		gameOverSound.setBuffer(buffer);
	});
}
function startGame() {
	gameEnded = false;
	lastTime = 0;
	stack = [];
	overhangs = [];
	SPEED = 0.005;

	if (gameoverElement) gameoverElement.style.display = "none";
	if (scoreElement) scoreElement.innerText = 0;

	if (world) {
		// Remove every object from world
		while (world.bodies.length > 0) {
			world.remove(world.bodies[0]);
		}
	}

	if (scene) {
		// Remove every Mesh from the scene
		while (scene.children.find((c) => c.type == "Mesh")) {
			const mesh = scene.children.find((c) => c.type == "Mesh");
			scene.remove(mesh);
		}

		// Platform
		platform = true;
		addLayer(0, 0, 10, 10);
		platform = false;

		// Foundation
		addLayer(0, 0, originalBoxSize, originalBoxSize);

		// First layer
		addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
	}

	if (camera) {
		// Reset camera positions
		camera.position.set(4, 4, 4);
		camera.lookAt(0, 0, 0);
		animateFOV(camera, 50, 200);
		camera.updateProjectionMatrix();
	}
}

function addLayer(x, z, width, depth, direction) {
	const y = boxHeight * stack.length; // Add the new box one layer higher
	const layer = generateBox(x, y, z, width, depth, false);
	layer.direction = direction;
	stack.push(layer);
}

function addOverhang(x, z, width, depth) {
	// Add layer but overhang
	const y = boxHeight * (stack.length - 1); // Add the new box one the same layer
	const overhang = generateBox(x, y, z, width, depth, true);
	overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, gravity) {
	// ThreeJS
	const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
	const color = platform
		? new THREE.Color(0x228dce)
		: new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
	let material = new THREE.MeshLambertMaterial({ color });

	if (platform) {
		const textureLoader = new THREE.TextureLoader();
		const brickTexture = textureLoader.load("./stack/brick.jpeg");
		brickTexture.wrapS = THREE.RepeatWrapping;
		brickTexture.wrapT = THREE.RepeatWrapping;
		brickTexture.repeat.set(3, 1); // Adjust the repeat values to fit your desired scale

		material = new THREE.MeshBasicMaterial({ map: brickTexture });
	}
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);
	scene.add(mesh);

	// CannonJS
	const shape = new CANNON.Box(
		new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
	);
	let mass = gravity ? 4 : 0; // If it shouldn't fall then setting the mass to zero will keep it stationary

	// Reduce mass proportionately by size
	mass *= width / originalBoxSize;
	mass *= depth / originalBoxSize;

	const body = new CANNON.Body({ mass, shape });
	body.position.set(x, y, z);
	world.addBody(body);

	return {
		threejs: mesh,
		cannonjs: body,
		width,
		depth,
	};
}

function cutBox(topLayer, overlap, size, delta) {
	const direction = topLayer.direction;
	const newWidth = direction == "x" ? overlap : topLayer.width;
	const newDepth = direction == "z" ? overlap : topLayer.depth;

	// Update metadata
	topLayer.width = newWidth;
	topLayer.depth = newDepth;

	// Update ThreeJS model
	topLayer.threejs.scale[direction] = overlap / size;
	topLayer.threejs.position[direction] -= delta / 2;

	// Update CannonJS model
	topLayer.cannonjs.position[direction] -= delta / 2;

	// Replace shape to a smaller one (in CannonJS you can't simply just scale a shape)
	const shape = new CANNON.Box(
		new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
	);
	topLayer.cannonjs.shapes = [];
	topLayer.cannonjs.addShape(shape);
}

window.addEventListener("mousedown", eventHandler);

window.addEventListener("keydown", function (event) {
	if (event.key == " ") {
		event.preventDefault();
		eventHandler();
		return;
	}
	if (event.key == "R" || event.key == "r") {
		event.preventDefault();
		startGame();
		return;
	}
});

function eventHandler() {
	nextStep();
}

function nextStep() {
	if (gameEnded) return;

	soundEffect.play();

	const topLayer = stack[stack.length - 1];
	const previousLayer = stack[stack.length - 2];

	const direction = topLayer.direction;

	// Calculate overlap
	const size = direction == "x" ? topLayer.width : topLayer.depth;
	const delta =
		topLayer.threejs.position[direction] -
		previousLayer.threejs.position[direction];
	const overhangSize = Math.abs(delta);
	const overlap = size - overhangSize;

	if (overlap > 0) {
		// Reduce box size
		cutBox(topLayer, overlap, size, delta);

		// Overhang
		const overhangShift =
			(overlap / 2 + overhangSize / 2) * Math.sign(delta);
		const overhangX =
			direction == "x"
				? topLayer.threejs.position.x + overhangShift
				: topLayer.threejs.position.x;
		const overhangZ =
			direction == "z"
				? topLayer.threejs.position.z + overhangShift
				: topLayer.threejs.position.z;
		const overhangWidth = direction == "x" ? overhangSize : topLayer.width;
		const overhangDepth = direction == "z" ? overhangSize : topLayer.depth;

		addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

		// Next layer
		const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
		const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
		const newWidth = topLayer.width;
		const newDepth = topLayer.depth;
		const nextDirection = direction == "x" ? "z" : "x";

		if (scoreElement) scoreElement.innerText = stack.length - 1;
		addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
	} else {
		gameOver();
	}
}

function gameOver() {
	const topLayer = stack[stack.length - 1];

	addOverhang(
		topLayer.threejs.position.x,
		topLayer.threejs.position.z,
		topLayer.width,
		topLayer.depth
	);
	world.remove(topLayer.cannonjs);
	scene.remove(topLayer.threejs);

	gameEnded = true;

	gameOverSound.play();
    
	animateFOV(camera, 100, 500);

	// Show gameover
	if (gameoverElement) gameoverElement.style.display = "flex";
}

function animation(time) {
	if (lastTime) {
		const timePassed = time - lastTime;

		camera.position.x = radius * Math.cos(angle);
		camera.position.z = radius * Math.sin(angle);
		camera.lookAt(0, camera.position.y - 4, 0);
		angle += 0.01;

		const topLayer = stack[stack.length - 1];

		if (!gameEnded) {
			// Move the boxes
			topLayer.threejs.position[topLayer.direction] += SPEED * timePassed;
			topLayer.cannonjs.position[topLayer.direction] +=
				SPEED * timePassed;

			// Fail if box went over
			if (topLayer.threejs.position[topLayer.direction] > 3.1) {
				gameOver();
			}
		}

		// Move up (4 is initial camera position)
		if (camera.position.y < boxHeight * (stack.length - 1) + 4) {
			camera.position.y += SPEED * timePassed;
			SPEED += 0.00001;
		}

		updatePhysics(timePassed);
		renderer.render(scene, camera);
	}
	lastTime = time;
}

function updatePhysics(timePassed) {
	world.step(timePassed / 1000); // Step the physics world

	// Render CanonJS position to ThreeJS
	overhangs.forEach((element) => {
		element.threejs.position.copy(element.cannonjs.position);
		element.threejs.quaternion.copy(element.cannonjs.quaternion);
	});
}

window.addEventListener("resize", () => {
	// Resize Camera
	const aspect = window.innerWidth / window.innerHeight;
	const width = 10;
	const height = width / aspect;

	camera.top = height / 2;
	camera.bottom = height / -2;

	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);
});

function animateFOV(camera, targetFOV, duration) {
	const initialFOV = camera.fov;
	let startTime = null;

	function updateFOV(timestamp) {
		if (!startTime) startTime = timestamp;
		const elapsed = timestamp - startTime;
		const progress = elapsed / duration;

		if (progress >= 1) {
			camera.fov = targetFOV;
			camera.updateProjectionMatrix();
		} else {
			const currentFOV = initialFOV + (targetFOV - initialFOV) * progress;
			camera.fov = currentFOV;
			camera.updateProjectionMatrix();
			requestAnimationFrame(updateFOV);
		}
	}

	requestAnimationFrame(updateFOV);
}

// ADDED:
// 1. Add increasing speed as game goes on
// 2. Change background
// 3. Change to perspective camera
// 4. Rotating camera
// 5. Add BGM and Sound Effect
// 6. Zoom in/out effect when gameover
// 7. Add platform with brick texture
