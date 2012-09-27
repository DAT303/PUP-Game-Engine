var goingLeft;
var goingRight;
var recoilLeft;
var recoilRight;
var jump;
var data;
var mapVisible = false;
var pixelScaling = 20;
var isFalling;
var jump = 0;
var fall = 2;
var airJumpTaken = false;
var globalLevelPointer;
var scrollingBufferDistance = 180;
var scrollSpeed = 8;

function Level(can,name)
{
    globalLevelPointer = this;
    this.canvas = can;
    this.graphics = can.getContext("2d");
    this.image = new Image();
    this.image.src = "levels/" + name + "/graphic.png";
    this.levelName = name;
    this.starCount = 0;
    this.offset = 0;
    var map = "levels/" + name + "/map.txt";
    $.ajax({ url: map, success: storeData, dataType: "text"});
}

Level.prototype.fillGrid = function()
{
    this.grid = new Array();
    var index = data.indexOf("\n");
    while(index != -1) {
        this.fillLine(this.grid,data.substring(0,index));
        data = data.substring(index+1,data.length);
        index = data.indexOf("\n");
    }
    this.fillLine(this.grid,data);
    var levelWidth = this.grid[0].length * pixelScaling;
    if(levelWidth > window.innerWidth-18) this.canvas.width = window.innerWidth-18;
    else this.canvas.width = levelWidth;
    this.canvas.height = this.grid.length * pixelScaling;
}

Level.prototype.fillLine = function(grid,line)
{
    this.grid[this.grid.length] = new Array();
    for(var i=0; i<line.length ;i++) {
        this.grid[this.grid.length-1][i] = new Artifact(line.charAt(i),i,this.grid.length-1);
        if(line.charAt(i) == "[") {
            this.player.x = i * pixelScaling;
            this.player.y = (this.grid.length-1) * pixelScaling;
        }
        else if(line.charAt(i) == "*") this.starCount++;
    }
}

Level.prototype.addPlayer = function(p)
{
    this.player = p;
    this.player.direction = RIGHT;
}

Level.prototype.draw = function()
{
    var offsettedLocation = this.player.x-this.offset;
    if(offsettedLocation > (this.canvas.width-scrollingBufferDistance)) this.offset+=scrollSpeed;
    else if(offsettedLocation < (scrollingBufferDistance)) this.offset-=scrollSpeed;
    if(this.offset<0) this.offset = 0;
    if(this.offset>this.image.width-this.canvas.width) this.offset = this.image.width-this.canvas.width;
    
    if((this.grid == null) && (data != null)) this.fillGrid();
    this.graphics.fillStyle = "#000";
    if(isImageReady(this.image)) this.graphics.drawImage(this.image,0-this.offset,0);
    else this.graphics.fillRect(0,0,this.canvas.width,this.canvas.height);
    
    this.walking = false;
    if(goingLeft || recoilLeft) {
        if(this.tryToMoveTo(this.player.x-walkingSpeed,this.player.y)) this.walking = true;
        this.player.direction = LEFT;
    }
    if(goingRight || recoilRight) {
        if(this.tryToMoveTo(this.player.x+walkingSpeed,this.player.y)) this.walking = true;
        this.player.direction = RIGHT;
    }
    
    // If we are on the way up
    if(jump > 0) {
        this.walking = false;
        if(this.tryToMoveTo(this.player.x,this.player.y-(jumpSpeed*Math.sin(jump/jumpDuration))));
        else jump = 0;
        jump--;
        if(jump==0) {
            fall = 3;
            this.applyGravity();
        }
    }
    else this.applyGravity();
    
    // Look around us
    this.collectNearbyCollectables(this.player.x,this.player.y);
    this.activateNearbyActivatables(this.player.x,this.player.y);
    if(this.isTouchingDanger(this.player.x,this.player.y)) this.recoil();
    if((this.hasReachedObjective(this.player.x,this.player.y)) && (this.starCount==0)) this.gameOver();
    
    if(this.walking) this.player.playFootsteps();
    else this.player.stopFootsteps();

    this.drawArtifacts();
    if(mapVisible) this.drawMapOverlay();
    this.player.draw(this.graphics,this.offset);
}

Level.prototype.gameOver = function()
{
    this.player.stopFootsteps();
    alert("Game Over");
    this.player.x = -9999;
}

