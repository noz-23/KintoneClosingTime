/*
 *組織締切時間
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
 *  2024/04/09 0.2.0 組織の表示をツリー構造へ変更
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
    //'app.record.detail.show', // 作成表示
  ];

  kintone.events.on(EVENTS, async (events_) =>{
    //console.log('events_:%o',events_);
    // 設定の読み込み
    var config =kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log('config:%o',config);
    
    //
    var loginUser =kintone.getLoginUser();
    console.log('loginUser:%o',loginUser);

    const readDate =config[ParameterFieldDate];   // 日付フィールド名

    // 日付は数値化した方が比較が楽なので数値化
    var toDay =getNumDate( new Date());
    var tmpDay =new Date();
    tmpDay.setDate(tmpDay.getDate()+1);
    var tomorrow =getNumDate(tmpDay);
    var readDay=getNumDate(new Date(events_.record[readDate].value));

    console.log('date:today[%o] read[%o] tommorow[%o]',toDay,readDay,tomorrow);

    if( readDay >=tomorrow){
     // 未来の日付
      //console.log('date:today[%o] < read[%o]',toDay,readDay);
      return events_;
    }
    if( readDay <toDay){
      // 過去の日付
      // 公式のエラー表示＆キャンセル方法
      events_.error=TimeError(loginUser.language);
      return events_;
    }
    // 当日
    var paramUsers ={code:loginUser.code};
    console.log('paramUsers:%o',paramUsers);
    var listOrgan =await kintone.api(kintone.api.url('/v1/user/organizations', true), 'GET',paramUsers);
    console.log('listOrgan:%o',listOrgan);
    
    // テキストからJSONへ変換
    var listCount =Number(config[ParameterCountRow]);
    if( listCount ==0)
    {
      return events_;
    }

    // 設定列の変換
    var listRow =JSON.parse(config[ParameterListRow]);
    console.log('listRow:%o',listRow);

    for( var row of listRow){
    // 各列での判定
    var flg =false;
      console.log('row:%o',row);
      for(var orgn of listOrgan.organizationTitles){
        // ユーザーの所属組織
        console.log('orgn:%o',orgn);

        // 設定にあるか検索
        var find =row.ListChecked.find( d => d ==orgn.organization.code);
        console.log('find:%o',find);

        if( typeof find !=='undefined'){
          flg =true;
          break;
        }
      }
      // 設定にあった場合は時間比較
      if( flg ==true){
      // 時間は数値化した方が比較が楽なので数値化
        var nowTime =getNumTime(new Date());
        var rowTime =Number(row.Time.replace(':',""));
        console.log('nowTime[%o] rowTIme[%o]',nowTime,rowTime);

        if(nowTime >rowTime){
          // 設定時間を超えてたら保存させない
          events_.error=TimeError(loginUser.language);
        }
      }
    }
    
    //console.log("%o",error_stop);
    return events_;
  });

  /*
  締切時間エラーの文字
   引数　：lang_ ユーザの言語設定
   戻り値：エラー文字
  */
   const TimeError=( lang_)=>{
    return ( lang_ =='ja') ? ('締切'):('It\'s Closing');
  }

  /*
  日付(数値)関数取得
   引数　：date_ 日付時間型
   戻り値：数値 ( 2024/03/30  なら 20240330 )
  */
  const getNumDate=(date_)=>{
    //console.log('date_:%o',date_);

    var year = date_.getFullYear();
    var month = ("0" + String(date_.getMonth() + 1)).slice(-2);
    var day = ("0" + String(date_.getDate())).slice(-2);

    var strDate=year+month+day;
    //console.log('strDate:%o',strDate);
    return Number(strDate);
  }

  /*
  時間(数値)関数取得
   引数　：time_ 日付時間型
   戻り値：数値 ( 7:45 なら 745 )
  */
   const getNumTime=(time_)=>{
    //console.log('time_:%o',time_);

    var hour = ("0" + String(time_.getHours())).slice(-2);
    var minute = ("0" + String(time_.getMinutes() )).slice(-2);

    var strTime=+hour+minute;
    //console.log('strTime:%o',strTime);
    return Number(strTime);
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
