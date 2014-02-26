//= require lodash
//= require handlebars.runtime
//= require templates/layout
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
    document.querySelector('section.' + type).innerHTML = JST['templates/' + type](data);
  }

  function whenReady(callback) {
    document.addEventListener('DOMContentLoaded', callback);
  }

  whenReady(function() {
    withResource('http://www.reddit.com/subreddits/popular.json', function(data) {
      renderResource('subreddits', {
        subreddits: _.map(data.data.children, function(obj) { return obj.data; })
      });
    });
  });

  whenReady(function() {
    listen('click', 'subreddit', function(e) {
      withResource('http://www.reddit.com' + e.target.dataset.url + '/hot.json', function(data) {
        renderResource('posts', {
          posts: _.map(data.data.children, function(obj) { return obj.data; })
        });
      });
    });
  });

  whenReady(function() {
    listen('click', 'title', function(e) {
      withResource('http://www.reddit.com' + e.target.dataset.url + '.json', function(data) {
        function parsePost(post) {
          post = post.data;

          if (post.domain === 'imgur.com') {
            post.image = post.url.replace(/^http:\/\/imgur\.com\/(.+)$/, 'http://i.imgur.com/$1.jpg');
          } else if(post.domain === 'i.imgur.com') {
            post.image = post.url;
          } else if (post.is_self) {
            if (!post.selftext) {
              delete post.selftext;
            }
          }
          return post;
        }

        function parseComment(comment) {
          comment = _.clone(comment.data);

          if (comment.replies) {
            comment.replies = parseComments(comment.replies);
          } else {
            delete comment.replies;
          }
          if(post.author === comment.author) {
            comment.post_author = true;
          }
          return comment;
        }

        function parseComments(listing) {
          return _.compact(_.map(listing.data.children, function(comment) {
            if (comment.kind === 't1') {
              return parseComment(comment);
            }
          }));
        }

        var post;
        renderResource('post', {
          post: post = parsePost(data[0].data.children[0]),
          comments: parseComments(data[1])
        });
      });
    });
  });

  whenReady(function() {
    document.querySelector('.app').innerHTML = JST['templates/layout']();
  });
}).call(this);