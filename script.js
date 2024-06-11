// マインドマップの初期化
$(document).ready(function() {
  // body要素にマインドマップを有効化
  $('body').mindmap();

  // データをマインドマップに追加
  var root = $('body>ul>li').get(0).mynode = $('body').addRootNode($('body>ul>li>a').text(), {
    href:'/',
    url:'/',
    onclick:function(node) {
      $(node.obj.activeNode.content).each(function() {
        this.hide();
      });
    }
  });

  // 初期のリストを隠す
  $('body>ul>li').hide();

  // リストアイテムをノードとして追加する関数
  var addLI = function() {
    var parentnode = $(this).parents('li').get(0);
    if (typeof(parentnode)=='undefined') parentnode=root;
    else parentnode=parentnode.mynode;

    // ノードを追加
    this.mynode = $('body').addNode(parentnode, $('a:eq(0)',this).text(), {
      href:$('a:eq(0)',this).attr('href'),
      onclick:function(node) {
        $(node.obj.activeNode.content).each(function() {
          this.hide();
        });
        $(node.content).each(function() {
          this.show();
        });
      }
    });

    // 子リストアイテムを再帰的に処理
    $(this).hide();
    $('>ul>li', this).each(addLI);
  };

  // 各リストアイテムにノードを追加
  $('body>ul>li>ul').each(function() {
    $('>li', this).each(addLI);
  });

});
