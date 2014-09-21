'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Event = mongoose.model('Event'),
    Tag = mongoose.model('Tag'),
    _ = require('lodash'),
    Feed = require('feed');


/**
 * Find event by _id
 */
exports.event = function(req, res, next, _id) {
    Topic.aggregate({ $project: { tags: 1, _id: 0 }})
    .unwind('tags')
    .group({ _id: "$tags" })
    .exec(function(err, results) {
      console.log(err);
      console.log(results);
    });
    Event.findOne({ _id: _id }, function(err, event) {
        if (err) return next(err);
        if (!event) return next(new Error('Failed to find event ' + _id));

        Tag.find({ _id: { '$in': event.tags }}, function(err, tags) {
            if (err) return next(err);

            var formattedEvent = JSON.parse(JSON.stringify(event));

            formattedEvent.tags = tags.map(function(tag) {
                return tag.name;
            });

            req.event = formattedEvent;

            next();
        });
    });
};

/**
 * Create an event
 */
exports.create = function(req, res) {
    var body = JSON.parse(JSON.stringify(req.body));
    delete body.tags;

    var event = new Event(body);

    event.setTags(req.body.tags, function (err) {
        if (err) {
            res.send(500, { errors: err.errors, event: event });
        } else {
            event.save(function(error) {
                if (error) {
                    res.send(500, { errors: error.errors, event: event });
                } else {
                    event.tags = req.body.tags;
                    res.jsonp(201, event);
                }
            });
        }
    });
};

/**
 * Update an event
 */
exports.update = function(req, res) {

    Event.findOne({ _id: req.body._id }, function(err, event) {
        if (err) {
            return res.send(500, { errors: err.errors, event: event });
        }

        var body = JSON.parse(JSON.stringify(req.body));
        delete body.tags;

        event = _.extend(event, body);

        event.setTags(req.body.tags, function (err) {
            if (err) {
                res.send(500, { errors: err.errors, event: event });
            } else {
                event.save(function(error) {
                    if (error) {
                        res.send(500, { errors: error.errors, event: event });
                    } else {
                        res.jsonp(201, event);
                    }
                });
            }
        });
    });

};

/**
 * Delete an event
 */
exports.destroy = function(req, res) {
    var event = req.event;

    event.remove(function(err) {
        if (err) {
            res.send(500, { errors: err.errors, event: event });
        } else {
            res.jsonp(204, event);
        }
    });
};

/**
 * Show an event
 */
exports.show = function(req, res) {
    res.jsonp(req.event);
};

/**
 * List of Events
 */
exports.all = function(req, res) {
    Event.find().sort('-title').exec(function(err, events) {
        if (err) {
            res.send(500, { errors: err.errors });
        } else {
            return res.jsonp(events);
        }
    });
};

exports.rss = function(req, res) {
    var feed = new Feed({
        title: 'Startup Wichita Events',
        description: 'The most recent events registered with the Startup Wichita site',
        link: 'http://startupwichita.com'
    });

    Event.find().sort('-created_at').limit(20).exec(function(err, events) {
        if (err) {
            res.send(500, { errors: err.errors });
        } else {
            events.forEach(function(event) {
                feed.addItem({
                    title: event.title,
                    link: event.url,
                    description: event.content.substr(0, 100),
                    content: event.content,
                    date: event.created_at
                });
            });

            res.send(feed.render('rss-2.0'));
        }
    });
};
