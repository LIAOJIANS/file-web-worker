import md5 from 'md5'

self.onmessage = async function ({
  data: {
    file,
    chunkSize,
    startIndex,
    endIndex,
  }
}) { 

  const arr = [];

  for (let i = startIndex; i < endIndex; i++) {
    arr.push(createChunks(file, i, chunkSize));
  }
  const chunks = await Promise.all(arr)

  // 提交线程信息
  postMessage(chunks);
}

const createChunks = (
  file, 
  index, 
  chunkSize
) => {
  return new Promise((resolve) => {
    // 开始第几个*分片的大小
    const start = index * chunkSize;
    //   结束时start + 分片的大小
    const end = start + chunkSize;
    const fileReader = new FileReader();
    // 读取文件的分片 读取完成后触发onload事件
    fileReader.onload = (e) => {
      
      const files = file.slice(start, end);
      resolve({
        start,
        end,
        index,
        hash: md5(e.target.result),
        files,
      });
    };
    // 读取文件的分片
    fileReader.readAsArrayBuffer(file.slice(start, end));
  });
}