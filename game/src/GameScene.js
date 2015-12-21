var url = window.location.href;
console.log(url);
var socket = io(url);
var index = 0;
var size;
var map;
var GameLayer = cc.Layer.extend({

        ctor: function(){
        this._super();

        socket.emit('user_name','test');

        //cc.log("Game init");

        size = cc.director.getWinSize();
        map = new cc.TMXTiledMap(res.map_tmx);
        this.addChild(map,0);



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
            var food_pos_x = Math.round(Math.random()*map.width);
            var food_pos_y = Math.round(Math.random()*map.height);

            var random_num = Math.round(Math.random()*3);
            if(random_num == 0) food[food_index] = new cc.Sprite(res.food_red_png);
            if(random_num == 1) food[food_index] = new cc.Sprite(res.food_blue_png);
            if(random_num == 2) food[food_index] = new cc.Sprite(res.food_green_png);
            if(random_num == 3) food[food_index] = new cc.Sprite(res.food_purple_png);
            food[food_index].setAnchorPoint(0.5, 0.5);
            food[food_index].setPosition(food_pos_x, food_pos_y);
            food[food_index].setTag(food_index);
            map.addChild(food[food_index],0);
            //cc.log("Food " + food_index + " location : " + food[food_index].getPositionX() + " " + food[food_index].getPositionY());
            food_index++;
        }

        // demo ended

        var ball = new cc.Sprite(res.ball_png);
        ball.setAnchorPoint(0.5, 0.5);

        var map_userSpawnPosX = Math.round(Math.random()*map.width);
        var map_userSpawnPosY = Math.round(Math.random()*map.height);
        // set map position
        var scr_userSpawnPosX = size.width/2 - map_userSpawnPosX;
        var scr_userSpawnPosY = size.height/2 - map_userSpawnPosY;

        ball.setPosition(size.width/2, size.height/2);
        map.setPosition(scr_userSpawnPosX, scr_userSpawnPosY);


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
            var isLeft = true;
            var isRight = true;
            var isUp = true;
            var isDown = true;
            angle = calculateAngle(mousePos,ball,angle);
            speed = 3*calculateSpeed(mousePos,ball,speed,size);
            var sin = Math.sin(angle);
            var cos = Math.cos(angle);


            if(map.getPositionX()>size.width/2-10) isLeft = false;
            else isLeft = true;
            if(map.getPositionX()<size.width/2-map.width+10) isRight = false;
            else isRight = true;
            if(map.getPositionY()<size.height/2-map.height+10) isDown = false;
            else isDown = true;
            if(map.getPositionY()>size.height/2-10) isUp = false;
            else isUp = true;

            if(cos<0){
                if(isRight) map.setPositionX(map.getPositionX() + speed * cos);
                if(sin<0){
                    if(isDown) map.setPositionY(map.getPositionY() + speed * sin);
                }else{
                    if(isUp) map.setPositionY(map.getPositionY() + speed * sin);
                }
            }else {
                if(isLeft) map.setPositionX(map.getPositionX() + speed * cos);
                if(sin<0){
                    if(isDown) map.setPositionY(map.getPositionY() + speed * sin);
                }else{
                    if(isUp) map.setPositionY(map.getPositionY() + speed * sin);
                }
            }


            for(var i=0;i<50;i++){
                if(collisionDetection(ball, food[i])){
                    ballsize = calculatePlayerSize(ball, food[i]);
                    ball.setScale(ball.getScale()+0.01);//ballsize/ball.getContentSize().height);
                    map.removeChild(food[i], true);
                }
                console.log(collisionDetection(ball, food[i]));
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
    size = cc.director.getWinSize();
    var radius1 = player.getScale()*10;
    //console.log("player.getScale(): "+radius1);
    var radius2 = sprite2.getScale();
    //console.log("player.getContentSize(): "+radius1+" sprite2.getContentSize(): "+radius2);
    //var mapCo_Player = screen2map(size.width/2,size.height/2);
    var playerX = size.width/2 - map.getPositionX();//mapCo_Player[0];
    var playerY = size.height/2- map.getPositionY();//mapCo_Player[1];
    //console.log("player position: "+playerX+ " "+playerY);
    //console.log("map position: "+ map.getPositionX()+ " "+ map.getPositionY());
    //var mapCo_sprite2 = screen2map(sprite2.getPositionX(),sprite2.getPositionY());
    var sprite2X = sprite2.getPositionX();
    var sprite2Y = sprite2.getPositionY();
    //console.log("food position: "+sprite2X+ " "+sprite2Y);
    var distanceX = sprite2X - playerX;
    var distanceY = sprite2Y - playerY;

    var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < (radius1 + radius2)) {
        return true;
    }
    else{
        return false;
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

function map2screen(mapX, mapY){
    var x = mapX + map.getPositionX();
    var y = mapY + map.getPositionY();
    return [x,y];
}

function screen2map(scrX, scrY){
    var x = scrX - map.getPositionX();
    var y = scrY - map.getPositionY();
    return [x,y];
}

function getUserPosition(){
    return screen2map(size.width/2, size.height/2);
}

function getUNIXTimestamp(){
    return Math.floor(Date.now());//change the server accodingly.
}

socket.on('user_index',function(newIndex){
    index = newIndex;
})