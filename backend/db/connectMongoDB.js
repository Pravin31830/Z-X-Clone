import mongoose from "mongoose";

const connectMongoDB = async () =>{
    try{

        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);

    }catch(error){
        console.log(`error connecting to mongo db:${error.message}`);
        process.exit(1);
    }
}

export default connectMongoDB;