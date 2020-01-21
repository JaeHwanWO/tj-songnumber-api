const request = require("request")
const cheerio = require('cheerio');
const express = require('express');
const app = express()

const typeStr = [
  "title",
  "singer",
  "lyricist",
  "composer",
  "songId"
]

function replaceAll(str, searchStr, replaceStr) {
  return str.split(searchStr).join(replaceStr);
}

/*
https://www.tjmedia.co.kr/tjsong/song_search_list.asp
form action : post
strType :
  0 통합 검색
  1 곡 제목
  2 가수
  4 작사가
  8 작곡가
  16 곡 번호
  32 가사
strCond : "1" or "0". 단일 검색 여부
strText : 검색어
*/
var search = (req, res) => {
  var strText = req.query.keyword
  var strType = req.query.type
  var typeIdx = typeStr.indexOf(strType)
  var strCond = "0"
  var url = "https://www.tjmedia.co.kr/tjsong/song_search_list.asp"
  console.log(strText)

  let options = {
    uri: url,
    method: 'POST',
    form: {
      strText: strText,
      strCond: strCond,
      strSize01: "100", // 곡 제목 개수
      strSize02: "100", // 가수 개수
      strSize03: "100", // 작사가 개수
      strSize04: "100", // 작곡가 개수
      strSize05: "100", // 곡번호 개수
    }
  };

  var songLists = {}
  request(options, function (error, response, body) {
    if (error) { return res.status(400).json({error: "internal-server-error"}) }
    var $ = cheerio.load(body);

    $("#BoardType1").each(function(index, item){ // each song list
      if (typeIdx != -1 && index != typeIdx) { return } // chk type
      var songs = []
      $(this).find("tr").each(function(index, item){ // each song
        // no list
        if (index == 0) { return }
        if ($(this).text().includes("검색결과를 찾을수 없습니다.")) { return }
        var song = {
          songId:    replaceAll(replaceAll($(this).children(":nth-child(1)").text(), "\n", ""), "\t", ""),
          songTitle: replaceAll(replaceAll($(this).children(":nth-child(2)").text(), "\n", ""), "\t", ""),
          singer:    replaceAll(replaceAll($(this).children(":nth-child(3)").text(), "\n", ""), "\t", ""),
          composer:  replaceAll(replaceAll($(this).children(":nth-child(4)").text(), "\n", ""), "\t", ""),
          lyricist:  replaceAll(replaceAll($(this).children(":nth-child(5)").text(), "\n", ""), "\t", ""),
        }
        songs.push(song)
      })
      songLists[typeStr[index]] = songs
    });
    res.json(songLists)
  });
}

// 포트 설정
app.listen((3000), function(){
  console.log('Express server listening on port');
})

app.get("/search", search)