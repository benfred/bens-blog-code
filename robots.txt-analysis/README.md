Robots.txt Analysis
=======

This folder has extra code for my [analysis of the worlds leading robots.txt files](http://www.benfrederickson.com/robots-txt-analysis/)


#### Crawling the robots.txt files

I'm using the [grab](http://grablib.org/en/latest/) python package to download all the results.
I highly recommend [enabling aync DNS
resolving](http://grablib.org/en/latest/grab/pycurl.html#asynchronous-dns-resolving) otherwise
downloading the files will be bottlenecked on the default single threaded DNS lookup.

You will also need the list of he top 1 million sites from alexa ([available
here](http://s3.amazonaws.com/alexa-static/top-1m.csv.zip)).

All the files are dumped out to a local sqlite database for later analysis.

To run the crawler:

```python crawler.py --crawl top-1m.csv --threads 50```

This will probably take a couple of hours to finish.

#### Running the analysis

There are a series of scripts like ```analyze_googlebot.py```. Running them will spit out the
results as shown in the post
