var url = window.location.href;
console.log(url);
var socket = io(url);
var REFRESH_TIME = 10;
var index = 0;
var size;
var map;
var ballSize;
var score;
var food = [];
var userName;
var mousePos;
var map_userSpawnPosX=0;
var map_userSpawnPosY=0;

var users = new Array();
var userNames = [];
var userSpeed = [];
var userScore = [];
var userStatus = [];
var userPos = [];
var angles = [];
var food_posi = [];
var food_type = [];

var GameLayer = cc.Layer.extend({

        ctor: function(){
        this._super();

        socket.emit('user_name','test');
        var gameLayer=this;
        //cc.log("Game init");
         map = new cc.TMXTiledMap(res.map_tmx);

        socket.on('game_init_info',function(para){
            for(var i=0;i<para.direction.length;i++){
                angles[i] = para.direction[i];
            }
            for(var i=0;i<para.name.length;i++){
                userNames[i] = para.name[i];
            }
            for(var i=0;i<para.speed.length;i++){
                userSpeed[i] = para.speed[i];
            }
            for(var i=0;i<para.score.length;i++){
                userScore[i] = para.score[i];
            }
            for(var i=0;i<para.status.length;i++){
                userStatus[i] = para.status[i];
            }
            for(var i=0;i<para.position.length;i+=2){
                userPos[i] = para.position[i];
                userPos[i+1] = para.position[i+1];
            }
            for(var i=0;i<para.food.length;i+=2){
                food_posi[i] = para.food[i];
                food_posi[i+1] = para.food[i+1];
                addFoodOnMap(i/2,para.food[i],para.food[i+1]);
            }
            for(var i=0;i<para.food_type.length;i++){
                food_type[i] = para.food_type[i];
            }
        });


        socket.on('user_initial_position',function(x,y){
            map_userSpawnPosX=x;
            map_userSpawnPosY=y;
            size = cc.director.getWinSize();


            gameLayer.addChild(map, 0);


            socket.on("User_Add", function(para){
                users[para.index] = new cc.Sprite(res.ball_png);
                users[para.index].setAnchorPoint(0.5, 0.5);
                users[para.index].setScale(0.03);
                users[para.index].setPosition(100,100);
                userNames.push(para.name);
                userSpeed.push(0);
                angles.push(0);
                map.addChild(users[para.index],0);
                //new user movement
                window.setInterval(function () {
                    otherUsersMove(users[para.index], angles[para.index], 3);
                },REFRESH_TIME);

            });

            socket.on('food_add', function(para){
                if(para.type == 0){
                    food_posi[para.food_index*2] = para.posi_x;
                    food_posi[para.food_index*2+2] = para.posi_y;
                    food_type[para.food_index] = 0;
                    addFoodOnMap(para.food_index,para.posi_x,para.posi_y);
                }
            });



            var ball = new cc.Sprite(res.ball_png);
            ball.setAnchorPoint(0.5, 0.5);

            // set map position
            var scr_userSpawnPosX = size.width / 2 - map_userSpawnPosX;
            var scr_userSpawnPosY = size.height / 2 - map_userSpawnPosY;

            ball.setPosition(size.width / 2, size.height / 2);
            map.setPosition(scr_userSpawnPosX, scr_userSpawnPosY);
            ballSize = ball.getContentSize().width;
            ball.setScale(0.03);
            gameLayer.addChild(ball, 0);

            userName = new cc.LabelTTF("test", "Arial");
            userName.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            userName.setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            userName.setFontSize(ballSize / 2 * ball.getScale());
            userName.setPosition(cc.p(ball.getPositionX(), ball.getPositionY()));
            userName.setColor(cc.color(0, 0, 0));
            gameLayer.addChild(userName, 0);


            var REGULAR_UPDATES_RATE = 100;
            var speed = 0;
            var angle = 0;
            score = 0;
            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseMove: function (event) {
                    //change when have a new map
                    mousePos = event.getLocation();
                }
            }, ball);

            //update speed and angle
            window.setInterval(function () {
                ball.angle = calculateAngle(mousePos, ball, angle);
                ball.speed = 3 * calculateSpeed(mousePos, ball, speed, size);
                move(ball, ball.angle, ball.speed);
            }, REFRESH_TIME);

            //old users movement
            for(var i=0;i<index;i++){
                users[i] = new cc.Sprite(res.ball_png);
                users[i].setAnchorPoint(0.5, 0.5);
                users[i].setScale(calculatePlayerScale(users[i],userScore[i]));
                users[i].setPosition(userPos[i*2],userPos[i*2+1]);
                map.addChild(users[i],0);
            }
            window.setInterval(function () {
                for(var i=0;i<index;i++) {
                    otherUsersMove(users[i], angles[i], 3);
                }
            },REFRESH_TIME);



            //collision detection
            window.setInterval(function () {
                for (var i = 0; i < food_type.length; i++) {
                    //var currentBallScale = ball.getScale();
                    if (collisionDetection(ball, food[i])) {
                        HighLog("Collision: ball "+getUserPosition()[0]+" "+getUserPosition()[1]+ " food: "+food_posi[i*2]+" "+food_posi[i*2+1]);
                        socket.emit('food_eat', index, getUserPosition()[0],getUserPosition()[1],i,getUNIXTimestamp());
                    }
                }
            },REFRESH_TIME);

            socket.on('food_eat_succ', function(para){
                //any user who have eat a food will cause this.
                // if the food index and user index matched, then delete,
                //new scores will be sent to you
                HighLog("Food Eat Received");

                userScore[para.index] = para.score;
                lowLog(para.index +": "+ para.score);
                if(para.index == index){
                    ball.setScale(calculatePlayerScale(ball,userScore[index]));
                    userName.setFontSize((ballSize / 2) * calculatePlayerScale(ball,userScore[index]));
                }
                else{
                    users[para.index].setScale(calculatePlayerScale(users[para.index],userScore[index]));
                }
                map.removeChild(food[para.food_index], true);
            });

            //regular updates
            window.setInterval(function () {
                socket.emit('regular_updates', index,getUserPosition()[0],getUserPosition()[1], getUNIXTimestamp());
            }, REGULAR_UPDATES_RATE);
            return true;
        });

        socket.on('user_index',function(newIndex){
            index = newIndex;

        });

        socket.on('update_direction', function(para){
            if (para.index!=index) {
                //HighLog("angle: "+para.newDirection);
                angles[para.index] = para.newDirection;
                HighLog(para.index+" angle2: "+angles[para.index]);
            }
        });

        socket.on('update_speed', function(para){
            if (para.index!=index) {
                users[para.index].speed = para.speed;
            }
        });

        socket.on('update_position', function(para){
            users[para.index].setPositionX = para.posi_x;
            users[para.index].setPositionY = para.posi_y;
        });

        socket.on('update_status', function(para){
            users[para.index].status = para.status;
        });

        socket.on('update_score', function(para){
            users[para.index].score = para.score;
        });

        }


    /*
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

function move(ball, angle, speed){
    var isLeft = true;
    var isRight = true;
    var isUp = true;
    var isDown = true;
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
}

function otherUsersMove(ball, angle, speed){
    var isLeft = true;
    var isRight = true;
    var isUp = true;
    var isDown = true;
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    if(ball.x<0) isLeft = false;
    else isLeft = true;
    if(ball.x>map.width) isRight = false;
    else isRight = true;
    if(ball.y<0) isDown = false;
    else isDown = true;
    if(ball.y>map.height) isUp = false;
    else isUp = true;

    if(cos<0){
        if(isRight) ball.x-= speed * cos;
        if(sin<0){
            if(isUp) ball.y-= speed * sin;
        }else{
            if(isDown) ball.y -= speed * sin;
        }
    }else {
        if(isLeft) ball.x -= speed * cos;
        if(sin<0){
            if(isUp) ball.y -= speed * sin;
        }else{
            if(isDown) ball.y -= speed * sin;
        }
    }
}

//add on the map via client
function addFood(food_index){
    var food_pos_x = Math.round(Math.random()*map.width);
    var food_pos_y = Math.round(Math.random()*map.height);
    addFoodOnMap(food_index,food_pos_x,food_pos_y)
}

//add food based on server response
function addFoodOnMap(food_index,food_pos_x,food_pos_y){
    var random_num = Math.round(Math.random()*3);
    if(random_num == 0) food[food_index] = new cc.Sprite(res.food_red_png);
    if(random_num == 1) food[food_index] = new cc.Sprite(res.food_blue_png);
    if(random_num == 2) food[food_index] = new cc.Sprite(res.food_green_png);
    if(random_num == 3) food[food_index] = new cc.Sprite(res.food_purple_png);
    food[food_index].setAnchorPoint(0.5, 0.5);
    food[food_index].setPosition(food_pos_x, food_pos_y);
    food[food_index].setTag(food_index);
    map.addChild(food[food_index],0);
}

function collisionDetection(player, sprite2) {
    size = cc.director.getWinSize();
    var radius1 = player.getScale()*ballSize/2;
    var radius2 = sprite2.getScale();
    var playerX = size.width/2 - map.getPositionX();//mapCo_Player[0];
    var playerY = size.height/2- map.getPositionY();//mapCo_Player[1];
    var sprite2X = sprite2.getPositionX();
    var sprite2Y = sprite2.getPositionY();
    var distanceX = sprite2X - playerX;
    var distanceY = sprite2Y - playerY;
    var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < (radius1 + radius2))
        return true;
    else
        return false;
}



function calculateAngle(sourcePoint,targetPoint,angle){//ball - source, mouse - targetpoint
    var tempAngle = (Math.atan2(targetPoint.y-sourcePoint.y,targetPoint.x-sourcePoint.x));
    if (tempAngle != angle) {
        //upload server - angle changed
        //console.log("angle changed");
        socket.emit('update_user_direction',index,getUserPosition()[0],getUserPosition()[1],tempAngle,getUNIXTimestamp());
    }
    return tempAngle;
}

function calculateSpeed(sourcePoint,targetPoint,speed,size){//ball - source, mouse - targetpoint
    var tempSpeed = calculateSpeedAlgorithm(sourcePoint,targetPoint,size);
    if (tempSpeed != speed) {
        speed = tempSpeed;
        socket.emit('update_user_speed',index,getUserPosition()[0],getUserPosition()[1],tempSpeed,getUNIXTimestamp());
    }
    return tempSpeed;
}

function calculateSpeedAlgorithm(soucePoint,targetPoint,size){
    var x = (targetPoint.x-soucePoint.x)*(targetPoint.x-soucePoint.x);
    var y = (targetPoint.y-soucePoint.y)*(targetPoint.y-soucePoint.y);

    var distance = Math.sqrt(x+y);
    return 1;
}


function calculatePlayerScale(player, score){
    var scale;
    if(score<100){
        scale = 0.03+ score*0.005;
    }
    else{
        scale = 0.03+ 100*0.005 + (score-100)*0.0005;
    }
    return scale;
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
    return Math.floor(Date.now());//change the server accordingly.
}

function lowLog(msg){
    console.log("Low Log: "+ msg);
}

function HighLog(msg){
    //console.log("High Log: "+ msg);
}