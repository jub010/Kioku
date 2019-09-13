var express = require("express");
var router = express.Router();
var Attraction = require("../models/attraction");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware/index.js");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dcdox9x32', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// INDEX - show all attractions
router.get("/", function(req, res) {
	let noMatch = null;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Attraction.find({name: regex}, function(err, allAttractions) {
			if (err) {
				console.log(err);
			} else {
				if (allAttractions.length < 1) {
            		noMatch = "No memories match that query, please try again.";
        		}
				res.render("attractions/index",{attractions: allAttractions, currentUser: req.user, page: 'attractions', noMatch: noMatch});
			}
		});
	} else {
		// Get all attractions from DB
		Attraction.find({}, function(err, allAttractions) {
			if (err) {
				console.log(err);
			} else {
				res.render("attractions/index", {attractions: allAttractions, currentUser: req.user, page: 'attractions', noMatch: noMatch});
			}
		});
	}
});

// CREATE - add new attraction to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
	// get data from form and add to attractions array
	req.body.attraction.author = {
		id: req.user._id,
		username: req.user.username
	}
	geocoder.geocode(req.body.attraction.location, function(err, data) {
    	if (err || !data.length) {
      		req.flash('error', 'Invalid address');
      		return res.redirect('back');
    	}
        req.body.attraction.cost = req.body.attraction.cost ? req.body.attraction.cost : 0;
		req.body.attraction.lat = data[0].latitude;
    	req.body.attraction.lng = data[0].longitude;
    	req.body.attraction.location = data[0].formattedAddress;
		cloudinary.uploader.upload(req.file.path, function(result) {
			// add cloudinary url for the image to the attraction object under image property
			req.body.attraction.image = result.secure_url;
			Attraction.create(req.body.attraction, function(err, attraction) {
    			if (err) {
					console.log(err);
      				req.flash('error', err.message);
      				return res.redirect('back');
    			}
				res.redirect('/attractions/' + attraction._id);
			});
		});
	});
});

// NEW - show form to create new attraction
router.get("/new", middleware.isLoggedIn, function(req, res) {
	res.render("attractions/new");
});

// SHOW - shows more info about one attraction
router.get("/:id", function(req, res) {
    // find the attraction with provided ID
	Attraction.findById(req.params.id).populate("comments likes").populate({
    	path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundAttraction) {
		if (err || !foundAttraction) {
			console.log(err);
			req.flash('error', 'Sorry, that memory does not exist!');
            return res.redirect('/attractions');
		} else {
			// render show template with that attraction
			res.render("attractions/show", {attraction: foundAttraction});
		}
	});
});

// EDIT ATTRACTION ROUTE
router.get("/:id/edit", middleware.checkAttractionOwnership, function(req, res) {
    Attraction.findById(req.params.id, function(err, foundAttraction) {
        res.render("attractions/edit", {attraction: foundAttraction});
    });
});

// UPDATE ATTRACTION ROUTE
router.put("/:id", middleware.checkAttractionOwnership, upload.single('image'), function(req, res) {
	delete req.body.attraction.rating;
    geocoder.geocode(req.body.attraction.location, function(err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.attraction.cost = req.body.attraction.cost ? req.body.attraction.cost : 0;
        req.body.attraction.lat = data[0].latitude;
        req.body.attraction.lng = data[0].longitude;
        req.body.attraction.location = data[0].formattedAddress;
		let imagePath = req.file ? req.file.path : "";
        cloudinary.uploader.upload(imagePath, function(result) {
			if (result.secure_url) {
				req.body.attraction.image = result.secure_url;
			}
			Attraction.findByIdAndUpdate(req.params.id, req.body.attraction, function(err, updatedAttraction) {
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated!");
                    res.redirect('/attractions/' + updatedAttraction._id);
                }
            });
        });
    });
});

// DESTROY ATTRACTION ROUTE
router.delete("/:id", middleware.checkAttractionOwnership, function (req, res) {
    Attraction.findById(req.params.id, function (err, attraction) {
        if (err) {
            res.redirect("/attractions");
        } else {
            // deletes all comments associated with the attraction
            Comment.remove({"_id": {$in: attraction.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/attractions");
                }
                // deletes all reviews associated with the attraction
                Review.remove({"_id": {$in: attraction.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/attractions");
                    }
                    //  delete the attraction
                    attraction.remove();
                    req.flash("success", "Memory deleted successfully!");
                    res.redirect("/attractions");
                });
            });
        }
    });
});

// Attraction Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Attraction.findById(req.params.id, function (err, foundAttraction) {
        if (err) {
            console.log(err);
            return res.redirect("/attractions");
        }

        // check if req.user._id exists in foundAttraction.likes
        var foundUserLike = foundAttraction.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundAttraction.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundAttraction.likes.push(req.user);
        }

        foundAttraction.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/attractions");
            }
            return res.redirect("/attractions/" + foundAttraction._id);
        });
    });
});

module.exports = router;
