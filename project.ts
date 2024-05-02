import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";

// Can expand the Datasource processor types via the genreic param
const project: SubstrateProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "explorer-lunes-backend",
  description:
    "Lunes Nightly is an exciting Rust-based blockchain project that aims to revolutionize the world of decentralized finance and autonomous governance. As a reference implementation for blockchain application development, Lunes Nightly provides a solid foundation for building innovative and scalable solutions.",
  runner: {
    node: {
      name: "@subql/node",
      version: ">=3.0.1",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* The genesis hash of the network (hash of block 0) */
    chainId:
      "0xb9926ab2c88b882cad89f1393fcf74ee90d40ef98ae99080b08289036c61efac",
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: ["wss://ws-archive.lunes.io","wss://ws-lunes-main-02.lunes.io","wss://ws-lunes-main-01.lunes.io"],
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: 1,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: SubstrateHandlerKind.Block,
            handler: "handleBlock"
          },
          /*{
            kind: SubstrateHandlerKind.Call,
            handler: "handleCall"
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleEvent",
            filter: {
              module: "balances",
              method: "Deposit",
            },
          },*/
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
