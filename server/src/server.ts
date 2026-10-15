import express from 'express';
import cors from 'cors'
import {prisma} from './lib/prisma.js'
import { categoriesRouter } from './routes/categories.route.js';

const app=express();
const PORT=3000;

app.use(
    cors({
        origin: 'http://localhost:5173',
    }),
);

app.use('/api/categories',categoriesRouter);


app.get('/health',(_req,res)=>{
    res.status(200).json({
        status:"ok",
        "service":"shopee-clone-api",
    });
});
app.get('/health/db',async (_req,res)=>{
  try{
    const userCount=await prisma.user.count();
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      userCount,
    });
  }catch(error){
    res.status(502).json({
      status: 'error',
      message: 'Không thể truy vấn database'
    })
  }

})

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
});
