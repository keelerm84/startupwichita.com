'use strict';

var mongoose = require('mongoose'),
    util = require('util'),
    Schema = mongoose.Schema,
    Tag = mongoose.model('Tag'),
    validator = require('validator'),
    async = require('async');

function BaseTopicSchema() {
    Schema.apply(this, arguments);

    this.add({
        title: { type: String, required: true },
        tags: { type: [Schema.Types.ObjectId], ref: 'Tag' },
        content: { type: String, required: true },
        //author: { type: Schema.Types.ObjectId, ref: 'User' },
        author: { type: String },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        url: String,
        image: String,
    });
}

util.inherits(BaseTopicSchema, Schema);

module.exports = BaseTopicSchema;

var TopicSchema = new BaseTopicSchema({}, { collection: 'topics' });

TopicSchema.methods.setTags = function (tags, cb) {
    var _this = this;
    async.map(tags, function (tag, next) {
        return Tag.findOrCreate(tag, function (err, tag) {
            next(null, tag._id);
        });
    }, function (err, tagIds) {
        _this.tags = tagIds;
        _this.markModified('tags');
        cb(err, tagIds);
    });
};

TopicSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

TopicSchema.path('url').validate(function(url) {
    return (validator.isNull(url) || validator.isURL(url, true, true));
});

mongoose.model('Topic', TopicSchema);
