const express = require('express');  
const multer = require('multer');  
const path = require('path');  
const fs = require('fs');  
const cors = require('cors');
const app = express();  
const upload = multer({ dest: 'server/uploads/' }); // 设置上传文件的临时存储目录

cors()
  
// 设置上传路由  
app.post('/upload', upload.single('files'), async (req, res) => {  
  
  const { file } = req;  
  const { 
    filename,
    index: chunkIndex,
    chunkNum: totalChunks,
    hash
   } = req.body;  
  const chunksDir = path.join(__dirname, 'chunks', filename);  
  const finalFile = path.join(__dirname, 'merged', filename);  

  const chunkName = `${chunkIndex}-${hash}.chunk`;
  
  // 确保chunks目录存在  
  if (!fs.existsSync(chunksDir)) {  
    fs.mkdirSync(chunksDir, { recursive: true });  
  }
  
  // 保存切片到对应的文件  
  const chunkPath = path.join(chunksDir, chunkName);  

  fs.copyFileSync(file.path, chunkPath); // 将临时文件复制到最终位置  
  
  // 检查所有切片是否都已上传  
  let allChunksUploaded = true;  
  for (let i = 0; i < totalChunks; i++) {  
    
    if (!fs.existsSync(path.join(chunksDir, chunkName))) { 
      allChunksUploaded = false;  
      break;  
    }  
  }  
  
  if (allChunksUploaded) {  
   
    await mergeChunks(chunksDir, finalFile, chunkName); // 合并切片 

    res.send(`文件 ${filename} 上传完成`);  

    // 清理chunks目录  
    fs.rmdirSync(chunksDir, { recursive: true });  
  } else {  
    res.send(`${filename} 的 第${chunkIndex}切片已经上传完成，等待其他切片！`);  
  }  
}); 
  
// 合并切片函数  
async function mergeChunks(
  chunksDir, 
  finalFile,
  chunkName
) {  
  return new Promise((resolve, reject) => {  

    const writeStream = fs.createWriteStream(finalFile);  
    writeStream.on('finish', resolve);  
    writeStream.on('error', reject);  
  
    // 读取并合并所有切片到最终文件  
    for (let i = 0; i < fs.readdirSync(chunksDir).length; i++) {  

      const chunkPath = path.join(chunksDir, chunkName);  
      const readStream = fs.createReadStream(chunkPath);  

      readStream.pipe(writeStream, { end: false }); // 不在读取流结束时关闭写入流  

      readStream.on('end', () => {  
        fs.unlinkSync(chunkPath); // 删除已合并的切片文件  
      });  
    }  
    writeStream.end(); // 所有切片都已管道传输后结束写入流  
  });  
}  
  
const PORT = 3001;  
app.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);  
});