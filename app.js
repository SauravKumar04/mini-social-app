const express = require('express');
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.static('public'));


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const upload = require('./config/multerconfig');

const JWT_SECRET = "shhhh"; // In production, use an env variable

// Home Route
app.get("/", (req, res) => {
    res.render("index");
});

// Registration
app.post("/register", async (req, res) => {
    try {
        const { name, username, email, password, age } = req.body;
        const existingUser = await userModel.findOne({ email });

        if (existingUser) return res.status(409).send("User already exists");

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newUser = await userModel.create({
            username,
            name,
            email,
            password: hash,
            age
        });

        const token = jwt.sign({ email, userid: newUser._id }, JWT_SECRET);
        res.cookie("token", token, { httpOnly: true });
        res.send("User Registered");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login");
});

// Login POST
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) return res.status(401).send("Invalid credentials");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.redirect("/login");

        const token = jwt.sign({ email, userid: user._id }, JWT_SECRET);
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Profile Page
app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email }).populate("posts");
        res.render("profile", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Create Post
app.post("/post", isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        const { content } = req.body;

        const post = await postModel.create({
            user: user._id,
            content
        });

        user.posts.push(post._id);
        await user.save();
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to create post");
    }
});

//Feed 
app.get("/feed", isLoggedIn, async (req, res) => {
    const allPosts = await postModel.find({})
        .populate("user", "username name profilepic") // populates user field with username , name & profile
        .sort({ createdAt: -1 }); // latest posts first

    res.render("feed", { posts: allPosts, user: req.user });
});

//Like
app.get("/like/:id",isLoggedIn, async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect("/profile");
})

//Edit
app.get("/edit/:id",isLoggedIn, async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.id}).populate("user");
    res.render("edit",{post});
})

//Update
app.post("/update/:id",isLoggedIn, async (req,res)=>{
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{content : req.body.content})
    res.redirect("/profile");
})

//Upload Profile
app.get("/profile/upload",(req,res)=>{
    res.render("profileupload");
})


// Upload route

app.post('/uploadprofile', isLoggedIn, upload.single('profilepic'), async (req, res) => {
  if (req.file) {
    const user = await userModel.findOne({ email: req.user.email });
    user.profilepic = req.file.filename;
    await user.save();
  }
  res.redirect('/profile');
});

// Logout
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

// Middleware for protected routes
function isLoggedIn(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).send("You must be logged in");

        const data = jwt.verify(token, JWT_SECRET);
        req.user = data;
        next();
    } catch (err) {
        return res.status(401).send("Invalid or expired token");
    }
}

// Start server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
