// console用スニペット集
truffle console --network ganache
migrate --compile-all --reset

// コントラクトアドレス
ChainList.address;

// 残高確認
web3.fromWei(web3.eth.getBalance(web3.eth.accounts[0]), 'ether').toNumber();
web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), 'ether').toNumber();
web3.fromWei(web3.eth.getBalance(web3.eth.accounts[2]), 'ether').toNumber();


// コントラクトインスタンス取得
(async () => {app = await ChainList.deployed()})();
// ChainList.deployed().then(instance => app = instance);

// インスタンスメソッドまわり
app.sellArticle('article 1', 'Description of article 1', web3.toWei(10, 'ether'), {from: web3.eth.accounts[1]});
app.sellArticle('article 2', 'Description of article 2', web3.toWei(20, 'ether'), {from: web3.eth.accounts[2]});
app.buyArticle(1, {from: web3.eth.accounts[2], value: web3.toWei(10, 'ether')});

app.getArticlesForSale();
app.getNumberOfArticles();

app.kill({from: web3.eth.accounts[0]});



// イベント関数周り
// Eventfn( {filter}, {range} ).watcn(callback)
// rangeを空にすると、直近のlogのみを取得する
// Event関数によるlog監視を開始
let sellEvent = app.LogSellArticle({}, {fromBlock: 0, toBlock: 'latest'}).watch((error, event)=>{console.log(event)});
let sellEvent = app.LogSellArticle({}, {}).watch((error, event)=>{console.log(event)});
// Log監視の終了
sellEvent.stopWatching();

let buyEvent = app.LogBuyArticle({_seller: web3.eth.accounts[1]}, {}).watch((error, event)=>{console.log(event)});












