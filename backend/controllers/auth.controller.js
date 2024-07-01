import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req,res)=>{
     try{

 const {username,fullName,email,password} = req.body;

 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

 if (!username || !fullName || !email || !password) {
   return res.status(400).json({ error: "All fields are required" });
}

 if(!emailRegex.test(email)){
    return res.status(400).json({error:"Invalid email format"});
 }

 const existingUser = await User.findOne({username});

 if(existingUser){
    return res.status(400).json({error:"Username is already taken"});
 }

 const existingEmail = await User.findOne({email});

 if(existingEmail){
    return res.status(400).json({error:"Email is already taken"});
 }

 if(password.length < 6){
   return res.status(400).json({error:"password must be atleast 6 characters long"});
 }
 const salt = await bcrypt.genSalt(10);

 const hashPassword = await bcrypt.hash(password,salt);

 const newUser = new User({
    username,
    fullName,
    email,
    password:hashPassword,
 })

 if(newUser){
    generateTokenAndSetCookie(newUser._id,res)
    await newUser.save();

    res.status(201).json({
    _id: newUser._id,
    username: newUser.username,
    fullName: newUser.fullName,
    email: newUser.email,
    followers: newUser.followers,
    following: newUser.following,
    profileImg: newUser.profileImg,
    coverImg: newUser.coverImg,
    });
 }else{
res.status(400).json({error:"Invalid user Data"});
 }

     }catch (error){

        console.log("Error in Signup Controller",error.message);
res.status(500).json({error:"Internal Server Error"});
     }
}

export const login = async (req,res)=>{
   try{
      const {username ,password} = req.body;
      const user = await User.findOne({username});
      const isPasswordCorrect = await bcrypt.compare(password,user?.password || "");

         if(!user || !isPasswordCorrect){
            return res.status(400).json({error:"Invalid Credentials"});
         }

         generateTokenAndSetCookie(user._id,res);

         res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
         });

   }catch(error){
console.log("Error in Login Controller",error.message);
res.status(500).json({error:"Internal Server Error"});
   }
}

export const logout = async (req,res)=>{
    try{
      res.cookie("jwt","",{maxAge:0});
      res.status(200).json({message:"Logged Out Successfully"});
    }catch(error){
console.log("Error in Logout Controller",error.message);
res.status(500).json({error:"Internal Server Error"});
    }
}

export const getMe = async (req, res) => {
   try {
       const user = await User.findById(req.user._id).select("-password");

       if (!user) {
           return res.status(404).json({ error: "User not found" });
       }

       res.status(200).json(user);
   } catch (error) {
       console.log("Error in GetMe Controller", error.message);
       res.status(500).json({ error: "Internal Server Error" });
   }
};