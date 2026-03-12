/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var SNIPCSS = SNIPCSS || {};

(function() {

SNIPCSS.KiwiWalker = function() 
{

    return this;
};


SNIPCSS.KiwiWalker.prototype =
{
    image : null,
    canvas : null,
    ctx : null,
    rows : 1,
    cols: 10,
    currFrame: 0,
    delay: 40,
    frameWidth: 100,
    frameHeight: 100,
    imgWidth : 0,
    imgHeight : 0,
    image_url : null,
    sound_url : "",
    totalFrames: 1,
    current_animation : 'left',  //left, down, downleft, squirm, dead
    animation_images : null,
    loaded_animations : 0,
    target_x : 500,
    target_y : 500,
    priority : 'down',
    isPecking: false,
    peckStartTime: null,
    TIMER_ID: -1,
    WALK_TIMER_ID : -1,
    isDead: false,
    kiwiDone : false,
    walk_speed : 3, 
    change_time : null,
    init : function(can, animationImages, targetX, targetY, walkSpeed){
        var me = this;
        this.canvas = can;
        this.ctx = this.canvas.getContext("2d");
        this.target_x = targetX;
        this.target_y = targetY;
        this.walk_speed = walkSpeed;
        //this.image_url = imageUrl;
        this.animation_images = animationImages;
        this.change_time = new Date().getTime();
        //console.log("IN INIT");
        //console.log(this.canvas);
        var totalAnimations = 4;
        for (var key in this.animation_images) {
            var imageUrl = animationImages[key]['url'];
            var aImage = new Image();
            (function(anImage, anUrl){ //start wrapper code
                
                me.animation_images[key]['image'] = anImage;

                anImage.onload = function(evt){
                    me.imgWidth = this.width;
                    me.imgHeight = this.height;
                    me.frameWidth = this.width / me.cols;
                    me.frameHeight = this.height / me.rows;

                    //console.log("DOING IT");
                    //console.log("img url: " + me.image_url);
                    //console.log("Frame width: " + me.frameWidth);
                    //console.log("Frame height: " + me.frameHeight);

                    me.totalFrames = me.rows * me.cols;
                    me.loaded_animations++;
                    //console.log("loaded " + anUrl + " totalAnimations " + totalAnimations + " VS " + me.loaded_animations);
                    if(totalAnimations == me.loaded_animations){
                        //
                        //alert("loaded all four");
                        //me.setupListener();
                        me.drawFrame(me.currFrame);
                        me.startWalking();
                    }
                    //Set timeout and draw each whatever sec
                    //
                    //
                };    

                anImage.crossOrigin = "anonymous";
                // anImage.src = anUrl;  
                anImage.src = chrome.runtime.getURL(anUrl);
            })(aImage, imageUrl); 
            
        }

        return this;
    },
    setFrameNum : function(cols){
       this.totalFrames = cols;
       this.cols = cols;
       this.frameWidth = this.imgWidth / this.cols;
       this.frameHeight = this.imgHeight / this.rows;       
       
       this.drawFrame(0);
       //this.removeListener();
       //this.setupListener();
    },
    removeListener : function(){
        $(this.canvas).unbind("mouseenter");
        $(this.canvas).unbind("mouseleave");  
    },
    startWalking : function(){
        this.startAnimation();
        var me = this;
        this.WALK_TIMER_ID = setInterval(function(){
            if(me.isDead){
                me.current_animation = "dead";
                me.drawFrame(0);
                me.stopAnimation();
                return;
            }
            
            //console.log(me.canvas);
            var currLeft = $(me.canvas).css('left');
            var currLeftInt = parseInt(currLeft.replace('px', ''));
            
            var currTop = $(me.canvas).css('top');
            var currTopInt = parseInt(currTop.replace('px', ''));            
            if(me.priority == 'left'){
                if(me.target_x < currLeftInt){
                    $(me.canvas).css('left', (currLeftInt - me.walk_speed).toString() + "px");
                    me.current_animation = "left";
                }else if(me.target_y > currTopInt){
                    $(me.canvas).css('top', (currTopInt + me.walk_speed).toString() + "px");
                    me.current_animation = "down";                
                }
                else{
                    me.current_animation = "peckleft";      
                    me.isPecking = true;
                    me.peckStartTime = new Date().getTime();
                    
                    /*
                    setTimeout(function(){
                        me.stopAnimation();
                        $(me.canvas).hide();
                    }, 5000);
                    */
                }
            }else{
                if(me.target_y > currTopInt){
                    $(me.canvas).css('top', (currTopInt + me.walk_speed).toString() + "px");
                    me.current_animation = "down";                
                }
                else if(me.target_x < currLeftInt){
                    $(me.canvas).css('left', (currLeftInt - me.walk_speed).toString() + "px");
                    me.current_animation = "left";
                }
                else{
                    me.current_animation = "peckleft";      
                    if(me.kiwiDone){
                        me.kiwiDone = false;
                        setTimeout(function(){
                            me.stopAnimation();
                            $(me.canvas).hide();                            
                        }, 4000);
                    }

                }                
            }
            
            var x = Math.random() * 100;
            var threshold = 99;
            var secPassed = (new Date().getTime()) - me.change_time;
            if(secPassed > 20){
                secPassed = 20;
            }
            
            if(x >= threshold){
                if(me.priority == 'left'){
                    me.priority = 'down';                    
                }else{
                    me.priority = 'left';                    
                }
                me.change_time = new Date().getTime();
            }
            
        }, 30);
    },
    googleKilledKiwi : function(){
        this.isDead = true;        
    },
    kiwiSuccess : function(){
        this.kiwiDone = true;
    },
    startAnimation : function(){
        var me = this;
        if(me.totalFrames > 1){
            window.clearInterval(me.TIMER_ID);
            me.TIMER_ID = setInterval(function(){
                me.currFrame++;
                if(me.currFrame >= me.totalFrames){
                    me.currFrame = 0;
                }
                me.drawFrame(me.currFrame);
            }, me.delay);       
        }        
    },    
    stopAnimation : function(){
        window.clearInterval(this.TIMER_ID);
        window.clearInterval(this.WALK_TIMER_ID);
        
    },    
    setupListener : function(){
        var me = this;
        
        if(me.totalFrames <= 1 && me.sound_url == null){
            //no extra frames or sound to play on hover
            return;
        }
        $(this.canvas).mouseenter(function(evt){
            if(me.totalFrames > 1){
                window.clearInterval(me.TIMER_ID);
                me.TIMER_ID = setInterval(function(){
                    me.currFrame++;
                    if(me.currFrame >= me.totalFrames){
                        me.currFrame = 0;
                    }
                    me.drawFrame(me.currFrame);
                }, me.delay);       
            }
            $('.objectselector_soundicon').remove();  
        }).mouseleave(function(){
            //console.log("MOUSE_LEAVE");            
            
            window.clearInterval(me.TIMER_ID);
        });
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

