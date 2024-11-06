# mediasoup-tutorial

This Node application is prodution ready. It comes with the necessary dependencies and their specific configurations.

- **Node v20.15.1**
- **NPM 10.8.2**
- **TypeScript 5**: for safge typings in both client and server code.
- **ES module application**
- **Protobuf**: to define client-server communication and auto generate shared types.
- **Vite**: to build and bundle the client application.
- **ESBuild**: to build and bundle the server application.
- **ESLint**: to lint the code.
- **Jest**: to test the code.
- **ts-node**/**nodemon**: to run the application in development mode with automatic reload.
- **Prettier**: to format the code.
- **Husky**: to trigger linting and formatting before commit.
- **Winston**: as powerful logging library.
- **Single Executable Application**: it is possible to compile a binary file to be executed anywhere using official Node instructions.
- **VSCode launch configuration**: ready to debug in VSCode.

## Run the application

Run the server:

```bash
cd server
npm install
npm start
```

Run the client:

```bash
cd client
npm install
npm start
```
