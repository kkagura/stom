import resolve from '@rollup/plugin-node-resolve';
import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear'; // 打包前清除文件夹
import esbuild from 'rollup-plugin-esbuild';
import { fileURLToPath } from 'node:url';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';
import pc from 'picocolors';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const SUCCESS = process.platform === 'win32' ? '√' : '✔';
const WARNING = process.platform === 'win32' ? '‼' : '⚠';
const ERROR = process.platform === 'win32' ? '×' : '✖';
const INFO = process.platform === 'win32' ? 'i' : 'ℹ';

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
        target: 'esnext',
        plugins: [
          typecheckPlugin({
            watch: true,
            omitStartLog: true,
            // compilerOptions: {
            //   noUnusedLocals: false,
            // },
            logger: {
              info(message) {
                // console.info(pc.bold(INFO) + '  ' + message);
              },
              warn(message) {
                console.warn(pc.bold(pc.yellow(WARNING)) + '  ' + message);
              },
              error(message) {
                console.error(pc.bold(pc.red(ERROR)) + '  ' + message);
              },
              success(message) {
                console.info(`${pc.bold(SUCCESS)}  [${target}] ${pc.green(message)}`);
              }
            }
          })
        ]
      })
    ],
    output: {
      dir: 'dist', // 配置输出文件
      format: 'esm' // 配置输出格式
    }
  }
];
