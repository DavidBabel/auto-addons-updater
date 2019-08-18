import * as fs from 'fs-extra';
import fetch from 'node-fetch';
import * as url from 'url';
import * as path from 'path';
import * as unzipper from 'unzipper';
import * as moment from 'moment';

console.log("This is a virus, you're dead !");

setTimeout(() => {
  console.log('no, just kidding ...');
}, 2000);

const addonsToDownload = JSON.parse(
  fs.readFileSync(cwd('./config.json')).toString()
);

const backupDir = cwd('backups/');
const tmpDir = cwd('backups/tmp/');
const outDir = cwd('AddOns/');
const currentRandomName = 0;

fs.removeSync(tmpDir);
fs.ensureDirSync(backupDir);
try {
  fs.renameSync(
    outDir,
    `${backupDir}AddOns-backup-${moment().format('YYYY-MM-DD--HH.mm.ss')}`
  );
} catch (O_o) {}

fs.ensureDirSync(tmpDir);
fs.ensureDirSync(outDir);

const filteredAddons = addonsToDownload.filter(
  (f: string) => !f.startsWith('#')
);

let addons = filteredAddons.length;
async function main() {
  for (let i = 0; i < filteredAddons.length; i++) {
    const addonUrl = filteredAddons[i];

    const content = await fetch(addonUrl);

    const [fileName, zipName, branch] = getZipName(addonUrl);
    const filePath = tmpDir + zipName;

    fs.writeFileSync(filePath, await content.buffer());
    await fs
      .createReadStream(filePath)
      .pipe(unzipper.Extract({ path: outDir }))
      .promise();

    if (branch) {
      fs.renameSync(`${outDir}${fileName}-${branch}`, `${outDir}${fileName}`);
    }
    addons--;
  }
}

main();

function getZipName(baseUrl: string) {
  let zipName = path.basename(url.parse(baseUrl).pathname);
  let branch = 'master';
  let match1: string;
  let match2: string = '';

  if (/gitlab\.com/g.test(baseUrl)) {
    if (baseUrl.endsWith('.zip')) {
      [, match1, match2] = baseUrl.match(/gitlab\.com\/.+\/(.+)-(.+?).zip/);
    } else {
      [, match1, match2] = baseUrl.match(
        /gitlab\.com\/.+?\/(.+?)\/.+\/(.+?)\/.+/
      );
      match2 = '';
    }
  } else if (/github\.com/g.test(baseUrl)) {
    [, match1, match2] = baseUrl.match(
      /github\.com\/.+?\/(.+?)\/.+?\/(.+).zip/
    );
  } else {
    try {
      [, match1] = baseUrl.match(/\/.+\/(.+?).zip/);
    } catch (error) {
      match1 = `untitledAddon${currentRandomName}`;
    }
  }
  zipName = match1 + '.zip';
  branch = match2;

  return [match1, zipName, branch];
}

function cwd(additionnalPath = '') {
  if (process.argv[1].includes('app.ts')) {
    return additionnalPath;
  }
  return path.join(path.dirname(process.execPath), additionnalPath);
}

// prevent windows closing
setInterval(() => {
  if (addons === 0) {
    addons--;
    console.log('script finished, press any key to close');
    process.stdin.setRawMode(true);
    process.stdin
      .resume()
      .setEncoding('utf8')
      .on('data', () => process.exit());
  }
}, 4000);
