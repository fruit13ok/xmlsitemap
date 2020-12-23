// REQUIREMENTS

// native
const path = require('path');

// 3rd party
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
const Sitemapper = require('sitemapper');
const sitemap = new Sitemapper();
sitemap.timeout = 5000;

// local
const app = express();
const port = process.env.PORT || 8000;

// MIDDLEWARE
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(__dirname + '../node_modules/bootstrap/dist/css'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// allow cors to access this backend
app.use( (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// INIT SERVER
app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

// helper functions
// check URL status code
let checkUrl = async (url) => {
    try {
        const response = await fetch(url);
        const status = await response.status;
        return status.toString();
    }catch (error) {
        console.log(error);
        // return error;
        return "598";
    }
};

// return result array of objects
let forLoop = async (resultArr) => {
    let resultArray = [];
    for (let i = 0; i < resultArr.length; i++) {
        let curUrl = resultArr[i];
        let curStatus = await checkUrl(curUrl);
        resultArray.push({url: curUrl, status: curStatus});
    }
    return resultArray;
}


// ROUTES
// root
app.get('/', function (req, res) {
    res.send('hello world');
});

// scrape for all "a" tag's "href" content of given page
// standard the page
let scrape = async (targetPage) => {
    let hrefs = [];
    // other than normal html page, it can scrape xml sitemap page
    if(targetPage.endsWith('.xml')){
        await sitemap.fetch(targetPage)
        // let getUrls = sitemap.fetch(targetPage)
        .then(sites=>{
            hrefs=sites.sites;
        })
        .catch(error => console.log(error));
        // let logUrls = async ()=>{
        //     await getUrls;
        //     console.log(hrefs);
        // }
        // logUrls();
    }
    else{
        console.log('hrefs: ',hrefs.length, hrefs);
    }
    return hrefs;
};

// post, get form data from frontend
app.post('/api', async function (req, res) {
    req.setTimeout(0);
    let targetPage = req.body.targetPage || "";
    await scrape(targetPage)
    .then((resultArr)=>{
        forLoop(resultArr)
        .then(resultArray => {
            res.send(resultArray);
        })
    }).catch(() => {}); 
});
