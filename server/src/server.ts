import express from 'express';
import cors from 'cors'

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

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
});
