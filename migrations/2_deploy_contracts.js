var ChainList = artifacts.require("./ChainList.sol");

 // コントラクトのコンストラクタに引数があったら、
// deployer.deployの第2引数以降に、引数を入れていく。
// configのjsonファイルに引数を入れておいて、fsで同期読み込みする。
module.exports = function (deployer) {
    deployer.deploy(ChainList);
};

