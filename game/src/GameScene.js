var url = window.location.href;
console.log(url);
var socket = io(url);
var REFRESH_TIME = 15;
var INITIAL_SCORE = 10;
var INITIAL_SPEED = 3;
var REGULAR_UPDATES_RATE = 15;
var POWER_UP_TIME = 3000;

var gameLayer;
var index = 0;
var size;
var map;
var ballSize;
var food = [];
var mousePos;
var map_userSpawnPosX=0;
var map_userSpawnPosY=0;
var stop = false;

var users = [];
var userNames = [];
var userLabels = [];
var angle = 0;
var speed = INITIAL_SPEED;
var isSpeedUp = false;
var isShrink = false;
var isReverse = false;
var userScore = [];
var userStatus = [];
var userPos = [];
var angles = [];
var food_posi = [];
var food_type = [];

var foodBox;

var scoreBox;
var network = 1000;
var networkLable;
var latestTS = 0;

var promptLabel;
var promptBox;
var ifPrompt = false;

var urlAddress;
var restartLabel;
var exitLabel;

var GameLayer = cc.Layer.extend({

        ctor: function(){
        this._super();
        gameLayer=this;
         map = new cc.TMXTiledMap(res.map_tmx);

        socket.on('game_init_info',function(para){
            for(var i=0;i<para.name.length;i++){
                userNames[i] = para.name[i];
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
                food_type[i] = para.food_type[i];
                addFoodOnMap(i/2,para.food_type[i/2],para.food[i],para.food[i+1]);
            }
        });


        socket.on('user_initial_position',function(x,y){
            map_userSpawnPosX=x;
            map_userSpawnPosY=y;
            size = cc.director.getWinSize();


            gameLayer.addChild(map, 0);


            socket.on("User_Add", function(para){
                if(para.ai==true){
                    users[para.index] = new cc.Sprite(res.AI_png);
                }
                else{
                    users[para.index] = new cc.Sprite(res.ball_png);
                }
                users[para.index].setAnchorPoint(0.5, 0.5);
                users[para.index].setScale(calculatePlayerScale(INITIAL_SCORE));
                users[para.index].setPosition(-1000,-1000);// make it outside the screen(there is a 1 second transiting animation)
                if(para.ai==true){
                    userStatus[para.index]='AI';
                }
                else{
                    userStatus[para.index]='running';
                }
                userNames[para.index]=para.name;
                angles[para.index]=0;
                map.addChild(users[para.index],0);

                userLabels[para.index] = new cc.LabelTTF(para.name, "Arial");
                userLabels[para.index].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                userLabels[para.index].setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(INITIAL_SCORE)*(4/userNames[para.index].length));
                userLabels[para.index].setPosition(users[para.index].x, users[para.index].y);
                userLabels[para.index].setColor(cc.color(0, 0, 0));
                map.addChild(userLabels[para.index], 0);

            });

            socket.on('food_add', function(para){
                food_posi[para.food_index*2] = para.posi_x;
                food_posi[para.food_index*2+2] = para.posi_y;
                food_type[para.food_index] = para.food_type;
                addFoodOnMap(para.food_index,para.food_type[para.food_index], para.posi_x,para.posi_y);
            });


            var ball = new cc.Sprite(res.ball_png);
            ball.setAnchorPoint(0.5, 0.5);

            // set map position
            var scr_userSpawnPosX = size.width / 2 - map_userSpawnPosX;
            var scr_userSpawnPosY = size.height / 2 - map_userSpawnPosY;

            ball.setPosition(size.width / 2, size.height / 2);
            map.setPosition(scr_userSpawnPosX, scr_userSpawnPosY);
            ballSize = ball.getContentSize().width;
            ball.setScale(calculatePlayerScale(INITIAL_SCORE));
            gameLayer.addChild(ball, 0);

            userLabels[index] = new cc.LabelTTF(userNames[index], "Arial");
            userLabels[index].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            userLabels[index].setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            if(userNames[index].length>3){
                userLabels[index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[index])*(4/userNames[index].length));
            }
            else{
                userLabels[index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[index]));
            }
            userLabels[index].setPosition(cc.p(ball.getPositionX(), ball.getPositionY()));
            userLabels[index].setColor(cc.color(0, 0, 0));
            gameLayer.addChild(userLabels[index], 0);


            foodBox = new cc.Sprite(res.scoreBox_png);
            foodBox.setScaleX(1.2);
            foodBox.setPosition(180, size.height - 80);
            foodBox.setOpacity(10);
            gameLayer.addChild(foodBox);

            var foodLabel = new cc.LabelTTF("Special Food", "Verdana");
            foodLabel.setScale(1.5);
            foodLabel.setPosition(180, size.height - 50);
            foodLabel.setColor(cc.color(47,79,79));
            gameLayer.addChild(foodLabel);

            var speedupItem = new cc.Sprite(res.speed_up_png);
            speedupItem.setPosition(50, size.height - 80);
            gameLayer.addChild(speedupItem);
            var speedupLabel = new cc.LabelTTF("Speed-up Food", "Optima");
            speedupLabel.setPosition(120, size.height - 80);
            speedupLabel.setColor(cc.color(47,79,79));
            gameLayer.addChild(speedupLabel);
            
            var poisonItem = new cc.Sprite(res.poison_png);
            poisonItem.setPosition(220, size.height - 80);
            gameLayer.addChild(poisonItem);
            var poisonLabel = new cc.LabelTTF("Poison Food", "Optima");
            poisonLabel.setPosition(280, size.height - 80);
            poisonLabel.setColor(cc.color(47,79,79));
            gameLayer.addChild(poisonLabel);
            
            var shrinkItem = new cc.Sprite(res.shrink_png);
            shrinkItem.setPosition(50, size.height - 100);
            gameLayer.addChild(shrinkItem);
            var shrinkLabel = new cc.LabelTTF("Shrink Food", "Optima");
            shrinkLabel.setPosition(120, size.height - 100);
            shrinkLabel.setColor(cc.color(47,79,79));
            gameLayer.addChild(shrinkLabel);
   
            var reverseItem = new cc.Sprite(res.reverse_png);
            reverseItem.setPosition(220, size.height - 100);
            gameLayer.addChild(reverseItem);
            var reverseLabel = new cc.LabelTTF("Reverse Food", "Optima");
            reverseLabel.setPosition(280, size.height - 100);
            reverseLabel.setColor(cc.color(47,79,79));
            gameLayer.addChild(reverseLabel);


            scoreBox = new cc.Sprite(res.scoreBox_png);
            scoreBox.setPosition(size.width - 180, 70);
            gameLayer.addChild(scoreBox);

            var scoreLabel = new cc.LabelTTF("Score : " + userScore[index], "Arial");
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
            },ball);



            //old users ball
            for(var i=0;i<index;i++){
              if(userStatus[i] == 'AI'){
                  users[i] = new cc.Sprite(res.AI_png);
              }
              else{
                users[i] = new cc.Sprite(res.ball_png);
              }
              users[i].setAnchorPoint(0.5, 0.5);
              users[i].setScale(calculatePlayerScale(userScore[i]));
              users[i].setPosition(userPos[i*2],userPos[i*2+1]);
                if(userStatus[i]!='not started'){
                    map.addChild(users[i],0);
                }
            }
            //old users label
            for(var i=0; i<userNames.length; i++){
                if(i!=index){
                    userLabels[i] = new cc.LabelTTF(userNames[i], "Arial");
                    userLabels[i].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                    userLabels[i].setVerticalAlignment(cc.TEXT_ALIGNMENT_CENTER);
                    if(userNames[i].length>3){
                        userLabels[i].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[i])*(4/userNames[i].length));
                    }
                    else{
                        userLabels[i].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[i]));
                    }
                    userLabels[i].setPosition(users[i].x, users[i].y);
                    userLabels[i].setColor(cc.color(0, 0, 0));
                    if(userStatus[i]!='not started'){
                        map.addChild(userLabels[i], 0);
                    }

                }
            }
            //update speed and angle
            window.setInterval(function () {
                if(stop){move(ball,0,0);}
                else {
                    ball.angle = calculateAngle(mousePos, ball, angle);
                    ball.speed = speed;
                    move(ball, ball.angle, ball.speed);
                }
            }, REFRESH_TIME);

            //collision detection
            window.setInterval(function () {
                for (var i = 0; i < food_type.length; i++) {
                    if (collisionDetection(ball, food[i])) {
                        socket.emit('food_eat', index, getUserPosition()[0],getUserPosition()[1],i,getUNIXTimestamp());
                        map.removeChild(food[i], true);
                    }
                }
            },REFRESH_TIME);

            window.setInterval(function () {
                for (var i = 0; i < users.length; i++) {
                    if(i!=index && userStatus[i]!='not started') {
                        if(collisionDetection(ball, users[i])){
                            socket.emit('eat_user', index, getUserPosition()[0],getUserPosition()[1],i,ball.getScale(),users[i].getScale(),getUNIXTimestamp());
                        }

                    }
                }
            },REFRESH_TIME);

            socket.on('food_eat_succ', function(para){
                //any user who have eat a food will cause this.
                // if the food index and user index matched, then delete,
                //new scores will be sent to you
                map.removeChild(food[para.food_index], true);
                userScore[para.index] = para.score;
                if(para.index == index){

                    ball.setScale(calculatePlayerScale(userScore[index]));
                    speed = calculateSpeedAlgorithm(calculatePlayerScale(userScore[index]));
                    if(userNames[para.index].length>3){
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index])*(4/userNames[para.index].length));
                    }
                    else{
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index]));
                    }
                    scoreLabel.setString("Score: " + para.score);

                    //Speed up
                    if(para.food_type == 1)
                    {
                        if(isSpeedUp == false)
                        {
                            isSpeedUp = true;
                            speed = calculateSpeedAlgorithm(calculatePlayerScale(userScore[index]));

                            window.setTimeout(function(){
                                    isSpeedUp = false;
                                    speed = calculateSpeedAlgorithm(calculatePlayerScale(userScore[index]));
                            },POWER_UP_TIME);

                            if(ifPrompt == false){
                                ifPrompt = true;
                                promptLabel = displayPrompt(1);
                                promptBox = displayPromptBox();
                            }else{
                                gameLayer.removeChild(promptLabel);
                                gameLayer.removeChild(promptBox);
                                promptLabel = displayPrompt(1);
                                promptBox = displayPromptBox();
                            }
                        }
                    }
                    else if(para.food_type == 2){
                        if(ifPrompt == false){
                            ifPrompt = true;
                            promptLabel = displayPrompt(2);
                            promptBox = displayPromptBox();
                        }else{
                            gameLayer.removeChild(promptLabel);
                            gameLayer.removeChild(promptBox);
                            promptLabel = displayPrompt(2);
                            promptBox = displayPromptBox();
                        }
                    }
                    else if(para.food_type == 3)
                    {
                        if(isShrink == false)
                        {
                            isShrink = true;
                            ball.setScale(calculatePlayerScale(userScore[index]));
                            speed = calculateSpeedAlgorithm(ball.getScale());
                            socket.emit("update_scale", index, ball.getScale(),getUNIXTimestamp());
                            if(userNames[para.index].length>3){
                                userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index])*(4/userNames[para.index].length));
                            }
                            else{
                                userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index]));
                            }

                            window.setTimeout(function(){
                                isShrink = false;
                                ball.setScale(calculatePlayerScale(userScore[index]));
                                speed = calculateSpeedAlgorithm(ball.getScale());
                                if(userNames[para.index].length>3){
                                    userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index])*(4/userNames[para.index].length));
                                }
                                else{
                                    userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index]));
                                }
                                socket.emit("update_scale", index, ball.getScale(),getUNIXTimestamp());
                            },POWER_UP_TIME);

                            if(ifPrompt == false){
                                ifPrompt = true;
                                promptLabel = displayPrompt(3);
                                promptBox = displayPromptBox();
                            }else{
                                gameLayer.removeChild(promptLabel);
                                gameLayer.removeChild(promptBox);
                                promptLabel = displayPrompt(3);
                                promptBox = displayPromptBox();
                            }
                            
                        }
                    }

                    if(para.food_type == 4)
                    {
                        if(isReverse == false)
                        {
                            isReverse = true;

                            window.setTimeout(function(){
                                isReverse = false;

                            },POWER_UP_TIME);

                            if(ifPrompt == false){
                                ifPrompt = true;
                                promptLabel = displayPrompt(4);
                                promptBox = displayPromptBox();
                            }else{
                                gameLayer.removeChild(promptLabel);
                                gameLayer.removeChild(promptBox);
                                promptLabel = displayPrompt(4);
                                promptBox = displayPromptBox();
                            }
                        }
                    }


                }
                else{
                    users[para.index].setScale(calculatePlayerScale(userScore[para.index]));
                    if(userNames[para.index].length>3){
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index])*(4/userNames[para.index].length));
                    }
                    else{
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index]));
                    }
                }
            });


            socket.on('user_eat_succ', function(para){
                //any user who have eat a food will cause this.
                // if the food index and user index matched, then delete,
                //new scores will be sent to you
                userScore[para.index] = para.score;
                if(para.index == index){
                    ball.setScale(calculatePlayerScale(userScore[para.index]));
                    speed = calculateSpeedAlgorithm(calculatePlayerScale(userScore[index]));
                    if(userNames[para.index].length>3){
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index])*(4/userNames[para.index].length));
                    }
                    else{
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index]));
                    }
                }else{
                    users[para.index].setScale(calculatePlayerScale(userScore[para.index]));
                    if(userNames[para.index].length>3){
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index])*(4/userNames[para.index].length));
                    }
                    else{
                        userLabels[para.index].setFontSize(ballSize / 2 * calculatePlayerScale(userScore[para.index]));
                    }
                }
                if(para.user_index==index){
                    gameOver();
                }else{
                    map.removeChild(users[para.user_index],true);
                    map.removeChild(userLabels[para.user_index],true);
                }
            });

            //regular updates
            window.setInterval(function () {
                socket.emit('regular_updates', index,getUserPosition()[0],getUserPosition()[1], getUNIXTimestamp());
            }, REGULAR_UPDATES_RATE);
            return true;
        });

        socket.on('user_index',function(newIndex){
            index = newIndex;
            userScore[newIndex] = INITIAL_SCORE;
        });

        socket.on('status_update', function(para){
            userStatus[para.index] = para.status;
        });

        socket.on('update_score', function(para){
            users[para.index].score = para.score;
        });

        socket.on('scale_update', function(para){
            users[para.index].setScale(para.scale);
            if(userNames[para.index].length>3){
                userLabels[para.index].setFontSize(ballSize / 2 * para.scale *(4/userNames[para.index].length));
            }
            else{
                userLabels[para.index].setFontSize(ballSize / 2 * para.scale);
            }
        });

        socket.on('updateAllUserLocation', function(para){
            if(para.timestamp>latestTS){
                latestTS = para.timestamp;
                for(var i=0; i<para.uid.length; i++){
                    if(para.uid[i]!=index){
                        users[para.uid[i]].x = para.position[i*2];
                        users[para.uid[i]].y = para.position[i*2+1];
                        userLabels[para.uid[i]].x = para.position[i*2];
                        userLabels[para.uid[i]].y = para.position[i*2+1];
                    }
                }
            }
        });

        socket.on('user_leave', function(para){
            userStatus[para.index] = 'not started';
            map.removeChild(users[para.index],true);
            map.removeChild(userLabels[para.index],true);
            if(para.index==index){
                gameOver(para.score);
            }else{
                    map.removeChild(users[para.user_index],true);
                    map.removeChild(userLabels[para.user_index],true);
            }
        });


        socket.on('timeLag', function(para){
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

});

