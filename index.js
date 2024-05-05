const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const redis = require('redis')
const redisClient = redis.createClient();
const port = '3000';

const defaultExpiry = 1800;



app.use(cors());
redisClient.connect();


app.get('/photos', async (req, res) => {
    // Check if data exists in Redis with a key (e.g., "photos")
    const cachedPhotos = await redisClient.get("photos");

    // If data exists, return it from Redis
    if (cachedPhotos) {
        try {
            const parsedData = JSON.parse(cachedPhotos);
            res.json(parsedData);
            return; // Exit the function if data is found in cache
        } catch (error) {
            console.error("Error parsing cached data:", error);
        }
    }

    try {
        // If data doesn't exist in Redis, fetch from API
        const { data } = await axios.get("https://jsonplaceholder.typicode.com/photos");
        await redisClient.set("photos", JSON.stringify(data), 'EX', defaultExpiry);
        res.json(data);
    } catch (error){
        console.error ("Error fetch response from API - ",error);
        res.status(500).json({message : "Error fetching response from API"});
    }
    
});


app.get('/photos/:id', async (req,res) => {
    const cachedId = await redisClient.get(`photos/${req.params.id}`);

    if(cachedId){
        try{
            const parsedID = JSON.parse(cachedId);
            res.json(cachedId);
            return;
        } catch (error) {
            console.error("Error parsing cached ID:" , error);
        }
    }
    try{
        const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`)
        await redisClient.set(`photos/${req.params.id}`, JSON.stringify(data), 'EX', defaultExpiry);
        res.json(data);
    } catch (error){
        console.error("Error fetching photos - ", error);
        res.status(500).json({message : "Error fetching photos from API"})
    }
        
    
})

app.listen(port,()=>{
    console.log('Server is running on Port 3000')
});