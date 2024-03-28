/* eslint-disable no-debugger */

import axios from 'axios'
import FileWorker from './files.worker'
import { defer, createEventHandler } from 'js-hodgepodge'

export const getConcurrency = () => navigator.hardwareConcurrency || 4

export const handleEvent = () => createEventHandler('handleSchedule')

export const sliceFile = file => {

  const dfd = defer()
  
  const chunkSize = 1024 // 1Kb
  const thread = getConcurrency() // 线程数

  const chunks = []
  const chunkNum = Math.ceil(file.size / chunkSize) // 切片总数量

  const workerChunkCount = Math.ceil(chunkNum / thread) // 每个线程需要处理的切片数量
  let finishCount = 0;

  for (let i = 0; i < thread; i++) {

    const worker = new FileWorker()

    // 计算每个线程的开始索引和结束索引
    const startIndex = i * workerChunkCount;

    let endIndex = startIndex + workerChunkCount;

    // 防止最后一个线程结束索引大于文件的切片数量的总数量
    if (endIndex > chunkNum) {
      endIndex = chunkNum;
    }

    worker.postMessage({
      file,
      chunkSize,
      startIndex,
      endIndex,
    });

    worker.onmessage = (e) => {

      // 接收到 worker 线程返回的消息
      for (let i = startIndex; i < endIndex; i++) {

        chunks[i] = {
          ...e.data[i - startIndex],
          chunkNum,
          filename: file.name
        };

      }

      worker.terminate(); // 关闭线程

      finishCount++;

      if (finishCount === thread) {

        dfd.resolve({
          chunks,
          chunkNum
        });
      }
    };

  }

  return dfd
}

export const uploadFile = (
  chunks // 总切片
) => {
  chunks = chunks || []

  let schedule = 0 // 进度

  const { dispatch } = handleEvent()

  const requestQueue = (concurrency) => {
    concurrency = concurrency || 6
    const queue = [] // 线程池
    let current = 0

    const dequeue = () => {
      while (current < concurrency && queue.length) {
        current++;
        const requestPromiseFactory = queue.shift();
        requestPromiseFactory()
          .then(result => { // 上传成功处理
            console.log(result)

            schedule++; // 收集上传切片成功的数量

            dispatch(window, schedule);  // 事件派发，通知进度
          })
          .catch(error => { // 失败
            console.log(error)
          })
          .finally(() => {
            current--;
            dequeue();
          });
      }

    }

    return (requestPromiseFactory) => {
      queue.push(requestPromiseFactory)
      dequeue()
    }

  }

  const handleFormData = obj => {
    const formData = new FormData()

    Object
      .entries(obj)
      .forEach(([key, val]) => {
        formData.append(key, val)
      })

    return formData
  }

  const enqueue = requestQueue(6)

  for (let i = 0; i < chunks.length; i++) {

    enqueue(() => axios.post(
      '/api/upload',
      handleFormData(chunks[i]),
      {
        headers: {
          'Content-Type': 'multipart/form-data' 
        }
      }
    ))
  }

  return schedule

}