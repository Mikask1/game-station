function Wheel() {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.z = 6;
    wheel.castShadow = false;
    wheel.receiveShadow = false;
    return wheel;
}

function getCarFrontTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const context = canvas.getContext("2d");
  
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 64, 32);
  
    context.fillStyle = "#666666";
    context.fillRect(8, 8, 48, 24);
  
    return new THREE.CanvasTexture(canvas);
}
  
function getCarSideTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 32;
    const context = canvas.getContext("2d");
  
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 128, 32);
  
    context.fillStyle = "#666666";
    context.fillRect(10, 8, 38, 24);
    context.fillRect(58, 8, 60, 24);
  
    return new THREE.CanvasTexture(canvas);
}

function getBeamlightCar(vehicle){
  const beamLight = new THREE.SpotLight(0xffffff, 1, 200);

  beamLight.position.set(10, 0, 30);
  beamLight.target.position.set(20, 0, 30);

  beamLight.name = "beamLight";
  beamLight.target.name = "beamLightTarget";

  beamLight.intensity = 10;
  vehicle.add(beamLight);
  vehicle.add(beamLight.target);

  beamLight.angle = Math.PI / 6; 
  beamLight.penumbra = 0.3; // Adjust the penumbra value as desired
  beamLight.castShadow = true; // Enable shadow casting for the beam light
  
  beamLight.shadow.mapSize.width = 1024; 
  beamLight.shadow.mapSize.height = 1024; 
  beamLight.shadow.camera.near = 10; 
  beamLight.shadow.camera.far = 200;
}

function getBeamlightTruck(vehicle){
    const beamLight = new THREE.SpotLight(0xffffff, 1, 200);

    beamLight.position.set(60, 0, 20);
    beamLight.target.position.set(120, 0, 20); 

    beamLight.name = "beamLight";
    beamLight.target.name = "beamLightTarget";

    beamLight.intensity = 10;
    vehicle.add(beamLight);
    vehicle.add(beamLight.target);

    beamLight.angle = Math.PI / 6; 
    beamLight.penumbra = 0.3; // Adjust the penumbra value as desired
    beamLight.castShadow = true; // Enable shadow casting for the beam light
    
    beamLight.shadow.mapSize.width = 1024; 
    beamLight.shadow.mapSize.height = 1024; 
    beamLight.shadow.camera.near = 10; 
    beamLight.shadow.camera.far = 200;
}

function removeBeamlight(vehicle) {
  const beamLight = vehicle.getObjectByName("beamLight");
  if (beamLight) {
    vehicle.remove(beamLight);
  }
  
  const beamLightTarget = vehicle.getObjectByName("beamLightTarget");
  if (beamLightTarget) {
    vehicle.remove(beamLightTarget);
  }
}


function Car() {
    const car = new THREE.Group();
  
    const color = pickRandom(vehicleColors);
  
    const main = new THREE.Mesh(
      new THREE.BoxGeometry(60, 30, 15),
      new THREE.MeshLambertMaterial({ color })
    );
    main.position.z = 12;
    main.castShadow = true;
    main.receiveShadow = true;
    car.add(main);


    const carFrontTexture = getCarFrontTexture();
    carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
    carFrontTexture.rotation = Math.PI / 2;
  
    const carBackTexture = getCarFrontTexture();
    carBackTexture.center = new THREE.Vector2(0.5, 0.5);
    carBackTexture.rotation = -Math.PI / 2;
  
    const carLeftSideTexture = getCarSideTexture();
    carLeftSideTexture.flipY = false;
  
    const carRightSideTexture = getCarSideTexture();
  
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(33, 24, 12), [
      new THREE.MeshLambertMaterial({ map: carFrontTexture }),
      new THREE.MeshLambertMaterial({ map: carBackTexture }),
      new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
      new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
      new THREE.MeshLambertMaterial({ color: 0xffffff }), // top
      new THREE.MeshLambertMaterial({ color: 0xffffff }) // bottom
    ]);


    cabin.position.x = -6;
    cabin.position.z = 25.5;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    car.add(cabin);
  
    const backWheel = new Wheel();
    backWheel.position.x = -18;
    car.add(backWheel);
  
    const frontWheel = new Wheel();
    frontWheel.position.x = 18;
    car.add(frontWheel);
  
    if (config.showHitZones) {
      car.userData.hitZone1 = HitZone();
      car.userData.hitZone2 = HitZone();
    }
  
    return car;
}
  
function getTruckFrontTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");
  
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 32, 32);
  
    context.fillStyle = "#666666";
    context.fillRect(0, 5, 32, 10);
  
    return new THREE.CanvasTexture(canvas);
  }
  function getTruckSideTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");
  
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 32, 32);
  
    context.fillStyle = "#666666";
    context.fillRect(17, 5, 15, 10);
  
    return new THREE.CanvasTexture(canvas);
  }
  
function Truck() {
    const truck = new THREE.Group();
    const color = pickRandom(vehicleColors);
  
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(100, 25, 5),
      new THREE.MeshLambertMaterial({ color: 0xb4c6fc })
    );
    base.position.z = 10;
    truck.add(base);
  
    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(75, 35, 40),
      new THREE.MeshLambertMaterial({ color: 0xffffff }) // 0xb4c6fc
    );
    cargo.position.x = -15;
    cargo.position.z = 30;
    cargo.castShadow = true;
    cargo.receiveShadow = true;
    truck.add(cargo);
  
    const truckFrontTexture = getTruckFrontTexture();
    truckFrontTexture.center = new THREE.Vector2(0.5, 0.5);
    truckFrontTexture.rotation = Math.PI / 2;
  
    const truckLeftTexture = getTruckSideTexture();
    truckLeftTexture.flipY = false;
  
    const truckRightTexture = getTruckSideTexture();
  
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(25, 30, 30), [
      new THREE.MeshLambertMaterial({ color, map: truckFrontTexture }),
      new THREE.MeshLambertMaterial({ color }), // back
      new THREE.MeshLambertMaterial({ color, map: truckLeftTexture }),
      new THREE.MeshLambertMaterial({ color, map: truckRightTexture }),
      new THREE.MeshLambertMaterial({ color }), // top
      new THREE.MeshLambertMaterial({ color }) // bottom
    ]);
    cabin.position.x = 40;
    cabin.position.z = 20;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truck.add(cabin);
  
    const backWheel = Wheel();
    backWheel.position.x = -30;
    truck.add(backWheel);
  
    const middleWheel = Wheel();
    middleWheel.position.x = 10;
    truck.add(middleWheel);
  
    const frontWheel = Wheel();
    frontWheel.position.x = 38;
    truck.add(frontWheel);
  
    if (config.showHitZones) {
      truck.userData.hitZone1 = HitZone();
      truck.userData.hitZone2 = HitZone();
      truck.userData.hitZone3 = HitZone();
    }
  
    return truck;
  }
  function Tree() {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
    trunk.position.z = 10;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.matrixAutoUpdate = false;
    tree.add(trunk);
  
    const treeHeights = [45, 60, 75];
    const height = pickRandom(treeHeights);
  
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(height / 2, 30, 30),
      treeCrownMaterial
    );
    crown.position.z = height / 2 + 30;
    crown.castShadow = true;
    crown.receiveShadow = false;
    tree.add(crown);
  
    return tree;
  }