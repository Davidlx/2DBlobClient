var url = window.location.href;
console.log(url);
var socket = io(url);
var index = 0;
var GameLayer = cc.Layer.extend({

        ctor: function(){
        this._super();

        socket.emit('user_name','test');

        //cc.log("Game init");
        var size = cc.director.getWinSize();

        var bg = new cc.Sprite(res.game_bg_png);
        bg.x = size.width/2;
        bg.y = size.height/2;
        this.addChild(bg,0);

        var MAX_FOOD_NUM = 100;
        var food = new Array(MAX_FOOD_NUM);
        var food_index = 0;

        /* real code when server is online
        io.emit('place_food',function(food_pos_x, food_pos_y){
            var random_num = Math.round(Math.random()*3);
            if(random_num == 0) food[food_index] = new cc.Sprite(res.food_red_png);
            if(random_num == 1) food[food_index] = new cc.Sprite(res.food_blue_png);
            if(random_num == 2) food[food_index] = new cc.Sprite(res.food_green_png);
            if(random_num == 3) food[food_index] = new cc.Sprite(res.food_purple_png);
            food[food_index].setAnchorPoint(0.5, 0.5);
            food[food_index].setPosition(food_pos_x, food_pos_y);
            this.addChild(food[food_index],0);
            food_index++;
        });
        */


        //The following is for demo
        for(var i=0;i<50;i++){
            var food_pos_x = Math.round(Math.random()*size.width);
            var food_pos_y = Math.round(Math.random()*size.height);

            var random_num = Math.round(Math.random()*3);
            if(random_num == 0) food[food_index] = new cc.Sprite(res.food_red_png);
            if(random_num == 1) food[food_index] = new cc.Sprite(res.food_blue_png);
            if(random_num == 2) food[food_index] = new cc.Sprite(res.food_green_png);
            if(random_num == 3) food[food_index] = new cc.Sprite(res.food_purple_png);
            food[food_index].setAnchorPoint(0.5, 0.5);
            food[food_index].setPosition(food_pos_x, food_pos_y);
            food[food_index].setTag(food_index);
            this.addChild(food[food_index],0);
            //cc.log("Food " + food_index + " location : " + food[food_index].getPositionX() + " " + food[food_index].getPositionY());
            food_index++;
        }

        // demo ended
        var ball = new cc.Sprite(res.ball_png);
        ball.setAnchorPoint(0.5, 0.5);
        ball.setPosition(size.width/2, size.height/2);

        this.addChild(ball,0);
        var REFRESH_TIME = 10;
        var REGULAR_UPDATES_RATE = 100;
        var speed = 0;
        var angle = 0;
        var ballsize = 1;
        var mousePos;
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseMove: function (event) {
                //change when have a new map
                mousePos = event.getLocation();
            }
        },ball);

        window.setInterval(function(){

            angle = calculateAngle(mousePos,ball,angle);
            speed = calculateSpeed(mousePos,ball,speed,size);
            var sin = Math.sin(angle);
            var cos = Math.cos(angle);
            ball.x = ball.x - speed*cos;
            ball.y = ball.y - speed*sin;

            for(var i=0;i<50;i++){
                if(collisionDetection(ball, food[i])){
                    ballsize = calculatePlayerSize(ball, food[i]);
                    ball.setScale(ballsize/ball.getContentSize().height);
                    food[i].getParent().removeChildByTag(food[i].getTag(), true);
                }
            }
            //cc.log("Player X : " + ball.x + " Y : " + ball.y);
        }, REFRESH_TIME);

        //regular updates
        window.setInterval(function(){
            socket.emit('regular_updates',index,ball.x,ball.y,getUNIXTimestamp());
        }, REGULAR_UPDATES_RATE);

        return true;
    },

    /*
    addFood: function(){
        for(var i=0;i<50;i++){
            var food_pos_x = Math.round(Math.random()*size.width);
            var food_pos_y = Math.round(Math.random()*size.height);

            var random_num = Math.round(Math.random()*3);
            if(random_num == 0) oneFood = new cc.Sprite(res.food_red_png);
            if(random_num == 1) oneFood = new cc.Sprite(res.food_blue_png);
            if(random_num == 2) oneFood = new cc.Sprite(res.food_green_png);
            if(random_num == 3) oneFood = new cc.Sprite(res.food_purple_png);
            this.food.push(oneFood);
            oneFood.setAnchorPoint(0.5, 0.5);
            oneFood.setPosition(food_pos_x, food_pos_y);
            oneFood.setTag(food_index);
            this.addChild(oneFood,0);
            //cc.log("Food " + food_index + " location : " + food[food_index].getPositionX() + " " + food[food_index].getPositionY());
            food_index++;
        }
    },

    deleteFood: function(sprite){
        var i = this.food.indexOf(sprite);
        if(i > -1) {
            this.food.splice(i,1);        
        }
        this.food[i].getParent().removeChildByTag(food[i].getTag(), true);
    }
    */

});

var GameScene = cc.Scene.extend({
    onEnter:function(){
        this._super();
        var layer = new GameLayer;
        this.addChild(layer);
        layer.init();
    }
});


function collisionDetection(player, sprite2) {
    var radius1 = player.getContentSize().height / 2;
    var radius2 = sprite2.getContentSize().height / 2;

    var distanceX = sprite2.getPositionX() - player.getPositionX();
    var distanceY = sprite2.getPositionY() - player.getPositionY();
    var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < (radius1 + radius2)) {
        return true;
    }
}



function calculateAngle(soucePoint,targetPoint,angle){//ball - source, mouse - targetpoint
    var tempAngle = (Math.atan2(targetPoint.y-soucePoint.y,targetPoint.x-soucePoint.x));
    if (tempAngle != angle) {
        //upload server - angle changed
        //console.log("angle changed");
        socket.emit('update_user_direction',index,soucePoint.x,soucePoint.y,tempAngle,getUNIXTimestamp());
    }
    return tempAngle;
}

function calculateSpeed(soucePoint,targetPoint,speed,size){//ball - source, mouse - targetpoint
    var tempSpeed = calculateSpeedAlgorithm(soucePoint,targetPoint,size);
    if (tempSpeed != speed) {
        //upload server - angle changed
        //console.log("speed changed");
        socket.emit('update_user_speed',index,soucePoint.x,soucePoint.y,tempSpeed,getUNIXTimestamp());
    }
    return tempSpeed;
}

function calculateSpeedAlgorithm(soucePoint,targetPoint,size){
    var x = (targetPoint.x-soucePoint.x)*(targetPoint.x-soucePoint.x);
    var y = (targetPoint.y-soucePoint.y)*(targetPoint.y-soucePoint.y);

    var distance = Math.sqrt(x+y);
    return 1;
}


function calculatePlayerSize(player,sprite){
    var size = player.getContentSize().height + sprite.getContentSize().height;
    return size;
}


function updateClientStatus(ball,mousePos,speed,angle){}

function getUNIXTimestamp(){
    return Math.floor(Date.now());//change the server accodingly.
}

socket.on('user_index',function(newIndex){
    index = newIndex;
})