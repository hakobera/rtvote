TechHUB.jp Node.js 入門 第3回資料 Node.js で作るリアルタイム投票アプリ
=================================================================

Last Update: 2011/12/21

Author: Kazuyuki Honda [@hakobera](https://twitter.com/#!/hakobera)

前書き
--------

　この資料は、2011年12月11日に開催された TechHUB.jp の Node.js 入門の3回目の講義の補足資料です。当日、講師である私の準備、検証不足もあり、色々と想定していた内容までたどり着かなかったので、そのお詫びを兼ねて、資料としてまとめてみました。

　なるべく細かいところまで記述したつもりですが、本題と関係ない部分は一部省略、または参考資料へのリンクで済ましている部分があるので、その点はご容赦ください。

　また、この資料は受講者のほとんどが Mac だったため、Mac OS X Lion (多分、Snow Leopard 10.6.7 以降なら同じはず）を前提にした資料になっています。Windows 版は時間があれば書くかもしれませんが、期待しないでください。Linux 使っている人は書かなくても何とかなると勝手に思っています。

　なお、これ以降の注意として、コンソールからコマンドを入力する場合は、`$ ` を先頭に付与した表記をします。文中に `$ npm install -d` のように書いてあった場合、`npm install -d` と入力する、という意味になります。`$ ` は入力しないでください。

ソースコードとデモ
----------------

[github](https://github.com/hakobera/rtvote)

デモ
[投票画面](http://stark-water-3025.herokuapp.com/votes/4ef09d4039c11c0100000001)
[投票作成画面](http://stark-water-3025.herokuapp.com/)

デモでは好きな投票を作っていただいて構いません。

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
          "express": "2.5.x"
        , "ejs": ">= 0.0.1"
        , "mongoskin": "0.2.x"
      }
      , "devDependencies": {
          "mocha": "*"
        , "should": "*"
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
            if (err) return done(err);
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

　createTopic メソッドに関しては正常系のテストを記述しています。`db.createTopic()` 呼び出し後に、エラーが発生していないこと、"_id" プロパティが自動設定されていること、残りのプロパティは指定した値が設定されていることを確認しています。非同期のテストの正常系テストケースでは、コールバック中のエラーは `if (err) return done(err);` で処理するのが mocha の常套句です。こう書くことで、もしエラーが発生した場合、レポートにエラーオブジェクトの内容が表示されます。

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
          if (err) return done(err);
          tp.should.have.property('_id');

          db.findTopic(tp._id, function(err, result) {
            result._id.toString().should.eql(tp._id.toString());
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
            if (err) return done(err);
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
            if (err) return done(err);
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
          if (e) return done(e);
          b.should.have.property('_id');

          var topicId = b._id;
          request.get({
            url: testUrl('/topics/' + topicId)
          }, function(err, res, body) {
            if (err) return done(err);
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
          if (err) return done(err);
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
[jQuery](http://jquery.com/) を利用するので、それぞれの CDN 配布のURL を追加しています。

views/index.ejs

    <h1><%= title %></h1>
    <form action="#">
      <fieldset>
        <legend>Topic</legend>
        <div class="clearfix">
          <label for="title">Title</label>
          <div class="input">
            <input class="xxlarge" id="title" name="title" type="text"/>
          </div>
        </div>
        <div class="clearfix">
          <label for="body">Question</label>
          <div class="input">
            <textarea class="xxlarge" id="body" name="body" cols="80" rows="3"></textarea>
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend>Selections</legend>
        <div class="clearfix">
          <label for="selection1">1:</label>
          <div class="input">
            <input class="xxlarge selection" id="selection1" name="selection1" type="text"/>
          </div>
        </div>
        <div class="clearfix">
          <label for="selection1">2:</label>
          <div class="input">
            <input class="xxlarge selection" id="selection2" name="selection2" type="text"/>
          </div>
        </div>
        <div class="clearfix">
          <label for="selection1">3:</label>
          <div class="input">
            <input class="xxlarge selection" id="selection3" name="selection3" type="text"/>
          </div>
        </div>
        <div class="clearfix">
          <label for="selection1">4:</label>
          <div class="input">
            <input class="xxlarge selection" id="selection4" name="selection4" type="text"/>
          </div>
        </div>
      </fieldset>
      <div class="actions">
        <button type="submit" id="createTopic" class="btn primary">Create Topic</button>
      </div>
    </form>

　Topic の作成画面では表示の都合上、投票の選択肢を４つまでに制限することにします。
ただし、プログラムの作り上の上限ではないので、数を変えたいという人は適宜増減させてみてください。
これでレイアウトが完成したので、ここから REST API を呼び出すクライアントコードをページ下部に追加します。

    <script type="text/javascript">
    $(function() {
      $('#createTopic').click(function(e) {
        e.preventDefault();

        var self = $(this);
        self.attr('disabled', 'disabled');

        var topic = { selections: [] };
        topic.title = $('#title').val();
        topic.body = $('#body').val();

        $('.selection').each(function() {
          var v = $(this).val();
          if (v && v !== '') {
            topic.selections.push(v);
          }
        });

        $.post('/topics', topic)
          .success(function(data) {
            window.location.href = '/votes/' + data._id;
            console.log(data);
          })
          .error(function() {
            alert('Error!');
          })
          .complete(function() {
            self.removeAttr('disabled');
          });
      });
    });
    </script>

　データを JSON 形式で組み立て、連続クリックによる2重送信防止しておき、Ajax で POST しています。これで Topic 作成画面の作成は終了です。

　次に、Topic を作成した後に遷移させる投票画面を作成していきます。
ここではまだ投票機能は実装していませんが、まずは作成した Topic を表示させてみましょう。

　まず、この画面に遷移させるためのコントロールロジックを app.js と routes/index.js に追加します。

app.js

    app.get('/votes/:topicId', routes.showTopic);

routes/index.js

    /**
     * GET show topic
     */
    exports.showTopic = function(req, res, next) {
      var topicId = req.param('topicId');
      db.findTopic(topicId, function(err, result) {
        if (err) {
          if (err instanceof db.EntityNotFoundError) {
            res.json(err.message, 404);
          } else {
            res.json(err, 500);
          }
        } else {
          res.render('vote', { title: result.title, topic: result });
        }
      });
    };

　最後に showTopic メソッドで呼び出している render の引数に対応するテンプレート vote.ejs を作成します。
views フォルダに vote.ejs という名前のファイルを作り、次のように入力してください。
`res.render` メソッドの第2引数に指定したオブジェクトは指定した名前でテンプレートから参照できます。
topic には topicId に対応するデータを格納しているので、これで Topic のデータが表示できます。

views/vote.ejs

    <h1><%= topic.title %></h1>
    <h2><pre><%= topic.body %></pre></h2>
    <form class="form-stacked" action="/votes/<%= topic._id %>" method="post">
      <div class="actions selections">
      <% for (var i = 0, l = topic.selections.length; i < l; ++i) { %>
        <div>
          <input type="button" class="btn xlarge selection" value="<%= topic.selections[i] %>"/>
        </div>
      <% } %>
      </div>
    </form>

　仕上げとして、CSS を少し調整します。

public/stylesheets/styel.css

    body {
      padding: 50px;
    }
    
    h2 pre {
      border: 0;
      margin: 0;
      font-size: 16px;
      line-height: 1.5em;
    }

    .selections div {
      margin-bottom: 20px;
    }

    .selections input.btn {
      height: 3em;
      text-align: left;
    }

　これで登録した Topic が表示できるようになりました。実際の画面から Topic を登録して、登録したものが表示できることを確認してください。
また、mongo のコマンドラインインターフェースで以下のコマンドを実行して、
実際にデータベースの topics コレクションにデータが格納されているのを確認してください。

    $ mongo rtvote-test
    mongo rtvote-test
    MongoDB shell version: 1.8.1
    connecting to: rtvote-test
    > db.topics.find();

### 投票機能を実装する

　これで画面はほぼ完成したので、ついに投票機能を追加します。投票機能は１票投票する機能と、集計結果を取得する機能からなります。
ですので、２つの API を作成します。まずは、１票投票する `makeVote` から考えていきます。

Topic に１票投票する:

- URL: `POST /votes/:topicId`
  - Content-Type: 'application/json'
  - body: １票に対応する Vote オブジェクトの JSON 表記
  - 対応する Topic がみつからない場合は、ステータスコード 404 を返す

　この仕様に基づいて実装していきます。実装の手順については基本的に Topic と同じです。

　app.js にルーティンを追加。

app.js

    app.post('/votes/:topicId', routes.makeVote);

　lib/db.js にデータベースアクセスロジックを追加。`db.makeVote` では投票対象の Topic を検索して存在するかどうかチェックします。

lib/db.js

    /**
     * Vote collection name
     * @constant
    */
    var COLLECTION_VOTE = 'votes';

    (省略)

    /**
     * Make a vote to a topic specified by topicId.
     *
     * @param {String} topicId Topic ID to vote
     * @param {String} selection selected value
     * @param {Function} callback Call when vote is created or failed
     */
    exports.makeVote = function(topicId, selection, callback) {
      exports.findTopic(topicId, function(e, topic) {
        if (e) {
          callback(e);
        } else {
          var vote = {
            topicId: db.toId(topicId),
            selection: selection,
            createdAt: new Date()
          };

          db.collection(COLLECTION_VOTE).insert(vote, function(err, docs) {
            if (err) {
              callback(err);
            } else {
              callback(null, docs[0]);
            }
          });
        }
      });
    };

　最後にコントローラロジックを実装します。

routes/index.js

    /**
     * POST make a vote
     */
    exports.makeVote = function(req, res, next) {
      var topicId = req.param('topicId'),
          selection = req.param('selection');

      db.makeVote(topicId, selection, function(err, result) {
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
    };

　これでサーバ側の実装ができたので、次はクライアント側の実装です。

views/vote.ejs

    <script type="text/javascript">
    $(function() {
      var selections = $('.selection');

      selections.click(function(e) {
        e.preventDefault();

        var self = this,
            action = self.form.action;

        selections.removeClass('primary');
        $(self).addClass('primary');

        $.post(action, { selection: self.value })
          .success(function(data) {
            // console.log(data);
          })
          .error(function() {
            alert('Error!');
          });
      });
    });
    </script>

  今回は、ログイン処理を実装しないので、１人で何回でも投票できてしまいますが、
ログイン処理を実装して、１人１回しか投票できないようにするのは、良い課題だと思いますので、時間があれば挑戦してみてください。

　ここまでできたら、実際に画面から投票してみてください。実際にデータが入っているかどうかは、前と同じように mongo の CLI で確かめましょう。

    > db.votes.find()
    { "topicId" : ObjectId("4eef735f2f935fc74a000007"), "selection" : "banana", "createdAt" : ISODate("2011-12-19T17:24:47.224Z"), "_id" : ObjectId("4eef735f2f935fc74a000008") }
    { "topicId" : ObjectId("4eef73ff132064514b000007"), "selection" : "banana", "createdAt" : ISODate("2011-12-19T17:27:27.199Z"), "_id" : ObjectId("4eef73ff132064514b000008") }

  こんな感じでデータが入っていればOKです。また、ここでは省略していますが、テストを書くのも忘れないでください。テストが全て通ったら、一旦 git commit しましょう。

### 投票結果をリアルタイムで表示できるようにする

　ここまでで普通の投票システムが完成しましたが、ここに「リアルタイム」な要素を加えてみましょう。
投票するとその結果をリアルタイムに更新される円グラフで表示するようにしてみます。モジュールとしては、WebSocket 相当の機能を
ほぼ全ブラウザで利用できるようできる Node.js の代表的なモジュールである [Socket.IO](http://socket.io/) を利用します。

#### Socket.IO の設定

　Socket.IO を利用できるように package.json の dependencies に socket.io を追加します。
0.8系の最新版を取得できるようにバージョン指定は `"0.8.x"` とします。

package.json

    , "dependencies": {
        "express": "2.5.x"
      , "ejs": ">= 0.0.1"
      , "mongoskin": "0.2.x"
      , "socket.io": "0.8.x"
    }

　依存関係を追加したら忘れずに `npm install` しておきましょう。

    $ npm install -d

　次に、Socket.IO をラップしたモジュールを lib/io.js というファイル名で作成します。

lib/io.js

　まずは初期化処理と設定部分。

    var sio = require('socket.io'),
    util = require('util');

    /**
     * io module
     */
    var io = null;

    /**
     * Listen app and create Socket.IO server.
     *
     * @param {Object} app Express application
     */
    exports.listen = function(app) {
      if (!io) {
        io = sio.listen(app);

        io.configure('production', function() {
          io.enable('browser client minification');
          io.enable('browser client etag');
          io.enable('browser client gzip');
          io.set('log level', 1);

          // Heroku is not support WebSocket
          io.set("transports", ["xhr-polling"]);
          io.set("polling duration", 10);
        });

        io.configure('development', function() {
          io.set('transports', ['websocket']);
        });
      }
    };

　Socket.IO の configure メソッドを利用すると環境ごとに設定を変更できます。
今回は Heroku では WebSocket が利用できないため、Heroku 上で動かす production モードでは xhr-polling を、開発環境では WebSocket を使うようにします。

　続いて、今回は Topic ごとに通知する内容（集計結果）が異なるため、クライアントをグループ化する必要があります。
ここでは Socket.IO のネームスペースの機能を利用してこれを実装しています。指定した topicId に対応する namespace が既に存在する場合はそれを、
存在しない場合は、新規に作成して返します。

    /**
     * Namespaces list
     */
    var namespaces = {};

    /**
     * Get namespace for specified topic.
     * If namespace is not found, create new one and return it.
     *
     * @param {String} topicId Topic ID to create namespace
     * @param {Function} onConnectCallback Call when client is conneted
     * @return {Object} Socket.IO server for specified namespace.
     */
    exports.namespace = function(topicId, onConnectCallback) {
      if (namespaces[topicId]) {
        return namespaces[topicId];
      } else {
        var namespace =
          io.of('/' + topicId)
            .on('connection', function(socket) {
              console.log('connected on ' + topicId);

              if (onConnectCallback) {
                onConnectCallback(socket);
              }

              socket.on('error', function(e) {
                console.error(util.inspect(e, true));
              });
            });
        namespaces[topicId] = namespace;
        return namespace;
      }
    };

　これで Socket.IO 関連の実装はできたので、これを app.js, route/index.js に組み込んでいきます。

app.jp

    var express = require('express'),
    routes = require('./routes'),
    io = require('./lib/io');　// 追加

    var app = module.exports = express.createServer();
    io.listen(app); // 追加

route/index.js

　投票画面を表示する時に、namespace を作成します。

    exports.showTopic = function(req, res, next) {
      var topicId = req.param('topicId');

      io.namespace(topicId); // 追加
      ...
    };

　そして、投票があった時に namespace に対して結果をブロードキャストします。ここではまだ集計結果を取得する処理を書いていないので、
仮データとして topicId を返しておきます。

    exports.makeVote = function(req, res, next) {
      var topicId = req.param('topicId'),
          selection = req.param('selection');

      db.makeVote(topicId, selection, function(err, result) {
        if (err) {
          if (err instanceof db.EntityNotFoundError) {
            res.json(err.message, 404);
          } else {
            res.json(err, 500);
          }
        } else {
          res.json(result);
          io.namespace(topicId).emit('update', { test: topicId }); // 追加
        }
      });
    };

  それではこれに対応するクライアントコードを書いていきましょう。

views/vote.ejs

  Socket.IO のクライアントは Socket.IO モジュールが `/socket.io/socket.io.js` という URL で提供してくれるので、これを利用します。
また、`io.connect()` の引数には `/ + namespace名` を指定します。今回は namespace = topicId なので、topicId を指定しています。
最後に `update` イベントでデータを受け取れるように `socket.on` メソッドでリスナを設定しています。
まだ、集計結果は出力されていないので、とりあえずコンソールに出力して通信ができていることを確認します。

    <script type="text/javascript" src="/socket.io/socket.io.js"></script>
    <script type="text/javascript">
    (省略)

    var socket = io.connect('/<%= topic._id %>');
      socket.on('update', function(data) {
      console.log(data);
    });
    </script>

　なにかトピックを作成して、投票画面でボタンを押してみてください。コンソールに topicId が表示されればOKです。

#### 集計結果の取得とグラフの表示

　それでは仕上げに集計結果の取得と、その結果のグラフ表示を行いましょう。MongoDB で投票結果の集計を行うには、MapReduce 機能を利用します。
これは SQL でいう group by に近い機能になります。

参考資料:
* [SQL to Mongo Mapping Chart](http://www.mongodb.org/display/DOCS/SQL+to+Mongo+Mapping+Chart)
* [Aggregation](http://www.mongodb.org/display/DOCS/Aggregation) 

　ここで MapReduce について解説を始めると長くなってしまうので、今回は以下のように書くと集計ができるんだな、くらいの感覚で書いてみてください。
詳細を知りたい人は [MapReduce の公式ドキュメント](http://www.mongodb.org/display/DOCS/MapReduce) を参照してください。

lib/db.js

    /**
     * Get surmmary (count for each selection) of specified topic
     *
     * @param {String} topicId Topic ID to summarize
     * @param {Function} callback Call when summary data is created or failed
     */
    exports.getSummary = function(topicId, callback) {
      db.collection(COLLECTION_VOTE).group([], { topicId: db.toId(topicId) }, { "count": {} }, "function (obj, prev) { if (prev.count[obj.selection]) { prev.count[obj.selection]++; } else { prev.count[obj.selection] = 1; } }", true, function(err, results) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, results[0].count);
      });
    };
　
　あとはこの結果を Socket.IO でクライアントに送信します。

route/index.js

    exports.showTopic = function(req, res, next) {
      var topicId = req.param('topicId');

      // 接続時の Callback を追加
      io.namespace(topicId, function(socket) {
        db.getSummary(topicId, function(err, summary) {
          if (!err) {
            socket.emit('update', summary);
          }
        });
      });
      (省略)
    };

    (省略)

    exports.makeVote = function(req, res, next) {
      var topicId = req.param('topicId'),
          selection = req.param('selection');

      db.makeVote(topicId, selection, function(err, result) {
        if (err) {
          if (err instanceof db.EntityNotFoundError) {
            res.json(err.message, 404);
          } else {
            res.json(err, 500);
          }
        } else {
          res.json(result);

          // 以下のように変更
          db.getSummary(topicId, function(err, summary) {
            if (!err) {
              io.namespace(topicId).volatile.emit('update', summary);
            }
          });
        }
      });
    };

  最後にこれを円グラフで表示させます。円グラフの描画には HTML5 Canvas を使った [circle.js](http://www.html5.jp/library/graph_circle.html) を利用します。
JavaScript ファイルをダウンロードしてきて、circle.js を public/javascripts 配下におきます。

  あとは描画用のエリアを追加し、円グラフ描画用にデータを整形するだけです。

views/vote.ejs

    <div id="chartContainer"><canvas width="480" height="300" id="chart"></canvas></div>
    <script type="text/javascript" src="/socket.io/socket.io.js"></script>
    <script type="text/javascript" src="/javascripts/circle.js"></script>
    <script type="text/javascript" src="/javascripts/circle.js"></script>
    <script type="text/javascript">
    (省略)
    var chart = new html5jp.graph.circle("chart");

    var socket = io.connect('/<%= topic._id %>');
    socket.on('update', function(data) {
      var items = [],
          item;

      for (k in data) {
        item = [];
        item.push(k);
        item.push(data[k]);
        items.push(item);
      }

      if (items.length > 0) {
        $('div', $('#chartContainer')).remove(); // 前回の文字を消す
        chart.draw(items);
      }
    });
    </script>

  これで完成です。実際に投票してみて、結果がリアルタイムで更新されることを確認してください。

### Heroku で公開する

　最後の仕上げとして、ここまでの結果を git commit し、Heroku に push しましょう。

    $ git add .
    $ git commit -m 'Complete!'

  push の前に Heroku を production モードに変更し、MongoDB が使えるように MongoHQ アドオンを追加します。

    $ heroku config:add NODE_ENV=production
    $ heroku addons:add mongohq:free

  全て終了したら、いよいよ公開です。

    $ git push heroku master
    $ heroku open

  ブラウザが開いて、投票作成画面が表示できれば成功です。成功しない場合は、`heroku logs` コマンドを利用して、ログを確認しましょう。
エラーがあればログに出力されているので、それをヒントに解決しましょう。正しく表示できた方は、投票を作成して実際に動作を確認してみましょう。

まとめ
-----

　以上で、「Node.js で作るリアルタイム投票アプリ」の解説は終了です。
ここまでやってきた皆さんは、Node.js のプログラムの基本的な内容がマスターできていると思います。
　
　あとはあなたのアイデア次第で色々と試してください。このアプリケーションにログイン機能をつけたり、Twitter との連携機能をつけても良いですし、
新たなアプリを作ってもよいと思います。この記事があなたの Node.js プログラミングのなにかの助けになれば、著者は嬉しいです。

レッツ　エンジョイ Node.js !!


