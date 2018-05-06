pragma solidity ^0.4.23;

import "./Ownable.sol";

contract ChainList is Ownable {

    /**
     * custum types
     *
     * structure: 複数の変数を一つにまとめて管理可能なカスタム型
     * （構造体自体に実体は無く、初期化されオブジェクト生成されてはじめて実体を持つ）
     *
     * Article articles = Article(value1, value2, ...)
     * と初期化を行ない、オブジェクトを変数に格納できる。
     *
     * articles.uint とアクセス可能。
     */
    struct Article {        // Array
        uint id;            // BigNumber
        address seller;     // String
        address buyer;
        string name;
        string description;
        uint256 price;
    }

    /**
     * state variables
     *
     * state variables が public だと getterが自動生成
     * instance.articles(key)で、valueへアクセス可
     */
    mapping (uint => Article) public articles;
    uint articleCounter;

    /**
     * events
     */
    event LogSellArticle(
        uint indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );
    event LogBuyArticle(
        uint indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    /**
     * Contract を破棄し owner に contract残高を送付する
     *
     * state変数は破棄され、関数は無効化される。
     * ただし、transaction callは可能で、gasも消費される
     */
    function kill() public onlyOwner {
        selfdestruct(owner);
    }

    /**
     * 商品を売る
     */
    function sellArticle(string _name, string _description, uint256 _price) public {

        // 全商品数を記録するカウンタ更新
        articleCounter++;

        // 連想配列のvalue構造体に出品情報を記録
        articles[articleCounter] = Article(
            articleCounter, // id
            msg.sender,     // seller
            0x0,            // buyer
            _name,          // name
            _description,   // description
            _price          // price
        );

        emit LogSellArticle(articleCounter, msg.sender, _name, _price);
    }


    /**
     * 商品を買う
     *
     * article.buyer に買い手のアドレス登録
     * article.seller へ送金
     */
    function buyArticle(uint _id) public payable {

        // 商品が買える状態にあるかどうか
        require(articleCounter > 0);
        // 購買希望商品が存在しているか（商品IDが、1以上で存在しているカウント以下）
        require(_id > 0 && _id <= articleCounter);

        // 構造体の実体を参照
        // struct, array, mapping型ローカル変数は、storage がデフォルトだが、
        // コンパイラが警告するため明示する
        Article storage article = articles[_id];

        // まだ買い手がついていないか
        require(article.buyer == 0x0);
        // sellerがbuyerになれないように
        require(msg.sender != article.seller);
        // 送金金額が商品金額と一致しているか
        require(msg.value == article.price);

        // 買い手として記録
        article.buyer = msg.sender;
        // 売り手へ送金
        article.seller.transfer(msg.value);
        // require(article.seller.send(msg.value)); // 左記でも同様

        emit LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
    }


    /**
     * 全商商品数をget
     *
     * @return (uint)
     */
    function getNumberOfArticles() public view returns (uint) {
        return articleCounter;
    }


    /**
     * 販売中商品IDをget
     * （販売中か否かは、buyer変数にアドレスが格納されているか否か）
     *
     * @return (uint[])
     */
    function getArticlesForSale() public view returns (uint[]) {

        // memoryへ格納する固定長配列（長さ変更不可）
        // （ローカル配列は固定長でなくてはならない）
        //
        // これまでの全商品を上限とする固定長配列を作成
        uint[] memory articleIdsArr = new uint[](articleCounter);

        // 販売中商品数
        uint numberOfArticlesForSale = 0;

        // articleCounterのスタートが1からのため、1スタート
        for(uint i = 1; i <= articleCounter; i++) {
            // 配列に、商品IDを格納していく
            if(articles[i].buyer == 0x0) {
                articleIdsArr[numberOfArticlesForSale] = articles[i].id;
                numberOfArticlesForSale++; //販売中商品数カウンタ更新
            }
        }

        // 販売中商品数の固定長配列
        uint[] memory forSaleIdsArr = new uint[](numberOfArticlesForSale);

        // より少ない固定長配列へ、全商品数分の長さを持つ配列から配列要素をコピー
        for(uint j = 0; j < numberOfArticlesForSale; j++) {
            forSaleIdsArr[j] = articleIdsArr[j];
        }

        return forSaleIdsArr;
    }

}