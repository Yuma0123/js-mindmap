$(document).ready(function() {
  // 各マインドマップコンテナに対して個別にマインドマップを初期化する
  $('.mindmap-container').each(function() {
    $(this).mindmap();

    var root = $(this).find('>ul>li').get(0).mynode = $(this).addRootNode($(this).find('>ul>li>a').text(), {
      href: '/',
      url: '/',
      onclick: function(node) {
        $(node.obj.activeNode.content).each(function() {
          this.hide();
        });
      }
    });

    $(this).find('>ul>li').hide();

    var addLI = function() {
      var parentnode = $(this).parents('li').get(0);
      if (typeof(parentnode) == 'undefined') parentnode = root;
      else parentnode = parentnode.mynode;

      this.mynode = $(this).addNode(parentnode, $('a:eq(0)', this).text(), {
        href: $('a:eq(0)', this).attr('href'),
        onclick: function(node) {
          $(node.obj.activeNode.content).each(function() {
            this.hide();
          });
          $(node.content).each(function() {
            this.show();
          });
        }
      });
      $(this).hide();
      $('>ul>li', this).each(addLI);
    };

    $(this).find('>ul>li>ul').each(function() {
      $('>li', this).each(addLI);
    });

  });
});
