const { defineConfig } = require('@vue/cli-service');
const path = require('node:path');
const { resolveApiTarget } = require('./server/proxy-target.cjs');
module.exports = defineConfig({
    transpileDependencies: true,
    chainWebpack(config) {
        // Load only the language subsets needed by the page, rather than embedding every font in CSS.
        config.module.rule('fonts').type('asset/resource').delete('parser');
    },
    devServer: {
        proxy: { '/api': {
            target: process.env.TRAVEL_API_PROXY || 'http://127.0.0.1:3001',
            router: () => resolveApiTarget(path.join(__dirname, '.travel-api.json'), process.env.TRAVEL_API_PROXY)
        } }
    }
});
