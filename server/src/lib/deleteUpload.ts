import path from "node:path";
import fs from 'fs'
import { UPLOAD_DIR } from "../config/upload.js";

export async function deleteUpload(relativePath:string){
    const fullPath=path.resolve(UPLOAD_DIR,relativePath)

    if(!fullPath.startsWith(UPLOAD_DIR+path.sep))return

    await fs.promises.rm(fullPath,{force:true})
}