var GameScene = cc.Scene.extend({
    onEnter:function(){
        this._super();
        var layer = new GameLayer();
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

//add food based on server response
function addFoodOnMap(food_index,food_type,food_pos_x,food_pos_y) {
    if (food_type == 0) {
        var random_num = Math.round(Math.random() * 3);
        if (random_num == 0) food[food_index] = new cc.Sprite(res.food_red_png);
        if (random_num == 1) food[food_index] = new cc.Sprite(res.food_blue_png);
        if (random_num == 2) food[food_index] = new cc.Sprite(res.food_green_png);
        if (random_num == 3) food[food_index] = new cc.Sprite(res.food_purple_png);
    }
    else if (food_type == 1) {
        food[food_index] = new cc.Sprite(res.speed_up_png);
    }

    else if (food_type == 2) {
        food[food_index] = new cc.Sprite(res.poison_png);
    }
    else if (food_type == 3) {
        food[food_index] = new cc.Sprite(res.shrink_png);
    }
    else if (food_type == 4) {
        food[food_index] = new cc.Sprite(res.reverse_png);
    }

        food[food_index].setAnchorPoint(0.5, 0.5);
        food[food_index].setPosition(food_pos_x, food_pos_y);
        food[food_index].setTag(food_index);
        map.addChild(food[food_index], 0);
    }

    function collisionDetection(player, sprite2) {
        size = cc.director.getWinSize();
        var radius1 = player.getScale() * ballSize / 2;
        var radius2 = sprite2.getScale();
        var playerX = size.width / 2 - map.getPositionX();
        var playerY = size.height / 2 - map.getPositionY();
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

    function calculateAngle(sourcePoint, targetPoint, angle) {//ball - source, mouse - targetpoint
        var tempAngle;
        if (isReverse == false) {
            tempAngle = (Math.atan2(targetPoint.y - sourcePoint.y, targetPoint.x - sourcePoint.x));
        } else {
            var reversePointX, reversePointY;
            reversePointX = 2 * sourcePoint.x - targetPoint.x;
            reversePointY = 2 * sourcePoint.y - targetPoint.y;
            tempAngle = (Math.atan2(reversePointY - sourcePoint.y, reversePointX - sourcePoint.x));
        }
        return tempAngle;
    }

    function calculateSpeedAlgorithm(scale) {
        var speed;
        if (isSpeedUp == true) {
            return INITIAL_SPEED * 2;
        }
        else {
            if (scale == 0.002 * INITIAL_SCORE) {
                speed = INITIAL_SPEED;
                return speed;
            }
            var radius = (scale * 500) / 2;
            speed = INITIAL_SPEED * (1 - radius * 0.0018);
            return speed;
        }
    }

    function calculatePlayerScale(score) {
        var scale;
        if (score < 100) {
            scale = score * 0.003;
        }
        else if (score < 500) {
            scale = 100 * 0.003 + (score - 100) * 0.0006;
        }
        else {
            scale = 100 * 0.003 + 500 * 0.0006;
        }
        //return scale;

        if (isShrink == true) {
            return scale * 0.5;
        } else {
            return scale;
        }


    }


    function displayPrompt(food_type){
        var prompt;
   
        if (food_type == 1) {
            prompt = new cc.LabelTTF("Your speed increases!", "Inconsolata"); 
        }
        else if (food_type == 2) {
            prompt = new cc.LabelTTF("Your score decreases :(", "Inconsolata");
        }
        else if (food_type == 3) {
            prompt = new cc.LabelTTF("You have been shrunk, RUN!", "Inconsolata");
        }
        else if (food_type == 4) {
            prompt = new cc.LabelTTF("Your direction has been reversed!", "Inconsolata");
        }

        prompt.setPosition(size.width / 2, size.height -230);
        prompt.setFontSize(22);
        prompt.setColor(cc.color(205,51,51));

        gameLayer.addChild(prompt);

        window.setTimeout(function(){
            gameLayer.removeChild(prompt);
            ifPrompt = false;
        },POWER_UP_TIME);

        return prompt;
    }

    function displayPromptBox(){
        var prompt;

        prompt = new cc.Sprite(res.scoreBox_png);
        prompt.setScaleX(1.2);
        prompt.setScaleY(0.7);
        prompt.setPosition(size.width / 2, size.height -230);
        prompt.setColor(cc.color(224,255,255));
        prompt.setOpacity(0);

        gameLayer.addChild(prompt);

        window.setTimeout(function(){
            gameLayer.removeChild(prompt);
            ifPrompt = false;
        },POWER_UP_TIME);

        return prompt;
    }


    function map2screen(mapX, mapY) {
        var x = mapX + map.getPositionX();
        var y = mapY + map.getPositionY();
        return [x, y];
    }

    function screen2map(scrX, scrY) {
        var x = scrX - map.getPositionX();
        var y = scrY - map.getPositionY();
        return [x, y];
    }

    function getUserPosition() {
        return screen2map(size.width / 2, size.height / 2);
    }

    function getUNIXTimestamp() {
        return Math.floor(Date.now());//change the server accordingly.
    }

    function gameOver() {
        var bg = new cc.Sprite(res.blackBG_png);

        bg.setPosition(size.width / 2, size.height / 2);
        gameLayer.addChild(bg, 0);

        var fade_action = cc.fadeIn(2);

        var box = new cc.Sprite(res.gameoverBox_png);
        box.setPosition(size.width / 2, size.height / 2);
        gameLayer.addChild(box, 0);
        box.setOpacity(0);
        box.runAction(fade_action);

        var scoreLabel = new cc.LabelTTF("Score : " + userScore[index], "Optima");
        scoreLabel.setPosition(size.width / 2 + 10, size.height / 2 + 60);
        scoreLabel.setFontSize(36);
        scoreLabel.setColor(0, 0, 0);
        gameLayer.addChild(scoreLabel);

        var label = new cc.LabelTTF("Please fill in our questionnaire to help us make the game better!", "Arial");
        label.setPosition(size.width / 2 + 10, size.height / 2 - 10);
        label.setFontSize(18);
        label.setColor(0, 0, 0);
        gameLayer.addChild(label);

        urlAddress = new cc.LabelTTF("http://tp.sojump.cn/jq/7123174.aspx", "Arial");
        urlAddress.setPosition(size.width / 2 + 10, size.height / 2 - 40);
        urlAddress.setFontSize(16);
        urlAddress.setColor(cc.color(205,51,51));
        gameLayer.addChild(urlAddress);
        clickEvent(urlAddress);

        restartLabel = new cc.LabelTTF("Try again", "Verdana");
        restartLabel.setPosition(size.width / 2 - 110, size.height / 2 - 110);
        restartLabel.setFontSize(18);
        restartLabel.setColor(0, 0, 0);
        gameLayer.addChild(restartLabel);
        clickEvent(restartLabel);
        
        exitLabel = new cc.LabelTTF("Exit", "Verdana");
        exitLabel.setPosition(size.width / 2 + 120, size.height / 2 - 110);
        exitLabel.setFontSize(18);
        exitLabel.setColor(0,0,0);
        gameLayer.addChild(exitLabel);
        clickEvent(exitLabel);
    }

    function clickEvent(clickLabel){
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            eventName: "clickOnLabel",
            onMouseMove: function (event) {
                var pos = event.getLocation();
                if (cc.rectContainsPoint(clickLabel.getBoundingBox(), pos)) {
                    cc._canvas.style.cursor = 'pointer';
                }
                else {
                    cc._canvas.style.cursor = 'default';
                }

            },
            onMouseUp: function (event) {
                var pos = event.getLocation();
                if (cc.rectContainsPoint(clickLabel.getBoundingBox(), pos)) {
                    if(clickLabel == urlAddress){
                        window.location.href = "http://tp.sojump.cn/jq/7123174.aspx";
                    }else if(clickLabel == restartLabel){
                        window.location.reload();
                    }else if(clickLabel == exitLabel){
                        window.location.href = "about:blank";
                    }
                   
                }
            }       
        }, clickLabel);

    }