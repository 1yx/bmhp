window.onload = printBookmarks;

function printBookmarks() {
  var bookmarksTree = chrome.bookmarks.getTree(
    function(bookmarksTree) {
      $('body div.toolbar').append(printTree(bookmarksTree[0].children[0].children));
      $('body div.other').append(printTree(bookmarksTree[0].children[1].children));
    }
  );
}

function printTree(treeNodes) {
  var list = $('<ul></ul>');
  var item;

  for (var i in treeNodes) {
    if (treeNodes[i].children) {
      $(list).append(printNode(treeNodes[i]));
      item = printTree(treeNodes[i].children);
      $(item).attr('id', 'folder' + treeNodes[i].id);

      if (localStorage.getItem('folder' + treeNodes[i].id) == null || localStorage.getItem('folder' + treeNodes[i].id) == 'hide') $(item).hide();

    } else {
      item = printNode(treeNodes[i]);
    }

    $(list).append(item);
  }

  return list;
}

function printNode(node) {
  var item = (node.children) ? $('<li id="' + node.id + '" class="folder"></li>').append($('<a><span class="arrow">' + (localStorage.getItem('folder' + node.id) == 'show' ? '&#x25bc;' : '&#x25b6;') + '</span><span class="title">' + node.title + '</span></a>').bind('click', {
    id: node.id
  }, toggleFolder)) : $('<li id="' + node.id + '" class="link"></li>').append('<a href="' + node.url + '" title="' + node.title + '" ' + (localStorage.getItem('newTab' + node.id) ? 'target="_blank"' : '') + '><span class="title">' + (node.title == '' ? '<i>' + node.url + '</i>' : node.title) + '</span></a>');

  $(item).append($('<a class="edit">edit</a>').bind('click', {
    node: node
  }, toggleEdit));

  return item;
}

function toggleFolder(e) {
  var folder = $('ul#folder' + e.data.id);

  if ($(folder).css('display') == 'block' || $(folder).css('display') == '') {
    $(folder).slideUp('fast').prev().find('span.arrow').html('&#x25b6;');
    localStorage.setItem('folder' + e.data.id, 'hide');
  } else {
    $(folder).slideDown('fast').prev().find('span.arrow').html('&#x25bc;');
    localStorage.setItem('folder' + e.data.id, 'show');
  }
}

function toggleEdit(e) {
  if ($('li#edit' + e.data.node.id).length == 1) {
    $('li#edit' + e.data.node.id).remove();
    return false;
  }

  var removeButton = $('<button>Remove</button>').bind('click', {
    node: e.data.node
  }, removeBookmark);
  var cancelButton = $('<button>Cancel</button>').bind('click', {
    node: e.data.node
  }, cancelEdit);
  var saveButton = $('<button><b>Done</b></button>').bind('click', {
    node: e.data.node
  }, saveEdit);

  $('li#' + e.data.node.id).after($('<li id="edit' + e.data.node.id + '" class="edit"><table><tbody><tr><td>Title:</td><td><input type="text" name="title" value="' + e.data.node.title.replace(/"/g, '&quot;') + '" /></td></tr>' + (e.data.node.children ? '' : '<tr><td>URL:</td><td><input type="text" name="url" value="' + e.data.node.url.replace(/"/g, '&quot;') + '" /></td></tr>') + '</tbody></table>' + (e.data.node.children ? '' : '<p class="newTab"><input type="checkbox" id="newtab' + e.data.node.id + '" ' + (localStorage.getItem('newTab' + e.data.node.id) ? 'checked="checked"' : '') + '/> <label for="newtab' + e.data.node.id + '">Open in new tab</label></p>') + '</li>').append($('<p class="buttons"></p>').append(removeButton).append(cancelButton).append(saveButton)).append('<div class="clearer"></div>'));
}

function removeBookmark(e) {
  if (e.data.node.children) {
    if (confirm("Delete folder?")) {
      chrome.bookmarks.removeTree(e.data.node.id);
      $('ul#folder' + e.data.node.id).remove();

    } else return false;

  } else chrome.bookmarks.remove(e.data.node.id);

  $('li#' + e.data.node.id).remove();
  $('li#edit' + e.data.node.id).remove();
}

function cancelEdit(e) {
  $('li#edit' + e.data.node.id).remove();
}

function saveEdit(e) {
  var changes = new Object();

  changes.title = $('li#edit' + e.data.node.id + ' input[name=title]').val();
  $('li#' + e.data.node.id + ' span.title').html(changes.title);

  if (!e.data.node.children) {
    var url = $('li#edit' + e.data.node.id + ' input[name=url]').val();
    if (!url.match(/^https?:\/\//)) url = 'http://' + url;
    changes.url = url;
    $('li#' + e.data.node.id + ' a:first').attr('href', url);
  }

  chrome.bookmarks.update(e.data.node.id, changes);

  localStorage.setItem('newTab' + e.data.node.id, $('li#edit' + e.data.node.id + ' input[type=checkbox]').attr('checked'));

  $('li#edit' + e.data.node.id).remove();
}
