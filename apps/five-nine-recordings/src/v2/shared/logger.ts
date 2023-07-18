import chalk from 'chalk';

export const logger = {
  info: (message: string) => {
    console.log(chalk.blueBright(message));
  },

  debug: (message: string) => {
    console.log(message);
  },

  warn: (message: string) => {
    console.log(chalk.yellowBright(message));
  },

  error: (message: string, error: Error) => {
    console.log(chalk.red(message));
  },

  critical: (message: string) => {
    console.log(chalk.redBright(message));
  },
};
