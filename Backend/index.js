const express = require("express")
const mongoose = require("mongoose");
const shortid = require("shortid");
const server = express();

// middlewares
server.use(express.json());

// database connection
async function connect(){
    await mongoose.connect(`${process.env.MONGO_URL}urldata`)
}

connect();

// database schema for storing the data
const url_schema = new mongoose.Schema({
    url:{
        type:String,
        require:true
    },
    shortCode:{
        type:String,
        require:true
    },
    visitTime:[{timestamp:{type:Number}}]
})

const url = mongoose.model("URL",url_schema)


// routes
server.post("/shorturls",async(req,res)=>{
    const data = req.body;
    
    if(!data.url){
        return res.status(404).json({"message":"url required"})
    }

    const short_code = shortid();

    if(!data.shortcode && !data.validity){
        await url.create({
            url:data.url,
            shortCode:short_code,
            visitTime:{timestamp:Date.now()}
        })

        return res.status(201).json({"shortLink":`https://localhost:8000/${short_code}`,"expiry":`${Date.now()}:30:00Z`});
    }

    else{
        await url.create({
            url:data.url,
            shortCode:data.shortcode,
            visitTime:{timestamp:Date.now()}
        })

        return res.status(201).json({"shortLink":`https://localhost:8000/${data.shortcode}`,"expiry":`${Date.now()}:${data.validity}:00Z`});
    }
})


// retriving the link data
server.get("/shorturls/:id",async(req,res)=>{
    const id = req.params.id;

    const url_data = await url.findOne({"shortCode":id});

    if(!url_data){
        return res.status(404).json({"message":"invalid shortid"});
    }
    
    else{
        await url.findOneAndUpdate(
            {
                id
            },
            {
                $push:{
                    visitTime:{
                        timestamp:Date.now()
                    }
                }
            }
        )

        res.status(200).json({"total_click":url_data.visitTime.length,"creation_time":`${url_data.visitTime[0]}`,"curr_time":Date.now(),})
    }
    
})