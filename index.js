import express from 'express';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.get("/books", async(req, res)=>{
    const data = await prisma.book.findMany({
        select:{
            id:true,
            name:true,
            author:true
        }
    });
    res.json(data);
});

app.listen(3000, ()=>{
    console.log("Server running on port 3000");
});