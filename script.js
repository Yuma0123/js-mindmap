$(document).ready(function() {
  var mindmaps = [];
  var mapPositions = {};
  var verticalSpacing = 250;
  var horizontalSpacing = 300;

  $('#mindmap1, #mindmap2, #mindmap3').each(function(index, mapElement) {
    var $map = $(mapElement);
    var mapId = $map.attr('id');

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
    mindmaps.push({ id: mapId, rootNode: root, title: $map.find('>ul>li>a').text() });
    mapPositions[mapId] = { x: 200 * (index + 1), y: 200 };

    // マインドマップを初期配置
    $map.mindmap({
      initialX: mapPositions[mapId].x,
      initialY: mapPositions[mapId].y
    });

    // セレクトボックスに追加
    $('#mapSelect, #relatedMapSelect').append('<option value="' + mapId + '">' + $map.find('>ul>li>a').text() + '</option>');
  });

  // フォームの送信を処理
  $('#nodeForm').submit(function(event) {
    event.preventDefault();
    
    var mapId = $('#mapSelect').val();
    var nodeText = $('#nodeText').val();
    
    var $map = $('#' + mapId);
    var rootNode = $map[0].nodes[0];
    
    $map.addNode(rootNode, nodeText, {
      href: '#',
      onclick: function(node) {
        $(node.obj.activeNode.content).each(function() {
          this.hide();
        });
        $(node.content).each(function() {
          this.show();
        });
      }
    });
  });

  // 新しいマインドマップの作成を処理
  $('#mapForm').submit(function(event) {
    event.preventDefault();
    
    var rootNodeText = $('#rootNodeText').val();
    var childNodeText = $('#childNodeText').val().split('\n').map(function(item) {
      return item.trim();
    }).filter(function(item) {
      return item.length > 0;
    });
    var relatedMapId = $('#relatedMapSelect').val();
    
    var newMapId = 'mindmap' + (mindmaps.length + 1);
    
    // 新しいマインドマップのHTMLを追加
    var newMapHTML = '<div id="' + newMapId + '">' +
                     '<ul>' +
                     '<li><a href="#">' + rootNodeText + '</a>' +
                     '<ul>';
    
    childNodeText.forEach(function(child) {
      newMapHTML += '<li><a href="#">' + child + '</a></li>';
    });
    
    newMapHTML += '</ul>' +
                  '</li>' +
                  '</ul>' +
                  '</div>';
    $('body').append(newMapHTML);
    
    // 新しいマインドマップの配置
    var initialX = 200;
    var initialY = 400 + (mindmaps.length * verticalSpacing);

    if (relatedMapId) {
      var relatedPosition = mapPositions[relatedMapId];
      initialX = relatedPosition.x + horizontalSpacing;
      initialY = relatedPosition.y + (mindmaps.filter(function(map) { return map.relatedTo === relatedMapId; }).length * verticalSpacing);
    }

    mapPositions[newMapId] = { x: initialX, y: initialY };

    // 新しいマインドマップを初期化
    $('#' + newMapId).mindmap({
      initialX: initialX,
      initialY: initialY
    });

    var $newMap = $('#' + newMapId);
    var root = $newMap.find('>ul>li').get(0).mynode = $newMap.addRootNode($newMap.find('>ul>li>a').text(), {
      href:'/',
      url:'/',
      onclick:function(node) {
        $(node.obj.activeNode.content).each(function() {
          this.hide();
        });
      }
    });

    $newMap.find('>ul>li').hide();

    var addLI = function() {
      var parentnode = $(this).parents('li').get(0);
      if (typeof(parentnode) == 'undefined') parentnode = root;
      else parentnode = parentnode.mynode;

      this.mynode = $newMap.addNode(parentnode, $('a:eq(0)', this).text(), {
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

    $newMap.find('>ul>li>ul>li').each(addLI);
    mindmaps.push({ id: newMapId, rootNode: root, relatedTo: relatedMapId, title: rootNodeText });
    
    // 新しいマインドマップをセレクトボックスに追加
    $('#mapSelect, #relatedMapSelect').append('<option value="' + newMapId + '">' + rootNodeText + '</option>');
  });
});
