$.noConflict;
$(document).ready(function(){
  //hide init
  $(".gameInfo").hide();
  $(".danger").hide();

  //Set up ThreeJS scene
  var camera, scene, renderer, controls, enabled;
  
  //player control globals (boilerplate from examples and tutorials)
  var moveFront = false;
  var moveBack = false;
  var moveLeft = false;
  var moveRight = false;
  var playerVel = new THREE.Vector3();
  var playerSpeed = 2000;
  var clock;
  var player;
  var timeElapsed;
  var jewel;
  
  //enemies
  var enemies = [];
  //var enemy;
  var enemySpeed = 1000;
  
  //collision stuff
  var playerColDist = 20;
  var enemyColDist = 45;
  //array of collidable objects for collision detection
  var collideObjects = [];
  var energyObjects = [];
  var collidedEnergyObjects = [];
  var jewelObjects = [];
  
  
  //init functions
  init();
  //animate function
  animate();

  function init() {
    //set clock
    clock = new THREE.Clock();
    playerMovementController();
    
    //set up a new scene
    scene = new THREE.Scene();
    //add fog/environment so the whole env. is not immediately visible
    scene.fog = new THREE.FogExp2(0xcccccc, 0.0020);

    //render settings | boilerplate, pulled from MrDoob examples
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    //full screen
    renderer.setSize(window.innerWidth, window.innerHeight);

    //render into #container
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    
    //set up camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 2000);
    //adjust this for the character
    camera.position.y = 10;
    camera.position.x = 0;
    camera.position.z = 0;
    scene.add(camera);
    
    //add controls
    controls = new THREE.PointerLockControls(camera);
    controls.enabled = false;
    scene.add(controls.getObject());
    
    //renders maze and lights it
    initWorld();
    lightWorld();
    
    //boilerplate resize function jQuery port
    $(window).on('resize', function(){
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    //mess with controls
    $(document).on('click', function(){
      container.requestPointerLock();
    });
    $(document).on('pointerlockchange', function(){
      if (document.pointerLockElement == container) {
        $("#blocker").hide();
        controls.enabled = true;
      } else {
        $("#blocker").show();
        controls.enabled = false;
      }
    });
    
    loadAllEnemies();
  }    
  
  function initWorld() {
    //Maze is grid of cubes, 2D array rep.
    var map = [
      [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
      [0, 1, 2, 0, 0, 0, 1, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, ],
      [3, 1, 0, 0, 3, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 3, ],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 3, 0, 0, 0, 0, 0, ],
      [0, 1, 1, 0, 0, 0, 0, 2, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, ],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, ],
      [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, ],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 0, 2, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, ],
      [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, ],
      [0, 0, 0, 1, 0, 0, 0, 0, 3, 1, 1, 0, 1, 3, 1, 0, 0, 1, 1, 1, ],
      [3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, ],
      [0, 2, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, ],
      [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 3, 0, 0, ],
      [0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 3, 0, 0, 1, 0, 0, ],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
      [0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, ],
      [0, 3, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 99, ]
    ];
  
    /*
    var map = [
      [2, 0, 1, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 0],
      [0, 1, 1, 0, 0, 1, 0],
      [0, 0, 0, 0, 2, 1, 0],
      [1, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0],
      [1, 1, 0, 0, 1, 1, 0]
    ];
    */

    //Size of maze cubes
    var cubeWidth = 90;
    var cubeHeight = 400;
    
    var cubeGeom = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeWidth);
    var cubeTex = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    
    //offsets to keep cubes in ground plane
    var widthOffset = cubeWidth/2;
    var heightOffset = cubeHeight/2;
    
    //needed for iteration
    var mazeWidth = map[0].length;
    
    // Place walls where 1`s are
    for (var i = 0; i < mazeWidth; i++) {
      for (var j = 0; j < map[i].length; j++) {
        // If a 1 is found, add a cube at the corresponding position
        if (map[i][j] == 1) {
          // Make the cube
          var cube = new THREE.Mesh(cubeGeom, cubeTex);
          // Set the cube position
          cube.position.z = (i - mazeWidth / 2) * cubeWidth + widthOffset;
          cube.position.y = heightOffset;
          cube.position.x = (j - mazeWidth / 2) * cubeWidth + widthOffset;
          // Add the cube
          scene.add(cube);
          // Used later for collision detection
          collideObjects.push(cube);
        } else if (map[i][j] == 2) {
          loadEnemy((j - mazeWidth / 2) * cubeWidth + widthOffset, 21, (i - mazeWidth / 2) * cubeWidth + widthOffset);
        } else if (map[i][j] == 3) {
          loadEnergyObjects((j - mazeWidth / 2) * cubeWidth + widthOffset, 10, (i - mazeWidth / 2) * cubeWidth + widthOffset);
        } else if (map[i][j] == 99) {
          //Create jewel
          createJewel((j - mazeWidth / 2) * cubeWidth + widthOffset, 0, (i - mazeWidth / 2) * cubeWidth + widthOffset);
        }
      }
    }
    
    //!!!!!!!!!!!!!
    //now we create the floor
    var totalMapSize = cubeWidth * mazeWidth;
    var floorGeom = new THREE.PlaneGeometry(totalMapSize, totalMapSize);
    //make it look alike from both sides
    var floorTex = new THREE.MeshPhongMaterial({ color: 0x333333, side: THREE.DoubleSide})
    var floor = new THREE.Mesh(floorGeom, floorTex);
    floor.position.set(0, 1, 0);
    //rotate to fit
    floor.rotation.x = Math.PI/2;
    
    //add to scene
    scene.add(floor);
    
    //!!!!!!!!!!!!!!!!!!
    //now we make the walls so player cant fall/see off the floor plane
    var halfSize = totalMapSize/2;
    var sw = 1;
    
    for (var i = 0; i < 2; i++) {
      var pWall = new THREE.PlaneGeometry(totalMapSize, cubeHeight);
      var pWallMat = new THREE.MeshPhongMaterial({ color: 0x1d1f20, side: THREE.DoubleSide });
      
      //Two walls
      var pWallA = new THREE.Mesh(pWall, pWallMat);
      var pWallB = new THREE.Mesh(pWall, pWallMat);
      
      pWallA.position.set(halfSize * sw, cubeHeight/2, 0);
      pWallB.position.set(0, cubeHeight / 2, halfSize * sw);
      pWallA.rotation.y = Math.PI/2;
      scene.add(pWallA);
      scene.add(pWallB);
      collideObjects.push(pWallA);
      collideObjects.push(pWallB);
      
      sw = -1;
    }
  }
  
  function lightWorld() {
    //main light
    var dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1,1,1);
    scene.add(dirLight);
    //secondary light src
    var dirLightTwo = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLightTwo.position.set(1, -1, -1);
    scene.add(dirLightTwo);
  }
  
  //!!!!!!!!!
  //!!!!!!!!!
  //!!!!!!!!!
  //ANIMATE
  function animate() {
    requestAnimationFrame(animate);
    render();
    
    timeElapsed = clock.getDelta();
    movePlayer(timeElapsed);
    
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i].obj;
      if (enemy.position.distanceTo(controls.getObject().position) < 50) {
        controls.enabled = false;
        $("#instructions").html("Game Over. Suck less next time.<br>Refresh to try again.")
        $("#blocker").show();
      }
    }
    
    if (controls.enabled) {
      animateEnemy(timeElapsed);
      rotateEnergyObjects();
      checkEnergyCollision();
      checkJewelCollision();
    }
    
    renderer.render(scene, camera);
  }  
  //!!!!!!!!
  //!!!!!!!!
  //!!!!!!!!
  //END ANIMATE
  
  function playerMovementController() {
    function onKeyDown(event) {
      switch (event.keyCode) {
        //use both wasd and arrow keys
        case 38: 
        case 87: 
          moveFront = true;
          break;
        case 37: 
        case 65: 
          moveLeft = true;
          break;
        case 40: 
        case 83: 
          moveBack = true;
          break;
        case 39: 
        case 68: 
          moveRight = true;
          break;
      }
    }
    
    function onKeyUp(event) {
      switch (event.keyCode) {
        //use both wasd and arrow keys
        case 38: 
        case 87:
          moveFront = false;
          break;
        case 37: 
        case 65: 
          moveLeft = false;
          break;
        case 40: 
        case 83: 
          moveBack = false;
          break;
        case 39: 
        case 68: 
          moveRight = false;
          break;
      }
    }
    
    $(document).on('keydown', function(event){
      onKeyDown(event);
    });
    $(document).on('keyup', function(event){
      onKeyUp(event);
    });
  }
  
  function movePlayer(timeElapsed) {
    var energy = parseInt($(".energy-level").text());
    var playerSpeedAdj = playerSpeed;// * (energy/200);
    
    var aspectAdjust = energy;
    if (energy > 200) {
      aspectAdjust = 200;
    }
    camera.aspect = window.innerWidth/window.innerHeight + 5 * (1 - aspectAdjust/200);
    camera.updateProjectionMatrix();
    
    //increment
    playerVel.x = playerVel.x - playerVel.x * 10 * timeElapsed;
    playerVel.z = playerVel.z - playerVel.z * 10 * timeElapsed;
        
    //check direction of movement and increment velocity
    if (detectPlayerCol() == false && controls.enabled) {
      if (moveFront) {
        playerVel.z = playerVel.z - playerSpeedAdj * timeElapsed;
      } if (moveBack) {
        playerVel.z = playerVel.z + playerSpeedAdj * timeElapsed;
      } if (moveLeft) {
        playerVel.x = playerVel.x - playerSpeedAdj * timeElapsed;
      } if (moveRight) {
        playerVel.x = playerVel.x + playerSpeedAdj * timeElapsed;
      }
      
      controls.getObject().translateX(playerVel.x * timeElapsed);
      controls.getObject().translateZ(playerVel.z * timeElapsed);
    } else {
      playerVel.x = 0;
      playerVel.z = 0;
    }
  }
  
  function generateTexture() {
      var canvas = document.createElement( 'canvas' );
      canvas.width = 256;
      canvas.height = 256;
      var context = canvas.getContext( '2d' );
      var image = context.getImageData( 0, 0, 256, 256 );
      var x = 0, y = 0;
      for ( var i = 0, j = 0, l = image.data.length; i < l; i += 4, j ++ ) {
          x = j % 256;
          y = x == 0 ? y + 1 : y;
          image.data[ i ] = 255;
          image.data[ i + 1 ] = 255;
          image.data[ i + 2 ] = 255;
          image.data[ i + 3 ] = Math.floor( x ^ y );
      }
      context.putImageData( image, 0, 0 );
      return canvas;
  }
  
   //set up enemy 
  function loadEnemy(x,y,z) {
    var texture = new THREE.TextureLoader().load( './public/textures/enemy_calm.jpg' );
    var box = new THREE.BoxBufferGeometry( 40, 40, 40 );
    var boxMat = new THREE.MeshBasicMaterial( { map: texture } );
    var boxMat2 = new THREE.MeshPhongMaterial();

    var enemy = new THREE.Mesh(box, boxMat);
    enemy.rotation.y = Math.PI/2;
    enemy.position.set(x,y,z);
    enemy.name = "enemy";
    
    var enemyObj = {
      obj : enemy,
      velocity : new THREE.Vector3()
    }
    
    enemies.push(enemyObj);
  }
  
  function loadAllEnemies() {
    for (var i = 0; i < enemies.length; i++) {
      scene.add(enemies[i].obj);
    }
  }
  
  function animateEnemy(timeElapsed) {
    for (var i = 0; i < enemies.length; i++) {      
      //detect col
      var enemy = enemies[i].obj;
      var enemyVel = enemies[i].velocity;
      
      enemyVel.x = enemyVel.x - enemyVel.x * 10 * timeElapsed;
      enemyVel.z = enemyVel.z - enemyVel.z * 10 * timeElapsed;

      if (detectEnemyCol(i) == false) {
        enemyVel.z = enemyVel.z + enemySpeed * timeElapsed;
        enemy.translateZ(enemyVel.z * timeElapsed);
      } else {
        var dirMult = [-1,1,2];
        var randomIndex = Math.floor(Math.random() * (Math.floor(2) - Math.ceil(0))) + Math.ceil(0);
        var randomChosen = dirMult[randomIndex];
        var randomDir = Math.PI/180 * (90 * randomChosen);

        enemyVel.z = enemyVel.z + enemySpeed * timeElapsed;
        enemy.rotation.y += randomDir;
      }
      
      //chase on
      makeChase(i);
    }
  }
  
  function detectPlayerCol() {
    var rotMatrix;
    var cameraDir = controls.getDirection(new THREE.Vector3(0,0,0)).clone();
    if (moveBack) {
      rotMatrix = new THREE.Matrix4();
      rotMatrix.makeRotationY(Math.PI)
    } else if (moveLeft) {
      rotMatrix = new THREE.Matrix4();
      rotMatrix.makeRotationY(Math.PI/2);
    } else if (moveRight) {
      rotMatrix = new THREE.Matrix4();
      rotMatrix.makeRotationY(270 * Math.PI/180);
    }
    
    if (rotMatrix != undefined) {
      cameraDir.applyMatrix4(rotMatrix);
    }
    
    var rayCast = new THREE.Raycaster(controls.getObject().position, cameraDir);
    var intersections = rayCast.intersectObjects(collideObjects);
    for (var i = 0; i < intersections.length; i++) {
      //console.log(intersections[i]);
      if (intersections[i].distance < playerColDist) {
        return true;
      }
    }
    return false;
  }
  
  function detectEnemyCol(i) {
    var enemy = enemies[i].obj;
    var matrix = new THREE.Matrix4();
    matrix.extractRotation(enemy.matrix);
    var frontDir = new THREE.Vector3(0,0,1);
    frontDir.applyMatrix4(matrix);

    var rayCaster = new THREE.Raycaster(enemy.position, frontDir);
    var intersections = rayCaster.intersectObjects(collideObjects);
    for (var i = 0; i < intersections.length; i++) {
      if (intersections[i].distance < enemyColDist) {
        return true;
      }
    }
    return false;
  
  }
  
  function makeChase(i) {
    var enemy = enemies[i].obj;

    if (enemy.position.distanceTo(controls.getObject().position) < 300) {
      $(".danger").show().fadeOut("400");
      
      var new_texture = new THREE.TextureLoader().load( './public/textures/enemy.jpg' );
      enemy.material = new THREE.MeshBasicMaterial( { map: new_texture } );
      enemy.material.map.needsUpdate = true;
      
      var lookTarget = new THREE.Vector3();
      lookTarget.copy(controls.getObject().position);
      lookTarget.y = enemy.position.y;
            
      enemy.lookAt(lookTarget);

      var distFrom = Math.round(enemy.position.distanceTo(controls.getObject().position));
      return true;
    } else {
      return false;
    }
  }
  
  function checkEnergyCollision() {
    var playerPos = controls.getObject().position;
    for (var i = 0; i < energyObjects.length; i++) {
      var energyPos = energyObjects[i].position;
            
      if (Math.abs(playerPos.x - energyPos.x) < 50 && Math.abs(playerPos.z - energyPos.z) < 50) {
        if (collidedEnergyObjects.indexOf(energyObjects[i].name) == -1) {
          scene.remove(energyObjects[i]);
          addEnergy(25);
          console.log("truuuu");
          collidedEnergyObjects.push(energyObjects[i].name);
        }
      }
    }
  }
  
  function loadEnergyObjects(x,y,z) {
    var energyGeom = new THREE.SphereGeometry(5, 48, 48);
    var texture = new THREE.Texture( generateTexture() );
    texture.needsUpdate = true;
    
    var energyMat = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0xff0000, shininess: 30, shading: THREE.SmoothShading, map: texture, transparent: true } );
    var energy = new THREE.Mesh(energyGeom, energyMat);
    
    scene.add(energy);
    energy.position.set(x, 10, z);
    energy.name = "energy" + Math.random()*1987;
    
    energyObjects.push(energy);
  }
  
  function rotateEnergyObjects() {
    for (var i = 0; i < energyObjects.length; i++) {
      var energy = energyObjects[i];
      energy.rotation.x = (23.5/180)*Math.PI;
      energy.rotation.z = Date.now() * 0.001;
    }
  }
  
  function createJewel(x,y,z) {
    var customUni = {
        delta: { value: 0}
    };
    
    var jewelMat = new THREE.ShaderMaterial({
        uniforms: customUni,
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragmentShader2').textContent
    });
    
    var jewelGeom = new THREE.SphereGeometry(10, 200, 200);
    jewel = new THREE.Mesh(jewelGeom, jewelMat);
    scene.add(jewel);
    
    jewel.position.set(x, y, z);
    jewel.name = "jewel"
    jewelObjects.push(jewel);
  }
  
  var delta = 0;
  function render() {
    delta+=0.1;
    jewel.material.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.5;
  }
  
  function checkJewelCollision() {
    var playerPos = controls.getObject().position;
    var jewelPos = jewelObjects[0].position;

    if (Math.abs(playerPos.x - jewelPos.x) < 60 && Math.abs(playerPos.z - jewelPos.z) < 60) {
      scene.remove(jewelObjects[0]);
      controls.enabled = false;
      $("#blocker").empty().show();
      $(".gameInfo").show().html("Congratulations.<br>That was pointless.<br><br>But hey- you win.");
    }
  }
  
  /*******/
  /*******/
  /*******/
  /* GUI */
  setInterval(function(){
    var energy = parseInt($(".energy-level").text());
    //console.log(energy);
    if (controls.enabled) {
      if (energy > 0) {
        $(".energy-level").text(energy - 1);
      } else if (energy = 0) {
        //call end
      }
    }
  }, 600);
  
  function addEnergy(i) {
    $(".energy-level").text(parseInt($(".energy-level").text()) + i);
    $(".gameInfo").text("Energy +25").show().fadeOut("400");
  }
});










