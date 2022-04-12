import http  from 'http';
import path from 'path';
import axios from 'axios'; //15k (gzipped: 5.1k)
import cheerio  from 'cheerio';
import express  from 'express';
import bodyParser from 'body-parser'

// Declare variables
const __dirname = path.resolve();
const app = express();
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

// Router
app.get('/', (_, res) => res.render('index'))

app.post('/', async (req, res) => {
  // get code of url https://www.fshare.vn/folder/C1SMHBSTE8PJ?token=1648831373 => C1SMHBSTE8PJ
  const code_url = req.body.link.split('/')[4].split('?')[0]
 
  try {
    var data = await getData(`https://www.fshare.vn/api/v3/files/folder?linkcode=${code_url}&sort=type%2Cname&page=1&per-page=50`)
    var items = data;
    
    var link = data._links.last;
    var paging_length = parseUrl(link.substring(1)).page
    var itemArrayFile = []
    var itemArrayFolder = []
    var itemArray = []
    for (let index = 1; index <= paging_length; index++) {
      let itemUrl = API_URL_Fshare({code:code_url, page:index})
      let dataItem = await getData(itemUrl)
      //send current item id to array
      var arr_code_file = [];
      var arr_code_folder = [];
      var arr_code = [];
      dataItem.items.forEach(element => {
        var type = getTypeName(element.type);
        var link = `https://www.fshare.vn/${type}/${element.linkcode}`
        arr_code.push({name: element.name, code: element.linkcode, type: type, link:link})
        if(element.type==1){
          arr_code_file.push({name: element.name, code: element.linkcode, type: element.type, link:link})
        }
        if(element.type==0){
          arr_code_folder.push({name: element.name, code: element.linkcode, type: element.type})
        }
      });
      itemArray.push(arr_code)
      itemArrayFile.push(arr_code_file)
      itemArrayFolder.push(arr_code_folder)
    }

    // res.json({data:itemArray})
    res.render('index', {listItem:itemArray.flat()})

  } catch (error) {
    console.log(error);
  }
})

// const port = process.env.PORT || 3001;
const port = 3003;
app.listen(port, function () {
  console.log('Server started at http://localhost:' + port);
})

async function getData(url){
  const res = await axios(url)
  const data = await res.data;
  return data
}
function API_URL_Fshare({code, page}) {
  if(!page){
    page=1
  }
  return `https://www.fshare.vn/api/v3/files/folder?linkcode=${code}&sort=type%2Cname&page=${page}&per-page=500`
}
function parseUrl(url) {
  return JSON.parse('{"' + url.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) })
}
function getTypeName(type_num){
  var type
  switch (type_num) {
    case 1:
      type = 'file'
      break;
    case 0:
      type = 'folder'
      break;
    default:
      type = 'error'
      break;
  }
  return type
}