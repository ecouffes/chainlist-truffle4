App = {
    web3Provider: null, // Ethereumノードに接続するためのオブジェクト
    contracts: {},      // Contractオブジェクト
    account: 0x0,   // Coinbaseアカウント
    loading: false, // smart contract へのloading中はtrueに

    /**
     * 初期化
     */
    init: () => {
        return App.initWeb3();
    },

    /**
     * web3オブジェクトの初期化
     *
     * Coinbaseアカウントと、そのBalanceをHTMLへ表示
     * Contractファイルの初期化（Web3を介したEthereumノードとの紐付け）
     */
    initWeb3: () => {
        // web3オブジェクトが存在していたら、
        if(typeof web3 !== 'undefined') {
            // Metamaskによって提供されるweb3 Objectのプロバイダーを再利用
            App.web3Provider = web3.currentProvider;
        } else {
            // web3 objが存在していなかったら、新たにproviderを作成し、Ethereumローカルノードに接続
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        App.displayAccountInfo();
        return App.initContract();
    },

    /**
     * Coinbaseアカウントと、そのBalanceをHTMLへ表示
     */
    displayAccountInfo: () => {
        // coinbaseアカウントの取得（エラーを吐かなかったら処理実行）
        web3.eth.getCoinbase((err, account) => {
            if(err === null) {
                App.account = account;
                $('#account').text(account);

                // coinbaseアカウントのbalance取得（エラーを吐かなかったは処理実行）
                web3.eth.getBalance(account, (err, balance) => {
                    if(err === null) {
                        $('#accountBalance').text(`${web3.fromWei(balance, 'ether')} ETH`);
                    }
                });
            }
        });
    },

    /**
     * Contract初期化（Contractオブジェクト生成）
     *      ビルドしたJSONファイルからContractオブジェクト化
     *      Web3を介したEthereumノードとの紐付け
     */
    initContract: () => {
        // bs-configでbasedir設定しているので、URL指定は下記でOK
        $.getJSON('ChainList.json', (chainListArtifact) => {
            // build後のcontractアーティファクト（成果物）のjsonファイルを初期化
            // TruffleContractで初期化されたオブジェクトのメンバーメソッドは、promiseを返す
            App.contracts.ChainList = TruffleContract(chainListArtifact);
            // 初期化したコントラクトファイルに、web3を紐付け
            App.contracts.ChainList.setProvider(App.web3Provider);
            // イベントリッスン
            App.listenToEvents();
            return App.reloadArticles()
        })
    },

    /**
     * HTMLへ再renderする関数
     *
     * Coinbaseアカウント情報をHTMLにrender
     * instance.getArticlesForSale() が返す情報から、
     * 現在発売中商品のidをキーにして、当該商品情報を取得しRender
     */
    reloadArticles: () => {

        if(App.loading) return;
        // reentry防止（Smart contractへのLoading開始）
        App.loading = true;

        // coinbaseアカウント情報をrender
        App.displayAccountInfo();

        // Contract インスタンス
        let chainListInstance;
        App.contracts.ChainList.deployed()
            .then(instance => {
                chainListInstance = instance;
                return chainListInstance.getArticlesForSale();
            })
            .then(forSaleIdsArr => {
                $('#articlesRow').empty();  // 商品情報表示箇所を空にする

                // 現在発売中商品のidをキーにして、当該商品情報を取得しRender
                forSaleIdsArr.forEach((elm, i, arr) => {
                    let articleId =  forSaleIdsArr[i];
                    chainListInstance.articles(articleId.toNumber())
                        .then((article) => {
                            App.displayArticle(
                                article[0], // id
                                article[1], // seller
                                article[3], // name
                                article[4], // description
                                article[5], // price
                            )
                        })
                });
                // Smart ContractへのLoading終了
                App.loading = false;
            }).catch(err => {
                console.error(err.message);
                App.loading = false;
            });
    },

    /**
     * 商品情報をHTMLへRenderする関数
     */
    displayArticle: (id, seller, name, description, price) => {

        const articlesRow = $('#articlesRow');    // render箇所のDOM
        const etherPrice = web3.fromWei(price, 'ether');

        // Render in the template
        const $articleTemplate = $('#articleTemplate');
        $articleTemplate.find('.panel-title').text(name);
        $articleTemplate.find('.article-description').text(description);
        $articleTemplate.find('.article-price').text(`${etherPrice} ETH`);
        $articleTemplate.find('.btn-buy').attr('data-id', id);
        $articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

        // 売り手がcoinbaseアカウントだった時
        if (seller == App.account) {
            $articleTemplate.find('.article-seller').text('You');
            $articleTemplate.find('.btn-buy').hide();
        } else {
            $articleTemplate.find('.article-seller').text(seller);
            $articleTemplate.find('.btn-buy').show();
        }

        // 描画
        articlesRow.append($articleTemplate.html());

    },

    /**
     * Modalでのform controlに入力された内容を引数にして
     * instance.sellArticle() 関数実行
     */
    sellArticle: () => {
        const _article_nane = $('#article_name').val();
        const _description = $('#article_description').val();
        const _price = web3.toWei(parseFloat($('#article_price').val() || 0), 'ether');

        // 商品名が空欄 or 商品価格が0なら、抜ける
        if ((_article_nane.trim() === '') || (_price === 0)) return false;

        App.contracts.ChainList.deployed()
            .then(instance => {
                // 関数をtransaction call
                // Metamask等のウォレットアプリケーションは、この関数が呼ばれている途中でインターセプトする
                return instance.sellArticle(_article_nane, _description, _price, {from: App.account, gas: 500000});
            }).then(receipt => {
                // transaction receiptが返って来る
                // console.log(receipt);
            }).catch(err => {
                console.error(err);
            });
    },

    /**
     * buy button押下後に実行
     *
     */
    buyArticle: (e) => {
        e.preventDefault();

        // buy buttonに仕込まれた商品IDと販売額をget
        const _articleId = $(e.target).data('id');
        const _price = parseFloat($(e.target).data('value'));

        App.contracts.ChainList.deployed()
            .then(instance => {
                instance.buyArticle(_articleId, {
                    from: App.account,
                    value: web3.toWei(_price, 'ether'),
                    gas: 500000 //gas limit
                })
            })
            .catch(error => {
                console.error(error);
            })
    },


    /**
     * Event logの監視
     * watchメソッドは、初回実行時に該当するEvent logがあったら、処理を実行する点に注意
     *
     * filter と range に該当するEvent logがあったら、処理を実行。HTMLを再描画
     */
    listenToEvents: () => {
        App.contracts.ChainList.deployed()
            .then(instance => {
                instance.LogSellArticle({}, {}).watch((error, event) => {
                    if(!error) {
                        $('#events').append(`<li class="list-group-item">${event.args._name} is now for sale</li>`)
                    } else {
                        console.error(error);
                    }
                    App.reloadArticles();
                });

                instance.LogBuyArticle({}, {}).watch((error, event) => {
                    if(!error) {
                        $('#events').append(`<li class="list-group-item">${event.args._buyer} bought ${event.args._name}</li>`)
                    } else {
                        console.error(error);
                    }
                    App.reloadArticles();
                });

            })
    }


};

$(function () {
    $(window).load(() => {
        App.init();
        $(document).on('click', '#btn-sell-article', e => {
            App.sellArticle();
            return false;
        });

        $(document).on('click', '#btn-buy-article', e => {
            App.buyArticle(e);
            return false;
        });
    });
});