import express from 'express';
import cors from 'cors'
import {prisma} from './lib/prisma.js'
import { categoriesRouter } from './routes/categories.route.js';
import {productsRouter} from './routes/products.route.js'
import { authRouter } from './routes/auth.route.js';
import { cartRouter } from "./routes/cart.route.js";
import cookieParser from "cookie-parser";

const app=express();
const PORT=3000;

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/categories',categoriesRouter);
app.use('/api/products',productsRouter);
app.use('/api/auth',authRouter);
app.use("/api/cart", cartRouter);

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
