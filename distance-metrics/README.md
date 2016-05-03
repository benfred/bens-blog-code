###Distance Metrics

Code to compute a list of related bands, using a bunch of different distance
metrics. Details are in the [blog post](http://www.benfrederickson.com/distance-metrics/).

####Running this code

First you'll need to [download the dataset](http://www.dtic.upf.edu/~ocelma/MusicRecommendationDataset/lastfm-360K.html) and copy the main file over to this directory.

Next step is to clean the dataset:

```python -c 'import musicdata; musicdata.clean_dataset("usersha1-artmbid-artname-plays.tsv")'```

To quickly generate calculate the bm25 distance on all entries in this post:

```
python calculate_similar.py --input usersha1-artmbid-artname-plays.tsv --method bm25
```

This script takes about 80 seconds on my laptop.

Running

```python generate_json.py```

should create all the json files used in this post, but note its crazy slow and probably should be
avoided.
