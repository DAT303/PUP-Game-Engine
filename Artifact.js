function Artifact(type,x,y)
{
    this.type = type;
    this.x = x;
    this.y = y;
    if((!this.isEmpty()) && (!this.isOrigin()) && (!this.isObjective()) && (!this.isStar()) && (!this.isPlatform())) {
        this.image = loadImage(globalLevelPointer.levelName,type+".png");
        this.activated = loadImage(globalLevelPointer.levelName,type+"+.png");
        this.wearing = loadImage(globalLevelPointer.levelName,type+"@.png");
        this.collection = loadAudio(globalLevelPointer.levelName,type+"@");
        this.activation = loadAudio(globalLevelPointer.levelName,type+"+");
        this.deactivation = loadAudio(globalLevelPointer.levelName,type);
    }
}

Artifact.prototype.isStar = function()
{
    return (this.type == "*");
}

Artifact.prototype.isEmpty = function()
{
    return (this.type == " ");
}

Artifact.prototype.isOrigin = function()
{
    return (this.type == "[");
}

Artifact.prototype.isObjective = function()
{
    return (this.type == "]");
}

Artifact.prototype.isPlatform = function()
{
    if((this.type == "[") || (this.type == "]") || (this.type == " ") || (this.type == "*")) return false;
    return (isNaN(this.type) && (this.type.toUpperCase() == this.type.toLowerCase()));
}

Artifact.prototype.isDanger = function()
{
    var ascii = this.type.charCodeAt(0);
    return ((ascii>=48) && (ascii<=57));
}

Artifact.prototype.isCollectable = function()
{
    if(this.hasActivatedImage()) return false;
    var ascii = this.type.charCodeAt(0);
    return ((ascii>=97) && (ascii<=122));
}

Artifact.prototype.isActivatable = function()
{
    if(!this.hasActivatedImage()) return false;
    var ascii = this.type.charCodeAt(0);
    return ((ascii>=97) && (ascii<=122));
}

Artifact.prototype.isPopup = function()
{
    var ascii = this.type.charCodeAt(0);
    return ((ascii>=65) && (ascii<=90));
}

Artifact.prototype.hasActivatedImage = function()
{
    if(this.activated==null) return false;
    return (this.activated.width > 0);
}

Artifact.prototype.primeActivation = function()
{
    this.primed = true;
}

Artifact.prototype.fireActivation = function()
{
    if(this.primed) {
        if(this.active) {
            this.active = false;
            playAudio(this.deactivation);
        }
        else {
            this.active = true;
            playAudio(this.activation);
        }
        this.primed = false;
    }
}

Artifact.prototype.isNotInside = function(fromX,fromY,toX,toY)
{
    return ((this.x<fromX) || (this.x>toX) || (this.y<fromY) || (this.y>toY));
}

Artifact.prototype.playCollection = function()
{
    playAudio(this.collection);
}

Artifact.prototype.showPopup = function()
{
    var xpos = (screen.width-880)/2;
    var ypos = (screen.height-600)/2;
    var settings = "height=600,width=880,top="+ypos+",left="+xpos+",scrollbars=no";
    window.open("popup.html?" + globalLevelPointer.levelName + "/popups/" + this.type + "0","",settings);
}

Artifact.prototype.draw = function(graphics,offset)
{
    if(!this.active && isImageReady(this.image)) {
        var xpos = (this.x*pixelScaling)-(this.image.width/2)+(pixelScaling/2);
        var ypos = (this.y*pixelScaling)-(this.image.height)+(pixelScaling);
        graphics.drawImage(this.image,xpos-offset,ypos);
    }
    else if(this.active && isImageReady(this.image)) {
        var xpos = (this.x*pixelScaling)-(this.activated.width/2)+(pixelScaling/2);
        var ypos = (this.y*pixelScaling)-(this.activated.height)+(pixelScaling);
        graphics.drawImage(this.activated,xpos-offset,ypos);
    }
}