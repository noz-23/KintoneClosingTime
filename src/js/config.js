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

(async ( jQuery_,PLUGIN_ID_)=>{
  'use strict';

  // 設定パラメータ
  const ParameterCountRow  ='paramCountRow';     // 行数
  const ParameterListRow   ='paramListRow';      // 行のデータ(JSON->テキスト)
  const ParameterFieldDate ='paramFieldDate';    // 日付フィールド
  
  // 環境設定
  const Parameter = {
  // 表示文字
    Lang:{
      en:{
        plugin_titile      : 'Organizations Closing Time Plug-in',
        plugin_description : 'After the set Closing Time for each Organizations, you will not be able to save the data.',
        plugin_label       : 'Please Select Organization and Set Closing Time',
        date_label         : 'Date Field        ',
        organ_label        : 'Organization      ',
        time_label         : 'Set Closing Time  ',
        plugin_cancel      : 'Cancel',
        plugin_ok          : ' Save ',
      },
      ja:{
        plugin_titile      : '組織締切時間設定 プラグイン',
        plugin_description : '組織毎に設定した締切時間で保存出来なくなります',
        plugin_label       : '組織を選択し締切時間を設定して下さい',
        date_label         : '日付 フィールド',
        organ_label        : '組織　　       ',
        time_label         : '締切時間       ',
        plugin_cancel      : 'キャンセル',
        plugin_ok          : '   保存  ',
      },
      DefaultSetting:'ja',
      UseLang:{}
    },
    Html:{
      Form               : '#plugin_setting_form',
      Title              : '#plugin_titile',
      Description        : '#plugin_description',
      Label              : '#plugin_label',
      DateLabel          : '#date_label',
      OrganLabel         : '#organ_label',
      TimeLabel          : '#time_label',
      TableBody          : '#table_body',
      AddRow             : '.add_row',
      RemoveRow          : '.remove_row',
      Cancel             : '#plugin_cancel',
      Ok                 : '#plugin_ok',
    },
    Elements:{
      DateField          : '#date_field',
      GroupClass         : 'group_class',
      GroupCheckBox      : '#group_checkbox',
      TimeInput          : '#time_input',
    },
  };
  
 
  /*
  HTMLタグの削除
   引数　：htmlstr タグ(<>)を含んだ文字列
   戻り値：タグを含まない文字列
  */
  const escapeHtml =(htmlstr)=>{
    return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#39;');
  };  

  /*
  ユーザーの言語設定の読み込み
   引数　：なし
   戻り値：なし
  */
  const settingLang=()=>{
    // 言語設定の取得
    Parameter.Lang.UseLang = kintone.getLoginUser().language;
    switch( Parameter.Lang.UseLang)
    {
      case 'en':
      case 'ja':
        break;
      default:
        Parameter.Lang.UseLang =Parameter.Lang.DefaultSetting;
        break;
    }
    // 言語表示の変更
    var html = jQuery(Parameter.Html.Form).html();
    var tmpl = jQuery.templates(html);
    
    var useLanguage =Parameter.Lang[Parameter.Lang.UseLang];
    // 置き換え
    jQuery(Parameter.Html.Form).html(tmpl.render({lang:useLanguage})).show();
  };

  /*
  フィールド設定
   引数　：なし
   戻り値：なし
  */
  const settingHtml= async ()=>{
    var listFeild =await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', {'app': kintone.app.getId()});
    console.log("listFeild:%o",listFeild);

    for (const key in listFeild.properties){
      //console.log("properties key:%o",key);
      try {
        const prop = listFeild.properties[key];
        //console.log("prop:%o",prop);
        // 日付フィールドのみ入れる
        if (prop.type === 'DATE'){
          const option = jQuery('<option/>');
          option.attr('value', escapeHtml(prop.code)).text(escapeHtml(prop.label));

          console.log("Add DATE option:%o",option);
          jQuery(Parameter.Elements.DateField).append(option);
        }                 
      }
      catch (error) {
        console.log("error:%o",error);
      }
    }

    var listGroup =await GetKintoneGroup();
    console.log("listGroup:%o",listGroup);

    var checkBox = jQuery(Parameter.Elements.GroupCheckBox);
    console.log("checkBox:%o",checkBox);

    for(var group of listGroup)
    {
      var inputGroup = document.createElement("input");
      inputGroup.type='checkbox';
      inputGroup.value =group.code;
      inputGroup.name =group.name;
      inputGroup.id =group.code;
      inputGroup.className=Parameter.Elements.GroupClass;

      var labelGroup = document.createElement("label");
      labelGroup.htmlFor=group.code;
      labelGroup.innerHTML =group.name;

      checkBox.append(inputGroup);
      checkBox.append(labelGroup);
    }

    //var labelGroup  = document.createElement("label");

    // 現在データの呼び出し
    var nowConfig =kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log("nowConfig:%o",nowConfig);

    if(nowConfig[ParameterFieldDate]){
      jQuery(Parameter.Elements.DateField).val(nowConfig[ParameterFieldDate]); 
    }

    var count =(nowConfig[ParameterCountRow]) ?Number(nowConfig[ParameterCountRow]):(0);
    // 作ってから値入れ
    var table =jQuery(Parameter.Html.TableBody);
    for(var i=1; i<count;i++){
      var cloneTr= jQuery(Parameter.Html.TableBody+' > tr').eq(0).clone(true);
      table.append(cloneTr);
    }

    if(nowConfig[ParameterListRow]){
      var listRow =JSON.parse(nowConfig[ParameterListRow]);
      console.log("listRow:%o",listRow);

      var listTr = jQuery(Parameter.Html.TableBody+' > tr');
      for(var i=0; i<count;i++){
        var row =listTr.eq(i);

        //console.log("row:%o",row);
        //
        var chack =jQuery(row).find(Parameter.Elements.GroupCheckBox);
        console.log("chack:%o",chack);
        var listCheckBox= jQuery(row).find('.'+Parameter.Elements.GroupClass);

        // チェックボックス
        // each でやることで、複数のvalを取得できる
        listCheckBox.each(function(){
          var inputValue =jQuery(this).val();
          if(listRow[i].ListChecked){
            for(var val of listRow[i].ListChecked){
              if(inputValue==val){
                jQuery(this).prop("checked",true);
              }
            }  
          }         
        })
  
        // 設定時間
        if(listRow[i].Time){
          jQuery(row).find(Parameter.Elements.TimeInput).val(listRow[i].Time);
        }
      }
    }
  };

  /*
  データの保存
   引数　：なし
   戻り値：なし
  */
   const saveSetting=()=>{
    // 各パラメータの保存
    var config ={};

    config[ParameterFieldDate]=jQuery(Parameter.Elements.DateField).val();
      
    var listTr = jQuery(Parameter.Html.TableBody+' > tr');

    var listRow =[];
    var count =0;
    for(var row of listTr)
    {
      var listRowChecked =[];
      console.log("row:%o",row);

      // 個別行
      var inputColumn=jQuery(row).find(Parameter.Elements.GroupCheckBox);
      console.log("inputColumn:%o",inputColumn);
      // 行でのチェックボックス
      var listChecked=jQuery(row).find('.'+Parameter.Elements.GroupClass+':checked');

      //var listChecked= jQuery(listCheckBox+':checked');
      console.log('listChecked:%o',listChecked);

      // チェックボックス
      // each でやることで、複数のvalを取得できる
      listChecked.each(function(){
        listRowChecked.push(jQuery(this).val());
      })
      
      console.log("listRowChecked:%o",listRowChecked);

      var time=jQuery(row).find(Parameter.Elements.TimeInput);
      //
      listRow.push({ListChecked:listRowChecked,Time:time.val()});
      count ++;
    }

    config[ParameterCountRow] =''+count;
    // 配列は一旦文字列化して保存
    config[ParameterListRow]=JSON.stringify(listRow);

    console.log('config:%o',config);

    // 設定の保存
    kintone.plugin.app.setConfig(config);
  };


  /*
  行の追加
   引数　：なし
   戻り値：なし
  */
  function AddRow(){
    // ラムダ式のthisは全体になりボタンでなくなるためfunctionを利用
    console.log("AddRow this:%o",this);
    jQuery(Parameter.Html.TableBody+' > tr').eq(0).clone(true).insertAfter(jQuery(this).parent().parent());
  };

  /*
  行の削除
   引数　：なし
   戻り値：なし
  */
   function RemoveRow(){
    console.log("RemoveRow this:%o",this);
    jQuery(this).parent("td").parent("tr").remove();
  };


   /*
   Kintoneからの組織取得
    引数　：なし
    戻り値：組織リスト
   */
   const GetKintoneGroup =async ()=>{
     var listGroup =[];
     var offset =0;
     var size =100;
     do{
       var paramUsers ={size:size,offset:offset};
       var list =await kintone.api(kintone.api.url('/v1/organizations', true), 'GET',paramUsers);
       if( list.organizations.length==0)
       {
         break;
       }
       listGroup.push(...list.organizations);
       offset +=size;
     }while(true);
     
     console.log("listGroup:%o",listGroup);
     return listGroup;
   }
 

  // 言語設定
  settingLang();
  await settingHtml();

  // 保存
  jQuery(Parameter.Html.Ok).click(()=>{saveSetting();});
  // キャンセル
  jQuery(Parameter.Html.Cancel).click(()=>{history.back();});

  jQuery(Parameter.Html.AddRow).click(AddRow);
  jQuery(Parameter.Html.RemoveRow).click(RemoveRow);
})(jQuery, kintone.$PLUGIN_ID);
