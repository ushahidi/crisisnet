# CrisisNET

#### A firehose of worldwide crisis data.

[CrisisNET](http://crisis.net) gives app developers, data-journalists and other makers fast, easy access to critical government, business, humanitarian, and crowdsourced data. Our API reduces the time it takes to access and use crisis-relevant data from hours (even days) to minutes.

## Getting Started

Register for an API key using [our developer portal](http://devapi.crisis.net/). (Note: we're currently in private beta, so the portal is a work in progress.)

## Getting Data

Now that you have an API key, CrisisNET data is yours for the taking. You'll find more detailed instructions below, but a basic request looks like this:

    $.ajax({
      url: 'http://api.crisis.net/item?apiKey='+ YOUR_TOKEN_HERE+'location=36.821946,-1.292066',
      dataType: "json",
      success: function (data) {
        console.log(data);
      }
    });

The above request is in JavaScript (using jQuery), so you'd run that from a web browser. However, because CrisisNET is a REST API, you can access it using any language that can make HTTP requests (Python, PHP, Java, etc etc). Here's the same example in Python, just for fun:

    import requests

    url = 'http://devapi.crisis.net/item&location=36.821946,-1.292066'
    headers = {'Authorization': 'Bearer ' + YOUR_TOKEN_HERE}

    r = requests.get(url, headers=headers)

## Filtering Data

As you probably noticed above, both requests are to the `/item` endpoint. In CrisisNET, an `Item` resource is very general -- basically a thing that exists in a place (usually at a specific time). This might be a tweet or Facebook status, a news item, NGO survey response, entry from a municipal dataset, etc etc. In this way we give you the power to shape your data stream in whatever way makes the most sense for your use case.

### List 'O Filters

Name | Description | Type/Example
--- | --- | --- 
*before* | Only retrieve records before this date/time. | timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` eg `before=2014-02-10T10:50:42.389Z`
*after* | Only retrieve records after this date/time. | timestamp like `before`
*tags* | Get records matching *all* of these tags. | comma-separated list of strings eg `tags=health,injury`
*text* | Full-text search on title + text properties. | url-formatted string eg `text=needle+in+haystack`
*location* | Coordinates around which to search. | coordinate pair of longitude, latitude eg `location=36.821946,-1.292066`
*radius* | Get records within x meters of `location`. Defaults to 10. | number in meters, eg `radius=10`
*limit* | Limits the number of records returned. Defaults to 25. | number, eg `limit=100`
*offset* | Useful in conjunction with `limit` for paginatated through results. | number, eg `offset=25`
*sources* | Limit results based on where they originated (outside of CrisisNET) | comma-separated list of strings eg `sources=twitter,facebook`
*licenses* | Limit to records with specific licenses. Useful if you're looking for data to use commercially, for example. | comma-separated list of strings, eg `licenses=commercial,odbl`
*orderBy* | Property used to order result set. Deafults to `publishedAt` | any valid property name, eg `orderBy=title`

### Example response

    [
      {
          "source": "twitter",
          "language": {
              "code": "en"
          },
          "geo": {
              "locationIdentifiers": {
                  "authorLocationName": "Nairobi, Kenya",
                  "authorTimeZone": null
              },
              "coordinates": null
          },
          "content": "Three killed in an accident along Narok-Mai Mahiu Highway #NarokNorthDistrictHospitalMortuary #Kenya http://t.co/IQROp0sdWK",
          "lifespan": "temporary",
          "publishedAt": "Sat Feb 22 2014 12:25:30 GMT-0600 (CST)",
          "remoteID": "437226684211662848"
      },
      {
          "source": "twitter",
          "language": {
              "code": "en"
          },
          "geo": {
              "locationIdentifiers": {
                  "authorLocationName": "Nairobi, Kenya",
                  "authorTimeZone": null
              },
              "coordinates": null
          },
          "content": "Three killed in an accident along Narok-Mai Mahiu Highway #NarokNorthDistrictHospitalMortuary #Kenya http://t.co/IQROp0sdWK",
          "lifespan": "temporary",
          "publishedAt": "Sat Feb 22 2014 12:25:30 GMT-0600 (CST)",
          "remoteID": "437226684211662848"
      }
    ]


### Local Env setup:
--

Requirements:
- Node.js 10.25+
- Python 2.7+

Setup Mongo, ElasticSearch and Redis
    
    brew install mongodb
    brew install elasticsearch
    brew install redis

Start databases
    
    redis-server /usr/local/etc/redis.conf
    mongod
    elasticsearch --config=/usr/local/opt/elasticsearch/config/elasticsearch.yml

Get Project Code
    
    git clone https://github.com/ushahidi/suckapy.git
    git clone https://github.com/ushahidi/crisisnet.git
    git clone https://github.com/ushahidi/scheduler.git
    git clone https://github.com/ushahidi/grimlock.git

Install dependencies
    
    cd crisisnet
    npm install

    cd ../scheduler
    npm install

    cd ../grimlock
    virtualenv venv --distribute
    source venv/bin/activate
    pip install -r requirements.txt

    cd ../suckapy
    virtualenv venv --distribute
    source venv/bin/activate
    pip install -r requirements.txt


Running apps
--
cd into the project directory for the app you'd like to run and...

Node apps
    
    npm run-script dev-server

Python apps (make sure to start your virtualenv source venv/bin/activate)
    
    python src/app.py


Testing apps
--
Node projects
    
    npm run-script run-test

Python projects
    
    nosestests


Deploy code:
--
cd into the project you want to deploy
    
    fab staging deploy:master

(that means, deploy the master branch to the staging server)
