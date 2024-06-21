import resolve from '@rollup/plugin-node-resolve';
import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear'; // 打包前清除文件夹
import esbuild from 'rollup-plugin-esbuild';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default [
  {
    input: './src/index.ts', // 配置入口文件
    plugins: [
      // 配置插件
      clear({ targets: ['dist'], watch: false }),
      resolve(),
      commonjs(),
      esbuild({
        exclude: [],
        sourceMap: false,
        loaders: {
          '.vue': 'ts'
        },
        treeShaking: true,
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
            paths: {
              '@/*': ['./src/*']
            }
          }
        },
        target: 'esnext'
      })
    ],
    output: {
      dir: 'dist', // 配置输出文件
      format: 'esm' // 配置输出格式
    }
  }
];
