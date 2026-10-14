import express from 'express';
import cors from 'cors'
import {prisma} from './lib/prisma.js'

const app=express();
const PORT=3000;

app.use(
    cors({
        origin: 'http://localhost:5173',
    }),
);

const categories=[
  {
    "id": 1,
    "name": "Thời trang nam"
  },
  {
    "id": 2,
    "name": "Mỹ phẩm"
  },
  {
    "id": 3,
    "name": "Thiết bị điện tử"
  }
]

app.get('/api/categories', (_req,res)=>{
    res.status(200).json(categories);
});

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
