//= require handlebars.runtime
//= require templates/application
//= require templates/subreddits
//= require templates/posts
//= require templates/_comment
//= require templates/post
(function() {
  'use strict';
  var exports = this,
      document = exports.document;

  function withResource(url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        callback(JSON.parse(request.responseText));
      }
    };
    request.open('GET', url);
    request.send();
  }

  function listen(event, className, callback) {
    document.addEventListener(event, function(e) {
      if (e.target.classList.contains(className)) {
        callback(e);
      }
    });
  }

  function renderResource(type, data) {
    var selector = ['section', 'body', 'div'].map(function(tag) {
      return tag + '.' + type;
    }).join();
    document.querySelector(selector).innerHTML = JST['templates/' + type](data);
  }

  function whenReady(callback) {
    document.addEventListener('DOMContentLoaded', callback);
  }

  function createClass(name, parentClass, members) {
    var descriptors = {};
    Object.keys(members).forEach(function(key) {
      descriptors[key] = {writable: true, value: members[key]};
    });

    var initialize = members.initialize || function(){};

    var Klass = eval('(function ' + name + '() { parentClass.apply(this, arguments); initialize.apply(this, arguments)})');
    Klass.prototype = Object.create(parentClass.prototype, descriptors);
    Klass.prototype.constructor = Klass;
    Klass.name = name;
    return Klass;
  }

  var Model = createClass('Model', Object, {
    initialize: function(options) { this.options = options; },
    url: function() { throw new Error("Url Not Implemented"); },
    parse: function(data) { return data; },
    fetch: function(success) {
      var self = this;
      withResource(self.url(), function(data) {
        success(self.parse(data));
      });
    }
  });

  var SubReddits = createClass('SubReddits', Model, {
    url: function() { return 'http://www.reddit.com/subreddits/popular.json'; },
    parse: function(data) {
      return data.data.children.map(function(obj) {
        return obj.data;
      });
    }
  });

  var SubReddit = createClass('SubReddit', Model, {
    url: function() {
      return 'http://www.reddit.com/r/' + this.options.id + '/hot.json';
    },
    parse: function(data) {
      return {
        posts: data.data.children.map(function(obj) {
          return obj.data;
        })
      };
    }
  });

  var Post = createClass('Post', Model, {
    url: function() {
      return 'http://www.reddit.com/r/' + this.options.subreddit_id + '/comments/' + this.options.id + '.json';
    },
    parse: function(data) {
      function parsePost(post) {
        post = post.data;

        if (post.domain === 'imgur.com') {
          post.image = post.url.replace(/^http:\/\/imgur\.com\/(.+)$/, 'http://i.imgur.com/$1.jpg');
        } else if (post.domain === 'i.imgur.com') {
          post.image = post.url;
        } else if (post.is_self) {
          if (!post.selftext) {
            delete post.selftext;
          }
        }
        return post;
      }

      var post = parsePost(data[0].data.children[0]),
        comments = new Comments({post: post}).parse(data[1]);

      return {post: post, comments: comments}
    }
  });

  function Comments(options) {
    var self = this;

    function parseComment(comment) {
      if (comment.kind !== 't1') { return false; }
      comment = comment.data;

      if (comment.replies) {
        comment.replies = self.parse(comment.replies);
      } else {
        delete comment.replies;
      }

      if (options.post.author === comment.author) {
        comment.post_author = true;
      }

      return comment;
    }

    self.parse = function parse(listing) {
      return listing.data.children.map(parseComment).filter(Boolean);
    };

    return self;
  }

  whenReady(function() {
    renderResource('application');
  });

  whenReady(function() {
    new SubReddits().fetch(function(subreddits) {
      renderResource('subreddits', {subreddits: subreddits});
    });
  });

  whenReady(function() {
    listen('click', 'subreddit', function(e) {
      new SubReddit({id: e.target.dataset.url.split('/')[2]}).fetch(function(subreddit) {
        renderResource('posts', subreddit);
      });
    });
  });

  whenReady(function() {
    listen('click', 'title', function(e) {
      var ids = e.target.dataset.url.match(/^\/r\/(.*?)\/comments\/(.*?)(?:\/|$)/);
      new Post({id: ids[2], subreddit_id: ids[1]}).fetch(function(post) {
        renderResource('post', post);
      });
    });
  });
}).call(this);