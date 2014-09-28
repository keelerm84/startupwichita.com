'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    News = mongoose.model('News'),
    _ = require('lodash'),
    Feed = require('feed');


/**
 * Find newsItem by _id
 */
exports.newsItem = function(req, res, next, _id) {
    News.findOne({ _id: _id })
        .populate('author')
        .exec(function(err, newsItem) {
            if (err) return next(err);
            if (!newsItem) return next(new Error('Failed to find newsItem ' + _id));
            req.newsItem = newsItem;
            next();
        });
};

/**
 * Create a newsItem
 */
exports.create = function(req, res) {
    var body = JSON.parse(JSON.stringify(req.body));
    delete body.tags;

    var newsItem = new News(body);

    newsItem.setTags(req.body.tags, function (err) {
        if (err) {
            res.send(500, { errors: err.errors, newsItem: newsItem });
        } else {
            newsItem.save(function(err) {
                if (err) {
                    res.send(500, { errors: err.errors, newsItem: newsItem });
                } else {
                    res.jsonp(201, newsItem);
                }
            });
        }
    });
};

/**
 * Update a newsItem
 */
exports.update = function(req, res) {
    var newsItem = req.newsItem;

    newsItem = _.extend(newsItem, req.body);

    newsItem.save(function(err) {
        if (err) {
            res.send(500, { errors: err.errors, newsItem: newsItem });
        } else {
            res.jsonp(newsItem);
        }
    });
};

/**
 * Delete a newsItem
 */
exports.destroy = function(req, res) {
    var newsItem = req.newsItem;

    newsItem.remove(function(err) {
        if (err) {
            res.send(500, { errors: err.errors, newsItem: newsItem });
        } else {
            res.jsonp(204, newsItem);
        }
    });
};

/**
 * Show a newsItem
 */
exports.show = function(req, res) {
    res.jsonp(req.newsItem);
};

/**
 * List of News items
 */
exports.all = function(req, res) {
    News.find()
        .populate('author')
        .sort('-title')
        .exec(function(err, news) {
            if (err) {
                res.send(500, { errors: err.errors });
            } else {
                return res.jsonp(news);
            }
        });
};

exports.rss = function(req, res) {
    var feed = new Feed({
        title: 'Startup Wichita News',
        description: 'The most recent news registered with the Startup Wichita site',
        link: 'http://startupwichita.com'
    });

    News.find()
        .populate('author')
        .sort('-created_at')
        .limit(20)
        .exec(function(err, news) {
            if (err) {
                res.send(500, { errors: err.errors });
            } else {
                news.forEach(function(newsItem) {
                    feed.addItem({
                        title: newsItem.title,
                        link: newsItem.url,
                        description: newsItem.content.substr(0, 100),
                        content: newsItem.content,
                        date: newsItem.date
                    });
                });

                res.send(feed.render('rss-2.0'));
            }
        });
};
