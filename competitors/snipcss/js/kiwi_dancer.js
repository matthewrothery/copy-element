/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var SNIPCSS = SNIPCSS || {};

(function() {

SNIPCSS.KiwiDancer = function() 
{

    return this;
};


SNIPCSS.KiwiDancer.prototype =
{
    image : null,
    canvas : null,
    ctx : null,
    currFrame: 1,
    beginFrame: 1,
    totalFrames: 53,
    delay: 1200,
    frameWidth: 64,
    frameHeight: 64,
    loaded_animations: 0,
    change_time : null,
    all_images: null,
    TIMER_ID: null,
    init : function(can, imageUrls){
        var me = this;
        this.canvas = can;
        this.ctx = this.canvas.getContext("2d");
        //this.image_url = imageUrl;
        this.loaded_animations = 0;
        this.animation_images = imageUrls;
        this.all_images = new Array();
        this.change_time = new Date().getTime();
        console.log("IN INIT");
        console.log(this.canvas);
        var totalAnimations = this.animation_images.length;
        this.totalFrames = totalAnimations;
        for (var x = 0; x < this.animation_images.length; x++) {
            var imageUrl = this.animation_images[x];
            console.log("image url " + imageUrl);
            var aImage = new Image();
            (function(anImage, anUrl){ //start wrapper code              
                anImage.onload = function(evt){
                    me.loaded_animations++;
                    console.log("loaded " + anUrl + " totalAnimations " + totalAnimations + " VS " + me.loaded_animations);
                    if(totalAnimations == me.loaded_animations){
                        me.beginDancing();
                    }
                };    

                anImage.crossOrigin = "anonymous";
                //anImage.src = anUrl;  
                anImage.src = chrome.runtime.getURL(anUrl);
            })(aImage, imageUrl); 
            this.all_images.push(aImage);
        }

        return this;
    },
    beginDancing : function(){
        var me = this;
        this.TIMER_ID = setInterval(function(){
            var theImage = me.all_images[me.currFrame];
            me.ctx.clearRect(0,0,me.canvas.width, me.canvas.height);
            me.ctx.drawImage(theImage, 0, 0, me.frameWidth, me.frameHeight, 0, 0, me.canvas.width, me.canvas.height);
            me.currFrame++;
            if(me.currFrame >= me.totalFrames){
                me.currFrame = 0;
            }            
        }, me.delay);
    },
    stopDancing : function(){
        window.clearInterval(this.TIMER_ID);
        
    },    
    drawFrame : function(x){
        
        //console.log("trying to draw frame: ");
        //console.log(x);
        
        var frameX = 0;
        var frameY = 0;
        
        var frameNum = 0;
        for(var i = 0; i < this.rows; i++){
            for(var j = 0; j < this.cols; j++){
                //console.log("comparing framenum " + frameNum + " and " + x);
                if(frameNum == x){
                    frameX = j * this.frameWidth;
                    frameY = i * this.frameHeight;
                }
                frameNum++;
            }
        }
        //console.log("framex: " + frameX);
        //console.log("framey: " + frameY);
        //console.log("frameWidth: " + this.frameWidth);
        //console.log("frameWidth: " + this.frameHeight);
        //console.log("canwidth: " + this.canvas.width);
        //console.log("canWidth: " + this.canvas.height);
        var theImage = this.animation_images[this.current_animation]['image'];
        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
        this.ctx.drawImage(theImage, frameX, frameY, this.frameWidth, this.frameHeight, 0, 0, this.canvas.width, this.canvas.height);
        
    }    
}


})();

