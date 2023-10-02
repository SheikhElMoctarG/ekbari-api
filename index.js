const express = require("express");
const app = express();
const sites = require("./sites.json");
const axios = require("axios");
const { parseString } = require("xml2js");
var posts = [];
app.get("/", async (req, res) => {
    await getDataFromSites();
    posts = await posts.sort(compareByDate);
    await res.send(posts.length == 0 ? {
        error: true,
        code: 500,
        message: "the server is not ready right now>"
    }: posts);
});

async function getDataFromSites() {
  var data = await getRequest(sites[0].url);
  for (const site of sites) {
    var posts_in = await getRequest(site.url);
    await addPosts(await convertXML2JSON(posts_in))
  }
}

async function getRequest(url) {
  return await axios
    .get(url)
    .then((res) => res.data)
    .catch((e) => {
      console.log(`the error in the request: ${e.message}`);
    });
}

async function convertXML2JSON(data_input) {
    var data_output; 
    parseString(data_input, (error, result) => {
        source = result.rss.channel[0].title
        result = JSON.stringify(result.rss.channel[0].item);
        data_output = JSON.parse(result);
    });
    let data_what_i_need = [];
    for(const post of data_output){
        data_what_i_need.push({
            title: typeof(post.title) != 'string' ? post.title[0] : post.title,
            link: typeof(post.link) != 'string' ? post.link[0] : post.link,
            date: typeof(post.pubDate) == 'string' ? post.pubDate : post['dc:date'] == undefined ? post.pubDate[0] : post['dc:date'][0],
            source: getSource(typeof(post.link) != 'string' ? post.link[0] : post.link)
        });
    }
    return data_what_i_need.slice(0,2);
};

async function addPosts(data){
    for(const post of data){
        let available = false;
            posts.forEach((x) =>{
                if(x.title == post.title && x.source == post.source)
                    available = true;
            })
        if (!available)
            posts.push(post);
    };
};

function getSource(url){
    let name = '';
    for(const site of sites){
        if (url.includes(new URL(site.url).hostname)) {
            name = site.name
        }
    }
    return name;
};


// sort by date
function compareByDate(a, b){
    const date1 = new Date(a.date);
    const date2 = new Date(b.date);
    return date2 - date1;
}
app.listen(3000, () => console.log("the system is running on 3000 port ..."));

