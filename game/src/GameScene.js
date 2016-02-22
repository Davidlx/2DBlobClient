var url = window.location.href;
console.log(url);
var socket = io(url);
var REFRESH_TIME = 15;
var INITIAL_SCORE = 5;
var gameLayer
var index = 0;
var size;
var map;
var ballSize;
var score;
var food = [];
var mousePos;
var map_userSpawnPosX=0;
var map_userSpawnPosY=0;
var stop = false;

var users = new Array();
var userNames = [];
var userLabels = [];
var userSpeed = [];
var userScore = [];
var userStatus = [];
var userPos = [];
var angles = [];
var food_posi = [];
var food_type = [];

var userName;
var scoreBox;
var network = 1000;
var networkLable;

var GameLayer = cc.Layer.extend({

        ctor: function(){
        this._super();

        socket.emit('user_name','test');
        gameLayer=this;
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
                lowLog("NEW USER ADD: "+para.index);
                users[para.index] = new cc.Sprite(res.ball_png);
                users[para.index].setAnchorPoint(0.5, 0.5);
                users[para.index].setScale(0.025);
                users[para.index].setPosition(100,100);
                userStatus[para.index]='running';
                userNames[para.index]=para.name;
                userSpeed[para.index]=0;
                angles[para.index]=0;
                map.addChild(users[para.index],0);

                userLabels[para.index] = new cc.LabelTTF("PH", "Arial");
                userLabels[para.index].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                userLabels[para.index].setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(INITIAL_SCORE));
                userLabels[para.index].setPosition(users[para.index].x, users[para.index].y);
                userLabels[para.index].setColor(cc.color(0, 0, 0));
                map.addChild(userLabels[para.index], 0);
                //new user movement

                window.setInterval(function () {
                    if(userStatus[para.index]=='running'){
                        lowLog("new user "+para.index+": "+ userStatus[para.index]);
                        otherUsersMove(users[para.index], angles[para.index], 3);
                        userLabels[para.index].setPosition(users[para.index].x, users[para.index].y);
                    }
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
            ball.setScale(0.025);
            gameLayer.addChild(ball, 0);

            userLabels[index] = new cc.LabelTTF("You", "Arial");
            userLabels[index].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            userLabels[index].setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            userLabels[index].setFontSize(ballSize / 2 * ball.getScale());
            userLabels[index].setPosition(cc.p(ball.getPositionX(), ball.getPositionY()));
            userLabels[index].setColor(cc.color(0, 0, 0));
            gameLayer.addChild(userLabels[index], 0);

            scoreBox = new cc.Sprite(res.scoreBox_png);
            scoreBox.setPosition(size.width - 180, 70);
            gameLayer.addChild(scoreBox);

            var REGULAR_UPDATES_RATE = 100;
            var speed = 0;
            var angle = 0;
            score = 5;

            var scoreLabel = new cc.LabelTTF("Score : " + score, "Arial");
            scoreLabel.setPosition(size.width - 180, 70);
            gameLayer.addChild(scoreLabel);

            networkLable = new cc.LabelTTF("Network Status : Excellent", "Arial");
            networkLable.setPosition(size.width - 180, 50);
            gameLayer.addChild(networkLable);

            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseMove: function (event) {
                    //change when have a new map
                    mousePos = event.getLocation();
                }
            }, ball);



            //old users ball
            for(var i=0;i<index;i++){
                if(userStatus[i]=='running'){
                    users[i] = new cc.Sprite(res.ball_png);
                    users[i].setAnchorPoint(0.5, 0.5);
                    users[i].setScale(calculatePlayerScale(userScore[i]));
                    users[i].setPosition(userPos[i*2],userPos[i*2+1]);
                    map.addChild(users[i],0);
                }
            }
            //old users label
            for(var i=0; i<userNames.length; i++){
                if(i!=index){
                    userLabels[i] = new cc.LabelTTF("PH", "Arial");
                    userLabels[i].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                    userLabels[i].setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                    userLabels[i].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[i]));
                    userLabels[i].setPosition(users[i].x, users[i].y);
                    userLabels[i].setColor(cc.color(0, 0, 0));
                    map.addChild(userLabels[i], 0);
                }
            }
            //old users movement
            window.setInterval(function () {
                for(var i=0;i<index;i++) {
                    if (userStatus[i]=='running'){
                        //lowLog(i+": "+ userStatus[i]);
                        otherUsersMove(users[i], angles[i], 3);
                        userLabels[i].setPosition(users[i].x, users[i].y);
                    }

                }
            },REFRESH_TIME);

            //update speed and angle
            window.setInterval(function () {
                if(stop){move(ball,0,0);}
                else {
                    ball.angle = calculateAngle(mousePos, ball, angle);
                    ball.speed = calculateSpeed(mousePos, ball, ball.speed, size);
                    move(ball, ball.angle, ball.speed);
                }
            }, REFRESH_TIME);

            //collision detection
            window.setInterval(function () {
                for (var i = 0; i < food_type.length; i++) {
                    if (collisionDetection(ball, food[i])) {
                        //HighLog("Collision: ball "+getUserPosition()[0]+" "+getUserPosition()[1]+ " food: "+food_posi[i*2]+" "+food_posi[i*2+1]);
                        socket.emit('food_eat', index, getUserPosition()[0],getUserPosition()[1],i,getUNIXTimestamp());
                        map.removeChild(food[i], true);
                    }
                }
            },REFRESH_TIME);

            window.setInterval(function () {
                for (var i = 0; i < users.length; i++) {
                    if(i!=index && userStatus[i]=='running') {
                        if(collisionDetection(ball, users[i])){
                            socket.emit('eat_user', index, getUserPosition()[0],getUserPosition()[1],i,getUNIXTimestamp());
                            HighLog("User Collision");
                        }

                    }
                }
            },REFRESH_TIME);

            socket.on('food_eat_succ', function(para){
                //any user who have eat a food will cause this.
                // if the food index and user index matched, then delete,
                //new scores will be sent to you
                HighLog("Food Eat Received");
                map.removeChild(food[para.food_index], true);
                userScore[para.index] = para.score;
                if(para.index == index){
                    ball.setScale(calculatePlayerScale(userScore[index]));
                    userLabels[index].setFontSize((ballSize / 2) * calculatePlayerScale(userScore[index]));
                    scoreLabel.setString("Score: " + para.score);
                }
                else{
                    users[para.index].setScale(calculatePlayerScale(userScore[para.index]));
                    userLabels[para.index].setFontSize((ballSize / 2) * calculatePlayerScale(userScore[para.index]));
                }
            });

            socket.on('user_eat_succ', function(para){
                //any user who have eat a food will cause this.
                // if the food index and user index matched, then delete,
                //new scores will be sent to you
                HighLog("User Eat Received");

                userScore[para.index] = para.score;
                if(para.index == index){
                    ball.setScale(calculatePlayerScale(userScore[para.index]));
                    userLabels[index].setFontSize((ballSize / 2) * calculatePlayerScale(userScore[index]));
                    lowLog("YOU HAVE EATEN A USER!");
                }else{
                    users[para.index].setScale(calculatePlayerScale(userScore[para.index]));
                    userLabels[para.index].setFontSize((ballSize / 2) * calculatePlayerScale(userScore[para.index]));
                }
                if(para.user_index==index){
                    gameOver(para.score);
                }else{
                    map.removeChild(users[para.user_index],true);
                    map.removeChild(userLabels[para.user_index],true);
                }

                users.splice(para.user_index,1);
                angles.splice(para.user_index,1);
                userScore.splice(para.user_index,1);
                userNames.splice(para.user_index,1);
                userSpeed.splice(para.user_index,1);
                userStatus.splice(para.user_index,1);
                userPos.splice(para.user_index*2,1);
                userPos.splice(para.user_index*2+1,1);
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
                angles[para.index] = para.newDirection;
            }
        });

        socket.on('update_speed', function(para){
            if (para.index!=index) {
                users[para.index].speed = para.speed;
            }
        });

        socket.on('update_position', function(para){
            users[para.index].setPositionX(para.posi_x);
            users[para.index].setPositionY(para.posi_y);
        });

        socket.on('status_update', function(para){
            userStatus[para.index] = para.status;
        });

        socket.on('update_score', function(para){
            users[para.index].score = para.score;
        });

        socket.on('updateAllUserLocation', function(para){
            HighLog("Update All Pos Received");
            for(var i=0; i<para.position.length; i+=2){
                if(i/2!=index){
                    users[i/2].x = para.position[i];
                    users[i/2].y = para.position[i+1];
                    HighLog("Update All Pos Proceed: "+i + " X: "+ users[i/2].x+  " Y: "+ users[i/2].y);
                }
            }
        });

        socket.on('user_leave', function(para){
            lowLog("User "+para.index+" has left 281");
            userStatus[para.index] = 'not running';
            map.removeChild(users[para.index],true);
            if(para.index==index){
                gameOver(para.score);
            }else{
                    map.removeChild(users[para.user_index],true);
            }
        });


        socket.on('timeLag', function(para){
          lowLog("Sending Time: "+para.sendingTime+" Receive Time "+para.currentTime+" Current Time: "+getUNIXTimestamp());
          network = getUNIXTimestamp() - para.sendingTime;
          var message = "";
          if (network <=50) {
            message = "Excellent";
          }else if (50<network&&network<=80) {
            message = "Good";
          }else if (80<network&&network<=100) {
            message = "Ok";
          }else{
            message = "bad";
          }
          networkLable.setString("Network Status : " + message+" "+network);
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
    if(ball.x<10) isLeft = false;
    else isLeft = true;
    if(ball.x>map.width-10) isRight = false;
    else isRight = true;
    if(ball.y<10) isDown = false;
    else isDown = true;
    if(ball.y>map.height-10) isUp = false;
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
    return 3;
}


function calculatePlayerScale(score){
    var scale;
    if(score<100){
        scale = score*0.005;
    }
    else{
        scale = 100*0.005 + (score-100)*0.0005;
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
    //console.log("Low Log: "+ msg);
}

function HighLog(msg){
    console.log("High Log: "+ msg);
}

/*function gameOver(){
    //TODO: GAME OVER PAGE
    lowLog("gg");
    size = cc.director.getWinSize();
    var info1 = new cc.LabelTTF("GAME OVER", "Arial");
    info1.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
    info1.setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
    info1.setFontSize(100);
    info1.setPosition(size.width/2,size.height/2-100);
    info1.setColor(cc.color(0, 0, 100));
    gameLayer.addChild(info1, 0);
    var info2 = new cc.LabelTTF("We are sorry but the game over page is still under construction \n Please refresh the website to reconnect.", "Arial");
    info2.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
    info2.setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
    info2.setFontSize(30);
    info2.setPosition(size.width/2,size.height/2+100);
    info2.setColor(cc.color(0, 0, 100));
    gameLayer.addChild(info2, 0);
}*/

function gameOver(score){
    var bg = new cc.Sprite(res.blackBG_png);

    bg.setPosition(size.width / 2, size.height / 2);
    gameLayer.addChild(bg, 0);

    var fade_action = cc.fadeIn(2);

    var box = new cc.Sprite(res.gameoverBox_png);
    box.setPosition(size.width/2, size.height/2);
    gameLayer.addChild(box, 0);
    box.setOpacity(0);
    box.runAction(fade_action);

    var scoreLabel = new cc.LabelTTF("Score : " + userScore[index], "Arial");
    scoreLabel.setPosition(size.width/2 + 10, size.height/2 + 60);
    scoreLabel.setFontSize(36);
    scoreLabel.setColor(0,0,0);
    gameLayer.addChild(scoreLabel);

    /*
    var label1 = new cc.LabelTTF("Did you enjoy the game?", "Arial");
    label1.setPosition(size.width/2 + 10, size.height/2 - 20);
    label1.setFontSize(20);
    label1.setColor(0,0,0);
    gameLayer.addChild(label1);
    */

    var label2 = new cc.LabelTTF("Please fill in our questionnaire to help us make the game better!", "Arial");
    label2.setPosition(size.width/2 + 10, size.height/2 - 20);
    label2.setFontSize(18);
    label2.setColor(0,0,0);
    gameLayer.addChild(label2);

    var url = new cc.LabelTTF("http://tp.sojump.cn/jq/7123174.aspx", "Arial");
    url.setPosition(size.width/2 + 10, size.height/2 - 40);
    url.setFontSize(16);
    url.setColor(255,0,0);
    gameLayer.addChild(url);

    var restartLabel = new cc.LabelTTF("Try again", "Verdana");
    restartLabel.setPosition(size.width/2 - 110, size.height/2 - 110);
    restartLabel.setFontSize(18);
    restartLabel.setColor(0,0,0);
    gameLayer.addChild(restartLabel);
    /*
     var restartLabel = new cc.MenuItemImage(
        "res/continue_up.png",
        "res/continue_down.png",
         function () {
            cc.log("restartLabel is clicked!");
            cc.director.pushScene(new cc.TransitionFade(1.2,new GameScene()));
         }, this);
         restartLabel.x = size.width / 2;
         restartLabel.y = size.height - 300;
     */

    var exitLabel = new cc.LabelTTF("Exit", "Verdana");
    exitLabel.setPosition(size.width/2 + 120, size.height/2 - 110);
    exitLabel.setFontSize(18);
    exitLabel.setColor(0,0,0);
    gameLayer.addChild(exitLabel);

    cc.eventManager.removeAllListeners();
}
