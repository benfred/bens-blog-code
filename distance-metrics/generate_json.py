import os
import json
import multiprocessing

import musicdata
from metrics import *


def generate_artist(data, artist):
    """ return json-able data with similarity metric data for an artist """
    # speed things up a bit by converting target to csc (makes dot products
    # moderately faster)
    users = data.artists[artist].tocsc()
    user_set = data.artist_sets[artist]
    user_count = len(data.user_sets)

    methods = {
        'overlap': lambda x: overlap(data.artist_sets[x], user_set),
        'jaccard': lambda x: jaccard(data.artist_sets[x], user_set),
        'ochiai': lambda x: ochiai(data.artist_sets[x], user_set),
        'cosine': lambda x: cosine(data.artists[x], users),
        'smoothed_cosine': lambda x: smoothed_cosine(data.artists[x], users),
        'bm25': lambda x: bm25(data.artists[x], users, data.idf,
                               data.average_plays),
        'tfidf': lambda x: tfidf(data.artists[x], users, data.idf),
    }

    metrics, best = {}, set()

    others = get_other_artists(data, artist)
    for name, method in methods.iteritems():
        similar = [(method(other), other) for other in others]
        similar.sort(reverse=True)
        metrics[name] = similar
        best.update(n for _, n in similar[:10])

    # dump out as json-able form, keeping rank information for all artists
    # in 'best' (so we can generate slopegraphs)
    output = {}
    for metric, similar in metrics.iteritems():
        filtered = []
        for i, (score, name) in enumerate(similar):
            if name in best:
                filtered.append({'artist': display_name(name),
                                 'score': score,
                                 'rank': i + 1})

        output[metric] = filtered
        venn_artists = [artist] + [n for _, n in similar[:2]]
        output[metric + '-venn'] = get_venn(data.artist_sets, venn_artists)
    return output


MUSIC_DATA = None
OUTPUT_PATH = None


def generate_artist_json(artist):
    """ Generates the json output for an artist. Basically a multiprocessing
    friendly version of generate_artist, and a total hack because of it """
    global MUSIC_DATA
    global OUTPUT_PATH

    try:
        filename = "%s/%s.json" % (OUTPUT_PATH, artist)
        if os.path.exists(filename):
            return

        path = os.path.dirname(filename)
        if not os.path.exists(path):
            print "creating", path
            os.makedirs(path)

        values = generate_artist(MUSIC_DATA, artist)
        open(filename, "wb").write(json.dumps(values,
                                              allow_nan=False,
                                              indent=4))
        print "generated", artist

    except Exception, e:
        print "FAILED", artist, e


def generate_json(data, path="./jsondump", min_users=10):
    # doing this using multiprocessing, which basically requires all data to
    # be in globals =(
    global MUSIC_DATA
    global OUTPUT_PATH
    MUSIC_DATA = data
    OUTPUT_PATH = path

    # precache some things (prefork so memory shared over all subprocesses)
    print "precaching"
    for i, artist in enumerate(data.artists.itervalues()):
        norm2(artist)
        binarize(artist)
        tfidf_weight(artist, data.idf)
        bm25_weight(artist, data.idf, data.average_plays)

        if i % 10000 == 0:
            print "precached ", i, len(data.artists)

    # get set of artists to calculate
    artists = [(len(v), k) for k, v in data.artist_sets.iteritems()]
    artists.sort(reverse=True)
    artists = [a for v, a in artists if v >= min_users]

    print "calculating", len(artists), "artists"

    # generate artist json in parallel using multiprocessing.
    try:
        pool = multiprocessing.Pool(multiprocessing.cpu_count())
        start = 0
        while True:
            group = artists[start: start+1000]
            start += len(group)
            if not group:
                break
            pool.map(generate_artist_json, group)
    finally:
        pool.close()
        pool.join()


def get_venn(artist_users, names):
    """ get set sizes for artists for displaying a venn diagram """
    data = []
    display = map(display_name, names)
    for i in xrange(len(names)):
        artist = artist_users[names[i]]
        data.append({'sets': [display[i]],
                     'size': len(artist)})

        for j in xrange(i + 1, len(names)):
            both = artist.intersection(artist_users[names[j]])
            data.append({'sets': [display[i], display[j]],
                         'size': len(both)})

            for k in xrange(j + 1, len(names)):
                size = len(both.intersection(artist_users[names[k]]))
                data.append({'sets': [display[i], display[j], display[k]],
                             'size': size})
    return data


def display_name(a):
    if isinstance(a, str):
        a = a.decode("utf8")
    return a.title()


def get_other_artists(data, artist):
    ret = set()
    for u in data.artist_sets[artist]:
        ret.update(data.user_sets[u])
    ret.remove(artist)
    return [a for a in ret if len(data.artist_sets.get(a, [])) > 0]


if __name__ == "__main__":
    import perfomance_hacks
    performance_hacks.disable_matrix_checks()
    data = musicdata.MusicData("./usersha1-artmbid-artname-plays.tsv")
    generate_json(data)
