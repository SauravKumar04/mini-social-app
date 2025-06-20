const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/miniproject");

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    age: Number,
    profilepic : {
        type : String,
        default : "displayProfile.jpg"
    },
    posts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "post"
        }
    ]
})

module.exports = mongoose.model("user", userSchema);