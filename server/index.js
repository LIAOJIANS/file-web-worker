const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const upload = multer({ dest: 'server/uploads/' }); // 设置上传文件的临时存储目录

cors();

// 设置上传路由
app.post('/upload', upload.single('files'), async (req, res) => {
  const { file } = req;
  const { filename, index: chunkIndex, chunkNum: totalChunks, hash } = req.body;
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

  if (fs.readdirSync(chunksDir).length == totalChunks) {

    await mergeChunks(chunksDir, finalFile, chunkName); // 合并切片

    res.send(`文件 ${filename} 上传完成`);

    // 清理chunks目录
    fs.rmdirSync(chunksDir, { recursive: true });
  } else {
    res.send(`${filename} 的 第${chunkIndex}切片已经上传完成，等待其他切片！`);
  }
});

// 合并切片函数
async function mergeChunks(chunksDir, finalFile) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(finalFile);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);

    // 读取所有切片文件名
    const chunks = fs.readdirSync(chunksDir)
      .sort((a, b) => (Number(a.split('-')[0]) - Number(b.split('-')[0])));

    // 使用异步函数按顺序处理每个切片
    async function mergeChunks(chunks) {

      const promses = [];

      for (const chunkName of chunks) {
        const chunkPath = path.join(chunksDir, chunkName);

        // 使用 Promise 包装单个切片的处理
         const chunkPromise = new Promise((resolveChunk, rejectChunk) => {
          const readStream = fs.createReadStream(chunkPath);

          readStream.on('end', () => {
            fs.unlinkSync(chunkPath); // 删除已合并的切片文件
            resolveChunk();
          });

          readStream.on('error', rejectChunk);
          readStream.pipe(writeStream, { end: false });
        });

        promses.push(chunkPromise);
      }
      
      await Promise.all(promses);
      
      writeStream.end(); // 所有切片处理完后才结束写入流
    }

    // 执行合并操作
    mergeChunks(chunks).catch(reject);
  });
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
