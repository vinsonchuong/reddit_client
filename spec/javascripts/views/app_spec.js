//= require spec_helper
//= require application
describe('App', function() {
  function triggerEvent(selector, eventName) {
    var event;
    if (eventName === 'click') {
      event = new MouseEvent('click', {view: window, bubbles: true, cancelable: true});
    }

    document.querySelector(selector).dispatchEvent(event);
  }

  describe('when /subreddits/popular.json responds', function () {
    beforeEach(function() {
      server.respondTo('http://www.reddit.com/subreddits/popular.json', {
        data: {
          children: [
            {data: {display_name: 'foo', url: '/r/foo'}},
            {data: {display_name: 'bar', url: '/r/bar'}}
          ]
        }
      });
    });

    it('renders a list of popular subreddits', function() {
      var subreddits = document.querySelectorAll('.app section.subreddits .subreddit');

      expect(subreddits[0]).toHaveText('foo');
      expect(subreddits[0]).toHaveData('url', '/r/foo');

      expect(subreddits[1]).toHaveText('bar');
      expect(subreddits[1]).toHaveData('url', '/r/bar');
    });

    describe("when clicking on a subreddit link and the server responds", function() {
      beforeEach(function() {
        triggerEvent('.app section.subreddits .subreddit:first-child', 'click');
        server.respondTo('http://www.reddit.com/r/foo/hot.json', {
          data: {
            children: [
              {data: {title: 'foo is great', url: 'http://images.com/foo.gif',
                permalink: '/r/foo/comments/foo_is_great'}}
            ]
          }
        });
      });

      it("should render posts", function() {
        var postTitle = document.querySelector('.app section.posts .post .title');
        expect(postTitle).toHaveText('foo is great');
        expect(postTitle).toHaveData('url', '/r/foo/comments/foo_is_great');
      });

      describe("when clicking on a post link", function() {
        beforeEach(function() {
          triggerEvent('.app section.posts .post .title:first-child', 'click');
        });

        function respond(postData) {
          server.respondTo('http://www.reddit.com/r/foo/comments/foo_is_great.json', [
            {data: {children: [{kind: 't3', data: _.extend({title: 'foo is great', author: 'bob'}, postData)}]}},
            {data: {children: [
              {kind: "t1", data: {author: 'bob', body: 'comment 1', replies: {data: {children: [
                {kind: "t1", data: {author: 'alice', body: 'sub-comment 1', replies: {data: {children: [
                  {kind: "t1", data: {author: 'chase', body: 'sub-sub comment 1'}}
                ]}}}}
              ]}}}},
              {kind: "t1", data: {author: 'chase', body: 'comment 2'}},
              {kind: "more"}
            ]}}
          ]);
        }

        describe("when the server responds with a self post", function() {
          beforeEach(function() {
            respond({domain: 'self.foo', selftext: 'foo self post content'});
          });

          it('should render the correct content', function() {
            var post = document.querySelector('.app section.post');
            expect(post.querySelector('.title')).toHaveText('foo is great');
            expect(post.querySelector('.content')).toHaveText('foo self post content');
          });
        });

        describe("when the server responds with domain imgur.com", function() {
          beforeEach(function() {
            respond({domain: 'imgur.com', url: "http://imgur.com/1234"});
          });

          it('should render the image', function() {
            var post = document.querySelector('.app section.post');
            expect(post.querySelector('.content')).toHaveAttr('src', 'http://i.imgur.com/1234.jpg');
          });
        });

        describe("when the server responds with domain i.imgur.com", function() {
          beforeEach(function() {
            respond({domain: 'i.imgur.com', url:'http://i.imgur.com/1234.jpg'});
          });

          it('should render the image', function() {
            var post = document.querySelector('.app section.post');
            expect(post.querySelector('.content')).toHaveAttr('src', 'http://i.imgur.com/1234.jpg');
          });
        });

        it("should render comments", function () {
          respond();

          var comments = document.querySelectorAll('.app .post > .comments > .comment');
          expect(comments[0].querySelector('.body')).toHaveText('comment 1');
          expect(document.querySelectorAll('.app .post > .comments > .comment:first-child > .comments > .comment:first-child > .body')).toHaveText('sub-comment 1');
          expect(document.querySelectorAll('.app .post > .comments > .comment:first-child > .comments > .comment:first-child > .comments > .comment:first-child > .body')).toHaveText('sub-sub comment 1');
          expect(comments[1].querySelector('.body')).toHaveText('comment 2');
        });

        it("should render post author's comments with by_post_author class", function() {
          respond();

          var comments = document.querySelectorAll('.app .post > .comments > .comment');
          expect(comments[0]).toHaveClass('by_post_author');
        });

        it("should not render the more placeholder as a comment", function() {
          expect(document.querySelectorAll('.app .post > .comments > .comment').length).toEqual(2);
        });
      });
    });
  });
});