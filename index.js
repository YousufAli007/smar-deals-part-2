const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config()
const cors = require('cors');
const app =express();
const admin = require("firebase-admin");
const port =process.env.PORT || 3000


const decoded = Buffer.from(
  process.env.fIREBASE_SERVICE_KEY,
  "base64"
).toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

 
// middleware
app.use(cors())
app.use(express.json())
const logger =(req, res, next)=>{
  // console.log('hello yousuf ali')
  next()
}
const varifyFirebaseDatabase =async (req,res,next)=>{
  // console.log('verify middle were')
  if(!req.headers.authorization){
   return res.status(401).send({message:'undifiend authorization'})
  }
  const token =req.headers.authorization.split(' ')[1];
  if(!token){
    return res.status(401).send({message:'undifiend authorization'})
  }
  // verify token 
  try{
    const userInof = await admin.auth().verifyIdToken(token);
    req.token_email =userInof.email;
    console.log(req)
    console.log('after token validation',userInof)
    next();
  }
  catch{
    
    return res.status(401).send({ message: "undifiend authorization" });
    
  }
  
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cydeyqc.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
async function run() {
  try{
    await client.connect();
    const database=client.db('smart_db'); 
    const productCollection =database.collection('products');
    const bidsCollection =database.collection('bids');
    // const usersCollection =database.collection('yousuf');
    // app.post('/yousuf',async(req,res)=>{
    //   const newUsers =req.body;
    //   const result=await usersCollection.insertOne(newUsers)
    //   res.send(result)
    // })

    // LatestProduct Api
    app.get('/latest_products', async(req ,res)=>{
     const products = productCollection.find().sort({ price_min: 1 }).limit(6);
     const result =await products.toArray()
     res.send(result) 
    })

    // post  data in the  Database
     app.post("/products", async (req, res) => {
      console.log(req.headers)
       const newProduct = req.body;
       const result = await productCollection.insertOne(newProduct);
       res.send(result);
     });

    // Delate data form Database
    app.delete('/products/:id', async(req , res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)}
      const result =await productCollection.deleteOne(query)
      res.send(result)
    }) 
    //  update data in the Database
    app.patch('/products/:id',async (req,res)=>{
      const id =req.params.id;
      const query={_id:new ObjectId(id)};
      const updteProduct =req.body;
      const updateDocument = {
        $set:updteProduct
      };
      const result =await productCollection.updateOne(query,updateDocument)
      res.send(result)
      
    })


    // get all data form Database
    app.get('/products', async(req,res)=>{
      // const projectFields = { title: 1, price_max:1, price_min:1 };
      // const cursor = productCollection
      //   .find()
      //   .sort({ price_min: -1})
      //   .limit(3)
      //   .skip(1)
      //   .project(projectFields)
      //  ;
      console.log(req.query)
      const email =req.query.email;
      const query={};
      if(email){
        query.email=email
      }
      const cursor =productCollection.find(query)
      const result =await cursor.toArray();
      res.send(result)
    })
    // get single data form the Database
    app.get('/products/:id', async(req,res)=>{
      const id =req.params.id;
      const query = { _id: new ObjectId(id) };
      const result =await productCollection.findOne(query);
      
      res.send(result)
    })


    // bids section 


    // app.get('/bids',async (req,res)=>{
    //   const cursor=bidsCollection.find();
    //   const result =await cursor.toArray()
    //   res.send(result)
    // })

    app.post('/bids', async(req,res)=>{
      const newBids =req.body;
      const result =await bidsCollection.insertOne(newBids)
      res.send(result)

    })
    app.get('/bid/:id',async (req, res)=>{
      const id = req.params.id;
      const query={productId: id};
      const corsor = bidsCollection.find(query).sort({
        bid_price: 1});
      const result =await corsor.toArray()
      res.send(result)
    })

    app.get("/bids",logger,varifyFirebaseDatabase, async(req, res)=>{
      // console.log('headers',req.headers)
      const email =req.query.email;
      // console.log('email req',email)
      const query ={};
      if(email){
        if (email !== req.token_email) {
          return res.status(403).send({massage:'forbids access'});
        }
        query.bid_email= email;
      }
      // console.log('query', query)
      const cursor = bidsCollection.find(query);
      const result =await cursor.toArray()
      res.send(result)
    });
    
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  }
  finally{

  }
}
run().catch(console.dir)
app.get('/',(req,res) =>{
  res.send('Smart details server')
})

app.listen(port,()=>{
  console.log(`Example app listening on port${port}`);
})