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

app.get("/books/id_:id", async(req, res)=>{
    const id = Number(req.params.id);
    const bookData = await prisma.book.findUnique({
        where: {
            id:id
        }
    }); 
    res.json(bookData);
});

app.post("/books/list", async(req,res)=>{
    const bookData = req.body;
    await prisma.book.create({
        data:{
            name:bookData.name,
            author:bookData.author,
            quantity:bookData.quantity,
            price:bookData.price
        }
    });
    res.json({"Message":"Data successfully Added"});
});

app.put("/books/id_:id/buy",async(req,res)=>{
    const bookId = Number(req.params.id);
    const booksQuantity = Number(req.body.quantity);
    const bookToBuy = await prisma.book.findUnique({
        where:{
            id:bookId
        }
    });

    const updatedBookData = await prisma.book.update({
        where:{
            id:bookId
        },
        data:{
            quantity:bookToBuy.quantity-booksQuantity
        }
    });

    if(updatedBookData.quantity == 0){
        await prisma.book.delete({
            where:{
                id:bookId
            }
        })
    }
    res.json({
        "Message":"Book Successfully Purchased",
        "Book-Details":{
            "title":bookToBuy.name,
            "author":bookToBuy.author,
            "price":bookToBuy.price,
            "quantity":booksQuantity
        }
    });
});

app.listen(3000, ()=>{
    console.log("Server running on port 3000");
});