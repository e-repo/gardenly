import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function checkCommitSize(
  files,
  {
    limit = 40,
    allowLargeInit = process.env.GARDENLY_ALLOW_LARGE_INIT_COMMIT === '1',
  } = {},
) {
  return {
    allowed: allowLargeInit || files.length <= limit,
    count: files.length,
    limit,
    overridden: allowLargeInit,
  };
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  const output = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '-z'],
    { encoding: 'utf8' },
  );
  const files = output.split('\0').filter(Boolean);
  const result = checkCommitSize(files);

  if (!result.allowed) {
    console.error(
      `Commit blocked: ${result.count} staged files exceed the ${result.limit}-file limit. Split the commit. Only for repository initialization, set GARDENLY_ALLOW_LARGE_INIT_COMMIT=1 explicitly.`,
    );
    process.exitCode = 1;
  } else if (result.overridden) {
    console.log(
      `Commit-size check bypassed for initialization (${result.count} staged files).`,
    );
  } else {
    console.log(
      `Commit-size check passed: ${result.count}/${result.limit} staged files.`,
    );
  }
}
