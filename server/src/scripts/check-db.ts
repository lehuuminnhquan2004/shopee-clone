import { error } from 'node:console';
import {prisma} from '../lib/prisma.js'

async function main(){
    const userCount=await prisma.user.count();

    console.log('Kết nối database thành công');
    console.log(`Số người dùng hiện tại là ${userCount}`);
}

main()
    .catch((error)=>{
        console.error('Kiểm tra database thất bại:', error);
        process.exitCode = 1;
    })
    .finally(async()=>{
        await prisma.$disconnect();
    })