var game = new Phaser.Game(1400, 380, Phaser.CANVAS, 'phaser', { preload: preload, create: create, update: update});

function preload() {

    game.load.tilemap('level1', 'assets/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', 'assets/tiles-1.png');
    game.load.spritesheet('cat', 'assets/cat.png', 48, 43);
    game.load.spritesheet('dog', 'assets/dog.png', 64, 32);
	game.load.spritesheet('goat', 'assets/goat.png', 37, 39);
	game.load.spritesheet('bee', 'assets/bee.png', 28, 32);
    game.load.image('henLeg', 'assets/henLeg.png');
    game.load.image('starBig', 'assets/star2.png');
    game.load.image('background', 'assets/background2.png'); // need to change

}

var map;
var tileset;
var layer;
var player;
var facing = 'right';
var jumpTimer = 0;
var cursors;
var jumpButton;
var bg;

var bees;
var dogs;
var goats;
var henLegs;

var lives = 9;
var score = 0;
var scoreText;
var stateText;

var groundLayer;
var waterLayer;
var decorationLayer;
var finishPoint;

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.stage.backgroundColor = '#000000';

  bg = game.add.tileSprite(0, 0, 1400, 380, 'background');
  bg.fixedToCamera = true;

  map = game.add.tilemap('level1');
  map.addTilesetImage('tiles-1');
  groundLayer = map.createLayer('GroundLayer');
  waterLayer = map.createLayer('WaterLayer');
  decorationLayer = map.createLayer('DecorationLayer');
  finishPoint = map.createLayer('FinishPoint');
  map.setCollisionBetween( 1, 16, true, 'GroundLayer');
  map.setCollisionBetween( 18, 19, true, 'WaterLayer');
  map.setCollisionBetween( 17, 17, true, 'FinishPoint');

  groundLayer.resizeWorld();

  game.physics.arcade.gravity.y = 250;

  player = game.add.sprite(48, 43, 'cat');
  game.physics.enable(player, Phaser.Physics.ARCADE);

  player.body.bounce.y = 0.2;
  player.body.collideWorldBounds = true;
  player.body.setSize(20, 32, 5, 16);

  player.animations.add('left', [0, 1, 2, 3], 10, true);
  player.animations.add('turn', [4], 20, true);
  player.animations.add('right', [5, 6, 7, 8], 10, true);

  game.camera.follow(player);

	//bees
  bees = game.add.group();
  bees.enableBody = true;
  bees.physicsBodyType = Phaser.Physics.ARCADE;
  createBees();
	
	//dogs
	dogs = game.add.group();
  dogs.enableBody = true;
	createDogs();
	
	//goats
	goats = game.add.group();
  goats.enableBody = true;
  for (var i = 0; i < 10; i++)
  {  
	var goat = goats.create(i * 400 + 150, 150, 'goat');
      goat.body.gravity.y = 200 + Math.random() * 0.2;

	goat.animations.add('walk', [ 0, 1, 2, 3 ], 12, true);
	goat.play('walk');
		
	goat.body.velocity.x = -20;
  }
	
	//henLegs
  henLegs = game.add.group();
  henLegs.enableBody = true;

  for (var i = 0; i < 50; i++){
    var henLeg = henLegs.create(i * 70, 120 * Math.random(), 'henLeg');
    henLeg.body.gravity.y = 300;
    henLeg.body.bounce.y = 0.7 + Math.random() * 0.2;
  }
	
  //The score
  scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#fff' });
  scoreText.fixedToCamera = true;
  scoreText.cameraOffset.setTo(16, 16);

  //The lives
  liveText = game.add.text(200, 16, 'Lives: 9', { fontSize: '32px', fill: '#fff' });
  liveText.fixedToCamera = true;
  liveText.cameraOffset.setTo(200, 16);

//Game over text
  stateText = game.add.text(500, 100, " GAME OVER \n Click to restart", { font: '84px Arial', fill: '#fff' }); // подправить координаты
  stateText.fixedToCamera = true;
  stateText.visible = false;

  //Game complite text
  gameCompleteText = game.add.text(500, 100, "Game Complete \n Your score ", { font: '84px Arial', fill: '#fff' }); // подправить координаты
  gameCompleteText.fixedToCamera = true;
  gameCompleteText.visible = false;

  cursors = game.input.keyboard.createCursorKeys();
  jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}


