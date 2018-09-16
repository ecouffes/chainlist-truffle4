/*
test test/ChainListHappyPath.js
 */

const ChainList = artifacts.require('./ChainList.sol');
// mocha test suite (contract is the entry point)
// chai assertion
contract('ChainList', accounts => { // accounts == web3.eth.accounts

    let chainListInstance;
    let seller = accounts[1];
    let buyer = accounts[2];
    let articleName1 = 'article 1';
    let articleDescription1 = 'Description for article 1';
    let articlePrice1 = 10;
    let articleName2 = 'article 2';
    let articleDescription2 = 'Description for article 2';
    let articlePrice2 = 20;

    let sellerBalanceBeforeBuy; // ether
    let sellerBalanceAfterBuy;  // ether
    let buyerBalanceBeforeBuy;  // ether
    let buyerBalanceAfterBuy;   // ether


    /**
     * 初期化時のテスト
     *
     * ・全商品数のカウンタが空になっているか
     * ・販売中の商品IDが格納された配列が空になっているか
     *
     * @return  promise (async function return promise object)
     */
    it('should be initialized with empty values', async () => {
        chainListInstance = await ChainList.deployed();

        const articleCounter = await chainListInstance.getNumberOfArticles();
        assert.equal(articleCounter.toNumber(), 0, 'number of articles must be zero');

        const forSaleIdsArr = await chainListInstance.getArticlesForSale();
        assert.equal(forSaleIdsArr.length, 0, 'there shouldn\'t be any article for sale');
    });


    /**
     * 最初の商品販売時のテスト
     *
     * ・eventがLogを適切に残しているかどうか
     * ・全商品数のカウンタが更新されているか
     * ・販売中の商品IDが格納された配列が更新されているか
     * ・全商品情報が格納された連想配列が更新されているか
     *
     * @return  promise
     */
    it('should let us sell a first article', async () => {
        chainListInstance = await ChainList.deployed();

        const receipt = await chainListInstance.sellArticle(
            articleName1,
            articleDescription1,
            web3.toWei(articlePrice1, 'ether'),
            {from: seller}
        );
        assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
        assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
        assert.equal(receipt.logs[0].args._id.toNumber(), 1, 'article id must be 1');
        assert.equal(receipt.logs[0].args._seller, seller, `event seller must be ${seller}`);
        assert.equal(receipt.logs[0].args._name, articleName1, `event article must be ${articleName1}`);
        assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice1, 'ether'), `event price must be ${web3.toWei(articlePrice1, 'ether')}`);

        const articleCounter = await chainListInstance.getNumberOfArticles();
        assert.equal(articleCounter.toNumber(), 1, 'number of articles must be one');

        const forSaleIdsArr = await chainListInstance.getArticlesForSale();
        assert.equal(forSaleIdsArr.length, 1, 'there must be one article for sale');
        assert.equal(forSaleIdsArr[0].toNumber(), 1, 'article id must be 1');

        // struct（構造体）は、JSでは配列を返す。
        const article = await chainListInstance.articles(forSaleIdsArr[0]);
        assert.equal(article[0].toNumber(), 1, 'article id must be 1');
        assert.equal(article[1], seller, `seller must be ${seller}`);
        assert.equal(article[2], 0x0, `buyer must be empty`);
        assert.equal(article[3], articleName1, `article name must be ${articleName1}`);
        assert.equal(article[4], articleDescription1, `article description must be ${articleDescription1}`);
        assert.equal(article[5].toNumber(), web3.toWei(articlePrice1, 'ether'), `article name must be ${web3.toWei(articlePrice1, 'ether')}`);
    });


    /**
     * 二回目の商品販売時のテスト
     *
     * ・eventがLogを適切に残しているかどうか
     * ・全商品数のカウンタが更新されているか
     * ・販売中の商品IDが格納された配列が更新されているか
     * ・全商品情報が格納された連想配列が更新されているか
     *
     * @return  promise
     */
    it('should let us sell a second article', async () => {
        chainListInstance = await ChainList.deployed();

        const receipt = await chainListInstance.sellArticle(
            articleName2,
            articleDescription2,
            web3.toWei(articlePrice2, 'ether'),
            {from: seller}
        );
        assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
        assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
        assert.equal(receipt.logs[0].args._id.toNumber(), 2, 'article id must be 2');
        assert.equal(receipt.logs[0].args._seller, seller, `event seller must be ${seller}`);
        assert.equal(receipt.logs[0].args._name, articleName2, `event article must be ${articleName2}`);
        assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice2, 'ether'), `event price must be ${web3.toWei(articlePrice2, 'ether')}`);

        const articleCounter = await chainListInstance.getNumberOfArticles();
        assert.equal(articleCounter.toNumber(), 2, 'number of articles must be two');

        const forSaleIdsArr = await chainListInstance.getArticlesForSale();
        assert.equal(forSaleIdsArr.length, 2, 'there must be two article for sale');
        assert.equal(forSaleIdsArr[1].toNumber(), 2, 'article id must be 2');

        const article = await chainListInstance.articles(forSaleIdsArr[1]);
        assert.equal(article[0].toNumber(), 2, 'article id must be 2');
        assert.equal(article[1], seller, `seller must be ${seller}`);
        assert.equal(article[2], 0x0, `buyer must be empty`);
        assert.equal(article[3], articleName2, `article name must be ${articleName2}`);
        assert.equal(article[4], articleDescription2, `article description must be ${articleDescription2}`);
        assert.equal(article[5].toNumber(), web3.toWei(articlePrice2, 'ether'), `article name must be ${web3.toWei(articlePrice2, 'ether')}`);
    });



    /**
     * 商品ID 1を購入するテスト
     *
     * ・売り手と買い手の金額が適切か
     * ・eventがLogを適切に残しているかどうか
     * ・販売中の商品IDが格納された配列が更新されているか
     * ・全商品情報が格納された連想配列が更新されずにそのままかどうか
     *
     * @return promise
     */
    it('should buy an article', async () => {

        chainListInstance = await ChainList.deployed();

        // buyerによる買取処理発生前の、sellerとbuyerの残高をget
        sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
        buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();

        const receipt = await chainListInstance.buyArticle(1, {
            from: buyer,
            value: web3.toWei(articlePrice1, 'ether')
        });

        assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
        assert.equal(receipt.logs[0].event, 'LogBuyArticle', 'event should be LogBuyArticle');
        assert.equal(receipt.logs[0].args._id.toNumber(), 1, 'article id must be 1');
        assert.equal(receipt.logs[0].args._seller, seller, `event seller must be ${seller}`);
        assert.equal(receipt.logs[0].args._buyer, buyer, `event buyer must be ${buyer}`);
        assert.equal(receipt.logs[0].args._name, articleName1, `event article must be ${articleName1}`);
        assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(articlePrice1, 'ether'), `event price must be ${web3.toWei(articlePrice1, 'ether')}`);

        // buyerによる買取処理発生後の、sellerとbuyerの残高をget
        sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
        buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();

        // buyArticle関数実行後、売り手と買い手の残高をテスト
        // buyer はTX時にgasを消費しているため、買取処理後の残高は若干少なくなっている
        assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + articlePrice1, `seller should have earned ${articlePrice1} ETH`);
        assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1, `buyer should have spent ${articlePrice1} ETH including GAS`);

        const forSaleIdsArr = await chainListInstance.getArticlesForSale();
        assert.equal(forSaleIdsArr.length, 1, 'there should now be only 1 article left for sale');
        assert.equal(forSaleIdsArr[0].toNumber(), 2, 'article id 2 should be the only article left for sale');

        const articleCounter = await chainListInstance.getNumberOfArticles();
        assert.equal(articleCounter.toNumber(), 2, 'there should still be 2 articles in total');
    });



    /**
     * Event Emitterおよびindexedがログをフィルタリングしているかテスト
     *
     * @return promise
     */
    it('should filer the event log', async () => {

        // deployedは、既にデプロイされているinstanceを取得
        // newは、test用に新たにinstanceを生成
        const instance = await ChainList.new();

        // param1: indexed filter(indexed指定されたパラメーターで、ログ収集対象をフィルタリング)
        // param2: range(ログ収集範囲）
        const events = await instance.LogSellArticle({_seller: accounts[0]}, {fromBlock: 0, toBlock: 'latest'})
            .watch((error, event) => {
                console.dir(event);
            });

        // LogSellArticleを 4回発生させる
        await instance.sellArticle('article 1', 'Description of article 1', web3.toWei(10, 'ether'), {from: accounts[0]});
        await instance.sellArticle('article 2', 'Description of article 2', web3.toWei(10, 'ether'), {from: accounts[1]});
        await instance.sellArticle('article 3', 'Description of article 3', web3.toWei(10, 'ether'), {from: accounts[2]});
        await instance.sellArticle('article 4', 'Description of article 4', web3.toWei(10, 'ether'), {from: accounts[0]});

        // console.dir(events.get());
        assert.equal(events.get().length, 2, 'event logs must be 2');
    });

});
