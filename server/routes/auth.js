const router = require("express").Router();
const bcyrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("../models/User");
const bcrypt = require("bcryptjs/dist/bcrypt");

// configuration multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

/*USER REGISTER*/
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    // Take all information from the form
    const { firstName, lastName, email, password } = req.body;

    // The uploaded file is available as req.file
    const profileImage = req.file;

    if (!profileImage) {
      return res.status(400).send("No file uploaded");
    }

    // path to the uploaded profile photo
    const ProfileImagePath = profileImage.path;

    //check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists!" });
    }
    //Hass the password
    const salt = await bcrypt.genSalt();
    const hashedpassword = await bcrypt.hash(password, salt);

    //create a new user

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedpassword,
      ProfileImagePath,
    });

    //save the new user
    await newUser.save();

    //send a successful message
    res
      .status(200)
      .json({ message: "User registered successfully!", user: newUser });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Registration failed!", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(409).json({ message: "User doesn't exists!" });
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        return res.status(400).json({message:"Invalid Credentials"})
    }

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
    delete user.password

    res.status(200).json({token, user})
  } catch (err) {
    console.log(err)
    res.status(500).json({error:err.message})
  }
});

module.exports = router;