function update() {
	
	//Collide
  game.physics.arcade.collide(player, groundLayer);
	game.physics.arcade.collide(henLegs, groundLayer);
	game.physics.arcade.collide(goats, groundLayer);
	game.physics.arcade.collide(dogs, groundLayer);
	
	//Overlap
  game.physics.arcade.overlap(player, henLegs, eatHenLegs, null, this);
	game.physics.arcade.overlap(player, dogs, goatAttack, null, this);// goatAttack - the same
	game.physics.arcade.overlap(player, goats, goatAttack, null, this);
	game.physics.arcade.overlap(player, bees, beeBeatsCat, null, this);
  game.physics.arcade.overlap(player, waterLayer, waterKill, null, this);
  game.physics.arcade.overlap(player, finishPoint, gameComplete, null, this);

	
	//Reset the players velocity
  player.body.velocity.x = 0;

  if (cursors.left.isDown){
    player.body.velocity.x = -150;
    if (facing != 'left'){
        player.animations.play('left');
        facing = 'left';
    }
  }
  else if (cursors.right.isDown){
    player.body.velocity.x = 150;

    if (facing != 'right'){	
        player.animations.play('right');
        facing = 'right';
    }
  }
  else{
    if (facing != 'idle'){
      player.animations.stop();
      if (facing == 'left'){
          player.frame = 0;
      }
      else{
          player.frame = 5;
      }	
      facing = 'idle';
    }
  }
  
  if ((jumpButton.isDown || cursors.up.isDown) && player.body.onFloor() && game.time.now > jumpTimer){
    player.body.velocity.y = -250;
    jumpTimer = game.time.now + 750;
  }
}

function createDogs() {
	for (var i = 0; i < 10; i++){  
		var dog = dogs.create(i * 400 + 400, 150, 'dog');
		dog.body.gravity.y = 200 + Math.random() * 0.2;
	
		dog.animations.add('walk', [ 0, 1, 2, 3 ], 15, true);
		dog.play('walk');
			
		dog.body.velocity.x = -80;
	}
}

function createBees() {
  for (var y = 1; y < 4; y++){
    for (var x = 1; x < 6; x++){
      var bee = bees.create(x * 400 * (0.5 + Math.random()) + 50, y * 20 * (0.5 + Math.random()), 'bee');
      //bee.anchor.setTo(0.5, 0.5);
      bee.animations.add('fly', [ 0, 1, 2, 3 ], 15, true);
      bee.play('fly');
      bee.body.moves = false;
    }
  }
  // start the bees moving. we're moving the Group they belong to, rather than the bees directly.
  var tween = game.add.tween(bees).to( { x: 300 }, 6000, Phaser.Easing.Linear.None, true, 0, 1000, true);
  //  When the tween loops it calls descend
  tween.onLoop.add(descend, this);
}

function descend() {
  bees.y += 5;
}

function eatHenLegs (player, henLeg) {
  henLeg.kill();	
  score += 10;
  scoreText.text = 'Score: ' + score;
}

function beeBeatsCat (player, bee) {
	bee.kill();   
    lives -= 1;
    liveText.text = 'Lives: ' + lives;
	if (lives < 1) {
		gameOver();
	}
}

function goatAttack (player, goat) {
    goat.kill();    
    lives -= 1;
    liveText.text = 'Lives: ' + lives;	
	if (lives < 1) {
		gameOver();
	}
}

function gameOver(){
  player.kill();
  stateText.visible = true;
  //the "click to restart" handler
  game.input.onTap.addOnce(restart,this);
}

function restart() {
  lives = 9;
  score = 0;
  create();
  game.camera.follow(player);
}

function waterKill(){
  gameOver();
}

function gameComplete(){
  gameCompleteText.text = 'Game Complete \n Your score ' + score;
  gameCompleteText.visible = true;
}
