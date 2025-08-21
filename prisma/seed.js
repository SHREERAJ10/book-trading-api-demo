import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
    await prisma.book.createMany({
        data: [
            {
                name: "The Midnight Library",
                author: "Matt Haig",
                quantity: 12,
                price: 14.99
            },
            {
                name: "The Night Circus",
                author: "Erin Morgenstern",
                quantity: 8,
                price: 12.5
            },
            {
                name: "Where the Crawdads Sing",
                author: 5,
                quantity: 15,
                price: 10.99
            }
        ]
    })
}

seed().then(()=>prisma.$disconnect());