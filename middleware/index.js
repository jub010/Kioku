var Attraction = require("../models/attraction");
var Comment = require("../models/comment");
var Review = require("../models/review");

// all the middleware goes here
var middlewareObj = {};

middlewareObj.checkAttractionOwnership = function(req, res, next) {
	if (req.isAuthenticated()) {	
		Attraction.findById(req.params.id, function(err, foundAttraction) {
			if (err || !foundAttraction) {
				req.flash("error", "Sorry, that memory does not exist!");
				res.redirect("back");
			} else {
				// does user own the attraction?
				if (foundAttraction.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}	
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
	if (req.isAuthenticated()) {	
		Comment.findById(req.params.comment_id, function(err, foundComment) {
			if (err || !foundComment) {
				req.flash('error', "Sorry, that comment does not exist!");
				res.redirect("back");
			} else {
				// does user own the comment?
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}	
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

middlewareObj.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if (foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Attraction.findById(req.params.id).populate("reviews").exec(function (err, foundAttraction) {
            if (err || !foundAttraction) {
                req.flash("error", "Memory not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundAttraction.reviews
                var foundUserReview = foundAttraction.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/attractions/" + foundAttraction._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObj;