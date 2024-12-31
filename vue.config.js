

module.exports = {
  publicPath: './',

  devServer: {
    inline: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', 
        changeOrigin: true, 
        pathRewrite: {
          '^/api': '/'
        }
      }
    }
  },

  chainWebpack: config => {  
    config.module  
      .rule('worker')  
      .test(/\.worker\.js$/)  
      .use('worker-loader')  
      .loader('worker-loader')
      .options({ // 根据文档自定义配置项

      })
      .end()
      config.module.rule('js').exclude.add(/\.worker\.js$/)
  }  
}