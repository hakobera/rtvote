TechHUB.jp Node.js 入門 第3回資料 Node.js で作るリアルタイム投票アプリ
=================================================================

Last Update: 2011/12/16

Author: Kazuyuki Honda [@hakobera](https://twitter.com/#!/hakobera)

前書き
--------

　この資料は、2011年12月11日に開催された TechHUB.jp の Node.js 入門の3回目の講義の補足資料です。当日、講師である私の準備、検証不足もあり、色々と想定していた内容までたどり着かなかったので、そのお詫びを兼ねて、資料としてまとめてみました。

　なるべく細かいところまで記述したつもりですが、本題と関係ない部分は一部省略、または参考資料へのリンクで済ましている部分があるので、その点はご容赦ください。

　また、この資料は受講者のほとんどが Mac だったため、Mac OS X Lion (多分、Snow Leopard 10.6.7 以降なら同じはず）を前提にした資料になっています。Windows 版は時間があれば書くかもしれませんが、期待しないでください。Linux 使っている人は書かなくても何とかなると勝手に思っています。

　なお、これ以降の注意として、コンソールからコマンドを入力する場合は、`$ ` を先頭に付与した表記をします。文中に `$ npm install -d` のように書いてあった場合、`npm install -d` と入力する、という意味になります。`$ ` は入力しないでください。

ソースコードとデモ
----------------

TODO: URL の設定

[github](http://xxx)

[デモ](http://xxxx.herokuapp.com)

前提条件
----------

　この資料を読み始める前に、以下の事前準備をしておいてください。準備が整っていないと、資料のどこからつまずきます。

* XCode がインストールされていること
  * App Store からインストールしてください
  * App Store がメニューにないよ！って人は、OS をバージョンアップするなり、マシンを新しく買うなりして、なんとかしてください。

* git がインストールされていること
  * Homebrew: `$ brew install git`
  * Mac Ports: `$ sudo port install git-core`

* ruby がインストールされていること
  * Mac に標準でインストールされているもので大丈夫

* Node.js v0.6.3 以降および NPM がインストールされていること
  * Node.js のバージョンを使い分けたい人は nvm などの利用を推奨
    * 参考資料:  http://d.hatena.ne.jp/mollifier/20110221/p1
  * めんどくさい人は[公式のインストーラ](http://nodejs.org/#download) を使ってください

* MongoDB がインストールされていること
  * 参考資料: http://www.mongodb.org/display/DOCS/Quickstart+OS+X

* Heroku のアカウントを持っていること
  * [Heroku](http://www.heroku.com/) にアクセスして、Sign Up から登録

* クレジットカードを持っていること
  * Heroku の Addon を利用するために必要ですので、Heroku にログインしたら、右上のメニュー My Account へ行き、Billing Info に登録しておいてください
  * 登録するだけなので、今回の資料の範囲内での利用量では課金されません
    * 設定によって課金されるので、そこは自己責任でお願いします

Node.js の使い所
----------------

　アプリの作成に入る前に、Node.js はどんなアプリを作るのに向いているのか、簡単におさらいしておきます。

* 画面を多く作るアプリケーションには向いていない
  * View Helper の決定版がない
  * ガジェットとか作るのには良いかも
  * 画面がそもそもないログ収集サーバとかには最適

* 非同期処理には向いている。簡易キューとしても使える

* リアルタイム風ネットワークアプリケーションには向いている（Node.js というより Socket.IO のおかげ
かも）

* 計算（CPU負荷が高い）処理ではなく、I/O が多い処理に向いている

　ということで、この資料では、「リアルタイム」に結果が反映される投票「ガジェット」を作成し、PaaS である Heroku にデプロイしてアプリを公開するまでの手順を解説していきます。技術要素としては、Node.js、Express、Socket.IO、MongoDB、Ajax、HTML5(Canvas)、Heroku CLI を含みます。

まずは Heroku でアプリを公開してみよう
----------------------------------

　いきなりですが、まずは Heroku にアプリをデプロイしてみましょう。Node.js のアプリを公開することがいかに簡単か、そして、git でのソースコード管理を強制するためにも、まずはこの作業を行います。

基本的には [Getting Started with Node.js on Heroku/Cedar](http://devcenter.heroku.com/articles/node-js) に書いてある手順をなぞっていきます。

### Heroku CLI のインストール

　[Mac用インストーラ](http://toolbelt.herokuapp.com/osx/download) をダウンロードしてきて、インストールします。インストール完了後、コンソールから `$ heroku login` と入力します。ここで、事前に登録しておいたメールアドレスとパスワードを入力します。この作業は初回のみ必要です。

    $ heroku login
    Enter your Heroku credentials.
    Email: adam@example.com
    Password:
    Could not find an existing public key.
    Would you like to generate one? [Yn]
    Generating new SSH public key.
    Uploading ssh public key /Users/adam/.ssh/id_rsa.pub

### アプリケーションを作成

　Node.js で利用できる Web アプリケーションフレームワークである [express](http://expressjs.com/) を利用するので、express コマンドを利用してアプリケーションの雛形を作成します。アプリケーション名はリアルタイム投票アプリということで rtvote (RealTime Voting app) としています。`<workdir>` は任意の作業用のディレクトリです。

    $ cd <workdir>
    $ npm install express -gd
    $ express -t ejs rtvote
    $ cd rtvote
    $ npm install -d

　これで `<workdir>/rtvote` に express の雛形が作成され、必要な npm モジュールがインストールされます。最後に app.js を1行書き換えます。

    // app.listen(3000); を以下のように書き換え
    app.listen(process.env.PORT || 3000);

### Heroku 用の設定ファイルを作成

　`.gitignore` と `Procfile` を作成します。以下のコマンドを打って、２つのファイルを作成してください。

    $ echo 'node_modules' > .gitignore
    $ echo 'web: node app.js' > Procfile

### Heroku にデプロイ

　Heroku にログインするには、アプリケーションのディレクトリを git で管理する必要があります。まずは、git リポジトリを作成、ソースファイルの追加、コミットをしましょう。

    $ git init
    $ git add .
    $ git commit -m 'First commit'

　次に `heroku` コマンドで Heroku 上にアプリケーションを作成します。

    $ heroku create --stack cedar --buildpack http://github.com/hakobera/heroku-buildpack-nodejs.git

 　`--buildpack` の部分は Heroku で Node.js v0.6.5 を利用するためのオプションです。Heroku の標準では Node.js v0.4.7 になりますが、これを指定することで開発環境と同じ、v0.6 系が利用できるようになります。

　さて、ここまでで準備が整ったので、Heroku にデプロイしてみましょう。といっても、作業は簡単で git コマンドで heroku リポジトリに push するだけです。

    $ git push heroku master
    Counting objects: 14, done.
    Delta compression using up to 2 threads.
    Compressing objects: 100% (9/9), done.
    Writing objects: 100% (14/14), 1.56 KiB, done.
    Total 14 (delta 0), reused 0 (delta 0)

    -----> Heroku receiving push
    -----> Fetching custom buildpack... done
    -----> Node.js app detected
    -----> Fetching Node.js binaries
    -----> Vendoring node 0.6.5
    -----> Installing dependencies with npm 1.1.0-alpha-6
           ejs@0.6.1 ./node_modules/ejs
           express@2.5.2 ./node_modules/express
           ├── mkdirp@0.0.7
           ├── qs@0.4.0
           ├── mime@1.2.4
           └── connect@1.8.3
           Dependencies installed
    -----> Discovering process types
           Procfile declares types -> web
    -----> Compiled slug size is 7.3MB
    -----> Launching... done, v5
           http://stark-water-3025.herokuapp.com deployed to Heroku

    To git@heroku.com:stark-water-3025.git
     * [new branch]      master -> master

　`Launching... done, <URL> deployed to Heroku` のように表示されれば成功です。URL は実行した人によって異なります。ここまでできたら以下のコマンドを入力すると、ブラウザでアプリが開きます。

    $ heroku open
    Opening http://stark-water-3025.herokuapp.com/

　これで、Heroku に、つまり全世界にあなたのアプリを公開することができました。簡単ですね。

MongoDB を使ってみよう
---------------------

### Node.js (JavaScript) と MongoDB の相性は抜群

　今回作成するアプリではデータは MongoDB に格納します。MongoDB は JSON 形式でデータを格納することのでできるデータベースで、JavaScript との相性が物凄く良いです。実際のコード例を挙げると以下のような感じです。(mongoskin という npm モジュールを使った例)

    var mongo = require('mongoskin'),
        db = mongo.db('localhost/test');

    var item = {
       name: 'sample',
       value: 10
    };

    db.collection('items').insert(item, {}, function(err, docs) {
       // do something
    });

    db.collection('items').find({ name: 'sample' }, function(err, docs) {
       // do something
       var i = docs[0];
       console.log(i.name); // => 'sample'
    });
　
　このように Node.js と MongoDB とでは JSON という共通のフォーマットを介して、item という JavaScript のオブジェクトをそのままの保存、検索できることがわかります。RDB を使った場合はこうはいきませんので、Node.js と MongoDB の相性がとても良いということがわかると思います。

### データ構造を決める

　いくら MongoDB がオブジェクトをそのまま突っ込めるととは言っても、エンティティレベルでの簡単なデータ構造は決定しておく必要があります。今回は、「投票」システムなので、「投票する議題」(Topic) と「票」(Vote) をエンティティとすることにしましょう。

　データとしてはこんな感じになります。MongoDB の場合、後からのプロパティの追加も容易なので、まずは必要そうなものだけ入れておきましょう。

Topic

    {
      "_id": <topicId>
      "title": "投票のタイトル",
      "body": "何について投票するのか？質問文をここに記述します",
      "selections": [ "選択肢1", "選択肢2", "選択肢3" ],
      "createdAt": "2011-12-16T12:34:56"
    }

Vote

    {
      "_id": <voteId>,
      "topicId": <topicId>
      "value": "選択肢1",
      "createdAt": "2011-12-16T12:34:56"
    }

　どちらのエンティティも "_id" プロパティをキーとします。MongoDB ではデータを insert すると、自動的に "_id" というプロパティに値を設定しれくれるので、今回はそれを利用します。場合によっては、"_id" とは別にあるルールで採番した方が良いケースもありますが、今回のケールではこれで十分です。
　
　また、Vate#topicId には投票対象 Topic の _id を、Vote#value には Topic.selections[] の中から選ばれた値を入れることとします。

### Topic を作成して、保存、検索できるようにする

　データ構造がおおまかに決まったので、Topic エンティティから作っていきます。今回、MongoDB との接続には前述した mongoskin という npm モジュールを利用します。mongoskin は mongo-native というローレベルの MongoDB ドライバーの薄いラッパーモジュールになっていて、MongoDB の コンソールクライアントとよく似たコードを記述することができるようになっています。

#### mongoskin を package.json に追加

　mongoskin を package.json の dependencies に追加します。ついでに private を削除して、name を変更して、
後のテストで使う mocha と should、そして request を devDependencies に追加します。

    {
        "name": "rtvote"
      , "version": "0.0.1"
      , "dependencies": {
          "express": "2.5.2"
        , "ejs": ">= 0.0.1"
        , "mongoskin": "0.2.2"
      }
      , "devDependencies": {
           "mocha": "0.5.0"
        , "should": "0.4.1"
        , "request": "2.2.9"
      }
   }

　package.json を変更したら、忘れずに `npm install` しましょう。

    $ npm install -d

　これで npm モジュールの設定は完了です。

#### MongoDB を起動

  MongoDB にアクセスするプログラムを書く前に、開発用の MongoDB を `mongod` コマンドで起動しておきましょう。`<dbpath>` はデータを格納する任意のディレクトリを指定してください

    $ mongod --dbpath=<dbpath>

  起動したかどうかは、新規コンソールを開いて `mongo` コマンドを起動してみましょう。

    $ mongo
    MongoDB shell version: 1.8.1
    connecting to: test

  上記のように `test` データベースにつながれば、起動は成功しています。MongoDB でアクセス時に自動的にデータベースが作成されるので、事前に利用するデータベースを作成しておく必要はありません。

#### Topic エンティティを作成するモジュールを作成

　今回はエンティティの数も多くないので、データベースにアクセスするモジュールは db.js という１つのファイルにまとめて記述することにします。

　まずは、MongoDB への接続と Topic エンティティに関する操作を記述していくことにします。今回は TDD スタイルで進めていくの、まずはテストを書きます。テストには BDD スタイルでテストが記述できる [mocha](http://visionmedia.github.com/mocha/) というテストフレームワークを利用します。

    $ npm install mocha -g
    $ mkdir test

  npm で mocha をグローバルインストールしたら、test ディレクトリを作成します。ここで、mocha の設定ファイル `mocha.opts` を test フォルダにおきます。

mocha.opts

    --reporter spec
    --ui bdd
    --ignore-leaks

  `--ignore-leaks` オプションは本来は必要ないのですが、今回利用する mongoskin のバグ回避のために指定しています。mongoskin の master リポジトリでは既に修正されているので、mongoskin のバージョンが上がれば、消せるようになります。

　それではテストを書いていきます。まずは、Topic の作成のメソッドについて考えて書きます。

test/db.test.js

    var db = require('../lib/db'),
    should = require('should');

    var TEST_DB = 'localhost/rtvote-test';

    describe('db', function() {
      before(function(done) {
        db.connect(TEST_DB, function(err) {
          if (err) {
            throw new Error('Error in db.connect(' + TEST_DB + ')');
          }
          done();
        });
      });

      after(function(done) {
        db.close(function(err) {
          if (err) {
            throw new Error('Error in db.close()');
          }
          done();
        });
      });

      describe('.createTopic()', function() {
        it('should create a topic', function(done) {
          var topic = {
            title: 'Test topic',
            body: 'What kind of fruit do you like?',
            selections: [ 'apple', 'banana' ]
          };

          db.createTopic(topic, function(err, result) {
            should.not.exist(err);
            result.should.have.property('_id');
            result.title.should.equal(topic.title);
            result.body.should.equal(topic.body);
            result.selections.should.eql(topic.selections);
            result.should.have.property('createdAt');

            done();
          });
        });
      });
    });

　before メソッドは全てのテストの開始前に呼び出され、MongoDB に接続し、after メソッドは全てのテスト終了後に呼び出されれ、MongoDB から切断しています。

　createTopic メソッドに関しては正常系のテストを記述しています。`db.createTopic()` 呼び出し後に、エラーが発生していないこと、"_id" プロパティが自動設定されていること、残りのプロパティは指定した値が設定されていることを確認しています。

　ここで、一旦テストを実行してみましょう。

    $ mocha
    node.js:201
        throw e; // process.nextTick error, or 'error' event on first tick
              ^
    18 Dec 01:18:26 - [ERROR] Error
    Error: Cannot find module '../lib/db'
    ... (略)

　ファイルが無いので当然、失敗しますね。では、このテストを通過するように lib/db.js を書いていきましょう。

lib/db.js

    var mongo = require('mongoskin');

    /**
     * Connection to mongodb
     */
    var db = null;

    /**
     * Topic collection name
     */
    var COLLECTION_TOPIC = 'topics';

    /**
     * Set MongoDB URL.
     *
     * @param {String} url MongoDB URL to connect
     * @param {Function} callback Called when connected or failed.
     */
    exports.connect = function(url, callback) {
      try {
        db = mongo.db(url);
        callback();
      } catch (e) {
        callback(e);
      }
    };

 `connect(url, callback)` メソッドは mongoskin の db メソッドを呼び出しています。db メソッドはコールバックではなく、例外でエラーを返す作りになっているため、ここでは try-catch ブロックを利用して、呼び出し側にエラーを返すようにしています。

    /**
     * Close connection to MongoDB if available.
     *
     * @param {Function} callback Called when connection closed or failed.
     */
    exports.close = function(callback) {
      if (db) {
        db.close(function(err) {
          if (err) {
            callback(err);
          } else {
            db = null;
            callback();
          }
        });
      } else {
        callback();
      }
    };

  `close()` メソッドは `connect()` メソッドが正常呼び出しされていた場合は mongoskin の close() メソッドを呼び出して MongoDB との切断処理をし、そうでない場合は何もしません。

    /**
     * Create topic and save it to database.
     *
     * @param {Object} topic Topic data to create
     * @param {Function} callback Call when topic created or failed
     */
    exports.createTopic = function(topic, callback) {
      db.collection(COLLECTION_TOPIC).insert(topic, function(err, docs) {
        if (err) {
          callback(err);
        } else {
          callback(null, docs[0]);
        }
      });
    };

　`createTopic(topic, callback)` では、'topics' コレクションを取得し、引数の topic をそのまま保存しています。MongoDB の collection は、RDB でいうところのテーブルに相当します。`db.collection('topics') ` で 'topics' コレクションを操作するオブジェクトが取得できるので、これの `insert(topic, callback)` メソッドを呼び出すことで MongoDB に指定した Topic を挿入できます。データの挿入に成功した場合、コールバックの第2引数に配列で挿入したデータが入ってきます。今回はオブジェクト1つしか挿入しない前提としているので、最初の要素のみを呼び出し元に戻すように実装します。

　ここまで書いたら、もう一度テストを実行して試してみましょう。

    $ mocha
    db
      .createTopic()
        ✓ should create a topic

    ✔ 1 tests complete (37ms)

　今度はテストが通りましたね。キリがよいので、ここで `git add .`, `git commit` しておきましょう。

#### Topic の検索メソッドを追加

　Topic の作成ができたので、次に Topic の検索メソッドを追加します。今度もテストから書いていきます。

test/db.test.js

    describe('.findTopic()', function() {
      it('should return a topic specified by topic id', function(done) {
        var topic = {
          title: 'Test topic',
          body: 'What kind of fruit do you like?',
          selections: [ 'apple', 'banana' ]
        };

        db.createTopic(topic, function(err, tp) {
          should.not.exist(err);
          tp.should.have.property('_id');

          var topicId = tp._id;
          db.findTopic(topicId, function(err, result) {
            result._id.should.eql(topicId);
            result.title.should.equal(topic.title);
            result.body.should.equal(topic.body);
            result.selections.should.eql(topic.selections);
            result.should.have.property('createdAt');

            done();
          });
        });
      });

      it('should throw error when entity specified by topic id is not found', function(done) {
        db.findTopic('aaaaa5e7b8990c0000000002', function(err, result) {
          should.exist(err);
          err.should.instanceof(db.EntityNotFoundError);
          err.message.should.equal('Topic not found for topic id = aaaaa5e7b8990c0000000002');

          done();
        });
      });

      it('should throw error when topic id format is invalid', function(done) {
        db.findTopic('invalid', function(err, result) {
          should.exist(err);
          err.message.should.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters in hex format');

          done();
        });
      });
    });

  `findTopic(topicId)` は単独ではテストできないので、`createTopic()` と組み合わせてテストします。
登録した Topic から topicId を取得して、それで検索した結果が最初に登録したものと一致するかどうかをテストしています。
今回は正常系の他に、登録されていない topicId を指定した場合に、`db.EntityNotFoundError` が発生することを確認する例外系のテストケースも追加しています。

　これを通るように db.js に `findTopic(topicId, callback)` を定義していきます。

lib/db.js

    /**
     * Entity not found error
     */
    function EntityNotFoundError(message) {
      this.message = message;
      Error.captureStackTrace(this, this.constructor);
    }
    util.inherits(EntityNotFoundError, Error);
    exports.EntityNotFoundError = EntityNotFoundError;

    (省略)

    /**
     * Find topic by topicId.
     *
     * @param {String} topicId Topic ID to find
     * @param {Function} callback Call when topic found or failed
     */
    exports.findTopic = function(topicId, callback) {
      try {
        db.collection(COLLECTION_TOPIC).findById(topicId, function(err, topic) {
          if (err) {
            callback(err);
          } else {
            if (!topic) {
              callback(new EntityNotFoundError('Topic not found for topic id = ' + topicId));
            } else {
              callback(null, topic);
            }
          }
        });
      } catch (e) {
        callback(e);
      }
    };

　カスタム例外の定義では、コンストラクタで `Error.captureStackTrace(this, this.constructor)` を呼び出し、
`util.inherits(EntityNotFoundError, Error)` で Error を継承します。
([node/lib/assert.js](https://github.com/joyent/node/blob/master/lib/assert.js#L40-52) の AssertError を参考にしています。）

　テストを実行してみて、全て通ることを確認してください。

    $ mocha
    db
      .createTopic()
        ✓ should create a topic
      .findTopic()
        ✓ should return a topic specified by topic id
        ✓ should throw error when entity specified by topic id is not found
        ✓ should throw error when topic id format is invalid

　確認できたら `git add .`、`git commit` しましょう。

#### Topic 作成画面を作る

　Topic の作成、検索ができるようになったので、今度は画面とコントローラを作っていきます。
今回は Node.js は REST API サーバとなるように設計していくので、次のような URL ルーティングにします。

Topic の作成:

- URL: `POST /topics/`
- request
  - Content-Type: 'application/json'
  - body: { title: 'String', body: 'String', selections: [ 'opt1', 'opt2' ] }
- response
  - Content-Type: 'application/json'
  - Body: 作成した Topic オブジェクトの JSON 表記
  - request.body の内容が不正な場合、ステータスコード 400 を返す
  - データベースとの接続、保存に失敗した場合、ステータスコード 500 を返す

　これに対応するルーティングを `app.js` に追加します。

    app.get('/topics/:topicId', routes.findTopic);

　今回もテストから書いていきましょう。app.js のテストは実際にサーバを立ち上げて、リクエストを送信することで実施します。
レクエストの処理を簡潔に記述できるように、ここでは request モジュールを利用します。

test/app.test.js

    var app = require('../app.js');

    var should = require('should'),
        request = require('request'),
        util = require('util');

    function testUrl(path) {
      if (path.substr(0, 1) !== '/') {
        path = '/' + path;
      }
      return util.format('http://localhost:%d%s', app.address().port, path);
    }

    describe('app', function() {
      describe('POST /topics', function() {
        it('should create topic and return it as JSON', function(done) {
          var topic = {
            title: 'title',
            body: 'body',
            selections: [ 'opt1', 'opt2' ]
          };

          request.post({
            url: testUrl('/topics'),
            json: topic
          }, function(err, res, body) {
            should.not.exist(err);
            res.statusCode.should.equal(200);
            res.header('content-type').should.equal('application/json; charset=utf-8');
            body.should.have.property('_id');
            body.title.should.equal(topic.title);
            body.body.should.equal(topic.body);
            body.selections.should.eql(topic.selections);

            done();
          });
        });

        it('should not accept when no body is supplied', function(done) {
          request.post({
            url: testUrl('/topics'),
            json: {},
            onRequest: function(err, ress) {
              console.log(ress);
            }
          }, function(err, res, body) {
            should.not.exist(err);
            res.statusCode.should.equal(400);

            done();
          });
        });
      });
    });

　これに対応する処理を `route/index.js` に追加します。

    var db = require('../lib/db');

    var MONGO_URL = process.env.MONGOHQ_URL || 'localhost/rtvote';
    if (process.env.NODE_ENV === 'test') {
      MONGO_URL = 'localhost/rtvote-test';
    }
    db.connect(process.env.MONGOHQ_URL || 'localhost/rtvote', function(err) {
      if (err) {
        throw err;
      }
    });

    (省略)

    /**
     * POST Create topic
     */
    exports.createTopic = function(req, res) {
      var topic = req.body;
      console.log(topic);
      if (!topic.title || !topic.body || !topic.selections) {
        res.json({}, 400);
      } else {
        db.createTopic(topic, function(err, result) {
          if (err) {
            res.json(err, 500);
          } else {
            res.json(result);
          }
        });
      }
    };

　先頭にモードによって接続する MongoDB の URL を切り替える処理を書いています。
Heroku での動作時は、`process.env.MONGOHQ_URL` から、test モード時には `localhost/rtvote-test` に接続します。
　レスポンスを返す部分では、`res.json(obj)` メソッドを利用することで、
レスポンスの JSON 文字列化と、`Content-Type: application/json` の設定が一度にできて便利です。
`res.json(obj)` は以下のコードと等価です。

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj);

　それでは、実際にテストを走らせてみましょう。test モードで実行するために、`mocha` コマンドの前に `NODE_ENV=test` をつけて実行します。

    $ NODE_ENV=test mocha
    Express server listening on port 3000 in test mode

    app
      POST /topics
        ✓ should create topic and return it as JSON
        ✓ should not accept when no body is supplied

    db
      .createTopic()
        ✓ should create a topic
      .findTopic()
        ✓ should return a topic specified by topic id
        ✓ should throw error when entity specified by topic id is not found
        ✓ should throw error when topic id format is invalid

    ✔ 6 tests complete (53ms)

  次は検索のための、`findTopic` メソッドを実装しましょう。

Topic の topicId 指定検索:

- URL: `GET /topics/:topicId`
- response
  - Content-Type: 'application/json'
  - body: topicId に対応する Topic オブジェクトの JSON 表記
  - 対応するものがみつからない場合は、ステータスコード 404 を返す

　これに対応するルーティングを `app.js` に追加します。

    app.get('/topics/:topicId', routes.findTopic);

　テストを書きます。

test/app.test.js

    describe('GET /topics/:topicId', function() {
      it('should return topic specified by topicId', function(done) {
        var topic = {
          title: 'title',
          body: 'body',
          selections: [ 'opt1', 'opt2' ]
        };

        request.post({
          url: testUrl('/topics'),
          json: topic
        }, function(e, r, b) {
          should.not.exist(e);
          b.should.have.property('_id');

          var topicId = b._id;
          request.get({
            url: testUrl('/topics/' + topicId)
          }, function(err, res, body) {
            should.not.exist(err);
            res.statusCode.should.equal(200);
            res.header('content-type').should.equal('application/json; charset=utf-8');

            var result = JSON.parse(body);
            result.title.should.equal(topic.title);
            result.body.should.equal(topic.body);
            result.selections.should.eql(topic.selections);

            done();
          });
        });
      });

      it('should return 404 when topic specified by topicId is not found', function(done) {
        request.get({
          url: testUrl('/topics/aaaaceee2da6f9e837000001')
        }, function(err, res, body) {
          should.not.exist(err);
          res.statusCode.should.equal(404);

          done();
        });
      });
    });


　これを通るメソッドを実装します。

route/index.js

    /**
     * GET find topic by topicId
     */
    exports.findTopic = function(req, res) {
      var topicId = req.param('topicId');
      if (!topicId) {
        res.json({}, 404);
      } else {
        db.findTopic(topicId, function(err, result) {
          if (err) {
            if (err instanceof db.EntityNotFoundError) {
              res.json(err.message, 404);
            } else {
              res.json(err, 500);
            }
          } else {
            res.json(result);
          }
        });
      }
    };

  `/topics/:topicId` のように指定した場合、`:topicId` に対応する URL パスパラメータは `req.param()` メソッドで取得することができます。
これで取得した topicId を検索キーにして検索し、その結果を返します。
エラーが発生した場合は、結果がみつからなかったのか、別のエラーが発生したのかを区別するために、エラーの型を `instanceof` で
判定して、ステータスコードを変更しています。

    $ NODE_ENV=test mocha
    Express server listening on port 3000 in test mode

    app
      POST /topics
        ✓ should create topic and return it as JSON
        ✓ should not accept when no body is supplied
      GET /topics/:topicId
        ✓ should return topic specified by topicId
        ✓ should return 404 when topic specified by topicId is not found

    db
      .createTopic()
        ✓ should create a topic
      .findTopic()
        ✓ should return a topic specified by topic id
        ✓ should throw error when entity specified by topic id is not found
        ✓ should throw error when topic id format is invalid

    ✔ 8 tests complete (58ms)

　テストも無事に通りましたね。ということで、今度は画面を作りましょう。

views/layout.ejs

    <!DOCTYPE html>
    <html>
    <head>
      <title><%= title %> | rtvote</title>
      <link rel="stylesheet" href="http://twitter.github.com/bootstrap/1.4.0/bootstrap.min.css"/>
      <link rel="stylesheet" href="/stylesheets/style.css" />
      <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    </head>
    <body>
      <div class="container">
        <%- body %>
      </div>
    </body>
    </html>

　今回、画面作成に [Twitter Bootstrap](http://twitter.github.com/bootstrap/) と
[jQuery[(http://jquery.com/) を利用するので、それぞれの CDN 配布のURL を追加しています。

views/index.ejs

　Topic の作成画面では表示の都合上、投票の選択肢を４つまでに制限することにします。
ただし、プログラムの作り上の上限ではないので、数を変えたいという人は適宜増減させてみてください。