import prisma from "../config/prisma.js";


const routes = [
    {
        name:"ROUTE_A",
        priority:1,
        balance:1000,
        failureRate:0.3
    },
    {
        name:"ROUTE_B",
        priority:2,
        balance:700,
        failureRate:0.1
    },
]

async function main(){
    for(const route of routes){
        await prisma.route.upsert({
            where:{
                name:route.name
            },
            update:route,
            create:route,
        })
    }
    console.log("routes added to the database")
}

main().catch((error)=>{
    console.log(error)
    process.exit(1)
})
.finally(async()=>{
    await prisma.$disconnect();
})