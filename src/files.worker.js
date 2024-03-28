import md5 from 'js-md5'

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
    arr.push(
      createChunks(file, i, chunkSize)
    );
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

    // 结束时start + 分片的大小
    const end = start + chunkSize;
    const fileReader = new FileReader();

    // 每个切片都通过FileReader读取为ArrayBuffer
    fileReader.onload = (e) => {

      const content = new Uint8Array(e.target.result);
      const files = file.slice(start, end);

      const md5s = md5.arrayBuffer(content)

      function arrayBufferToHex(buffer) {
        let bytes = new Uint8Array(buffer);
        let hexString = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          let hex = bytes[i].toString(16);

          hexString += hex.length === 1 ? '0' + hex : hex;
        }
        return hexString;
      }

      resolve({
        start,
        end,
        index,
        hash: arrayBufferToHex(md5s),  // 生成唯一的hash
        files,
      });
    };

    // 读取文件的分片
    fileReader.readAsArrayBuffer(file.slice(start, end));
  });
}