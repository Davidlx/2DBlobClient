var AboutLayer = cc.Layer.extend({
    ctor: function() {
        this._super();
        var size = cc.director.getWinSize();

        var bg = new cc.Sprite(res.about_bg_png);
        bg.x = size.width / 2;
        bg.y = size.height / 2;
        this.addChild(bg, 0);

        //add home sprite
        var homeMenuItem = new cc.MenuItemImage(
            "res/home.png",
            "res/home_down.png",
            function () {
                cc.log("homeMenuItem is clicked!");
                cc.director.runScene(new app());
            }, this);
        homeMenuItem.x = size.width / 2+350;
        homeMenuItem.y = 580;

        var mu = new cc.Menu(homeMenuItem);
        mu.x = 0;
        mu.y = 0;
        this.addChild(mu);
    },

    menuItemAboutCallback: function (sender) {
        cc.log("menuItemHomeCallback!");
    }
});

var AboutScene = cc.Scene.extend({
    onEnter:function(){
        this._super();
        var layer = new AboutLayer;
        this.addChild(layer);
        layer.init();
    }
});

