import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/virtual-pc-lab/' : '/',
  server:{host:'0.0.0.0',port:5180,strictPort:true},
  preview:{host:'0.0.0.0',port:5180,strictPort:true},
});