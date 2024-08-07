import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req,res)=>{

    try {
        
        const {text} = req.body;
        let {img ,video } = req.body;
        

        const userId = req.user._id.toString();

        const user = await User.findById(userId);

        if(!user) return res.status(404).json({message:"User not found"});

        if(!text && !img && !video){

            return res.status(400).json({error:"Post must have text or image or video"});

        }

        if(img){

            const uploadedResponse = await cloudinary.uploader.upload(img);

            img = uploadedResponse.secure_url;

        }

        if(video){

            const uploadedResponse = await cloudinary.uploader.upload(video,{
                resource_type:"video",
                quality:"auto:good",
                format:"mp4",
                
            });


        }

        
        const newPost = new Post({

            user:userId,
            text,
            img,
            video
        })

        await newPost.save();

        res.status(201).json(newPost);

    } catch (error) {
        
        res.status(500).json({error:"Internal Server Error"});
        console.log("Error in createPost Controller",error);
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);  // Add 'await' to properly get the post document

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this post" });
        }

        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost Controller", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const commentOnPost = async (req,res) => {

    try {
        
        const {text} = req.body;

        const postId = req.params.id;

        const userId = req.user._id;

    if(!text){

        return res.status(400).json({error:"text field is required"});

    }

    const post = await Post.findById(postId)

    if(!post){

        return res.status(404).json({error:"post not found"});

    }

    const comment = {user: userId,text} 

    post.comments.push(comment);

    await post.save();

    res.status(200).json(post);

    } catch (error) {
        
        console.log("error in commentonpost controller",error);
        return res.status(500).json({error:"internal server error"});

    }
};

export const likeUnlikePost = async (req,res) =>{

    try {
        
         const userId = req.user._id;

         const {id:postId} = req.params;

         const post = await Post.findById(postId);

         if(!post){

            return res.status(404).json({error:"post not found"});

         }

         const userLikedPost = post.likes.includes(userId);

         if(userLikedPost){

        await Post.updateOne({_id:postId},{$pull:{likes:userId}});

        await User.updateOne({_id:userId},{$pull:{likedPosts:postId}});

        const updateLikes = post.likes.filter((id)=> id.toString() !== userId.toString());

        return res.status(200).json(updateLikes);


         }else{

        post.likes.push(userId);

        await User.updateOne({_id:userId},{$push:{likedPosts:postId}}); 

        await post.save();

        const notification = new Notification({
            from:userId,
            to:post.user,
            type:"like"
        })

        await  notification.save();

        const updateLikes = post.likes;

        return res.status(200).json(updateLikes);

         }
    } catch (error) {
        
        console.log("Error in unlikepost controller",error);
        return res.status(500).json({error:"internal server error"});
         
    }

};

export const getAllPosts = async (req,res)=>{

    try {
        
      const posts = await Post.find().sort({createdAt:-1}).populate({
        path:"user",
        select:"-password", 
      })
      .populate({
        path:"comments.user",
        select:"-password",
      })
      if (posts.length === 0){

        return res.status(200).json([]);

      }

      res.status(200).json(posts);


    } catch (error) {
        
        console.log("Error in getallposts controller",error);
        return res.status(500).json({error:"internal server error"});


    }

};

export const getLikedPosts = async (req, res) => {
    const { id: userId } = req.params; // Destructure the id from req.params

    try {
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ error: "user not found" });

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getlikedposts controller", error);
        return res.status(500).json({ error: "internal server error" });
    }
};

export const getFollowingPosts = async (req,res) => {

    try {
        
      const userId = req.user._id;

      const user = await User.findById(userId);

      if(!user) return res.status(404).json({error:"user not found"});

      const following = user.following;

      const feedPosts = await Post.find({user:{$in:following}}).sort({createdAt:-1}).populate({
        path:"user",
        select:"-password",
      }).populate({
        path:"comments.user",
        select:"-password",
      });

      return res.status(200).json(feedPosts);


    } catch (error) {
        
        console.log("Error in getfollowingposts",error);
        return res.status(500).json({error:"internal server error"});
    }
};

export const getUserPosts = async (req,res)=>{

    try {
        
        const {username} = req.params;

        const user = await User.findOne({username});

        if(!user) return res.status(404).json({error:"user not found"});

        const posts = await Post.find({user:user._id}).sort({createdAt:-1}).populate({
            path:"user",
            select:"-password",
          }).populate({
            path:"comments.user",
            select:"-password",
          });
    
          return res.status(200).json(posts);


    } catch (error) {
        
        console.log("Error in getuserposts",error);
        return res.status(500).json({error:"internal server error"});

    }

};