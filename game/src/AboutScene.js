var AboutLayer = cc.Layer.extend({
    ctor: function() {
        this._super();
        var size = cc.director.getWinSize();

        var bg = new cc.Sprite(res.about_bg_png);
        bg.x = size.width / 2;
        bg.y = size.height / 2;
        this.addChild(bg, 0);
        
        var david = new cc.LabelTTF("David", "Arial", 30);
        david.setColor(cc.color(0,0,0));
        david.x = 173;
        david.y = 392.5;
        this.addChild(david, 5);

        var ivy = new cc.LabelTTF("Ivy", "Arial", 30);
        ivy.setColor(cc.color(0,0,0));
        ivy.x = 125;
        ivy.y = 257;
        this.addChild(ivy, 4);

        var toby = new cc.LabelTTF("Toby", "Arial", 30);
        toby.setColor(cc.color(0,0,0));
        toby.x = 280;
        toby.y = 100;
        this.addChild(toby, 3);

        var leon = new cc.LabelTTF("Leon", "Arial", 30);
        leon.setColor(cc.color(0,0,0));
        leon.x = 815;
        leon.y = 377;
        this.addChild(leon, 2);

        var vivian = new cc.LabelTTF("Vivian", "Arial", 30);
        vivian.setColor(cc.color(0,0,0));
        vivian.x = 737;
        vivian.y = 150;
        this.addChild(vivian, 1);

        var alvin = new cc.LabelTTF("Alvin", "Arial", 30);
        alvin.setColor(cc.color(0,0,0));
        alvin.x = 850;
        alvin.y = 215;
        this.addChild(alvin, 6);

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