Level.prototype.recoil = function(distance)
{
    this.player.playOuch();
    jump=jumpDuration;
    // Jump either left of right (to prevent just bouncing)
    if(goingRight) {
        recoilLeft = true;
        recoilRight = false;
    }
    else if(goingLeft) {
        recoilLeft = false;
        recoilRight = true;
    }
    else if(Math.random() >= 0.5) {
        recoilLeft = false;
        recoilRight = true;
    }
    else {
        recoilLeft = true;
        recoilRight = false;
    }
}

Level.prototype.applyGravity = function(distance)
{
    if(this.fallBy(fall)) { 
        this.walking = false;
        fall = fall*(1+gravity);
        // Set the terminal velocity
        if((this.player.image.height > 0) && (fall > this.player.image.height)) {
            fall = this.player.image.height;
        }
    }
    // Shuffle down the last few pixels to ensure we are in contact with ground
    else while(this.fallBy(1));
}

Level.prototype.fallBy = function(distance)
{
    var attempt = this.tryToMoveTo(this.player.x,this.player.y+distance);
    // If we have hit the ground
    if(isFalling && (attempt==false)) {
        this.player.playLand();
        airJumpTaken = false;
        recoilLeft = false;
        recoilRight = false;
    }
    isFalling = attempt;
    return attempt;
}

Level.prototype.tryToMoveTo = function(xpos,ypos)
{
    if( ! this.isTouchingPlatform(xpos,ypos)) {
        this.player.x = xpos;
        this.player.y = ypos;
        return true;
    }
    else return false;
}

Level.prototype.calculateFromAndTo = function(xpos,ypos)
{
    this.fromX = Math.round((xpos-collisionWidth/2)/pixelScaling);
    this.fromY = Math.round((ypos-collisionHeight)/pixelScaling);
    this.toX = Math.round((xpos+collisionWidth/2)/pixelScaling);
    this.toY = Math.round(ypos/pixelScaling);
    if(this.fromX<0) this.fromX = 0;
    if(this.fromY<0) this.fromY = 0;
    if(this.toX>this.grid[0].length) this.toX = this.grid[0].length;
    if(this.toY>this.grid.length) this.toY = this.grid.length;
}

Level.prototype.isTouchingPlatform = function(xpos,ypos)
{
    if(this.grid == null) return false;
    this.calculateFromAndTo(xpos,ypos);
    for(var y=this.fromY; y<this.toY ;y++) {
        for(var x=this.fromX; x<this.toX ;x++) {
            if(this.grid[y][x].isPlatform()) {
                return true;
            }
        }
    }
    return false;
}

Level.prototype.isTouchingDanger = function(xpos,ypos)
{
    if(this.grid == null) return false;
    this.calculateFromAndTo(xpos,ypos);
    for(var y=this.fromY; y<this.toY ;y++) {
        for(var x=this.fromX; x<this.toX ;x++) {
            if(this.grid[y][x].isDanger()) return true;
        }
    }
    return false;
}

Level.prototype.hasReachedObjective = function(xpos,ypos)
{
    if(this.grid == null) return false;
    this.calculateFromAndTo(xpos,ypos);
    for(var y=this.fromY; y<this.toY ;y++) {
        for(var x=this.fromX; x<this.toX ;x++) {
            if(this.grid[y][x].isObjective()) return true;
        }
    }
    return false;
}

Level.prototype.collectNearbyCollectables = function(xpos,ypos)
{
    if(this.grid == null) return;
    this.calculateFromAndTo(xpos,ypos);
    for(var y=this.fromY; y<this.toY ;y++) {
        for(var x=this.fromX; x<this.toX ;x++) {
            if(this.grid[y][x].isCollectable()) {
                this.grid[y][x].playCollection();
                this.player.addCollectable(this.grid[y][x]);
                this.grid[y][x] = new Artifact(" ",y,x);
            }
            else if(this.grid[y][x].isStar()) {
                this.starCount--;
                this.grid[y][x] = new Artifact(" ",y,x);
            }
        }
    }
}

Level.prototype.activateNearbyActivatables = function(xpos,ypos)
{
    if(this.grid == null) return;
    this.calculateFromAndTo(xpos,ypos);
    for(var y=0; y<this.grid.length ;y++) {
        for(var x=0; x<this.grid[y].length ;x++) {
            if(this.grid[y][x].isNotInside(this.fromX,this.fromY,this.toX,this.toY)) {
                this.grid[y][x].primeActivation();
            }
        }
    }

    for(var y=this.fromY; y<this.toY ;y++) {
        for(var x=this.fromX; x<this.toX ;x++) {
            if(this.grid[y][x].isActivatable()) this.grid[y][x].fireActivation();
        }
    }
}

