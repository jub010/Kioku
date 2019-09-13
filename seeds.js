require('dotenv').config();

var mongoose = require("mongoose");
var passport = require("passport");
var User = require("./models/user");
var Attraction = require("./models/attraction");
var Comment   = require("./models/comment");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

var userData = [
	{
		username: "Jack",
		firstName: "Jack",
		lastName: "Foobar",
		email: "jack@foobar.com",
		avatar: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
	},
	{
		username: "Jill",
		firstName: "Jill",
		lastName: "Foobar",
		email: "jill@foobar.com",
		avatar: "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_redBlue.png"
	},
	{
		username: "Jane",
		firstName: "Jane",
		lastName: "Foobar",
		email: "jane@foobar.com",
		avatar: "https://www.bing.com/sa/simg/SharedSpriteDesktop_2x_040919.png"
	}
]
 
var attractionData = [
    {
        name: "Cloud's Rest", 
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
		cost: 10.00,
		location: "Yosemite National Park, California, USA",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    {
        name: "Desert Mesa", 
        image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
		cost: 10.00,
		location: "Yosemite National Park, California, USA",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    {
        name: "Canyon Floor", 
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
		cost: 10.00,
		location: "Yosemite National Park, California, USA",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    }
]
 
async function seedDB(){
	// Remove all users
	await User.deleteMany({}, function(err) {
		if (err) {
			console.log(err);
		}
		console.log("removed users!");
	});
	
	// Remove all attractions
	await Attraction.deleteMany({}, function(err) {
		if (err) {
			console.log(err);
		}
		console.log("removed attractions!");
	});

	// Remove all comments
	await Comment.deleteMany({}, function(err) {
		if (err){
			console.log(err);
		}
		console.log("removed comments!");
	});
	
	// Add a few users
	for (let i = 0; i < userData.length; i++) {
		let newUser = await new User(userData[i]);
		let user = await User.register(newUser, "password");
		userData[i].id = user._id;
		console.log("Created new user");
	}
	
	// Add a few attractions
	for (let i = 0; i < attractionData.length; i++) {
		attractionData[i].author = {id: userData[i].id, username: userData[i].username};
		await geocoder.geocode(attractionData[i].location, function(err, data) {
			if (err || !data.length) {
				console.log(err);
				console.log(data);
			} else {
				attractionData[i].lat = data[0].latitude;
    			attractionData[i].lng = data[0].longitude;
    			attractionData[i].location = data[0].formattedAddress;
			}
		});
		let newAttraction = await Attraction.create(attractionData[i]);
		console.log("added a attraction");
		let newComment = await Comment.create(
			{
				text: "This place is great, but I wish there was internet",
                author: attractionData[i].author
            });
		newAttraction.comments.push(newComment);
    	newAttraction.save();
        console.log("Created new comment");
	}
}
 
module.exports = seedDB;