from __future__ import print_function

import argparse
import logging

import pandas
import numpy
from scipy.sparse import coo_matrix

import implicit.als
import implicit.approximate_als
from implicit.nearest_neighbours import bm25_weight


# hack: cut-n-paste from the implicit/examples/lastfm.py file
def read_data(filename):
    data = pandas.read_table(filename,
                             usecols=[0, 2, 3],
                             names=['user', 'artist', 'plays'])
    data['user'] = data['user'].astype("category")
    data['artist'] = data['artist'].astype("category")
    plays = coo_matrix((data['plays'].astype(float),
                       (data['artist'].cat.codes.copy(),
                        data['user'].cat.codes.copy())))
    return data, plays


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generates file for ann-benchmarks",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--factors', type=int,
                        dest='factors', help='# of factors to use', default=50)
    parser.add_argument('--input', type=str,
                        dest='inputfile', help='last.fm dataset file', required=True)
    args = parser.parse_args()
    logging.basicConfig(level=logging.DEBUG)

    # train a basic ALS model on the last.fm dataset
    data, plays = read_data(args.inputfile)
    plays = bm25_weight(plays, K1=100, B=0.8)
    model = implicit.als.AlternatingLeastSquares(factors=args.factors, regularization=0.8)
    model.fit(plays)

    # transform the factors into being appropiate for an inner product search
    training_data = implicit.approximate_als.augment_inner_product_matrix(model.item_factors)

    # generate queries from the user factors, setting extra dimension to 0
    queries = numpy.append(model.user_factors,
                           numpy.zeros((model.user_factors.shape[0], 1)), axis=1)

    # dump out data in a format that annbenchmarks expects, add an extra column for other testing
    filename = "lastfm%s-10000--1-3.npz" % args.factors
    numpy.savez(filename, train=training_data[1], test=queries[:10000], queries=queries)