Level.prototype.keyPressed = function(event)
{
    try { event.preventDefault(); } catch(error) {}
    if((event.keyCode == 88) || (event.keyCode == 39)) {
        if((jump>0) || isFalling) {
            if(airSteerAllowed) goingRight = true;
        }
        else goingRight = true;
    }
    else if((event.keyCode == 90) || (event.keyCode == 37)) {
        if((jump>0) || isFalling) {
            if(airSteerAllowed) goingLeft = true;
        }
        else goingLeft = true;
    }
    else if((event.keyCode == 32) || (event.keyCode == 38)) {
        if((jump>0) || isFalling) {
            if(airJumpAllowed && !airJumpTaken) {
                jump = jumpDuration;
                this.player.playJump();
                airJumpTaken = true;
            }
        }
        else {
            jump = jumpDuration;
            this.player.playJump();
        }
    }
}

Level.prototype.keyReleased = function(event)
{
    try { event.preventDefault(); } catch(error) {}
    if((event.keyCode == 88) || (event.keyCode == 39)) goingRight = false;
    else if((event.keyCode == 90) || (event.keyCode == 37)) goingLeft = false;
}

Level.prototype.touch = function(event)
{
    event.preventDefault();
    var xpos = event.touches[0].pageX;
    var ypos = event.touches[0].pageY;
    var keyEvent = new Object();
    if(ypos < 150) {
        keyEvent.keyCode = 32;
        globalLevelPointer.keyPressed(keyEvent);
    }
    if(xpos > globalLevelPointer.canvas.width/2) {
        keyEvent.keyCode = 88;
        globalLevelPointer.keyPressed(keyEvent);
    }
    if(xpos < globalLevelPointer.canvas.width/2) {
        keyEvent.keyCode = 90;
        globalLevelPointer.keyPressed(keyEvent);
    }
}

Level.prototype.touchStop = function(event)
{
    event.preventDefault();
    var keyEvent = new Object();
    keyEvent.keyCode = 32;
    globalLevelPointer.keyReleased(keyEvent);
    keyEvent.keyCode = 88;
    globalLevelPointer.keyReleased(keyEvent);
    keyEvent.keyCode = 90;
    globalLevelPointer.keyReleased(keyEvent);
}

Level.prototype.drawArtifacts = function()
{
    if(this.grid != null) {
        for(var y=0; y<this.grid.length ;y++) {
            for(var x=0; x<this.grid[y].length ;x++) {
                this.grid[y][x].draw(this.graphics,this.offset);
            }
        }
    }
}

Level.prototype.drawMapOverlay = function()
{
    if(this.grid != null) {
        for(var y=0; y<this.grid.length ;y++) {
            for(var x=0; x<this.grid[y].length ;x++) {
                if(this.grid[y][x].isEmpty()) this.graphics.fillStyle = "rgba(255, 255, 255, 0)";
                else if(this.grid[y][x].isPlatform()) this.graphics.fillStyle = "#000";
                else if(this.grid[y][x].isDanger()) this.graphics.fillStyle = "#F00";
                else if(this.grid[y][x].isOrigin()) this.graphics.fillStyle = "#FF0";
                else if(this.grid[y][x].isStar()) this.graphics.fillStyle = "#DDD";
                else if(this.grid[y][x].isObjective()) this.graphics.fillStyle = "#FF0";
                else if(this.grid[y][x].isCollectable()) this.graphics.fillStyle = "#FA0";
                else if(this.grid[y][x].isActivatable()) this.graphics.fillStyle = "#0F0";
                else if(this.grid[y][x].isPopup()) this.graphics.fillStyle = "#00F";
                this.graphics.fillRect(x*pixelScaling-this.offset,y*pixelScaling,pixelScaling,pixelScaling);
            }
        }
    }
}

Level.prototype.mousePressed = function(event)
{
    if(event.shiftKey) mapVisible = true;
}

Level.prototype.mouseReleased = function(event)
{
    if(event.shiftKey) mapVisible = false;
    else {
        var y = Math.round(event.pageY/pixelScaling)-1;
        // 8 seems to be the min margin/padding
        var xoff = globalLevelPointer.canvas.offsetLeft-globalLevelPointer.offset-8;
        var x = Math.round((event.pageX-xoff)/pixelScaling)-1;
        var target = globalLevelPointer.grid[y][x];
        if(target.isPopup()) target.showPopup();
        else if(target.isActivatable()) {
            target.primeActivation();
            target.fireActivation();
        }
    }
}

Level.prototype.openDoors = function()
{
    this.doors = true;
}

Level.prototype.closeDoors = function()
{
    this.doors = false;
}