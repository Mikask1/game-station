
const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = (1/3) * Math.PI;

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY/outerTrackRadius);

const arcCenterX = (
    Math.cos(arcAngle1) * innerTrackRadius + 
    Math.cos(arcAngle2) * outerTrackRadius
)/2;

const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);
const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);
const trackColor = "#546E90";

function getLineMarkings(mapWidth, mapHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const context = canvas.getContext("2d");
  
    context.fillStyle = trackColor;
    context.fillRect(0, 0, mapWidth, mapHeight);
  
    context.lineWidth = 2;
    context.strokeStyle = "#E0FFFF";
    context.setLineDash([10, 14]);
  
    // Left circle
    context.beginPath();
    context.arc(
      mapWidth / 2 - arcCenterX,
      mapHeight / 2,
      trackRadius,
      0,
      Math.PI * 2
    );
    context.stroke();
  
    // Right circle
    context.beginPath();
    context.arc(
      mapWidth / 2 + arcCenterX,
      mapHeight / 2,
      trackRadius,
      0,
      Math.PI * 2
    );
    context.stroke();
  
    return new THREE.CanvasTexture(canvas);
}

function getLeftIsland() {
    const islandLeft = new THREE.Shape();
  
    islandLeft.absarc(
      -arcCenterX,
      0,
      innerTrackRadius,
      arcAngle1,
      -arcAngle1,
      false
    );
  
    islandLeft.absarc(
      arcCenterX,
      0,
      outerTrackRadius,
      Math.PI + arcAngle2,
      Math.PI - arcAngle2,
      true
    );
  
    return islandLeft;
}
  
function getMiddleIsland() {
    const islandMiddle = new THREE.Shape();
  
    islandMiddle.absarc(
      -arcCenterX,
      0,
      innerTrackRadius,
      arcAngle3,
      -arcAngle3,
      true
    );
  
    islandMiddle.absarc(
      arcCenterX,
      0,
      innerTrackRadius,
      Math.PI + arcAngle3,
      Math.PI - arcAngle3,
      true
    );
  
    return islandMiddle;
  }
  
  function getRightIsland() {
    const islandRight = new THREE.Shape();
  
    islandRight.absarc(
      arcCenterX,
      0,
      innerTrackRadius,
      Math.PI - arcAngle1,
      Math.PI + arcAngle1,
      true
    );
  
    islandRight.absarc(
      -arcCenterX,
      0,
      outerTrackRadius,
      -arcAngle2,
      arcAngle2,
      false
    );
  
    return islandRight;
  }
  
  function getOuterField(mapWidth, mapHeight){
    const field = new THREE.Shape();
    
    field.moveTo(-mapWidth / 2, -mapHeight / 2);
    field.lineTo(0, -mapHeight / 2);
  
    field.absarc(-arcCenterX, 0, outerTrackRadius, -arcAngle4, arcAngle4, true);
  
    field.absarc(
        arcCenterX,
        0,
        outerTrackRadius,
        Math.PI - arcAngle4,
        Math.PI + arcAngle4,
        true
    );
    

    field.lineTo(0, -mapHeight / 2);
    field.lineTo(mapWidth / 2, -mapHeight / 2);
    field.lineTo(mapWidth / 2, mapHeight / 2);
    field.lineTo(-mapWidth / 2, mapHeight / 2);
  
    return field;
}


  
function renderMap(mapWidth, mapHeight){

    const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);
    const planeGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
    const planeMaterial = new THREE.MeshLambertMaterial({
        // color: 0x54e90,
        map: lineMarkingsTexture,
    });
    
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    //extruded geometry
    const islandLeft = getLeftIsland();
    const islandRight = getRightIsland();
    const islandMiddle = getMiddleIsland();
    const outerField = getOuterField();

    const fieldGeometry = new THREE.ExtrudeGeometry(
        [islandLeft, islandRight, islandMiddle, outerField],
        { depth: 6, bevelEnabled: false}
      );
    
    const fieldMesh = new THREE.Mesh(fieldGeometry, [
        new THREE.MeshLambertMaterial({color: 0x67c240}),
        new THREE.MeshLambertMaterial({color: 0x23311c}),
    ]);

    scene.add(fieldMesh);

}
