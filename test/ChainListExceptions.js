/*
test test/ChainListExceptions.js
 */

const ChainList = artifacts.require('./ChainList.sol');

contract('ChainList', accounts => { // accounts == web3.eth.accounts

    let chainListInstance;
    let seller = accounts[1];
    let buyer = accounts[2];
    let articleName = 'article 1';
    let articleDescription = 'Description for article 1';
    let articlePrice = 10;

    /**
     * 商品が一度も出品されていない状態で
     * 購入しようとした際にrevertされるかテスト
     *
     * @return promise
     */
    it('should throw an exception if you try to buy an article when there is no article for sale', async () => {
        chainListInstance = await ChainList.deployed();

        // require(articleCounter > 0) の段階でrevert
        await chainListInstance.buyArticle(1, {
            from: buyer,
            value: web3.toWei(articlePrice, 'ether')
        })
            .then(assert.fail)
            .catch(error => {
                assert(true);
            });

        const articleCounter = await chainListInstance.getNumberOfArticles();
        assert.equal(articleCounter.toNumber(), 0, 'number of articles must be 0');
    });


    /**
     * 存在していない商品を購入しようとした際に
     * revertされるかテスト
     *
     * @return  promise
     */
    it('should throw an exception if you try to buy an article that does not exit', async () => {
        chainListInstance = await ChainList.deployed();

        const receipt = await chainListInstance.sellArticle(
            articleName,
            articleDescription,
            web3.toWei(articlePrice, 'ether'),
            {from: seller}
        );

        // require(_id > 0 && _id <= articleCounter) で revert
        await chainListInstance.buyArticle(2, {
            from: seller,
            value: web3.toWei(articlePrice, 'ether')
        })
            .then(assert.fail)
            .catch(error => {
                assert(true);
            });

        // struct（構造体）は、JSでは配列を返す。
        // 販売している商品の情報をテスト
        const article = await chainListInstance.articles(1);
        assert.equal(article[0].toNumber(), 1, 'article id must be 1');
        assert.equal(article[1], seller, `seller must be ${seller}`);
        assert.equal(article[2], 0x0, `buyer must be empty`);
        assert.equal(article[3], articleName, `article name must be ${articleName}`);
        assert.equal(article[4], articleDescription, `article description must be ${articleDescription}`);
        assert.equal(article[5].toNumber(), web3.toWei(articlePrice, 'ether'), `article name must be ${web3.toWei(articlePrice, 'ether')}`);
    });

    /**
     * 自分が出品した商品を購入しようとした際に、
     * revertされるかテスト
     *
     * @return promise
     */
    it('should throw an exception if you try to buy your own article', async () => {

        chainListInstance = await ChainList.deployed();

        // require(msg.sender != article.seller) の箇所で revertされる
        await chainListInstance.buyArticle(1, {
            from: seller,
            value: web3.toWei(articlePrice, 'ether')
        })
            .then(assert.fail)
            .catch(error => {
                assert(true);
            });

        // 商品情報をテスト
        const article = await chainListInstance.articles(1);
        assert.equal(article[0].toNumber(), 1, 'article id must be 1');
        assert.equal(article[1], seller, `seller must be ${seller}`);
        assert.equal(article[2], 0x0, `buyer must be empty`);
        assert.equal(article[3], articleName, `article name must be ${articleName}`);
        assert.equal(article[4], articleDescription, `article description must be ${articleDescription}`);
        assert.equal(article[5].toNumber(), web3.toWei(articlePrice, 'ether'), `article name must be ${web3.toWei(articlePrice, 'ether')}`);
    });

    /**
     * 出品金額と異なった金額で購入しようとした際に、
     * revertされるかテスト
     *
     * @return promise
     */
    it('should throw an exception if you try to buy an article for a value different from its price', async () => {

        chainListInstance = await ChainList.deployed();

        // require(msg.value == price); の箇所で revertされる
        await chainListInstance.buyArticle(1, {
            from: buyer,
            value: web3.toWei(articlePrice + 1, 'ether')
        })
            .then(assert.fail)
            .catch(error => {
                assert(true);
            });

        // 商品情報をテスト
        const article = await chainListInstance.articles(1);
        assert.equal(article[0].toNumber(), 1, 'article id must be 1');
        assert.equal(article[1], seller, `seller must be ${seller}`);
        assert.equal(article[2], 0x0, `buyer must be empty`);
        assert.equal(article[3], articleName, `article name must be ${articleName}`);
        assert.equal(article[4], articleDescription, `article description must be ${articleDescription}`);
        assert.equal(article[5].toNumber(), web3.toWei(articlePrice, 'ether'), `article name must be ${web3.toWei(articlePrice, 'ether')}`);
    });

    /**
     * すでに商品が売れてしまった場合に、
     * revertされるかテスト
     *
     * @return promise
     */
    it('should throw an exception if you try to buy an article that was already been sold', async () => {

        chainListInstance = await ChainList.deployed();

        // 購入成功
        await chainListInstance.buyArticle(1, {
            from: buyer,
            value: web3.toWei(articlePrice, 'ether')
        });

        // require(article.buyer == 0x0); の箇所で revertされる
        await chainListInstance.buyArticle(1, {
            from: accounts[0],
            value: web3.toWei(articlePrice, 'ether')
        })
            .then(assert.fail)
            .catch(error => {
                assert(true);
            });

        // 商品情報をテスト
        const article = await chainListInstance.articles(1);
        assert.equal(article[0].toNumber(), 1, 'article id must be 1');
        assert.equal(article[1], seller, `seller must be ${seller}`);
        assert.equal(article[2], buyer, `buyer must be empty`);
        assert.equal(article[3], articleName, `article name must be ${articleName}`);
        assert.equal(article[4], articleDescription, `article description must be ${articleDescription}`);
        assert.equal(article[5].toNumber(), web3.toWei(articlePrice, 'ether'), `article name must be ${web3.toWei(articlePrice, 'ether')}`);

    });

});