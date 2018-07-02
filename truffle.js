const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = process.env.MNEMONIC;
const accessToken = process.env.INFURA_ACCESS_TOKEN;

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        local: {
            host: "localhost",
            port: 8545,
            network_id: "4224",
            gas: 4700000
        },
        ganache: {
            host: "localhost",
            port: 7545,
            network_id: "*" // Match any network id
        },
        ropsten: {
            provider: () => {
                return new HDWalletProvider(
                    mnemonic,
                    "https://ropsten.infura.io/" + accessToken
                );
            },
            network_id: 3,
            gas: 4700000
        },
        rinkeby: {
            provider: () => {
                return new HDWalletProvider(
                    mnemonic,
                    "https://rinkeby.infura.io/" + accessToken,
                    3  // index of metamask
                );
            },
            // host: "localhost",
            // port: 8545,
            network_id: 4,    // rinkby test network
            gas: 4700000
        },
        mainnet: {
            host: "localhost",
            port: 8545,
            network_id: 1,
            gas: 4700000,
            gasPrice: 5000000000,
        }
    }
};
