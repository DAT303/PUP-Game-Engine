function Character(i)
{
    this.x = 0;
    this.y = 0;
    this.image = loadImage(globalLevelPointer.levelName,i);
    this.footsteps = loadAudio(globalLevelPointer.levelName,"footsteps");
    this.jump = loadAudio(globalLevelPointer.levelName,"jump");
    this.ouch = loadAudio(globalLevelPointer.levelName,"ouch");
    this.land = loadAudio(globalLevelPointer.levelName,"land");
    this.collectables = new Array();
    this.frameCounter = -0.5;
    this.walking = false;
}

Character.prototype.playJump = function()
{
    playAudio(this.jump);
}

Character.prototype.addCollectable = function(c)
{
    this.collectables[this.collectables.length] = c;
}

Character.prototype.playLand = function()
{
    playAudio(this.land);
}

Character.prototype.playFootsteps = function()
{
    playAudio(this.footsteps);
    this.walking = true;
}

Character.prototype.stopFootsteps = function()
{
    this.walking = false;
    stopAudio(this.footsteps);
}

Character.prototype.playOuch = function()
{
    playAudio(this.ouch);
}

Character.prototype.draw = function(graphics,offset)
{
    if(this.walking) this.frameCounter+=0.45;
    if(this.frameCounter > (this.image.width/this.image.height)-0.5) this.frameCounter = -0.5;
    var xpos = this.x-this.image.height/2;
    var ypos = this.y-this.image.height-(pixelScaling/2)+1;
    if(isImageReady(this.image)) {
        var bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = this.image.height;
        bufferCanvas.height = this.image.height;
        bufferGraphics = bufferCanvas.getContext("2d");
        bufferGraphics.scale(this.direction,1);
        var spriteSheetOffset = this.image.height * Math.round(this.frameCounter);
        if(this.direction == LEFT) bufferGraphics.drawImage(this.image,-bufferCanvas.width-spriteSheetOffset,0);
        else bufferGraphics.drawImage(this.image,-spriteSheetOffset,0);
        for(var i=0; i<this.collectables.length ;i++) {
            next = this.collectables[i].wearing;
            if(isImageReady(next)) {
                if(this.direction == LEFT) bufferGraphics.drawImage(next,-bufferCanvas.width,0);
                else bufferGraphics.drawImage(next,0,0);
            }
        }
        graphics.drawImage(bufferCanvas,xpos-offset,ypos);
    }        
}
