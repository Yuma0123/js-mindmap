$(document).ready(function() {
  var mindmaps = [];

  $('#mindmap1').mindmap({
    initialX: 200,
    initialY: 200
  });

  $('#mindmap2').mindmap({
    initialX: 600,
    initialY: 200
  });

  $('#mindmap1, #mindmap2,#mindmap3').each(function(index, mapElement) {
    var $map = $(mapElement);
    $map.mindmap();

    var root = $map.find('>ul>li').get(0).mynode = $map.addRootNode($map.find('>ul>li>a').text(), {
      href:'/',
      url:'/',
      onclick:function(node) {
        $(node.obj.activeNode.content).each(function() {
          this.hide();
        });
      }
    });

    $map.find('>ul>li').hide();

    var addLI = function() {
      var parentnode = $(this).parents('li').get(0);
      if (typeof(parentnode) == 'undefined') parentnode = root;
      else parentnode = parentnode.mynode;

      this.mynode = $map.addNode(parentnode, $('a:eq(0)', this).text(), {
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
      $(this).find('>ul>li').each(addLI);
    };

    $map.find('>ul>li>ul>li').each(addLI);
    mindmaps.push(root);
  });

  // Add connections between root nodes of different mindmaps
  if (mindmaps.length > 1) {
    for (var i = 0; i < mindmaps.length - 1; i++) {
      new Line(mindmaps[i].obj, mindmaps[i], mindmaps[i + 1]);
    }
  }
});
