var GameLayer = cc.Layer.extend({

    ctor: function(){
        this._super();
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
            this.addChild(food[food_index],0);
            food_index++;
        }

        // demo ended


        var ball = new cc.Sprite(res.ball_png);
        ball.setAnchorPoint(0.5, 0.5);
        ball.setPosition(size.width/2, size.height/2);
        this.addChild(ball,0);

        var REFRESH_TIME = 10;
        var speed = 1;
        var mousePos;
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseMove: function (event) {
                mousePos = event.getLocation();
            }
        },ball);

        window.setInterval(function(){
                    var diff_x = mousePos.x - ball.x;
                    var diff_y = mousePos.y - ball.y;
                    var distance = Math.sqrt((diff_x * diff_x) + (diff_y * diff_y));
                    var sin = diff_y/distance;
                    var cos = diff_x/distance;
                    if(distance>1){
                        ball.x = ball.x + speed*cos;
                        ball.y = ball.y + speed*sin;
                    }

        }, REFRESH_TIME);







        return true;


    }


});

var GameScene = cc.Scene.extend({
    onEnter:function(){
        this._super();
        var layer = new GameLayer;
        this.addChild(layer);
        layer.init();
    }
});

