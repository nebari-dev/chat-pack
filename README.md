# chat-plus-plus
Chat++ is a frontend for a [Hrafnar Server](https://github.com/openteams-ai/hrafnar) or any
other agentic server that implments the Hrafnar API, which is essentially just the
[AG-UI](https://docs.ag-ui.com/introduction) protocol with some additional endpoints for
managing thread history.


# Instructions

Before you can run Chat++ you need a [Hrafnar](https://github.com/openteams-ai/hrafnar)
compatible server running somewhere. Follow the Hrafnar instructions for creating your
agents and deploying the server.

To get started with a local version of Chat++, first checkout the repo:

```
git clone https://github.com/openteams-ai/chat-plus-plus.git
```

Then navigate to the repo and install the dependencies:

```
cd chat-plus-plus
npm install
```

Then copy the example `env` file and edit the `VITE_API_URL` to match your Hrafnar deployment.

```
cp .env.example .env
```

Chat++ uses [KeyCloak](https://www.keycloak.org/) for authentication. To bypass authentication 
for local development, set `VITE_AUTH_ENABLED=false`, otherwise set it to `true` and set the 
rest of the variables to match your Keycloak deployment.


# Run the Development Server

Once your `env` file is configured and your Hrafnar server is running, start the Chat++
development server with the following command and point your browser at the URL displayed in 
the terminal.

```
npm run dev
```


# Run a Production Build

To build a production bundle for deployment, first make sure your `env` file is configured properly
as these variables will be built into the bundle, then execute the following command:

```
npm run build
```

If the build succeeds, the results will be in the `./dist` directory ready to be used by a 
server of your choice.

You can preview the build locally by running the following command and pointing your browser to 
the URL shown in the terminal. This will be a different port than `npm run dev`.

Note that if you change `env` variables, you will need to rebuild the project before the preview
command will pick up the changes.

```
npm run preview
```
