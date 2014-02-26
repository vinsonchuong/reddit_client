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
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        callback(JSON.parse(httpRequest.responseText));
      }
    };
    httpRequest.open('GET', url);
    httpRequest.send();
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

  function Model() {
    var self = this;
    self.fetch = function(success) {
      withResource(self.url(), function(data) {
        success(self.parse(data));
      });
    };
    self.parse = function(data) { return data; };
    self.url = function() { throw new Error("Url Not Implemented"); };
  }

  function SubReddits(options) {
    var self = new Model(options);
    self.url = function() {
      return 'http://www.reddit.com/subreddits/popular.json';
    };
    self.parse = function(data) {
      return data.data.children.map(function(obj) {
        return obj.data;
      });
    };
    return self;
  }

  function SubReddit(options) {
    var self = new Model(options);
    self.url = function() {
      return 'http://www.reddit.com/r/' + options.id + '/hot.json';
    };
    self.parse = function(data) {
      return {
        posts: data.data.children.map(function(obj) { return obj.data; })
      };
    };
    return self;
  }

  function Post(options) {
    var self = new Model(options);
    self.url = function() {
      return 'http://www.reddit.com/r/' + options.subreddit_id + '/comments/' + options.id + '.json';
    };

    self.parse = function(data) {
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
    };
    return self;
  }

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