
var HelloWorldLayer = cc.Layer.extend({
    //sprite:null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;

        var intro_bg = new cc.Sprite(res.intro_bg);
        intro_bg.x = size.width / 2;
        intro_bg.y = size.height / 2;
        this.addChild(intro_bg);

        //add next sprite
        var nextMenuItem = new cc.MenuItemImage(
            "res/next_up.png",
            "res/next_down.png",
            function () {
                cc.log("nextMenuItem is clicked!");
                cc.director.pushScene(new cc.TransitionFade(1.2,new HomeScene()));
            }, this);
        nextMenuItem.x = size.width / 2 + 420;
        nextMenuItem.y = size.height / 2 + 30;

        var mu = new cc.Menu(nextMenuItem);
        mu.x = 0;
        mu.y = 0;
        this.addChild(mu);

    },

    menuItemNextCallback: function (sender) {
        cc.log("menuItemStartCallback!");
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

