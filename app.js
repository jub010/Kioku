require('dotenv').config();

var express        = require("express"),
	app 	       = express(),
	bodyParser     = require("body-parser"),
	mongoose       = require("mongoose"),
	flash          = require("connect-flash"),
	passport       = require("passport"),
	LocalStrategy  = require("passport-local"),
	methodOverride = require("method-override"),
	Attraction     = require("./models/attraction"),
	Comment        = require("./models/comment"),
	User           = require("./models/user"),
	seedDB         = require("./seeds");

// requiring routes
var commentRoutes    = require("./routes/comments"),
	reviewRoutes     = require("./routes/reviews"),
	attractionRoutes = require("./routes/attractions"),
	indexRoutes       = require("./routes/index");

var url = process.env.DATABASEURL || "mongodb://localhost:27017/kioku"
mongoose.connect(url, {useNewUrlParser: true, useCreateIndex: true});
// mongoose.connect("mongodb+srv://hexiaozhidi:@cluster0-byjyg.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true, useCreateIndex: true});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
// seedDB(); // seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "iroseka",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success")
	next();
});

app.use("/", indexRoutes);
app.use("/attractions", attractionRoutes);
app.use("/attractions/:id/comments", commentRoutes);
app.use("/attractions/:id/reviews", reviewRoutes);


app.listen(process.env.PORT || 3000, function() {
	console.log("The Kioku Server Has Started!");
});