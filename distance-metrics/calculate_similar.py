from __future__ import print_function
import time

from scipy.sparse import coo_matrix, csr_matrix
import numpy
import pandas
from sklearn.preprocessing import normalize


def cosine(plays):
    normalized = normalize(plays)
    return normalized.dot(normalized.T)


def bhattacharya(plays):
    plays.data = numpy.sqrt(plays.data)
    return cosine(plays)


def ochiai(plays):
    plays = csr_matrix(plays)
    plays.data = numpy.ones(len(plays.data))
    return cosine(plays)


def bm25_weight(data, K1=100, B=0.8):
    """ Weighs each row of the matrix data by BM25 weighting """
    # calculate idf per term (user)
    N = float(data.shape[0])
    idf = numpy.log(N / (1 + numpy.bincount(data.col)))

    # calculate length_norm per document (artist)
    row_sums = numpy.squeeze(numpy.asarray(data.sum(1)))
    average_length = row_sums.sum() / N
    length_norm = (1.0 - B) + B * row_sums / average_length

    # weight matrix rows by bm25
    ret = coo_matrix(data)
    ret.data = ret.data * (K1 + 1.0) / (K1 * length_norm[ret.row] + ret.data) * idf[ret.col]
    return ret


def bm25(plays):
    plays = bm25_weight(plays)
    return plays.dot(plays.T)


def read_data(filename):
    """ Reads in the last.fm dataset, and returns a tuple of a pandas dataframe
    and a sparse matrix of artist/user/playcount """
    # read in triples of user/artist/playcount from the input dataset
    data = pandas.read_table(filename,
                             usecols=[0, 2, 3],
                             names=['user', 'artist', 'plays'])

    # map each artist and user to a unique numeric value
    data['user'] = data['user'].astype("category")
    data['artist'] = data['artist'].astype("category")

    # create a sparse matrix of all the users/plays
    plays = coo_matrix((data['plays'].astype(float),
                       (data['artist'].cat.codes.copy(),
                        data['user'].cat.codes.copy())))

    return data, plays


def get_largest(row, N=10):
    if N >= row.nnz:
        best = zip(row.data, row.indices)
    else:
        ind = numpy.argpartition(row.data, -N)[-N:]
        best = zip(row.data[ind], row.indices[ind])
    return sorted(best, reverse=True)


def calculate_similar_artists(similarity, artists, artistid):
    neighbours = similarity[artistid]
    top = get_largest(neighbours)
    return [(artists[other], score, i) for i, (score, other) in enumerate(top)]


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generates related artists on the last.fm dataset",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('--input', type=str,
                        dest='inputfile', help='last.fm dataset file', required=True)
    parser.add_argument('--output', type=str, default='similar-artists.tsv',
                        dest='outputfile', help='output file name')
    parser.add_argument('--method', type=str, default='bm25',
                        dest='method', help='output file name')
    args = parser.parse_args()

    methods = {'bm25': bm25, 'cosine': cosine, 'ochiai': ochiai,
               'bhattacharya': bhattacharya}

    if args.method not in methods:
        print("Unknown Method %s. Must be one of %s\n" % (args.method, methods.keys()))
        return
    method = methods[args.method]

    start = time.time()
    df, matrix = read_data(args.inputfile)
    artists = dict(enumerate(df['artist'].cat.categories))
    user_count = df.groupby('artist').size()
    to_generate = sorted(list(artists), key=lambda x: -user_count[x])
    loadEnd = time.time()
    print("load time", loadEnd - start)

    similarity = method(matrix)
    simEnd = time.time()
    print("calculate similar time", simEnd - loadEnd)

    with open("similar_artists.tsv", "wb") as o:
        for artist in to_generate:
            name = artists[artist]
            for other, score, rank in calculate_similar_artists(similarity, artists, artist):
                o.write("%s\t%s\t%s\t%s\t\n" % (name, other, score, rank))

    topEnd = time.time()
    print("getting top related time", topEnd - simEnd)


if __name__ == "__main__":
    main()
