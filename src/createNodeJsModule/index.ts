import Path from 'path';
import ora from 'ora';
import camelcase from 'camelcase';

import IConfig from '../IConfig';
import copyTemplates from '../common/copyTemplates';
import getCurrentDir from '../utils/getCurrentDir';
import installDevDeps from './installDevDeps';
import getPkgNameWithScope from '../utils/getPkgNameWithScope';
import commitToGit from '../common/commitToGit';
import getGitUrl from '../utils/getGitUrl';
import getStarted from './getStarted';
import configTS from '../common/configTS';

export default async function createNodeJsModule(
  config: IConfig
): Promise<void> {
  config = {
    ...config,
    pkgName: camelcase(config.libName),
    pkgNameWithScope: getPkgNameWithScope(config.libName, config.pkgScope),
    gitUrl: getGitUrl(config),
  };
  const templatePath = Path.join(getCurrentDir(), 'templates', 'nodeJsModule');
  const destPath = Path.join(process.cwd(), config.libName);
  const copySpinner = ora('Creating lib files from templates').start();

  try {
    await copyTemplates(templatePath, destPath, config, []);
    copySpinner.succeed('Created lib files from templates');
  } catch (error) {
    copySpinner.fail('Error in creating files from templates');
    throw error;
  }

  if (config.pkgManager) {
    const depsSpinner = ora('Installing dev dependencies').start();
    try {
      await installDevDeps(destPath, config);
      depsSpinner.succeed(`Dev dependencies installed`);
    } catch (error) {
      depsSpinner.fail('Failed to install dev dependencies');
      throw error;
    }
  }

  if (config.pkgManager && config.ts) {
    const depsSpinner = ora('Initializing typescript configuration').start();
    try {
      await configTS(config, destPath);
      depsSpinner.succeed(`Initialized typescript configuration`);
    } catch (error) {
      depsSpinner.fail('Failed initialize typescript configuration');
      throw error;
    }
  }

  if (config.gitProvider) {
    const gitSpinner = ora('Commiting to git').start();
    try {
      await commitToGit(config, destPath);
      gitSpinner.succeed(`Files commited to git`);
    } catch (error) {
      gitSpinner.fail('Git commit failed');
      throw error;
    }
  }

  await getStarted(config);
}
