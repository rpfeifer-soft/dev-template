# dev-template

Template to start a new web-application (Docker+Rollup+Typescript)!

## Contents

- Docker
  - node:latest
  - nginx:latest
- Express
- TSLint + Prettier
- Recommended VSCode-extensions
- VSCode debugging

## Start development

Provide a **secrets.json** file with the necessary parameters to run the application (see minimum options):

      {
         "port": 3001
      }

### Either start by using terminals extension

    Cmd+Shift+P

    Terminals:Run

### or start the processes manually

Starting TS-watch

    npm run watch

Starting docker

    npm run dev

### open the website

    http://localhost