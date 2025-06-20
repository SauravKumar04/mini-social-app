const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Set storage location and filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads'); // folder where files are saved
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, name) {
            if (err) return cb(err);
            const fn = name.toString("hex") + path.extname(file.originalname);
            cb(null, fn); // unique filename
        });
    }
});

const upload = multer({ storage: storage });

module.exports = upload; 
