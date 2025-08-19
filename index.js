import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

// async function validateId(bookId) {
//     return await prisma.book.findFirst({
//         where: {
//             id: bookId
//         }
//     });
// }

app.get("/books", async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            select: {
                id: true,
                name: true,
                author: true
            }
        });
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ "Error": "server error" });
    }
});

app.get("/books/:id", async (req, res) => {
    try{
        const id = Number(req.params.id);
        const bookData = await prisma.book.findUnique({
            where: {
                id: id
            }
        });
        res.json(bookData);
    }
    catch (err){
        res.status(500).json({ "Error": "server error" });
    }
}

);

app.post("/books", async (req, res) => {
    try{
        const bookData = req.body;
        if (bookData.quantity > 0) {
            await prisma.book.create({
                data: {
                    name: bookData.name,
                    author: bookData.author,
                    quantity: bookData.quantity,
                    price: bookData.price
                }
            });
            res.json({ "Message": "Data successfully Added" });
        }
        else {
            res.json({ "Error": "Book Quantity must be greater than zero" });
        }
    }
    catch (err){
        res.status(500).json({ "Error": "server error" });
    }
});

app.put("/books/:id", async (req, res) => {
    try{
        const bookId = Number(req.params.id);
        const booksQuantity = Number(req.body.quantity);
    
        const bookToBuy = await prisma.book.findUnique({
            where: {
                id: bookId
            }
        });
    
        if (booksQuantity <= bookToBuy.quantity) {
            const updatedBookData = await prisma.book.update({
                where: {
                    id: bookId
                },
                data: {
                    quantity: bookToBuy.quantity - booksQuantity
                }
            });
    
            if (updatedBookData.quantity == 0) {
                await prisma.book.delete({
                    where: {
                        id: bookId
                    }
                })
            }
    
            res.json({
                "Message": "Book Successfully Purchased",
                "Book-Details": {
                    "title": bookToBuy.name,
                    "author": bookToBuy.author,
                    "price": bookToBuy.price,
                    "quantity": booksQuantity
                }
            });
        }
        else {
            res.json({ "Error": "Requested quantity exceeds stock" })
        }
    }
    catch (err){
        res.status(500).json({ "Error": "server error" });
    }
}
);

app.delete("/books/:id", async (req, res) => {
    try{

        const bookId = Number(req.params.id);
        const deletedBook = await prisma.book.delete({
            where: {
                id: bookId
            }
        });
        res.json({ "Message": "Book Data Successfully Deleted!" });
    }
    catch (err){
        res.status(500).json({ "Error": "server error" });
    }
}
);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});