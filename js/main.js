/* global phina */
/* 先にdefine.jsでphina.jsをグローバル領域に展開しておくこと */

phina.define( 'Enemy', {
    superClass: 'RectangleShape',

    init: function(params) {
        params = (params || {}).$safe( Enemy.defaults );
        const originalStroke = params.stroke;
        params.stroke = null;
        this.superInit( params );

        this.fromJSON( {
            children: {
                innerRect: {
                    className: 'RectangleShape',
                    arguments: [ {
                        width: params.width - 4,
                        height: params.height - 4,
                        stroke: originalStroke,
                        strokeWidth: 4,
                        backgroundColor: params.backgroundColor,
                        fill: params.fill,
                    } ],
                }
            }
        } );

        this.tweeners = {
            move: Tweener().attachTo( this ),
            fadeIn: Tweener().attachTo( this ),
            fadeOut: Tweener().attachTo( this ),
            blink: Tweener().attachTo( this ),
        };

        this.vy = 0;
        this.level = params.level;
        this.alpha = 0.0;
        this.blinkDuration = 100;
        this._hitAlert = false;
    },
    startMove: function (vy, duration, delay) {
        this.vy = vy;
        var t = this.tweeners.move;
        t.clear()
         .wait( delay )
         .call( this._startMove, this, [ duration ] );
    },
    _startMove: function (duration) {
        var t = this.tweeners.move;
        t.clear()
         .by( {
             x: 0,
             y: this.vy
         }, duration )
         .setLoop( true );
    },
    stopMove: function () {
        this.tweeners.move.stop();
    },
    stop: function () {
        this.innerRect.stroke = 'yellow';
        this.tweeners.move.stop();
        this.tweeners.fadeIn.stop();
        this.tweeners.fadeOut.stop();
        this.tweeners.blink.stop();
    },
    fadeIn: function (duration) {
        var t = this.tweeners.fadeIn;
        t.clear()
         .fadeIn( duration, 'easeOutQuad' );
    },
    fadeOut: function (duration) {
        var t = this.tweeners.fadeOut;
        t.clear()
         .fadeOut( duration, 'easeOutQuad' )
         .call( function () {
             this.parent.onEnemyRemoved( this );
             this.remove();
         }, this );
    },
    startBlink: function () {
        var duration = this.blinkDuration;
        var t = this.tweeners.blink;
        t.clear()
         .call( function () {
             this.alpha = 0.2;
         }, this )
         .fadeIn( duration, 'easeInOutQuad' )
         .call( function () {
             if ( duration !== this.blinkDuration ) {
                 this.startBlink();
             }
         }, this )
         .setLoop( true );
    },
    cancelBlink: function () {
        var t = this.tweeners.blink;
        t.clear()
         .fadeIn( 500, 'easeInQuad' );
    },
    _accessor: {
        hitAlert: {
            get: function () {
                return this._hitAlert;
            },
            set: function (flag) {
                if ( this._hitAlert != flag ) {
                    if ( flag ) {
                        this.startBlink();
                    }
                    else {
                        this.cancelBlink();
                    }
                }

                this._hitAlert = flag;
            }
        }
    },
    _static: {
        defaults: {
            width: 40,
            height: 40,
            cornerRadius: 0,
            backgroundColor: 'transparent',
            fill: null,
            strokeWidth: 1,
            lavel: 0
        }
    }
} );

phina.define( 'TitleScene', {
    superClass: 'DisplayScene',

    init: function(params) {
        this.superInit();

        params = (params || {}).$safe( TitleScene.defaults );

        this.fontColor = params.fontColor;
        this.backgroundColor = params.backgroundColor;

        this.fromJSON( {
            children: {
                titleLabel: {
                    className: 'Label',
                    arguments: {
                        text: params.title,
                        fill: this.fontColor,
                        stroke: null,
                        fontSize: 60,
                    },
                    x: this.gridX.center(),
                    y: this.gridY.span(3.5),
                },
                versionLabel: {
                    className: 'Label',
                    arguments: {
                        text: params.version,
                        fill: this.fontColor,
                        stroke: null,
                        fontSize: 32,
                    },
                    x: this.gridX.center(),
                    y: this.gridY.span(4.5),
                },
                touchLabel: {
                    className: 'Label',
                    arguments: {
                        text: "Touch to Start!",
                        fill: this.fontColor,
                        stroke: null,
                        fontSize: 32,
                    },
                    x: this.gridX.center(),
                    y: this.gridY.span(12)
                }
            }
        } );

        this.touchLabel.alpha = 0.0;
        this.touchLabel.tweener.clear()
                               .fadeIn( 1000.0, 'linear' )
                               .call( function () {
                                   this.touchLabel.alpha = 0.0;
                               }, this )
                               .setLoop( true );
        this.on( 'pointend', function() {
            this.exit();
        } );
        this.onkeyup = function (e) {
            if ( e.keyCode === Keyboard.KEY_CODE.space ) {
                this.exit();
            }
        };
    },
    _static: {
        //defaults: {
        //    exitType: 'touch'
        //}
    }
} );

