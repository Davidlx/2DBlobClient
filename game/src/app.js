
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;
        this._box1 = cc.EditBox(cc.size(170, 50),new cc.Scale9Sprite("res/input_box.png"));
        this._box1.setPosition(cc.p(size.width/2,size.height/2));
        this._box1.setFont("American Typewriter", 26);
        this._box1.setFontColor(cc.color(5,4,10));
        this._box1.setPlaceHolder("Enter your nickname");
        this._box1.setPlaceholderFontColor(cc.color(117, 76, 36));
        this._box1.setMaxLength(20);
        this._box1.setReturnType(cc.EditBox.KEYBOARD_RETURNTYPE_DONE);
        this._box1.setDelegate(this);
        this.addChild(this._box1,8);
        var bg = new cc.Sprite(res.first_bg_png);
        bg.x = size.width / 2;
        bg.y = size.height / 2;
        this.addChild(bg);

        var title = new cc.Sprite(res.title_png);
        title.x = size.width / 2+20;
        title.y = size.height / 2+130;
        this.addChild(title);



        //add start sprite
        var startMenuItem = new cc.MenuItemImage(
            "res/start_up.png",
            "res/start_down.png",
            function () {
                cc.log("startMenuItem is clicked!");
                var str = prompt("Enter your nickname: ", "");
                while(str.length>8){
                    str = prompt("The nickname should not longer than 8 characters", "");
                }
                socket.emit('user_name', str);
                cc.director.pushScene(new cc.TransitionFade(1.2,new GameScene()));
            }, this);
        startMenuItem.x = size.width / 2;
        startMenuItem.y = size.height - 500;

        //add about sprite
        var aboutMenuItem = new cc.MenuItemImage(
            "res/about_up.png",
            "res/about_down.png",
            function () {
                cc.log("aboutMenuItem is clicked!");
                cc.director.runScene(new cc.TransitionFade(1.2,new AboutScene()));
            }, this);
        aboutMenuItem.x = size.width / 2 + 165;
        aboutMenuItem.y = size.height - 450;

        var mu = new cc.Menu(startMenuItem, aboutMenuItem);
        mu.x = 0;
        mu.y = 0;
        this.addChild(mu);

    },

    menuItemStartCallback: function (sender) {
        cc.log("menuItemStartCallback!");
    },
    menuItemAboutCallback: function (sender) {
        cc.log("menuItemAboutCallback!");
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

