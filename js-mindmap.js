/*
 js-mindmap

 MIT (X11) license
*/

// jQueryの即時関数を使用
(function ($) {
  'use strict';

  // 定数の定義
  var TIMEOUT = 4,  // 動作タイムアウト時間（秒）
    CENTRE_FORCE = 3,  // 中心に引き寄せる力の強さ
    Node,
    Line;

  // Nodeクラスの定義
  Node = function (obj, name, parent, opts) {
    this.obj = obj;
    this.options = obj.options;

    this.name = name;
    this.href = opts.href;
    if (opts.url) {
      this.url = opts.url;
    }

    // 表示用の要素を作成
    this.el = $('<a href="' + this.href + '">' + this.name + '</a>').addClass('node');
    $('body').prepend(this.el);

    if (!parent) {
      obj.activeNode = this;
      this.el.addClass('active root');
    } else {
      obj.lines[obj.lines.length] = new Line(obj, this, parent);
    }
    this.parent = parent;
    this.children = [];
    if (this.parent) {
      this.parent.children.push(this);
    }

    // アニメーション関連の設定
    this.moving = false;
    this.moveTimer = 0;
    this.obj.movementStopped = false;
    this.visible = true;
    this.x = 1;
    this.y = 1;
    this.dx = 0;
    this.dy = 0;
    this.hasPosition = false;

    this.content = []; // クリック時に表示するコンテンツの配列

    this.el.css('position', 'absolute');

    var thisnode = this;

    // ドラッグ可能にする
    this.el.draggable({
      drag: function () {
        obj.root.animateToStatic();
      }
    });

    // クリックイベントの設定
    this.el.click(function () {
      if (obj.activeNode) {
        obj.activeNode.el.removeClass('active');
        if (obj.activeNode.parent) {
          obj.activeNode.parent.el.removeClass('activeparent');
        }
      }
      if (typeof opts.onclick === 'function') {
        opts.onclick(thisnode);
      }
      obj.activeNode = thisnode;
      obj.activeNode.el.addClass('active');
      if (obj.activeNode.parent) {
        obj.activeNode.parent.el.addClass('activeparent');
      }
      obj.root.animateToStatic();
      return false;
    });

  };

  // ルートノードのみ: アニメーションループの制御
  Node.prototype.animateToStatic = function () {
    clearTimeout(this.moveTimer);
    // 一定時間後に動作を停止
    var thisnode = this;
    this.moveTimer = setTimeout(function () {
      thisnode.obj.movementStopped = true;
    }, TIMEOUT * 1000);

    if (this.moving) {
      return;
    }
    this.moving = true;
    this.obj.movementStopped = false;
    this.animateLoop();
  };

  // ルートノードのみ: 全ノードをアニメーション（再帰的に呼び出される）
  Node.prototype.animateLoop = function () {
    var i, len, mynode = this;
    this.obj.canvas.clear();
    for (i = 0, len = this.obj.lines.length; i < len; i++) {
      this.obj.lines[i].updatePosition();
    }
    if (this.findEquilibrium() || this.obj.movementStopped) {
      this.moving = false;
      return;
    }
    setTimeout(function () {
      mynode.animateLoop();
    }, 10);
  };

  // このノードの適正位置を見つける
  Node.prototype.findEquilibrium = function () {
    var i, len, stable = true;
    stable = this.display() && stable;
    for (i = 0, len = this.children.length; i < len; i++) {
      stable = this.children[i].findEquilibrium() && stable;
    }
    return stable;
  };

  // このノードとその子ノードを表示
  Node.prototype.display = function (depth) {
    var parent = this,
      stepAngle,
      angle;

    depth = depth || 0;

    if (this.visible) {
      // 自分や親ノードがアクティブでない場合、非表示にする
      if (this.obj.activeNode !== this && this.obj.activeNode !== this.parent && this.obj.activeNode.parent !== this) {
        this.el.hide();
        this.visible = false;
      }
    } else {
      // 自分や親ノードがアクティブな場合、表示する
      if (this.obj.activeNode === this || this.obj.activeNode === this.parent || this.obj.activeNode.parent === this) {
        this.el.show();
        this.visible = true;
      }
    }
    this.drawn = true;

    // 位置が設定されていない場合、中央に配置
    if (!this.hasPosition) {
      this.x = this.options.mapArea.x / 2;
      this.y = this.options.mapArea.y / 2;
      this.el.css({'left': this.x + "px", 'top': this.y + "px"});
      this.hasPosition = true;
    }

    // 子ノードを配置
    stepAngle = Math.PI * 2 / this.children.length;
    $.each(this.children, function (index) {
      if (!this.hasPosition) {
        if (!this.options.showProgressive || depth <= 1) {
          angle = index * stepAngle;
          this.x = (50 * Math.cos(angle)) + parent.x;
          this.y = (50 * Math.sin(angle)) + parent.y;
          this.hasPosition = true;
          this.el.css({'left': this.x + "px", 'top': this.y + "px"});
        }
      }
    });

    // 位置を更新
    return this.updatePosition();
  };

  // 位置を更新し、静止しているかどうかを返す
  Node.prototype.updatePosition = function () {
    var forces, showx, showy;

    // ドラッグ中の場合、位置を更新して終了
    if (this.el.hasClass("ui-draggable-dragging")) {
      this.x = parseInt(this.el.css('left'), 10) + (this.el.width() / 2);
      this.y = parseInt(this.el.css('top'), 10) + (this.el.height() / 2);
      this.dx = 0;
      this.dy = 0;
      return false;
    }

    // 力の計算
    forces = this.getForceVector();
    this.dx += forces.x * this.options.timeperiod;
    this.dy += forces.y * this.options.timeperiod;

    // 力の減衰
    this.dx = this.dx * this.options.damping;
    this.dy = this.dy * this.options.damping;

    // 最小速度の適用
    if (Math.abs(this.dx) < this.options.minSpeed) {
      this.dx = 0;
    }
    if (Math.abs(this.dy) < this.options.minSpeed) {
      this.dy = 0;
    }
    if (Math.abs(this.dx) + Math.abs(this.dy) === 0) {
      return true;
    }

    // 速度ベクトルの適用
    this.x += this.dx * this.options.timeperiod;
    this.y += this.dy * this.options.timeperiod;
    this.x = Math.min(this.options.mapArea.x, Math.max(1, this.x));
    this.y = Math.min(this.options.mapArea.y, Math.max(1, this.y));

    // 表示位置の更新
    showx = this.x - (this.el.width() / 2);
    showy = this.y - (this.el.height() / 2) - 10;
    this.el.css({'left': showx + "px", 'top': showy + "px"});
    return false;
  };

  Node.prototype.getForceVector = function () {
    var i, x1, y1, xsign, dist, theta, f,
      xdist, rightdist, bottomdist, otherend,
      fx = 0,
      fy = 0,
      nodes = this.obj.nodes,
      lines = this.obj.lines;

    // 他のノードからの反発力を計算
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i] === this) {
        continue;
      }
      if (!nodes[i].visible) {
        continue;
      }

      x1 = (nodes[i].x - this.x);
      y1 = (nodes[i].y - this.y);

      dist = Math.sqrt((x1 * x1) + (y1 * y1));

      if (Math.abs(dist) < 500) {
        if (x1 === 0) {
          theta = Math.PI / 2;
          xsign = 0;
        } else {
          theta = Math.atan(y1 / x1);
          xsign = x1 / Math.abs(x1);
        }

        f = (this.options.repulse * 500) / (dist * dist);
        fx += -f * Math.cos(theta) * xsign;
        fy += -f * Math.sin(theta) * xsign;
      }
    }

    // 壁からの反発力の追加
    xdist = this.x + this.el.width();
    f = (this.options.wallrepulse * 500) / (xdist * xdist);
    fx += Math.min(2, f);

    rightdist = (this.options.mapArea.x - xdist);
    f = -(this.options.wallrepulse * 500) / (rightdist * rightdist);
    fx += Math.max(-2, f);

    f = (this.options.wallrepulse * 500) / (this.y * this.y);
    fy += Math.min(2, f);

    bottomdist = (this.options.mapArea.y - this.y);
    f = -(this.options.wallrepulse * 500) / (bottomdist * bottomdist);
    fy += Math.max(-2, f);

    // 自分が関わる各ラインに引力を追加
    for (i = 0; i < lines.length; i++) {
      otherend = null;
      if (lines[i].start === this) {
        otherend = lines[i].end;
      } else if (lines[i].end === this) {
        otherend = lines[i].start;
      } else {
        continue;
      }

      if (!otherend.visible) {
        continue;
      }

      x1 = (otherend.x - this.x);
      y1 = (otherend.y - this.y);
      dist = Math.sqrt((x1 * x1) + (y1 * y1));
      if (Math.abs(dist) > 0) {
        if (x1 === 0) {
          theta = Math.PI / 2;
          xsign = 0;
        }
        else {
          theta = Math.atan(y1 / x1);
          xsign = x1 / Math.abs(x1);
        }

        f = (this.options.attract * dist) / 10000;
        fx += f * Math.cos(theta) * xsign;
        fy += f * Math.sin(theta) * xsign;
      }
    }

    // アクティブな場合、中心に引き寄せる力を追加
    if (this.obj.activeNode === this) {
      otherend = this.options.mapArea;
      x1 = ((otherend.x / 2) - this.options.centreOffset - this.x);
      y1 = ((otherend.y / 2) - this.y);
      dist = Math.sqrt((x1 * x1) + (y1 * y1));
      if (Math.abs(dist) > 0) {
        if (x1 === 0) {
          theta = Math.PI / 2;
          xsign = 0;
        } else {
          xsign = x1 / Math.abs(x1);
          theta = Math.atan(y1 / x1);
        }

        f = (0.1 * this.options.attract * dist * CENTRE_FORCE) / 1000;
        fx += f * Math.cos(theta) * xsign;
        fy += f * Math.sin(theta) * xsign;
      }
    }

    if (Math.abs(fx) > this.options.maxForce) {
      fx = this.options.maxForce * (fx / Math.abs(fx));
    }
    if (Math.abs(fy) > this.options.maxForce) {
      fy = this.options.maxForce * (fy / Math.abs(fy));
    }
    return {
      x: fx,
      y: fy
    };
  };

  Node.prototype.removeNode = function () {
    var i,
      oldnodes = this.obj.nodes,
      oldlines = this.obj.lines;

    for (i = 0; i < this.children.length; i++) {
      this.children[i].removeNode();
    }

    this.obj.nodes = [];
    for (i = 0; i < oldnodes.length; i++) {
      if (oldnodes[i] === this) {
        continue;
      }
      this.obj.nodes.push(oldnodes[i]);
    }

    this.obj.lines = [];
    for (i = 0; i < oldlines.length; i++) {
      if (oldlines[i].start === this) {
        continue;
      } else if (oldlines[i].end === this) {
        continue;
      }
      this.obj.lines.push(oldlines[i]);
    }

    this.el.remove();
  };

  // Lineクラスの定義
  Line = function (obj, startNode, endNode) {
    this.obj = obj;
    this.options = obj.options;
    this.start = startNode;
    this.colour = "blue";
    this.size = "thick";
    this.end = endNode;
  };

  Line.prototype.updatePosition = function () {
    if (!this.options.showSublines && (!this.start.visible || !this.end.visible)) {
      return;
    }
    this.size = (this.start.visible && this.end.visible) ? "thick" : "thin";
    this.color = (this.obj.activeNode.parent === this.start || this.obj.activeNode.parent === this.end) ? "red" : "blue";
    this.strokeStyle = "#FFF";

    this.obj.canvas.path("M" + this.start.x + ' ' + this.start.y + "L" + this.end.x + ' ' + this.end.y).attr({'stroke': this.strokeStyle, 'opacity': 0.2, 'stroke-width': '5px'});
  };

  // ノードを追加するjQueryプラグイン
  $.fn.addNode = function (parent, name, options) {
    var obj = this[0],
      node = obj.nodes[obj.nodes.length] = new Node(obj, name, parent, options);
    console.log(obj.root);
    obj.root.animateToStatic();
    return node;
  };

  // ルートノードを追加するjQueryプラグイン
  $.fn.addRootNode = function (name, opts) {
    var node = this[0].nodes[0] = new Node(this[0], name, null, opts);
    this[0].root = node;
    return node;
  };

  // ノードを削除するjQueryプラグイン（未実装）
  $.fn.removeNode = function (name) {
    return this.each(function () {
      // 未実装
    });
  };

  // マインドマップを初期化するjQueryプラグイン
  $.fn.mindmap = function (options) {
    // デフォルト設定を定義
    options = $.extend({
      attract: 15,
      repulse: 6,
      damping: 0.55,
      timeperiod: 10,
      wallrepulse: 0.4,
      mapArea: {
        x: -1,
        y: -1
      },
      canvasError: 'alert',
      minSpeed: 0.05,
      maxForce: 0.1,
      showSublines: false,
      updateIterationCount: 20,
      showProgressive: true,
      centreOffset: 100,
      timer: 0
    }, options);

    var $window = $(window);

    return this.each(function () {
      var mindmap = this;

      this.mindmapInit = true;
      this.nodes = [];
      this.lines = [];
      this.activeNode = null;
      this.options = options;
      this.animateToStatic = function () {
        this.root.animateToStatic();
      };
      $window.resize(function () {
        mindmap.animateToStatic();
      });

      // キャンバスの初期化
      if (options.mapArea.x === -1) {
        options.mapArea.x = $window.width();
      }
      if (options.mapArea.y === -1) {
        options.mapArea.y = $window.height();
      }

      // 描画領域を作成
      this.canvas = Raphael(0, 0, options.mapArea.x, options.mapArea.y);

      // オブジェクトにクラスを追加してスタイルを適用
      $(this).addClass('js-mindmap-active');

      // キーボードサポートの追加
      $(this).keyup(function (event) {
        var newNode, i, activeParent = mindmap.activeNode.parent;
        switch (event.which) {
        case 33: // PgUp
        case 38: // 上、親ノードに移動
          if (activeParent) {
            activeParent.el.click();
          }
          break;
        case 13: // Enter（兄弟ノードを挿入）
        case 34: // PgDn
        case 40: // 下、最初の子ノードに移動
          if (mindmap.activeNode.children.length) {
            mindmap.activeNode.children[0].el.click();
          }
          break;
        case 37: // 左、前の兄弟ノードに移動
          if (activeParent) {
            newNode = null;
            if (activeParent.children[0] === mindmap.activeNode) {
              newNode = activeParent.children[activeParent.children.length - 1];
            } else {
              for (i = 1; i < activeParent.children.length; i++) {
                if (activeParent.children[i] === mindmap.activeNode) {
                  newNode = activeParent.children[i - 1];
                }
              }
            }
            if (newNode) {
              newNode.el.click();
            }
          }
          break;
        case 39: // 右、次の兄弟ノードに移動
          if (activeParent) {
            newNode = null;
            if (activeParent.children[activeParent.children.length - 1] === mindmap.activeNode) {
              newNode = activeParent.children[0];
            } else {
              for (i = activeParent.children.length - 2; i >= 0; i--) {
                if (activeParent.children[i] === mindmap.activeNode) {
                  newNode = activeParent.children[i + 1];
                }
              }
            }
            if (newNode) {
              newNode.el.click();
            }
          }
          break;
        case 45: // Ins、子ノードを挿入
          break;
        case 46: // Del、このノードを削除
          break;
        case 27: // Esc、挿入をキャンセル
          break;
        case 83: // 'S'、保存
          break;
        }
        return false;
      });

    });
  };
}(jQuery));