phina.define( 'MainScene', {
    superClass: 'DisplayScene',

    init: function(params) {
        this.superInit();

        params = (params || {}).$safe( MainScene.defaults );

        this.score = 0;
        this.fontColor = params.fontColor;
        this.backgroundColor = params.backgroundColor;

        this.fromJSON( {
            children: {
                scoreLabel: {
                    className: 'Label',
                    arguments: {
                        text: 'SCORE:',
                        fill: this.fontColor,
                        stroke: null,
                        fontSize: 24,
                        align: 'right'
                    },
                    x: this.gridX.center() - this.gridX.span(0.5),
                    y: this.gridY.span(0.5),
                },
                scoreText: {
                    className: 'Label',
                    arguments: {
                        text: this.score+'',
                        fill: this.fontColor,
                        stroke: null,
                        fontSize: 24,
                        align: 'right'
                    },
                    x: this.gridX.span(10.5),
                    y: this.gridY.span(0.5),
                },
            }
        } );

        var margin = 40;
        this.fromJSON( {
            children: {
                directionShape: {
                    className: 'TriangleShape',
                    arguments: [ {
                        radius: this.gridY.unit(),
                        stroke: params.fontColor,
                        strokeWidth: 4,
                        backgroundColor: 'transparent',
                        fill: null,
                    } ],
                    x: this.gridX.center(),
                    y: this.gridY.span(15),
                }
            }
        } );

        this._deltaX = 0;
        this._touchY = 0;
        this.on('pointmove', function(e) {
            // 逆方向へのmoveは移動量をリセット
            if ( this._deltaX < 0 && 0 < e.pointer.dx ) {
                this._deltaX = 0;
            }

            this._touchY = e.pointer.y;
            this._deltaX += e.pointer.dx;
        });
        this.on('pointend', function(e) {
            this._deltaX = 0;
        });

        this.level = -1;
        this.remainingTimeForNextLevel = 0; // 次のレベルまでの時間
        this.remainingTimeForNextEnemy = 0; // 敵出現までの時間
        this.enemies = [];
        this._missiles = [];

        this._elapsedTime = 0;
        this._elapsedCounter = 0;
        this._shootAngle = 0;
        this.state = MainScene.GAME_STATE.init;
    },
    addLevelLabel: function () {
        var label = Label( {
            text: 'Level '+ this.level,
            fill: this.fontColor,
            stroke: null,
            fontSize: 32,
            align: 'center'
        } );

        label.x = this.gridX.center();
        label.y = this.gridY.span( 7 );
        label.addChildTo( this );

        label.alpha = 0.0;
        label.tweener.clear()
                     .fadeIn( 500.0, 'easeInQuad' )
                     .call( function () {
                         this.state = MainScene.GAME_STATE.started;
                     }, this )
                     .wait( 2000.0 )
                     .fadeOut( 500.0, 'easeOutQuad' )
                     .call( function () {
                         label.remove();
                     }, this );
    },
    update: function (app) {
        if ( this.state === MainScene.GAME_STATE.init ) {
            this.state = MainScene.GAME_STATE.wait;
            this.level = 1;
            this.onLevelChanged();
        }
        else if ( this.state === MainScene.GAME_STATE.gameOver ) {
            return;
        }
        else if ( this.state === MainScene.GAME_STATE.started ) {
            this.remainingTimeForNextEnemy -= app.deltaTime;
            if ( this.remainingTimeForNextEnemy < 0 ) {
                if ( this.enemies.length < 3 ) {
                    this.addEnemy();
                }

                // todo: レベルに応じて、敵の出現間隔を短くする
                this.remainingTimeForNextEnemy = Math.randint(500, 2000);
            }

            this.remainingTimeForNextLevel -= app.deltaTime;
            if ( this.remainingTimeForNextLevel < 0 ) {
                this.state = MainScene.GAME_STATE.breakTime;
            }
        }
        else if ( this.state === MainScene.GAME_STATE.breakTime ) {
            if ( this.enemies.length < 1 ) {
                this.state = MainScene.GAME_STATE.wait;
                this.level++;
                this.onLevelChanged();
            }
        }

        if ( this._deltaX != 0 ) {
            // 砲台とタッチしたところまでの長さを半径とした0.1度あたりの長さ
            const r = Math.max(
                this.directionShape.radius,
                this.directionShape.y - this._touchY );
            const delta = (r * 2 * Math.PI) / 360;
            const dd = (this._deltaX.abs() / delta).floor();
            if ( 0 < this._deltaX ) {
                this._deltaX -= dd * delta;
                this.shootAngle = Math.min( 60, this.shootAngle + dd );
            }
            else {
                this._deltaX += dd * delta;
                this.shootAngle = Math.max( -60, this.shootAngle - dd );
            }
        }

        this._elapsedTime -= app.deltaTime;
        if ( this._elapsedTime < 0 ) {
            if ( this._elapsedCounter < 3 ) {
                this.shoot();
            }

            this._elapsedTime += 100; // msec
            this._elapsedCounter =
                ( 6 < this._elapsedCounter ) ? 0 : (this._elapsedCounter + 1);
        }

        // 当たり判定
        if ( this.hasGameOver() ) {
            this.enemies.forEach( function (elm) {
                elm.stop();
            } );

            var label = Label( {
                text: 'Game Over',
                fill: this.fontColor,
                stroke: null,
                fontSize: 32,
                align: 'center'
            } );

            label.x = this.gridX.center();
            label.y = this.gridY.span( 7 );
            label.alpha = 0.5;
            label.addChildTo( this );

            label.tweener.clear()
                         .fadeIn( 800, 'easeOutQuad' )
                         .wait( 1200 )
                         .call( function () {
                             this.exit( {
                                 score: this.score,
                                 level: this.level
                             } );
                         }, this );

            this.state = MainScene.GAME_STATE.gameOver;
        }
        else {
            const self = this;
            this._missiles.eraseIfAll( function (missile) {
                const found = self.enemies.find( function (enemy) {
                    return enemy.hitTestElement( missile );
                } );

                if ( found != null ) {
                    missile.remove();
                    self.enemies.erase( found );
                    found.stopMove();
                    found.fadeOut( 200 );
                    return true;
                }
                else {
                    return false;
                }
            } );
        }

        // 画面外に出たミサイルの回収
        const xmin = 0 - 20;
        const ymin = 0 - 20;
        const xmax = this.width + 20;
        this._missiles.eraseIfAll( function (elm) {
            if ( elm.x < xmin || elm.y < ymin || xmax < elm.x ) {
                elm.remove();
                return true;
            }
            else {
                return false;
            }
        } );
    },
    shoot: function () {
        const pos = Vector2()
            .fromDegree( 270 + this.shootAngle, this.directionShape.radius + 10 );
        var missile = TriangleShape( {
            radius: this.gridX.span(0.1),
            stroke: null,
            fill: 'white',
        } );

        missile.rotation = this.shootAngle;
        missile.x = this.directionShape.x + pos.x;
        missile.y = this.directionShape.y + pos.y;

        const v = Vector2()
            .fromDegree( 270 + this.shootAngle, this.gridX.span(1) );
        missile.tweener
            .clear()
            .by( { x: v.x, y: v.y }, 100 )
            .setLoop( true );

        missile.addChildTo( this );
        this._missiles.push( missile );
    },
    addEnemy: function () {
        var width = (this.gridX.unit() * 1.5).floor()
        var enemy = Enemy( {
            level: this.level,
            stroke: this.fontColor,
            width: width,
            height: width
        } );

        var i = Math.randint( 2, this.gridX.columns - 1 );
        enemy.x = this.gridX.unit() * (i - 0.5);
        enemy.y = this.gridY.span(1);

        var vx = 0, vy = 0, i = this.level;
        if ( this.level <= 4 ) {
            vy = 100 + (i + 20);
        }
        else if ( this.level <= 6 ) {
            vy = 100 + Math.randint(i - 1, i) * 20;
        }
        else {
            vy = 100 + Math.randint(i - 2, i) * 20;
        }

        const fadeInDuration = 1000 * (100 / vy);
        enemy.startMove( vy, 1000, Math.max(100, fadeInDuration * 0.25) );
        enemy.fadeIn( fadeInDuration );

        enemy.addChildTo( this );
        this.enemies.push( enemy );
    },
    onEnemyRemoved: function (enemy) {
        var points = enemy.level * 10;
        var label = Label( {
            text: points+'',
            fill: this.fontColor,
            stroke: null,
            fontSize: 24,
            align: 'center'
        } );

        label.setPosition( enemy.x, enemy.y );
        label.alpha = 0.5;
        label.addChildTo( this );

        label.tweener.clear()
                     .by( {
                         alpha: 1.0 - label.alpha,
                         y: -20
                     }, 800, 'easeOutQuad' )
                     .fadeOut( 400, 'easeOutQuad' )
                     .call( function () {
                         label.remove();
                     }, this );
        this.score += points;
        this.scoreText.text = this.score+'';
    },
    hasGameOver: function () {
        const ymax = this.height;
        return this.enemies.find( function (elm) {
            const y = elm.y + (elm.height / 2);
            return ( ymax < y );
        } ) != null;
    },
    onLevelChanged: function () {
        this.addLevelLabel();
        this.remainingTimeForNextLevel = 5000;
    },
    _accessor: {
        shootAngle: {
            get: function () {
                return this._shootAngle;
            },
            set: function (newValue) {
                this._shootAngle = newValue;
                this.directionShape.rotation = this._shootAngle;
            }
        }
    },
    _static: {
        GAME_STATE : {
            init    : 0,
            started : 1,
            paused  : 2,
            cleared : 3,
            breakTime : 4,
            wait : 5,
            gameOver: 999
        }
    }
} );

// メイン処理
phina.main( function() {

    // アプリケーション生成
    var app = GameApp( {
        startLabel: 'title',
        title: 'Shoot the Rect',
        version: 'Ver.1.0.0',
        fontColor: 'white',
        backgroundColor: 'black',
        backgroundImage: '',
        width: 640,
        height: 960,
    } );
    // アプリケーション実行
    app.fps = 60;
    app.run();
} );