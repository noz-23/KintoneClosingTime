/*
 *締切時間
 * Copyright (c) 2024 noz-23
 *  https://github.com/noz-23/
 *
 * Licensed under the MIT License
 * 
 *  利用：
 *   JQuery:
 *     https://jquery.com/
 *     https://js.cybozu.com/jquery/3.7.1/jquery.min.js
 *   
 *   jsrender:
 *     https://www.jsviews.com/
 *     https://js.cybozu.com/jsrender/1.0.13/jsrender.min.js
 * 
 * History
 *  2024/03/25 0.1.0 初版とりあえずバージョン
 *
 */

jQuery.noConflict();

((PLUGIN_ID_)=>{
  'use strict';

  // 設定パラメータ
  // 設定パラメータ
  const ParameterCountRow  ='paramCountRow';     // 行数
  const ParameterListRow   ='paramListRow';      // 行のデータ(JSON->テキスト)
  const ParameterFieldDate ='paramFieldDate';    // 日付フィールド

  const EVENTS=[
    //'app.record.create.show', // 作成表示
    //'app.record.edit.show',   // 編集表示
    //'app.record.index.show',  // 一覧表示
    //'app.record.create.edit', // 作成表示
    //'app.record.edit.edit',   // 編集表示
    //'app.record.index.edit',  // 一覧表示
    'app.record.create.submit', // 作成表示
    'app.record.edit.submit',   // 編集表示
    'app.record.index.submit',  // 一覧表示
    'app.record.detail.show', // 作成表示
  ];

  kintone.events.on(EVENTS, async (events_) => {
    //console.log('events_:%o',events_);
    // 設定の読み込み
    var config =kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log('config:%o',config);
    
    const readDate =config[ParameterFieldDate];   // 日付フィールド名

    var toDay =getNumDate( new Date());
    var tmpDay =new Date();
    tmpDay.setDate(tmpDay.getDate()+1);
    var tomorrow =getNumDate(tmpDay);
    var readDay=getNumDate(new Date(events_.record[readDate].value));

    console.log('date:today[%o] read[%o] tommorow[%o]',toDay,readDay,tomorrow);

    if( readDay >=tomorrow){
      //console.log('date:today[%o] < read[%o]',toDay,readDay);
      return events_;
    }
    //if( readDay <toDay){
    //if (window.confirm('締切です')) {
      // 公式のエラー表示＆キャンセル方法
      events_.error='締切';
      return events_;
    //}
    //}
    
    // テキストからJSONへ変換
    var listCount =config[ParameterCountRow];
    var listRow =JSON.stringify(config[ParameterListRow]);
    console.log('listRow:%o',listRow);

    var loginUser =kintone.getLoginUser();
    var paramUsers ={code:loginUser.code};
    var listOrgan =await kintone.api(kintone.api.url('/v1/organizations', true), 'GET',paramUsers);
    console.log('listOrgan:%o',listOrgan);

    return events_;
  });

  const getNumDate=(date_)=>{
    console.log('date_:%o',date_);

    var year = date_.getFullYear();
    var month = ("0" + String(date_.getMonth() + 1)).slice(-2);
    var day = ("0" + String(date_.getDate())).slice(-2);

    var strDate=year+month+day;
    console.log('strDate:%o',strDate);
    return Number(strDate);
  }
 
  /*
  スリープ関数
   引数　：ms_ ms単位のスリープ時間
   戻り値：なし
  */
  const Sleep=(ms_)=>{
    return new Promise(resolve_ => setTimeout(resolve_, ms_));
  };
  
})(kintone.$PLUGIN_ID);
