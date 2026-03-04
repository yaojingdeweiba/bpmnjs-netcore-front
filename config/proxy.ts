/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 开发环境代理配置（连接本地后端API）
  dev: {
    // 只代理工作流相关的API到后端服务器（ABP框架标准路径）
    // localhost:8000/api/app/** -> https://localhost:44300/api/app/**
    '/api/app/': {
      // 要代理的后端地址
      target: 'http://localhost:44323',
      // 配置了这个可以从 http 代理到 https
      changeOrigin: true,
      // 忽略SSL证书验证（开发环境）
      secure: false,
    },
    // 代理草稿相关API到后端服务器
    // localhost:8000/draft/** -> http://localhost:44323/draft/**
    '/draft/': {
      target: 'http://localhost:44323',
      changeOrigin: true,
      secure: false,
    },
    // 登录、用户信息等接口不代理，使用mock数据
    // /api/login/account, /api/currentUser 等会由 mock 文件处理
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
