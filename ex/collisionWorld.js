var World = Class.extend({
    // Class constructor
    init: function(args) {
        'use strict';
        // Set the different geometries composing the room
        var ground = new THREE.PlaneGeometry(512, 2048),
          ceiling = new THREE.PlaneGeometry(512, 2048),
          height = 256,
          walls = [
              new THREE.PlaneGeometry(ground.height, height),
              new THREE.PlaneGeometry(ground.width, height),
              new THREE.PlaneGeometry(ground.height, height),
              new THREE.PlaneGeometry(ground.width, height)
          ],
          obstacles = [
              new THREE.CubeGeometry(128, 64, 64)
          ],
          // Set the material, the "skin"
          material = new THREE.MeshLambertMaterial(args),
          i;
      
      
        // Set the "world" modelisation object
        this.mesh = new THREE.Object3D();
        // Set and add the ground
        this.ground = new THREE.Mesh(ground, material);
        this.ceiling = new THREE.Mesh(ground, material);
        this.ground.rotation.x = -Math.PI / 2;
        
        this.ceiling.rotation.x = (-Math.PI / 2);
        this.ceiling.rotation.y = Math.PI;
        this.ceiling.position.y = 256;
        
        this.mesh.add(this.ground);
        this.mesh.add(this.ceiling);
        
        // Set and add the walls
        this.walls = [];
        for (i = 0; i < walls.length; i += 1) {
            this.walls.push(new THREE.Mesh(walls[i], material));
            this.walls[i].position.y = height / 2;
            this.mesh.add(this.walls[i]);
        }
        
        //left wall
        this.walls[0].rotation.y = -Math.PI / 2;
        this.walls[0].position.x = ground.width / 2;
        //front wall
        this.walls[1].rotation.y = Math.PI;
        this.walls[1].position.z = ground.height / 2;
        //right wall
        this.walls[2].rotation.y = Math.PI / 2;
        this.walls[2].position.x = -ground.width / 2 - 200;
        //back wall
        this.walls[3].position.z = -ground.height / 2;
      
        // Set and add the obstacles
        this.obstacles = [];
        for (i = 0; i < obstacles.length; i += 1) {
            this.obstacles.push(new THREE.Mesh(obstacles[i], material));
            this.mesh.add(this.obstacles[i]);
        }
        this.obstacles[0].position.set(120, 32, 128);
    },
    getObstacles: function() {
        'use strict';
        return this.obstacles.concat(this.walls);
    }
});