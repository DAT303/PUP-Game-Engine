var LEFT = -1;
var RIGHT = 1;

var cache = new Array();

function initialiseGameEngine(canvas,level)
{
    window.addEventListener('keydown',level.keyPressed,true);
    window.addEventListener('keyup',level.keyReleased,true);
    window.addEventListener('mousedown',level.mousePressed,true);
    window.addEventListener('mouseup',level.mouseReleased,true);
    canvas.ontouchstart = level.touch;
    canvas.ontouchmove = level.touch;
    canvas.ontouchend = level.touchStop;
}

function storeData(d)
{
    data = d;
}

function isImageReady(image)
{
    return ((image != null) && (typeof image !== "undefined") && (image.width>0));
}

function loadImage(level,filename)
{
    if(filename == "") return null;
    if(cache[filename] != null) {
        return cache[filename];
    }
    else {
        var image = new Image();
        cache[filename] = image;
        image.src = "levels/" + level + "/media/" + filename;
        return image;
    }
}

function loadAudio(level,filename)
{
    if(cache[filename + ".audio"] != null) {
        return cache[filename + ".audio"];
    }
    else {
        var audio = new Object();
        cache[filename + ".audio"] = audio;
        audio.MP3 = document.createElement("audio");
        audio.MP3.setAttribute("src","levels/" + level + "/media/" + filename + ".mp3");
        audio.OGG = document.createElement("audio");
        audio.OGG.setAttribute("src","levels/" + level + "/media/" + filename + ".ogg");
        return audio;
    }
}

function playAudio(audio)
{
    if(typeof audio === "undefined") return;
    if((! hasSampleLoaded(audio.OGG)) && (! hasSampleLoaded(audio.MP3))) {
        console.log("Reloading " + audio.OGG.src);
        audio.OGG.setAttribute("src",audio.OGG.src);
        audio.MP3.setAttribute("src",audio.MP3.src);
    }
    if (hasSampleLoaded(audio.OGG)) audio.OGG.play();
    else if (hasSampleLoaded(audio.MP3)) audio.MP3.play();
}

function hasSampleLoaded(sample)
{
    return ((sample != null) && (typeof sample !== "undefined") && (sample.duration != 0) && (!isNaN(sample.duration)))
}

function stopAudio(audio)
{
    if(audio.OGG.currentTime != 0) {
        audio.OGG.pause();
        audio.OGG.currentTime=0;
    }
    else if(audio.MP3.currentTime != 0) {
        audio.MP3.pause();
        audio.MP3.currentTime=0;
    }
}