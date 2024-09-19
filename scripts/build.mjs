import esbuild, { context, build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';
import path from 'node:path';
import fs from 'node:fs';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';
import pc from 'picocolors';
import vuePlugin from 'esbuild-plugin-vue3';
import esbuildPostcssPlugin from './esbuild-postcss.mjs';

const pkgPath = process.cwd();
const pkgJson = readJson(path.join(pkgPath, 'package.json'));

const argv = minimist(process.argv.slice(2), { string: ['_'] });
const entrys = argv._;
const isDev = argv.dev === true;

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath));
}

async function buildTs(entry) {
  // 将src替换为dist即为输出路径
  const outfile = path.resolve(pkgPath, entry.replace(/^src/, 'dist'));
  const relativeOutputFile = path.relative(pkgPath, outfile);

  /** @type {import('esbuild').BuildOptions} */
  const buildConfig = {
    entryPoints: [path.resolve(pkgPath, entry)],
    outfile,
    bundle: true,
    metafile: true,
    minify: !isDev,
    external: Object.keys({
      ...pkgJson.dependencies,
      ...pkgJson.peerDependencies,
      ...pkgJson.devDependencies
    }).filter(dep => !dep.startsWith('@stom')),
    sourcemap: true,
    format: 'esm',
    platform: 'browser',
    plugins: [
      vuePlugin(),
      esbuildPostcssPlugin(),
      typecheckPlugin({
        watch: isDev,
        omitStartLog: true,
        logger: {
          info(message) {
            // console.info(pc.bold(INFO) + '  ' + message);
          },
          warn(message) {
            console.warn(pc.bold(pc.yellow(message)));
          },
          error(message) {
            console.error(pc.bold(pc.red(message)));
          },
          success(message) {
            console.info(`${pc.green(`[${pkgJson.name}] ${message}`)}`);
          }
        }
      }),
      {
        name: 'watch-build',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length) {
              console.error('build failed...' /*, result.errors */);
              return;
            }
            console.log('watch build succeeded:', relativeOutputFile);
          });
        }
      }
    ]
  };

  if (isDev) {
    const ctx = await context(buildConfig);
    await ctx.watch();
  } else {
    build(buildConfig);
  }
}

function setup(entrys) {
  entrys.forEach(entry => {
    buildTs(entry);
  });
}

setup(entrys);
